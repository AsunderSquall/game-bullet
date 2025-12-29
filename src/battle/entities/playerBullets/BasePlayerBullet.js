// src/playerBullets/BasePlayerBullet.js
import * as THREE from 'three';

export class BasePlayerBullet {
  constructor(scene, position, direction, options = {}) {
    this.scene = scene;
    this.position = position.clone();
    this.direction = direction.clone().normalize();
    
    this.speed = options.speed || 50;
    this.damage = options.damage || 28;
    this.size = options.size || 0.5;
    this.color = options.color || 0x88ccff;
    this.lifetime = options.lifetime || 6;
    this.owner = 'player';

    this.mesh = this.createMesh();
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);

    if (this.mesh) {
      this.mesh.lookAt(this.position.clone().add(this.direction));
    }
  }

  createMesh() {
    const geo = new THREE.SphereGeometry(this.size, 16, 12);
    const mat = new THREE.MeshBasicMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.8,
    });
    return new THREE.Mesh(geo, mat);
  }

  update(delta, enemies) {
    this.position.add(this.direction.clone().multiplyScalar(this.speed * delta));
    this.mesh.position.copy(this.position);

    let hitThisFrame = false;

    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      if (!enemy || enemy.dead) continue;

      const dist = this.position.distanceTo(enemy.mesh.position);
      const hitRadius = (enemy.mesh.geometry.parameters.radius || 2.5) + this.size;

      if (dist < hitRadius) {
        if (!hitThisFrame) {
          enemy.takeDamage(this.damage);
          this.onHit?.(enemy);
          hitThisFrame = true;
        }

        this.destroy();
        return false;
      }
    }

    this.lifetime -= delta;
    if (this.lifetime <= 0 || this.position.length() > 1000) {
      this.destroy();
      return false;
    }

    return true;
  }

  destroy() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      this.mesh.geometry?.dispose();
      this.mesh.material?.dispose();
    }
  }

  onHit(enemy) {}
}