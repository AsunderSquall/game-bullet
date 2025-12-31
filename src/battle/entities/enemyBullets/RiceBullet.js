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

    // 创建更亮、更发光的材质
    const mat = new THREE.MeshStandardMaterial({
      color: options.color,
      emissive: options.color,
      emissiveIntensity: 0.8, // 增加发光强度
      metalness: 0.1, // 降低金属度
      roughness: 0.2, // 降低粗糙度
      transparent: true,
      opacity: 0.9
    });

    const mesh = new THREE.Mesh(geo, mat);

    // 添加一个发光的外壳效果
    const glowGeometry = new THREE.SphereGeometry(options.size * 1.5, 8, 8);
    const glowMaterial = new THREE.MeshBasicMaterial({
      color: options.color,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending
    });
    const glowMesh = new THREE.Mesh(glowGeometry, glowMaterial);
    mesh.add(glowMesh); // 发光外壳作为子对象

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