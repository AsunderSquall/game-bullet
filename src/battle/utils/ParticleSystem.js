import * as THREE from 'three';

export class ParticleSystem {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.activeSystems = [];

    // Load the damage indicator texture from the picture directory
    this.damageTexture = this.loadDamageTexture();
  }

  // Load the damage indicator texture from the picture directory
  loadDamageTexture() {
    const textureLoader = new THREE.TextureLoader();
    // Load the damage texture from the picture directory
    const texture = textureLoader.load('picture/damage.png');
    texture.minFilter = THREE.NearestFilter; // Preserve pixel art look
    texture.magFilter = THREE.NearestFilter;
    return texture;
  }

  // Create a damage indicator particle system
  createDamageIndicator(position, damageAmount) {
    // Create a group to hold all particles for this damage indicator
    const particleGroup = new THREE.Group();
    this.scene.add(particleGroup);

    // Set the initial position to where the player was hit
    particleGroup.position.copy(position);

    // Number of particles for the damage indicator
    const particleCount = 6 + Math.floor(damageAmount / 10); // More damage = more particles

    // Create individual particles
    for (let i = 0; i < particleCount; i++) {
      // Create geometry for the particle (using a simple quad/sprite)
      // Random size between 0.3 and 0.8
      const size = 0.3 + Math.random() * 0.5;
      const geometry = new THREE.PlaneGeometry(size, size);

      // Create material with the damage texture
      const material = new THREE.MeshBasicMaterial({
        map: this.damageTexture,
        transparent: true,
        opacity: 0.8 + Math.random() * 0.2, // Slight opacity variation
        side: THREE.DoubleSide,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      });

      const particle = new THREE.Mesh(geometry, material);

      // Randomize the initial position slightly around the hit point
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 0.1 + Math.random() * 0.3;
      particle.position.x = Math.cos(angle) * radius;
      particle.position.y = Math.sin(angle) * radius * 0.5; // Less variation in y
      particle.position.z = (Math.random() - 0.5) * 0.2;

      // Random rotation
      particle.rotation.z = Math.random() * Math.PI * 2;

      // Add the particle to the group
      particleGroup.add(particle);

      // Store particle data for animation
      this.particles.push({
        mesh: particle,
        group: particleGroup,
        velocity: new THREE.Vector3(
          (Math.random() - 0.5) * 0.5, // Small horizontal movement (X)
          1.0 + Math.random() * 1.5, // Upward movement (Y)
          (Math.random() - 0.5) * 0.5  // Small depth movement (Z)
        ),
        life: 0,
        maxLife: 0.8 + Math.random() * 0.7, // 0.8 to 1.5 seconds
        initialScale: particle.scale.clone(),
        rotationSpeed: (Math.random() - 0.5) * 0.5, // Slow rotation
        isTextParticle: false
      });
    }

    // Add the group to active systems
    this.activeSystems.push({
      group: particleGroup,
      type: 'damageIndicator',
      damageAmount: damageAmount
    });

    return particleGroup;
  }

  // Update all active particle systems
  update(delta) {
    // Update each particle
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];

      // Update life
      p.life += delta;

      // Remove dead particles
      if (p.life >= p.maxLife) {
        p.group.remove(p.mesh);
        // Only dispose geometry and material for non-text particles (to avoid issues with canvas textures)
        if (!p.isTextParticle) {
          p.mesh.geometry.dispose();
          if (p.mesh.material.map && p.mesh.material.map !== this.damageTexture) {
            p.mesh.material.map.dispose();
          }
          p.mesh.material.dispose();
        }
        this.particles.splice(i, 1);
        continue;
      }

      // Apply velocity - move in world space (no need to check isTextParticle anymore since we removed text)
      p.mesh.position.add(p.velocity.clone().multiplyScalar(delta));

      // Fade out as life decreases
      const lifeRatio = 1 - (p.life / p.maxLife);
      if (p.mesh.material) {
        p.mesh.material.opacity = 0.8 * lifeRatio;
      }

      // Scale down as life decreases
      const scale = p.initialScale.clone().multiplyScalar(lifeRatio);
      p.mesh.scale.copy(scale);

      // Rotate the particle
      p.mesh.rotation.z += p.rotationSpeed;
    }

    // Clean up empty groups
    for (let i = this.activeSystems.length - 1; i >= 0; i--) {
      const system = this.activeSystems[i];
      if (system.group.children.length === 0) {
        this.scene.remove(system.group);
        this.activeSystems.splice(i, 1);
      }
    }
  }

  // Clean up all particles
  dispose() {
    // Remove all particle groups from the scene
    for (const system of this.activeSystems) {
      this.scene.remove(system.group);
    }
    
    // Dispose of all particle geometries and materials
    for (const p of this.particles) {
      p.mesh.geometry.dispose();
      p.mesh.material.dispose();
    }
    
    this.particles = [];
    this.activeSystems = [];
  }
}