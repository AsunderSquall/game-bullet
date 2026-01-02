// src/playerBullets/BasePlayerBullet.js
import * as THREE from 'three';

export class BasePlayerBullet {
  constructor(scene, position, direction, options = {}) {
    this.scene = scene;
    this.position = position.clone();
    this.direction = direction.clone().normalize();
    
    // 基础属性
    this.speed = options.speed || 120;
    this.damage = options.damage || 28;
    this.size = options.size || 0.5;
    this.color = options.color || 0x88ccff;
    this.lifetime = options.lifetime || 6;
    this.owner = 'player';

    // 状态管理
    this.isDead = false;       // 是否彻底销毁并从列表中移除
    this.exploding = false;    // 是否处于爆炸动画中
    this.explosionTimer = 0;
    this.explosionDuration = 0.3; // 爆炸动画持续时间 (秒)

    this.mesh = this.createMesh();
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);

    // 初始朝向
    if (this.mesh) {
      this.mesh.lookAt(this.position.clone().add(this.direction));
    }
  }

  createMesh() {
    // 使用八面体并进行顶点拉伸，创建梭形子弹
    const geometry = new THREE.OctahedronGeometry(this.size, 0);
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      // 拉伸 Z 轴
      if (vertex.z > 0) {
        vertex.z *= 8.0; 
      } else {
        vertex.z *= 2.0;
        vertex.z -= 1.5; 
      }
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 1.0,
      metalness: 0.3,
      roughness: 0.4,
      side: THREE.DoubleSide,
      transparent: true, // 必须开启透明度以便爆炸淡出
      opacity: 1.0,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(geometry, mat);
    // 抵消 lookAt 后的默认偏转，确保长轴指向飞行方向
    mesh.rotateX(Math.PI / 4);
    mesh.rotateY(Math.PI / 4);

    return mesh;
  }

  update(delta, enemies) {
    // 1. 如果已经彻底死亡，通知管理器从数组移除
    if (this.isDead) return false;

    // 2. 爆炸动画逻辑
    if (this.exploding) {
      this.explosionTimer += delta;
      const progress = this.explosionTimer / this.explosionDuration;

      if (progress >= 1.0) {
        this.destroy();
        this.isDead = true;
        return false;
      }

      // 视觉反馈：体积迅速膨胀，同时颜色变淡消失
      const scaleFactor = 1.0 + progress * 3.5; // 膨胀至约 4.5 倍
      this.mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
      this.mesh.material.opacity = 1.0 - progress; 
      this.mesh.material.emissiveIntensity = 2.0 * (1.0 - progress);

      return true; // 爆炸期间仍返回 true 以保持在列表内
    }

    // 3. 正常飞行逻辑
    const moveStep = this.direction.clone().multiplyScalar(this.speed * delta);
    this.position.add(moveStep);
    this.mesh.position.copy(this.position);

    // 4. 碰撞检测
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      if (!enemy || enemy.dead) continue;

      const dist = this.position.distanceTo(enemy.mesh.position);
      // 优先取 enemy.hitRadius，否则取几何体参数
      const enemyHitRadius = enemy.hitRadius || 2.5;

      if (dist < enemyHitRadius + this.size) {
        this.startExplosion(enemy);
        return true; 
      }
    }

    // 5. 寿命与边界检查
    this.lifetime -= delta;
    if (this.lifetime <= 0 || this.position.length() > 1000) {
      this.destroy();
      this.isDead = true;
      return false;
    }

    return true;
  }

  /**
   * 触发爆炸效果
   * @param {Object} enemy 被击中的敌人对象
   */
  startExplosion(enemy) {
    if (this.exploding) return;

    this.exploding = true;
    this.speed = 0; // 停止移动

    // 立即结算伤害
    if (enemy && typeof enemy.takeDamage === 'function') {
      enemy.takeDamage(this.damage);
      this.onHit?.(enemy);
    }

    // 视觉加强：爆炸瞬间闪亮
    if (this.mesh) {
      this.mesh.material.emissiveIntensity = 4.0;
    }
  }

  destroy() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      if (this.mesh.geometry) this.mesh.geometry.dispose();
      if (this.mesh.material) this.mesh.material.dispose();
      this.mesh = null;
    }
  }

  onHit(enemy) {
    // 预留给外部重写的钩子
  }
}