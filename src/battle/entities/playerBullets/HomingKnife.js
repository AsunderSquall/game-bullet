// src/playerBullets/types/HomingKnife.js
import { BasePlayerBullet } from './BasePlayerBullet.js';
import * as THREE from 'three';

export class HomingKnife extends BasePlayerBullet {
  constructor(scene, position, direction, options = {}, enemies = []) {
    super(scene, position, direction, {
      speed: 40,
      damage: options.damage || 25,
      size: 0.8,
      color: 0xff66ff,
      ...options
    });

    this.enemies = enemies; // 敌人列表
    this.target = null; // 当前追踪的目标
    this.searchRadius = 550; // 搜索半径
    this.findNearestEnemy(); // 寻找最近的敌人

    // 添加最大存活时间（20秒）
    this.creationTime = Date.now();
    this.maxLifetime = 20000; // 20秒 = 20000毫秒
  }

  createMesh() {
    const geometry = new THREE.OctahedronGeometry(this.size, 0);

    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);

      if (vertex.z > 0) {
        vertex.z *= 8.0; // 更加细长
      } else {
        vertex.z *= 2.0;
        vertex.z -= 1.5; // 更加细长
      }

      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0xff66ff,
      emissiveIntensity: 0.5,
      metalness: 0.3,
      roughness: 0.4,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(geometry, material);

    mesh.lookAt(this.direction.clone().multiplyScalar(1000));
    mesh.rotateX(Math.PI / 4);
    mesh.rotateY(Math.PI / 4);

    return mesh;
  }

  update(delta, enemies, globalTime) {
    if (this.markedForDeletion) return;

    // 检查是否超过最大存活时间
    if (Date.now() - this.creationTime > this.maxLifetime) {
      this.markedForDeletion = true;
      this.destroy();
      return;
    }

    // 更新追踪目标
    this.updateTarget(enemies);

    // 更新位置 - 保持恒定的Z速度
    this.mesh.position.z += this.speed * delta;

    // 在XY平面内追踪目标（只有当目标存在且未死亡时）
    if (this.target && this.target.mesh && !this.target.dead) {
      this.updateXYMovementToTarget(this.target.mesh.position, delta);
    }

    // 检查与敌人的碰撞
    this.checkCollision(enemies);

    // 检查是否超过目标（在Z轴方向）
    if (this.hasPassedTarget()) {
      this.markedForDeletion = true;
      this.destroy();
      return;
    }

    // 检查边界
    this.checkBounds();
  }

  checkCollision(enemies) {
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      if (!enemy || enemy.dead) continue;

      const dist = this.mesh.position.distanceTo(enemy.mesh.position);
      const hitRadius = (enemy.mesh.geometry?.parameters?.radius || 2.5) + this.size;

      if (dist < hitRadius) {
        enemy.takeDamage(this.damage);
        this.onHit?.(enemy);
        this.markedForDeletion = true;
        this.destroy();
        return;
      }
    }
  }

  findNearestEnemy() {
    if (!this.enemies || this.enemies.length === 0) return;

    let nearestEnemy = null;
    let minDistance = Infinity;

    for (const enemy of this.enemies) {
      if (enemy.dead || !enemy.mesh) continue;

      // 只寻找Z轴位置还没被超过的敌人（敌人Z坐标大于子弹Z坐标）
      if (enemy.mesh.position.z <= this.mesh.position.z) continue;

      const distance = this.mesh.position.distanceTo(enemy.mesh.position);
      if (distance < minDistance && distance < this.searchRadius) {
        minDistance = distance;
        nearestEnemy = enemy;
      }
    }

    this.target = nearestEnemy;
  }

  updateTarget(enemies) {
    // 更新敌人列表
    this.enemies = enemies;

    // 只有在没有目标的情况下才寻找目标
    // 一旦找到目标，即使目标死亡也不再寻找新目标
    // 但只在子弹Z位置小于敌人Z位置时才寻找目标（敌人在前方）
    if (!this.target) {
      this.findNearestEnemy();
    }
  }


  updateXYMovementToTarget(targetPos, delta) {
    // 计算到目标在XY平面的向量
    const targetXY = new THREE.Vector2(targetPos.x, targetPos.y);
    const currentXY = new THREE.Vector2(this.mesh.position.x, this.mesh.position.y);
    const toTargetXY = new THREE.Vector2().subVectors(targetXY, currentXY);

    if (toTargetXY.length() > 0) {
      // 标准化方向并应用最大速度
      toTargetXY.normalize();

      // 设置最大XY速度（可以根据需要调整）
      const maxXYSpeed = this.speed * 0.4; // 例如，最大XY速度是总速度的80%

      // 更新XY位置
      this.mesh.position.x += toTargetXY.x * maxXYSpeed * delta;
      this.mesh.position.y += toTargetXY.y * maxXYSpeed * delta;
    }
  }

  hasPassedTarget() {
    // 检查是否在Z轴方向上超过了目标
    if (this.target && this.target.mesh && !this.target.dead) {
      // 如果子弹的Z位置超过了目标的Z位置，则认为已通过目标
      return this.mesh.position.z > this.target.mesh.position.z;
    }
    return false;
  }

  checkBounds() {
    const pos = this.mesh.position;
    if (Math.abs(pos.x) > 500 || Math.abs(pos.y) > 500 || Math.abs(pos.z) > 500) {
      this.markedForDeletion = true;
    }
  }
}