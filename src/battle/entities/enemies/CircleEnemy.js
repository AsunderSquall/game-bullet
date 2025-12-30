import * as THREE from 'three';
import { Enemy } from './BaseEnemy.js';
import { RiceBullet } from '../enemyBullets/RiceBullet.js';
import { HomingBullet } from '../enemyBullets/HomingBullet.js';

export class CircleEnemy extends Enemy {
  constructor(scene, player, enemyBullets, options = {}) {
    super(scene, player, enemyBullets, {
      hp: 80,
      shootInterval: 1.5,
      bulletSpeed: 6,
      bulletCount: 8,
      ...options,
      ...(options.options || {})
    });

    this.shootTimer = 0;
    this.circleRadius = options.circleRadius || 25; // 增大圆形轨迹半径
    this.circleSpeed = options.circleSpeed || 2;    // 圆形移动速度
    this.centerX = this.mesh.position.x;            // 圆心X坐标
    this.centerY = this.mesh.position.y;            // 圆心Y坐标
    this.angle = 0;                                 // 当前角度
  }

  createMesh() {
    const geo = new THREE.OctahedronGeometry(2);
    const mat = new THREE.MeshBasicMaterial({ color: 0x66ff66, wireframe: true });
    return new THREE.Mesh(geo, mat);
  }

  update(delta, globalTime) {
    if (this.dead) return;

    // 沿XY平面圆形轨迹移动，同时在Z轴方向以固定速度前进
    this.angle += this.circleSpeed * delta;
    this.mesh.position.x = this.centerX + this.circleRadius * Math.cos(this.angle);
    this.mesh.position.y = this.centerY + this.circleRadius * Math.sin(this.angle);
    this.mesh.position.z -= 6 * delta; // 在Z轴方向以固定速度朝向玩家移动

    this.shootTimer += delta;

    // 高频率向玩家方向发射子弹
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
        damage: 12,
        color: 0x66ff66,
        size: 2.5,
        grazeThreshold: 2.5,
        target: this.player.object.position, // 追踪目标
        maxTurnAngle: 0.05, // 最大转向角度
        isPlayerBullet: false // 这明这是敌人子弹
      }
    );
    this.enemyBullets.push(bullet);
  }
}