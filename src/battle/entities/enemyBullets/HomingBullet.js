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
  }

  update(delta, player, globalTime) {
    if (this.isDead) return;

    // 敌人子弹：追踪玩家
    if (!this.isPlayerBullet && player) {
      this.adjustDirectionToTarget(player.object.position);
    }

    // 更新位置
    this.mesh.position.add(this.velocity.clone().multiplyScalar(delta));

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
    const geometry = new THREE.SphereGeometry(this.size, 8, 8);
    const material = new THREE.MeshBasicMaterial({ 
      color: options.color || 0xff66ff,
      emissive: 0xff00ff,
      emissiveIntensity: 0.8
    });
    return new THREE.Mesh(geometry, material);
  }
}