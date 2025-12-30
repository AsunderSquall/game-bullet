import * as THREE from 'three';
import { Enemy } from './BaseEnemy.js';
import { RiceBullet } from '../enemyBullets/RiceBullet.js';
import { HomingBullet } from '../enemyBullets/HomingBullet.js';

export class TrackerEnemy extends Enemy {
  constructor(scene, player, enemyBullets, options = {}) {
    super(scene, player, enemyBullets, {
      hp: 50,
      shootInterval: 3, // 降低射击频率
      bulletSpeed: 30, // 提高子弹速度
      bulletCount: 1,
      ...options,
      ...(options.options || {})
    });

    this.shootTimer = 0;
    this.trackingSpeed = options.trackingSpeed || 3;   // 追踪速度
    this.rotationSpeed = options.rotationSpeed || 1;   // 旋转速度
    this.rotationAngle = 0;                            // 旋转角度
    this.isRotating = options.isRotating || false;     // 是否进行旋转运动
  }

  createMesh() {
    const geo = new THREE.TetrahedronGeometry(2.5);
    const mat = new THREE.MeshBasicMaterial({ color: 0xff44ff, wireframe: true });
    return new THREE.Mesh(geo, mat);
  }

  update(delta, globalTime) {
    if (this.dead) return;

    // 如果启用旋转运动，则进行旋转，同时在Z轴方向以固定速度前进
    if (this.isRotating) {
      this.rotationAngle += this.rotationSpeed * delta;
      const distance = 12; // 增大旋转半径
      const playerPos = this.player.object.position;
      this.mesh.position.x = playerPos.x + distance * Math.cos(this.rotationAngle);
      this.mesh.position.y = playerPos.y + distance * Math.sin(this.rotationAngle);
    } else {
      // 否则在XY平面内追踪玩家，同时在Z轴方向以固定速度前进
      const direction = new THREE.Vector3();
      direction.subVectors(this.player.object.position, this.mesh.position).normalize();

      // 只追踪X和Y方向，Z方向以固定速度前进
      this.mesh.position.x += direction.x * this.trackingSpeed * delta;
      this.mesh.position.y += direction.y * this.trackingSpeed * delta;
    }

    // 在Z轴方向以固定速度前进
    this.mesh.position.z -= 10 * delta;

    this.shootTimer += delta;

    // 向玩家方向发射子弹
    if (this.shootTimer >= this.options.shootInterval) {
      this.shootTimer = 0;
      this.shootAtPlayer();
    }
  }

  shootAtPlayer() {
    // 发射追踪子弹
    const bullet = new HomingBullet(
      this.scene,
      this.mesh.position.clone(),
      new THREE.Vector3(0, 0, -1), // 初始方向
      {
        speed: this.options.bulletSpeed,
        damage: 8,
        color: 0xff44ff,
        size: 2,
        grazeThreshold: 2.0,
        target: this.player.object.position, // 追踪目标
        maxTurnAngle: 0.08, // 最大转向角度
        isPlayerBullet: false // 这明这是敌人子弹
      }
    );
    this.enemyBullets.push(bullet);
  }
}