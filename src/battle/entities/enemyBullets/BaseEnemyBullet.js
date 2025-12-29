import * as THREE from 'three';

export class BaseEnemyBullet {
  constructor(scene, position, direction, options = {}) {
    this.scene = scene;
    this.size = options.size;
    this.speed = options.speed ?? 10;
    this.damage = options.damage ?? 10;

    this.direction = direction.clone().normalize();

    this.hitThreshold = options.hitThreshold ?? 0.5;
    this.grazeThreshold = options.grazeThreshold ?? 2.5;

    this.age = 0;
    this.isDead = false;

    this.mesh = this.createMesh(options);
    this.mesh.position.copy(position);
    scene.add(this.mesh);

    this.tempVec3 = new THREE.Vector3();
    this.alreadyGrazed = false;
    this.markedForDeletion = false;
  }

  createMesh(options) { throw new Error("必须实现 createMesh"); }

  behave(delta, totalTime) {

  }

  update(delta, player, totalTime) {
    if (this.isDead) return;

    this.age += delta;
    this.behave(delta, totalTime);

    this.mesh.position.add(
      this.direction.clone().multiplyScalar(this.speed * delta)
    );

    const hitPoint = player.object.position.clone()
      .add(new THREE.Vector3(0, player.data.hitOffsetY || 0.6, 0));

    const distance = this.mesh.position.distanceTo(hitPoint)-this.size;

    if (!this.alreadyGrazed && distance < this.grazeRadius) {
      player.graze?.();
      this.alreadyGrazed = true;
    }

    if (distance < this.size) {
      player.takeDamage?.(this.damage);
      this.destroy();
    }

    if (this.mesh.position.length() > 1000) this.destroy();
  }

  destroy() {
    if (this.markedForDeletion) return;
    this.markedForDeletion = true;
    this.isDead = true;
    this.scene.remove(this.mesh);
    this.mesh.geometry?.dispose();
    this.mesh.material?.dispose();
  }
}