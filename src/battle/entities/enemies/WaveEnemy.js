import * as THREE from 'three';
import { Enemy } from './BaseEnemy.js';
import { RiceBullet } from '../enemyBullets/RiceBullet.js';

export class WaveEnemy extends Enemy {
  constructor(scene, player, enemyBullets, options = {}) {
    super(scene, player, enemyBullets, {
      hp: 60,
      shootInterval: 2.0,
      bulletSpeed: 7,
      bulletCount: 12,
      ...options,
      ...(options.options || {})
    });

    this.shootTimer = 0;
    this.waveAmplitude = options.waveAmplitude || 10; // 波浪幅度
    this.waveFrequency = options.waveFrequency || 3;   // 波浪频率
    this.waveSpeed = options.waveSpeed || 4;           // 波浪移动速度
    this.initialX = this.mesh.position.x;              // 初始X坐标
    this.initialY = this.mesh.position.y;              // 初始Y坐标
    this.forwardSpeed = options.forwardSpeed || 6;     // 前进速度
  }

  createMesh() {
    const geo = new THREE.IcosahedronGeometry(2.2);
    const mat = new THREE.MeshBasicMaterial({ color: 0xffaa00, wireframe: true });
    return new THREE.Mesh(geo, mat);
  }

  update(delta, globalTime) {
    if (this.dead) return;

    // 在XY平面内波浪形移动，同时在Z轴方向以固定速度前进
    this.mesh.position.x = this.initialX + this.waveAmplitude * Math.sin(globalTime * this.waveFrequency);
    this.mesh.position.y = this.initialY + (this.waveAmplitude/2) * Math.cos(globalTime * this.waveFrequency); // Y方向波浪
    this.mesh.position.z -= 5 * delta; // 在Z轴方向以固定速度朝向玩家移动

    this.shootTimer += delta;

    // 发射扇形子弹
    if (this.shootTimer >= this.options.shootInterval) {
      this.shootTimer = 0;
      this.shootFan(5, this.options.bulletSpeed);
    }
  }

  shootFan(count = 5, speed = 7) {
    // 计算到玩家的方向
    const toPlayer = new THREE.Vector3();
    toPlayer.subVectors(this.player.object.position, this.mesh.position).normalize();

    // 计算垂直方向
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3();
    right.crossVectors(toPlayer, up).normalize();

    // 发射扇形子弹
    for (let i = 0; i < count; i++) {
      const angle = (i - (count - 1) / 2) * 0.3; // 扇形角度
      const dir = toPlayer.clone()
        .applyAxisAngle(up, angle) // 绕Y轴旋转
        .normalize();

      const bullet = new RiceBullet(
        this.scene,
        this.mesh.position.clone(),
        dir,
        {
          speed: speed,
          damage: 10,
          color: 0xffaa00,
          size: 2.2,
          grazeThreshold: 2.8
        }
      );
      this.enemyBullets.push(bullet);
    }
  }
}