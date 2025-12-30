import * as THREE from 'three';
import { Enemy } from './BaseEnemy.js';
import { RiceBullet } from '../enemyBullets/RiceBullet.js';

export class SpiralEnemy extends Enemy {
  constructor(scene, player, enemyBullets, options = {}) {
    super(scene, player, enemyBullets, {
      hp: 120,
      shootInterval: 1.0,
      bulletSpeed: 6,
      bulletCount: 20,
      ...options,
      ...(options.options || {})
    });

    this.shootTimer = 0;
    this.spiralRadius = options.spiralRadius || 12;    // 螺旋半径
    this.spiralSpeed = options.spiralSpeed || 1.5;     // 螺旋速度
    this.forwardSpeed = options.forwardSpeed || 4;     // 前进速度
    this.spiralAngle = 0;                              // 螺旋角度
    this.initialX = this.mesh.position.x;              // 初始X坐标
    this.initialY = this.mesh.position.y;              // 初始Y坐标
  }

  createMesh() {
    const geo = new THREE.TorusGeometry(2.5, 0.8, 16, 32);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffff44, wireframe: true });
    return new THREE.Mesh(geo, mat);
  }

  update(delta, globalTime) {
    if (this.dead) return;

    // 在XY平面内螺旋形移动，同时在Z轴方向以固定速度前进
    this.spiralAngle += this.spiralSpeed * delta;
    this.mesh.position.x = this.initialX + this.spiralRadius * Math.cos(this.spiralAngle); // 使用初始X坐标作为中心
    this.mesh.position.y = this.initialY + this.spiralRadius * Math.sin(this.spiralAngle); // Y轴也做螺旋运动
    this.mesh.position.z -= this.forwardSpeed * delta;

    this.shootTimer += delta;

    // 发射螺旋形子弹
    if (this.shootTimer >= this.options.shootInterval) {
      this.shootTimer = 0;
      this.shootSpiral();
    }
  }

  shootSpiral() {
    // 发射螺旋形子弹模式
    for (let i = 0; i < 8; i++) {
      const angle = (this.spiralAngle * 3 + i * Math.PI / 4) % (Math.PI * 2); // 螺旋角度
      const dir = new THREE.Vector3(
        Math.sin(angle) * 0.5,
        Math.cos(angle) * 0.3,
        -1 // 向前发射
      ).normalize();

      const bullet = new RiceBullet(
        this.scene,
        this.mesh.position.clone(),
        dir,
        {
          speed: this.options.bulletSpeed + i * 0.2, // 不同子弹速度略有差异
          damage: 6,
          color: 0xffff44,
          size: 2.5,
          grazeThreshold: 2.5
        }
      );
      this.enemyBullets.push(bullet);
    }
  }
}