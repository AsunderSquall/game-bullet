import { BaseEnemyBullet } from './BaseEnemyBullet.js';
import * as THREE from 'three';

export class RiceBullet extends BaseEnemyBullet {
  constructor(scene, position, direction, options = {}) {
    super(scene, position, direction, {
      speed: options.speed ?? 12,
      damage: options.damage ?? 8,
      color: options.color ?? 0xff4444,
      size : options.size ?? 0.5,
      grazeThreshold: options.grazeThreshold ?? 2.8, 
      ...options
    });
  }

  createMesh(options) {
    const geo = new THREE.SphereGeometry(options.size, 16, 12);

    const mat = new THREE.MeshStandardMaterial({
      color: options.color,
      emissive: options.color,
      emissiveIntensity: 0.5,
      metalness: 0.3,
      roughness: 0.4
    });

    const mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }
  update(delta, player, totalTime) {
    super.update(delta, player, totalTime);
  }
  behave(delta, totalTime) {
    this.mesh.position.add(
      this.direction.clone().multiplyScalar(this.speed * delta)
    );
}
}