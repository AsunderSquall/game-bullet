import * as THREE from 'three';
import { BaseEnemyBullet } from './BaseEnemyBullet.js';


export class HomingBullet extends BaseEnemyBullet {
  constructor(scene, position, direction, options = {}) {
    // 调用父类构造函数
    super(scene, position, direction, {
      size: 1,
      speed: options.speed || 8,
      damage: options.damage || 10,
      color: options.color || 0xff66ff,
      grazeThreshold: options.grazeThreshold || 2.5,
      ...options
    });

    this.target = options.target || null; // 目标对象
    this.maxTurnAngle = options.maxTurnAngle || 0.05; // 每帧最大转向角度
    this.isPlayerBullet = options.isPlayerBullet || false; // 是否为玩家子弹
    this.velocity = this.direction.clone().multiplyScalar(this.speed);

    // 添加追踪尾迹效果
    this.trailPositions = [];
    this.maxTrailLength = 10;
    this.trailTimer = 0;
    this.trailInterval = 0.03; // 尾迹更新间隔

    // 创建尾迹几何体和材质
    this.createTrailGeometry();
  }

  update(delta, player, globalTime) {
    if (this.isDead) return;

    // 敌人子弹：追踪玩家
    if (!this.isPlayerBullet && player) {
      this.adjustDirectionToTarget(player.object.position);
    }

    // 更新位置
    this.mesh.position.add(this.velocity.clone().multiplyScalar(delta));

    // 更新追踪尾迹
    this.updateTrail(delta, globalTime);

    // 调用父类的更新方法
    super.update(delta, player, globalTime);
  }

  adjustDirectionToTarget(targetPos) {
    // 计算到目標的方向
    const toTarget = new THREE.Vector3();
    toTarget.subVectors(targetPos, this.mesh.position).normalize();

    // 计算当前方向和目標方向的夹角
    const currentDir = this.velocity.clone().normalize();
    const angle = currentDir.angleTo(toTarget);

    // 如果角度小于最大转向角度，则直接转向
    if (angle <= this.maxTurnAngle) {
      this.velocity.copy(toTarget.multiplyScalar(this.speed));
    } else {
      // 否则只转向最大角度
      const rotationAxis = new THREE.Vector3();
      rotationAxis.crossVectors(currentDir, toTarget).normalize();

      // 使用四元数进行旋转
      const quaternion = new THREE.Quaternion();
      quaternion.setFromAxisAngle(rotationAxis, this.maxTurnAngle);

      const newDir = currentDir.clone();
      newDir.applyQuaternion(quaternion);

      this.velocity.copy(newDir.multiplyScalar(this.speed));
    }
  }


  createMesh(options) {
    // 创建子弹主体
    const geometry = new THREE.SphereGeometry(this.size, 16, 12);
    const material = new THREE.MeshStandardMaterial({
      color: options.color || 0xff66ff,
      emissive: options.color || 0xff66ff, // 使用相同颜色作为自发光
      emissiveIntensity: 0.8, // 增强自发光强度
      metalness: 0.1,
      roughness: 0.2,
      transparent: true,
      opacity: 0.95,
      // 添加更多视觉效果
      side: THREE.DoubleSide
    });
    const bulletMesh = new THREE.Mesh(geometry, material);

    return bulletMesh;
  }

  createTrailGeometry() {
    // 创建尾迹粒子系统
    this.trailParticles = [];
    this.maxTrailParticles = 15; // 最大尾迹粒子数
  }

  updateTrail(delta, globalTime) {
    this.trailTimer += delta;

    // 计算子弹速度，如果速度过快则不添加尾迹粒子
    const speed = this.velocity.length();
    const maxSpeedForTrail = 15; // 设置最大速度阈值

    // 定期添加尾迹粒子（仅当速度未超过阈值时）
    if (this.trailTimer >= this.trailInterval && speed <= maxSpeedForTrail) {
      this.trailTimer = 0;

      // 创建尾迹粒子
      this.createTrailParticle();
    }

    // 更新现有尾迹粒子
    this.updateTrailParticles(delta);
  }

  createTrailParticle() {
    // 创建一个较小的尾迹粒子
    const particleGeometry = new THREE.SphereGeometry(this.size * 0.4, 6, 6);
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: this.mesh.material.color, // 使用与子弹主体相同的颜色
      transparent: true,
      opacity: 0.6,
      depthWrite: false
    });

    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    // 尾迹粒子稍微滞后于子弹位置
    particle.position.copy(this.mesh.position.clone().add(
      this.velocity.clone().normalize().multiplyScalar(-1.5)
    ));
    this.scene.add(particle);

    // 添加到尾迹粒子数组
    this.trailParticles.push({
      mesh: particle,
      life: 0.0,
      maxLife: 0.5, // 粒子生命周期
      initialScale: particle.scale.clone(),
      initialOpacity: 0.6
    });

    // 限制尾迹粒子数量
    if (this.trailParticles.length > this.maxTrailParticles) {
      const oldParticle = this.trailParticles.shift();
      this.scene.remove(oldParticle.mesh);
      if (oldParticle.mesh.geometry) oldParticle.mesh.geometry.dispose();
      if (oldParticle.mesh.material) oldParticle.mesh.material.dispose();
    }
  }

  updateTrailParticles(delta) {
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const particle = this.trailParticles[i];
      particle.life += delta;

      if (particle.life >= particle.maxLife) {
        // 移除生命周期结束的粒子
        this.scene.remove(particle.mesh);
        particle.mesh.geometry.dispose();
        particle.mesh.material.dispose();
        this.trailParticles.splice(i, 1);
      } else {
        // 更新粒子大小和透明度，创建淡出效果
        const lifeRatio = particle.life / particle.maxLife;
        const scaleRatio = 1 - lifeRatio * 0.7; // 随时间稍微缩小
        particle.mesh.scale.set(
          particle.initialScale.x * scaleRatio,
          particle.initialScale.y * scaleRatio,
          particle.initialScale.z * scaleRatio
        );

        // 更新粒子透明度
        const opacity = particle.initialOpacity * (1 - lifeRatio);
        particle.mesh.material.opacity = opacity;
      }
    }
  }

  destroy() {
    // 清理所有尾迹粒子
    for (const particle of this.trailParticles) {
      this.scene.remove(particle.mesh);
      if (particle.mesh.geometry) particle.mesh.geometry.dispose();
      if (particle.mesh.material) particle.mesh.material.dispose();
    }
    this.trailParticles = [];

    // 调用父类销毁方法
    super.destroy();
  }
}