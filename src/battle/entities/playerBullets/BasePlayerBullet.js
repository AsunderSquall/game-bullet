// src/playerBullets/BasePlayerBullet.js
import * as THREE from 'three';

export class BasePlayerBullet {
  constructor(scene, position, direction, options = {}, playerData = null) {
    this.scene = scene;
    this.position = position.clone();
    this.direction = direction.clone().normalize();

    // 基础属性
    this.speed = options.speed || 120;
    this.damage = options.damage || 28;
    this.size = options.size || 0.5;
    this.color = options.color || 0x88ccff;
    this.lifetime = options.lifetime || 6;
    this.owner = 'player';

    // 从玩家数据中提取必要的升级信息
    this.hasPierce = false;
    this.hasArmorPiercing = false; // 穿甲效果

    if (playerData && playerData.upgrades) {
      this.hasPierce = playerData.upgrades.includes("穿透");
      this.hasArmorPiercing = playerData.upgrades.includes("穿甲");
    }

    // 状态管理
    this.isDead = false;       // 是否彻底销毁并从列表中移除
    this.exploding = false;    // 是否处于爆炸动画中
    this.explosionTimer = 0;
    this.explosionDuration = 0.3; // 爆炸动画持续时间 (秒)

    // 穿透相关属性
    this.piercedEnemies = []; // 已穿透的敌人列表
    this.pierceCount = 0;     // 当前穿透次数
    this.maxPierceCount = 0;  // 最大穿透次数，0表示不穿透

    // 根据升级设置穿透属性
    if (this.hasPierce) {
      this.maxPierceCount = 3; // 设置最大穿透次数为3
    }

    this.mesh = this.createMesh();
    this.mesh.position.copy(this.position);
    this.scene.add(this.mesh);

    // 初始朝向
    if (this.mesh) {
      this.mesh.lookAt(this.position.clone().add(this.direction));
    }
  }

  createMesh() {
    // 使用八面体并进行顶点拉伸，创建梭形子弹
    const geometry = new THREE.OctahedronGeometry(this.size, 0);
    const positions = geometry.attributes.position;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i);
      // 拉伸 Z 轴
      if (vertex.z > 0) {
        vertex.z *= 8.0; 
      } else {
        vertex.z *= 2.0;
        vertex.z -= 1.5; 
      }
      positions.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }

    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
      color: this.color,
      emissive: 0x000000, // 移除发光效果
      emissiveIntensity: 0.0,
      metalness: 0.1,
      roughness: 0.8,
      side: THREE.DoubleSide,
      transparent: true, // 保持透明度
      opacity: 0.8,
      depthWrite: false
    });

    const mesh = new THREE.Mesh(geometry, mat);
    // 抵消 lookAt 后的默认偏转，确保长轴指向飞行方向
    mesh.rotateX(Math.PI / 4);
    mesh.rotateY(Math.PI / 4);

    return mesh;
  }

  update(delta, enemies) {
    // 1. 如果已经彻底死亡，通知管理器从数组移除
    if (this.isDead) return false;

    // 2. 爆炸动画逻辑
    if (this.exploding) {
      this.explosionTimer += delta;
      const progress = this.explosionTimer / this.explosionDuration;

      if (progress >= 1.0) {
        this.destroy();
        this.isDead = true;
        return false;
      }

      // 视觉反馈：体积迅速膨胀，同时颜色变淡消失
      const scaleFactor = 1.0 + progress * 3.5; // 膨胀至约 4.5 倍
      this.mesh.scale.set(scaleFactor, scaleFactor, scaleFactor);
      this.mesh.material.opacity = 1.0 - progress;
      this.mesh.material.emissiveIntensity = 2.0 * (1.0 - progress);

      return true; // 爆炸期间仍返回 true 以保持在列表内
    }

    // 3. 正常飞行逻辑
    const moveStep = this.direction.clone().multiplyScalar(this.speed * delta);
    this.position.add(moveStep);
    this.mesh.position.copy(this.position);

    // 4. 碰撞检测
    for (let i = enemies.length - 1; i >= 0; i--) {
      const enemy = enemies[i];
      if (!enemy || enemy.dead) continue;

      // 检查是否已经穿透过这个敌人
      if (this.piercedEnemies.includes(enemy)) continue;

      const dist = this.position.distanceTo(enemy.mesh.position);
      // 优先取 enemy.hitRadius，否则取几何体参数
      const enemyHitRadius = enemy.hitRadius || 2.5;

      if (dist < enemyHitRadius + this.size) {
        this.startExplosion(enemy);
        return true;
      }
    }

    // 5. 寿命与边界检查
    this.lifetime -= delta;
    if (this.lifetime <= 0 || this.position.length() > 1000) {
      this.destroy();
      this.isDead = true;
      return false;
    }

    return true;
  }

  /**
   * 触发爆炸效果
   * @param {Object} enemy 被击中的敌人对象
   */
  startExplosion(enemy) {
    if (this.exploding) return;

    // 检查穿透效果
    if (this.hasPierce && this.pierceCount < this.maxPierceCount) {
      // 有穿透效果且未达到最大穿透次数
      this.pierceCount++;
      this.piercedEnemies.push(enemy); // 记录已穿透的敌人

      // 立即结算伤害，传递穿甲信息
      if (enemy && typeof enemy.takeDamage === 'function') {
        enemy.takeDamage(this.damage, this.hasArmorPiercing);
        this.onHit?.(enemy);
      }

      // 不进入爆炸状态，继续飞行
      return;
    } else {
      // 没有穿透效果或已达到最大穿透次数，正常爆炸
      this.exploding = true;
      this.speed = 0; // 停止移动

      // 立即结算伤害，传递穿甲信息
      if (enemy && typeof enemy.takeDamage === 'function') {
        enemy.takeDamage(this.damage, this.hasArmorPiercing);
        this.onHit?.(enemy);
      }
    }
  }

  destroy() {
    if (this.mesh) {
      this.scene.remove(this.mesh);
      if (this.mesh.geometry) this.mesh.geometry.dispose();
      if (this.mesh.material) this.mesh.material.dispose();
      this.mesh = null;
    }
  }

  onHit(enemy) {
    // 预留给外部重写的钩子
  }
}