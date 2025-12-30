// src/playerBullets/types/SakuyaKnife.js
import { BasePlayerBullet } from './BasePlayerBullet.js';
import * as THREE from 'three';

export class SakuyaKnife extends BasePlayerBullet {
  constructor(scene, position, direction, options = {}) {
    super(scene, position, direction, {
      speed: 80,
      damage: options.damage || 32,
      size: 0.8,
      color: 0xcccccc,
      ...options
    });
  }

createMesh() {
    const geometry = new THREE.OctahedronGeometry(this.size, 0);

    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      
      if (vertex.z > 0) {
        vertex.z *= 8.0; // 更加细长
      } else {
        vertex.z *= 2.0;
        vertex.z -= 1.5; // 更加细长
      }
      
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    emissive: 0xaaccff,
    emissiveIntensity: 0.5,
    metalness: 0.3,
    roughness: 0.4,
    transparent: true,
    opacity: 0.5,
    side: THREE.DoubleSide,
    depthWrite: false
    });

    const mesh = new THREE.Mesh(geometry, material);

    mesh.lookAt(this.direction.clone().multiplyScalar(1000));
    mesh.rotateX(Math.PI / 4);
    mesh.rotateY(Math.PI / 4);

    return mesh;
  }
}