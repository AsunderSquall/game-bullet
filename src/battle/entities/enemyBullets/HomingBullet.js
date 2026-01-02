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

    // 添加拖曳效果
    this.trailPositions = [];
    this.maxTrailLength = 15; // 拖曳长度
    this.trailUpdateCounter = 0;
    this.trailUpdateInterval = 0.05; // 拖曳更新间隔
  }

  update(delta, player, globalTime) {
    if (this.isDead) return;

    // 敌人子弹：追踪玩家
    if (!this.isPlayerBullet && player) {
      this.adjustDirectionToTarget(player.object.position);
    }

    // 更新位置
    this.mesh.position.add(this.velocity.clone().multiplyScalar(delta));

    // 更新拖曳效果
    this.updateTrail(delta);

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

  updateTrail(delta) {
    // 定期记录位置以创建拖曳效果
    this.trailUpdateCounter += delta;
    if (this.trailUpdateCounter >= this.trailUpdateInterval) {
      this.trailUpdateCounter = 0;
      this.trailPositions.push(this.mesh.position.clone());

      // 保持拖曳长度
      if (this.trailPositions.length > this.maxTrailLength) {
        this.trailPositions.shift();
      }

      // 更新拖曳几何体
      if (this.trailLine && this.trailPositions.length > 1) {
        this.updateTrailGeometry();
      }
    }
  }

  updateTrailGeometry() {
    const positions = [];
    for (let i = 0; i < this.trailPositions.length; i++) {
      const pos = this.trailPositions[i];
      positions.push(pos.x, pos.y, pos.z);
    }

    if (positions.length > 0) {
      const positionAttribute = new THREE.Float32BufferAttribute(positions, 3);
      this.trailLine.geometry.setAttribute('position', positionAttribute);
      this.trailLine.geometry.attributes.position.needsUpdate = true;
    }
  }

  createMesh(options) {
    // 创建子弹主体
    const geometry = new THREE.SphereGeometry(this.size, 16, 12);
    const material = new THREE.MeshStandardMaterial({
      color: options.color || 0xff66ff,
      emissive: options.color || 0xff66ff,
      emissiveIntensity: 0.8, // 增加发光强度
      metalness: 0.1, // 降低金属度
      roughness: 0.2, // 降低粗糙度
      transparent: true,
      opacity: 0.9
    });
    const bulletMesh = new THREE.Mesh(geometry, material);

    // 添加一个发光的外壳效果
    const glowGeometry = new THREE.SphereGeometry(this.size * 1.5, 8, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: options.color || 0xff66ff,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    bulletMesh.add(glowMesh); // 发光外壳作为子对象

    // 创建拖曳线
    const trailGeometry = new THREE.BufferGeometry();
    const trailMaterial = new THREE.LineBasicMaterial({
      color: new THREE.Color(options.color || 0xff66ff),
      transparent: true,
      opacity: 0.7,
      linewidth: 2
    });

    this.trailLine = new THREE.Line(trailGeometry, trailMaterial);
    this.scene.add(this.trailLine);

    return bulletMesh;
  }

  destroy() {
    // 销毁拖曳线
    if (this.trailLine) {
      this.scene.remove(this.trailLine);
      this.trailLine.geometry.dispose();
      this.trailLine.material.dispose();
      this.trailLine = null;
    }

    // 清空拖曳位置数组
    this.trailPositions = [];

    // 调用父类销毁方法
    super.destroy();
  }
}