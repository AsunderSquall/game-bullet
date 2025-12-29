import * as THREE from 'three';
import { Enemy } from './BaseEnemy.js';
import { RiceBullet } from '../enemyBullets/RiceBullet.js';

export class FairyBlue extends Enemy {
  constructor(scene, player, enemyBullets, options = {}) {
    console.log("options0=",options);
    super(scene, player, enemyBullets, {
      hp: 100,
      shootInterval: 2.0,
      bulletSpeed: 8,
      bulletCount: 16,
      ...options, 
      ...(options.options || {})
    });

    this.shootTimer = 0;
  }

createMesh() {
    const geo = new THREE.DodecahedronGeometry(2.5);
    const mat = new THREE.MeshBasicMaterial({ color: 0x6666ff, wireframe: true });
    return new THREE.Mesh(geo, mat);
  }

  update(delta, globalTime) {
    if (this.dead) return;

    this.mesh.position.z -= 8 * delta;
    this.shootTimer += delta;

    if (this.shootTimer >= 2.5) {
      this.shootTimer = 0;
      this.shootHemisphere(8, 10, 11);
    }
  }

  shootHemisphere(counta = 8, countb = 10, speed = 11) {
    for (let i = 0; i < counta; i++) {
      for (let j = 0; j < countb; j++) {
        const phi = - Math.PI  * (i+0.5) / counta;
        const theta = Math.PI * (j+0.5) / countb;

        const dir = new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta),
          -Math.cos(phi),
          Math.sin(phi) * Math.sin(theta)
        ).normalize();

        const bullet = new RiceBullet(this.scene, this.mesh.position.clone(), dir, {
          speed,
          damage: 10,
          color: 0x4488ff,
          size: 3,
          grazeThreshold: 3.2
        });
        this.enemyBullets.push(bullet);
        }
    }
  }
}