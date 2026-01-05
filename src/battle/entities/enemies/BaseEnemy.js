import * as THREE from 'three';

export class Enemy {
  constructor(scene, player, enemyBullets, options = {}) {
    console.log("options=",options);
    this.scene = scene;
    this.player = player;
    this.enemyBullets = enemyBullets;
    this.hp = options.hp ?? 100;
    this.maxHp = this.hp;
    this.armor = options.armor ?? 0; // 添加护甲值
    this.hitRadius = options.hitRadius ?? 5; // 默认碰撞半径
    this.dead = false;
    this.birthTime = performance.now() / 1000;
    this.options = options;
    this.mesh = this.createMesh();
    this.mesh.position.copy(options.position || new THREE.Vector3(0, 250, 0));
    scene.add(this.mesh);
  }

  createMesh() { throw new Error("子类必须实现 createMesh()"); }

  update(delta, globalTime) { }

  takeDamage(damage, hasArmorPiercing = false) {
    console.log("take damage",damage);
    if (this.dead) return false;

    // 如果有穿甲效果，忽略护甲
    let actualDamage = damage;
    if (!hasArmorPiercing && this.armor > 0) {
      // 如果伤害小于等于护甲，完全不受伤
      if (damage <= this.armor) {
        return true; // 伤害被完全抵消，但返回true表示处理成功
      }
      actualDamage = damage - this.armor;
    }

    this.hp -= actualDamage;
    console.log("left hp =",this.hp);

    // 检查玩家是否有吸血升级
    if (this.player && this.player.data && this.player.data.upgrades) {
      const hasVampire = this.player.data.upgrades.includes("吸血");
      if (hasVampire && this.player.health !== undefined && this.player.maxHealth !== undefined) {
        // 固定回复5点生命值，但不超过最大生命值
        this.player.health = Math.min(this.player.maxHealth, this.player.health + 5);

        // 保存更新后的生命值
        if (this.player.data) {
          this.player.data.health = this.player.health;
        }
      }
    }

    this.onHit?.();
    if (this.hp <= 0)
    {
      this.kill_by_player = true;
      this.die();
    }
    return true;
  }

  die() {
    if (this.dead) return;
    this.dead = true;
    this.onDeath?.();
    this.scene.remove(this.mesh);
  }
}