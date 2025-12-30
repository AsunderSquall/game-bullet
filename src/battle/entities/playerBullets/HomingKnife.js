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
    this.maxTurnAngle = 0.05; // 每帧最大转向角度
    this.homingStrength = 0.03; // 追踪强度
    this.searchRadius = 150; // 搜索半径
    this.findNearestEnemy(); // 寻找最近的敌人
  }

  createMesh() {
    const geometry = new THREE.OctahedronGeometry(this.size, 0);

    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);

      if (vertex.z > 0) {
        vertex.z *= 3.2;
      } else {
        vertex.z *= 0.7;
        vertex.z -= 0.4;
      }

      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    const material = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      emissive: 0xff66ff,
      emissiveIntensity: 1.0,
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

    // 更新位置
    this.mesh.position.add(this.velocity.clone().multiplyScalar(delta));

    // 更新追踪目标
    this.updateTarget(enemies);

    // 如果有目标，调整方向
    if (this.target && this.target.mesh && !this.target.dead) {
      this.adjustDirectionToTarget(this.target.mesh.position);
    }

    // 检查边界
    this.checkBounds();
  }

  findNearestEnemy() {
    if (!this.enemies || this.enemies.length === 0) return;

    let nearestEnemy = null;
    let minDistance = Infinity;

    for (const enemy of this.enemies) {
      if (enemy.dead) continue;

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

    // 如果当前目标已死亡或超出范围，寻找新目标
    if (!this.target || this.target.dead || 
        (this.target.mesh && this.mesh.position.distanceTo(this.target.mesh.position) > this.searchRadius)) {
      this.findNearestEnemy();
    }
  }

  adjustDirectionToTarget(targetPos) {
    // 计算到目标的方向
    const toTarget = new THREE.Vector3();
    toTarget.subVectors(targetPos, this.mesh.position).normalize();

    // 计算当前方向和目标方向的夹角
    const currentDir = this.velocity.clone().normalize();
    const angle = currentDir.angleTo(toTarget);

    // 如果角度小于最大转向角度，则直接转向
    if (angle <= this.maxTurnAngle) {
      this.velocity.copy(toTarget.multiplyScalar(this.options.speed));
    } else {
      // 否则只转向最大角度
      const rotationAxis = new THREE.Vector3();
      rotationAxis.crossVectors(currentDir, toTarget).normalize();
      
      // 使用四元数进行旋转
      const quaternion = new THREE.Quaternion();
      quaternion.setFromAxisAngle(rotationAxis, this.maxTurnAngle * 2); // 增加转向速度
      
      const newDir = currentDir.clone();
      newDir.applyQuaternion(quaternion);
      
      this.velocity.copy(newDir.multiplyScalar(this.options.speed));
    }
  }

  checkBounds() {
    const pos = this.mesh.position;
    if (Math.abs(pos.x) > 500 || Math.abs(pos.y) > 500 || Math.abs(pos.z) > 500) {
      this.markedForDeletion = true;
    }
  }
}