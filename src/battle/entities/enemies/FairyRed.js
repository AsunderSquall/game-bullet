import * as THREE from 'three';
import { Enemy } from './BaseEnemy.js';
import { RiceBullet } from '../enemyBullets/RiceBullet.js';

export class FairyRed extends Enemy {
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
    const mat = new THREE.MeshBasicMaterial({ color: 0xff6666, wireframe: true });
    return new THREE.Mesh(geo, mat);
  }

  update(delta, globalTime) {
    if (this.dead) return;
    this.mesh.position.z -= 10 * delta;
    this.shootTimer += delta;
    if (this.shootTimer >= this.options.shootInterval) {
      this.shootTimer = 0;
      this.shootRing(this.options.bulletCount, this.options.bulletSpeed);
    }
  }

  shootRing(count = 20, speed = 15) {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI + Math.PI/2;

      const dir = new THREE.Vector3(
        Math.sin(angle),
        0,                    
        Math.cos(angle)
      );

      const bullet = new RiceBullet(
        this.scene,
        this.mesh.position.clone(), 
        dir,
        {
          speed: speed,
          damage: 8,
          color: 0xff4444,
          size: 3, 
          grazeThreshold: 2.8
        }
      );
      this.enemyBullets.push(bullet);
      console.log(this.enemyBullets);
    }
  }
}