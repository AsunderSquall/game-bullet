import * as THREE from 'three';

export class Enemy {
  constructor(scene, player, enemyBullets, options = {}) {
    console.log("options=",options);
    this.scene = scene;
    this.player = player;
    this.enemyBullets = enemyBullets;
    this.hp = options.hp ?? 100;
    this.maxHp = this.hp;
    this.dead = false;
    this.birthTime = performance.now() / 1000;
    this.options = options;
    this.mesh = this.createMesh();
    this.mesh.position.copy(options.position || new THREE.Vector3(0, 40, 0));
    scene.add(this.mesh);
  }

  createMesh() { throw new Error("子类必须实现 createMesh()"); }

  update(delta, globalTime) { }

  takeDamage(damage) {
    if (this.dead) return false;
    this.hp -= damage;
    this.onHit?.();
    if (this.hp <= 0) this.die();
    return true;
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.onDeath?.();
    this.scene.remove(this.mesh);
  }
}