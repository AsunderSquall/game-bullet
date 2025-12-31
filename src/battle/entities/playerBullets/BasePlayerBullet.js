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
    // Create a more elongated bullet shape using octahedron geometry
    const geometry = new THREE.OctahedronGeometry(this.size, 0);

    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);

      if (vertex.z > 0) {
        vertex.z *= 8.0; // Make it much more elongated in +Z direction
      } else {
        vertex.z *= 2.0;
        vertex.z -= 1.5; // Make it more elongated in -Z direction
      }

      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: this.color,
      emissiveIntensity: 0.5,
      metalness: 0.3,
      roughness: 0.4,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(geometry, mat);
    mesh.lookAt(this.direction.clone().multiplyScalar(1000));
    mesh.rotateX(Math.PI / 4);
    mesh.rotateY(Math.PI / 4);

    return mesh;
  }

  update(delta, enemies) {
    this.position.add(this.direction.clone().multiplyScalar(this.speed * delta));
    this.mesh.position.copy(this.position);

    let hitThisFrame = false;

    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      if (!enemy || enemy.dead) continue;

      const dist = this.position.distanceTo(enemy.mesh.position);
      const hitRadius = enemy.hitRadius || 
                   enemy.mesh.geometry?.parameters?.radius || 
                   2.5;

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