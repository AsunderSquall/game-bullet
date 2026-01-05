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

    // 使用高自发光值来增加亮度，但不产生光源效果
    const mat = new THREE.MeshStandardMaterial({
      color: options.color,
      emissive: options.color, // 使用相同颜色作为自发光
      emissiveIntensity: 0.5, // 适度的自发光强度
      metalness: 0.05,
      roughness: 0.25,
      transparent: true,
      opacity: 0.9
    });

    const mesh = new THREE.Mesh(geo, mat);
    return mesh;
  }

  // 创建轨迹粒子
  createTrailParticle() {
    // 创建一个较小的粒子几何体
    const particleGeometry = new THREE.SphereGeometry(this.size * 0.4, 6, 6);
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: this.mesh.material.color,
      transparent: true,
      opacity: 0.7,
      depthWrite: false
    });

    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    particle.position.copy(this.mesh.position);
    this.scene.add(particle);

    // 添加到粒子数组，以便后续更新
    this.trailParticles.push({
      mesh: particle,
      life: 0.0, // 当前生命周期
      maxLife: 0.4, // 最大生命周期
      initialScale: particle.scale.clone(),
      initialOpacity: 0.7
    });
  }

  // 更新轨迹粒子
  updateTrailParticles(delta) {
    for (let i = this.trailParticles.length - 1; i >= 0; i--) {
      const particle = this.trailParticles[i];
      particle.life += delta;

      if (particle.life >= particle.maxLife) {
        // 移除生命周期结束的粒子
        this.scene.remove(particle.mesh);
        particle.mesh.geometry.dispose();
        particle.mesh.material.dispose();
        this.trailParticles.splice(i, 1);
      } else {
        // 更新粒子大小和透明度，创建淡出效果
        const lifeRatio = particle.life / particle.maxLife;
        const scaleRatio = 1 - lifeRatio; // 随时间缩小
        particle.mesh.scale.set(
          particle.initialScale.x * scaleRatio,
          particle.initialScale.y * scaleRatio,
          particle.initialScale.z * scaleRatio
        );

        // 更新粒子透明度
        const opacity = particle.initialOpacity * (1 - lifeRatio);
        particle.mesh.material.opacity = opacity;
      }
    }
  }

  update(delta, player, totalTime) {
    super.update(delta, player, totalTime);
  }

  behave(delta, totalTime) {
    this.mesh.position.add(
      this.direction.clone().multiplyScalar(this.speed * delta)
    );
  }

  destroy() {
    // 调用父类的destroy方法
    super.destroy();
  }
}