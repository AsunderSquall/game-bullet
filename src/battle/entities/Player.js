// ==========================
// Player.js（重构版 + 符卡系统）
// ==========================
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { storage } from '../../utils/storage.js';
import { currentPlayer } from '../battle.js';
import { musicManager } from '../../utils/musicManager.js';

export const keys = { w: false, a: false, s: false, d: false, shift: false };
export let scrollSpeed = 0;
export const SCROLL_SENSITIVITY = 0.01;
export const MAX_SCROLL_SPEED = 10;

export let yaw = 0, pitch = 0;
export let firstPerson = false;
export let shooting = false;
export let global_hitOffset = new THREE.Vector3(0, 0, 0);

let playerData = null;

export async function loadPlayerData() {
  playerData = await storage.load('playerCur.json', {
    health: 100,
    maxHealth: 100,
    shields: 0,
    bombs: 3,
    lives: 2,
    power: 0,
    maxPower: 400,
    hitRadius: 0.6,
    hitOffsetY: 0.6,
    grazeRadius: 1.4,
    attackPower: 28,
    attackSpeed: 0.09,
    regenerateInterval: -1.0,
    regenTimer: 0,
    totem: 0,
    bulletType: "sakuya_knife_normal",
    position: { x: 0, y: 15, z: 0 },
    upgrades: []
  });
  return playerData;
}

export class Player {
  constructor(group, hitSphere, data, enemies, playerBullets, enemyBullets, battleInstance = null) {
    this.enemies = enemies;
    this.playerBullets = playerBullets;
    this.enemyBullets = enemyBullets;  // 用于符卡清弹
    this.battleInstance = battleInstance; // 用于访问相机和其他战斗实例属性

    this.object = group;
    this.hitSphere = hitSphere;
    this.data = data;
    this.shootTimer = 0;
    this.lastShooting = false;

    // 符卡变量
    this.spellCardActive = false;
    this.spellCardTimer = 0;
    this.spellCardCooldown = 0;
    this.spellCardSphere = null;
    this.spellCardMaxRadius = 200;
    this.spellCardDuration = 2.0;

    this.health = data.health;
    this.maxHealth = data.maxHealth;
    this.invulnerableUntil = 0;

    // 添加伤害音效相关属性
    this.lastDamageTime = 0;
    this.damageCooldown = 1.0; // 1秒伤害冷却时间

    // 相机抖动相关属性
    this.cameraShakeIntensity = 0;
    this.cameraShakeDuration = 0;
    this.cameraShakeTimer = 0;

    this.hitRadius = data.hitRadius;
    this.hitOffset = new THREE.Vector3(0, data.hitOffsetY, 0);
    global_hitOffset = this.hitOffset;
    this.dead = false;

    // 预加载子弹类
    this.sakuyaKnifeClass = null;
    this.homingKnifeClass = null;
    this.loadBulletClasses();
  }

  async loadBulletClasses() {
    const { SakuyaKnife } = await import('./playerBullets/SakuyaKnife.js');
    this.sakuyaKnifeClass = SakuyaKnife;

    const { HomingKnife } = await import('./playerBullets/HomingKnife.js');
    this.homingKnifeClass = HomingKnife;
  }

  createBullet(position, direction, damage) {
    let BulletClass;
    if (this.data.bulletType === 'homeing_knife') {
      BulletClass = this.homingKnifeClass || this.sakuyaKnifeClass;
    } else {
      BulletClass = this.sakuyaKnifeClass;
    }

    if (BulletClass) {
      if (this.data.bulletType === 'homeing_knife') {
        return new BulletClass(this.object.parent, position, direction, { damage: damage }, this.enemies);
      } else {
        return new BulletClass(this.object.parent, position, direction, { damage: damage });
      }
    }
    return null;
  }

  getHitPosition() {
    return this.object.position.clone().add(this.hitOffset);
  }

  // 符卡发动
  activateSpellCard() {
    if (this.dead || this.spellCardActive || this.spellCardCooldown > 0 || this.data.bombs <= 0) {
      return false;
    }

    this.data.bombs -= 1;
    storage.set('playerCur.json', { ...this.data, bombs: this.data.bombs });

    this.spellCardActive = true;
    this.spellCardTimer = 0;
    this.spellCardCooldown = 8;

    const geometry = new THREE.SphereGeometry(1, 32, 24);
    const material = new THREE.MeshBasicMaterial({
      color: 0xcc99ff,
      transparent: true,
      opacity: 0.28,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending
    });
    this.spellCardSphere = new THREE.Mesh(geometry, material);
    this.spellCardSphere.position.copy(this.getHitPosition());
    this.object.parent.add(this.spellCardSphere);

    console.log("✨ 符卡发动！完美结界展开～");
    return true;
  }

  takeDamage(amount) {
    amount -= this.data.shields;
    if (this.dead) return;
    const now = performance.now() / 1000;
    if (now < (this.invulnerableUntil || 0)) {
      console.log("take damage,无敌");
      return;
    }

    this.health -= amount;
    console.log("take damage,health=",this.health);
    storage.set('playerCur.json', { ...this.data, health: this.health });

    // 检查是否在伤害冷却时间内
    if (now - this.lastDamageTime >= this.damageCooldown) {
      this.lastDamageTime = now;
      // 播放随机射击音效（伤害音效），音量调低
      this.playDamageSound();

      // 触发相机抖动效果
      this.startCameraShake();
    }

    if (this.health <= 0) {
      if (this.data.totem > 0) {
        this.data.totem--;
        this.health = this.maxHealth;
        storage.set('playerCur.json', { ...this.data, health: this.health, totem: this.data.totem });
        return;
      }
      this.health = 0;
      this.dead = true;
      console.log("玩家死亡");
    }
    this.invulnerableUntil = now + 1;
  }

  // 开始相机抖动
  startCameraShake() {
    // 设置抖动参数
    this.cameraShakeIntensity = 3.0; // 抖动强度
    this.cameraShakeDuration = 0.5; // 抖动持续时间（秒）
    this.cameraShakeTimer = this.cameraShakeDuration;
  }

  // 更新相机抖动
  updateCameraShake(delta) {
    if (this.cameraShakeTimer > 0) {
      this.cameraShakeTimer -= delta;

      if (this.battleInstance && this.battleInstance.camera) {
        const camera = this.battleInstance.camera;

        // 计算抖动衰减
        const shakeProgress = this.cameraShakeTimer / this.cameraShakeDuration;
        const currentIntensity = this.cameraShakeIntensity * shakeProgress;

        // 生成随机抖动偏移
        const offsetX = (Math.random() - 0.5) * 2 * currentIntensity;
        const offsetY = (Math.random() - 0.5) * 2 * currentIntensity;
        const offsetZ = (Math.random() - 0.5) * 2 * currentIntensity;

        // 应用抖动到相机位置
        camera.position.x += offsetX;
        camera.position.y += offsetY;
        camera.position.z += offsetZ;
      }
    } else {
      this.cameraShakeTimer = 0;
      this.cameraShakeIntensity = 0;
    }
  }

  playDamageSound() {
    // 创建一个临时音频实例用于播放伤害音效
    // 随机选择一个射击音效
    const musicList = musicManager.musicLibrary.shoot || [];
    if (musicList.length === 0) return;

    const randomMusic = musicList[Math.floor(Math.random() * musicList.length)];
    const musicPath = `music/${randomMusic}`;

    const damageAudio = new Audio(musicPath);
    // 将音量调低（例如30%）
    damageAudio.volume = musicManager.volume * 0.3;
    damageAudio.play().catch(e => {
      console.warn('Damage sound play failed:', e);
    });
  }

  update(delta) {
    if (this.spellCardCooldown > 0) {
      this.spellCardCooldown -= delta;
      if (this.spellCardCooldown < 0) this.spellCardCooldown = 0;
    }

    if (this.spellCardActive) {
      this.spellCardTimer += delta;
      const progress = Math.min(1, this.spellCardTimer / this.spellCardDuration);
      const radius = this.spellCardMaxRadius * progress;

      this.spellCardSphere.scale.set(radius, radius, radius);
      this.spellCardSphere.position.copy(this.getHitPosition());

      for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
        const b = this.enemyBullets[i];
        if (!b.mesh) continue;
        const dist = b.mesh.position.distanceTo(this.spellCardSphere.position);
        if (dist < radius + (b.size || 1)) {
          b.destroy();
          this.enemyBullets.splice(i, 1);
        }
      }

      if (progress >= 1) {
        this.spellCardActive = false;
        this.object.parent.remove(this.spellCardSphere);
        this.spellCardSphere.geometry.dispose();
        this.spellCardSphere.material.dispose();
        this.spellCardSphere = null;
      }
    }

    // 原有逻辑完全不变
    if (this.data.regenerateInterval > 0.0 && this.health < this.maxHealth) {
      this.regenTimer += delta;
      if (this.regenTimer >= this.data.regenerateInterval) {
        this.regenTimer -= this.data.regenerateInterval;
        this.health = Math.floor(this.health + 1.0);
      }
      storage.set('playerCur.json', {
        ...this.data,
        health: this.health,
      });
    }
    let speed = 1.2;
    if (keys.shift) speed *= 0.3;

    const p = this.object.position;

    if (keys.w) p.y += speed;
    if (keys.s) p.y -= speed;
    if (keys.a) p.x += speed;
    if (keys.d) p.x -= speed;

    if (scrollSpeed !== 0) {
      const move = Math.sign(scrollSpeed) * Math.min(Math.abs(scrollSpeed), MAX_SCROLL_SPEED * delta);
      const forward = new THREE.Vector3(
        Math.sin(yaw) * Math.cos(pitch),
        Math.sin(pitch),
        Math.cos(yaw) * Math.cos(pitch)
      ).normalize();
      p.add(forward.multiplyScalar(move));
      scrollSpeed -= move / delta;
    }

    p.x = THREE.MathUtils.clamp(p.x, -499, 499);
    p.y = THREE.MathUtils.clamp(p.y, 1, 499);
    p.z = THREE.MathUtils.clamp(p.z, -499, 499);

    const now = (typeof performance !== 'undefined' ? performance.now() : Date.now()) / 1000;
    if (now < (this.invulnerableUntil || 0)) {
          const shouldShow = Math.floor(now * 20) % 2 === 0;
          this.object.visible = shouldShow;
        } else {
          this.object.visible = true;
        }

        if (this.hitSphere) this.hitSphere.visible = keys.shift;
      
        this.shootTimer += delta;
        if (shooting !== this.lastShootingState) {
        this.lastShootingState = shooting;
        this.object.traverse((child) => {
          if (child.isMesh && child.userData?.normalMat) { 
            child.material = shooting ? child.userData.redMat : child.userData.normalMat;
          }
        });
      }

        if (firstPerson) {
        this.object.visible = false;
        if (this.hitSphere) this.hitSphere.visible = false;
      } else {
        if (now < (this.invulnerableUntil || 0)) {
          const shouldShow = Math.floor(now * 20) % 2 === 0;
          this.object.visible = shouldShow;
        } else {
          this.object.visible = true;
        }
        if (this.hitSphere) this.hitSphere.visible = keys.shift;
      }
      if (shooting && this.shootTimer >= this.data.attackSpeed) {
        this.shootTimer = 0;

        const forward0 = new THREE.Vector3(0, 0, 1);
        const spawnPos0 = this.getHitPosition().clone().add(forward0.clone().multiplyScalar(2));
        const bullet0 = this.createBullet(spawnPos0, forward0, this.data.attackPower);
        if (bullet0) this.playerBullets.push(bullet0);
        if (this.data.power>=100)
        {
          const forward1 = new THREE.Vector3(0, 0.05, 1);
          const spawnPos1 = this.getHitPosition().clone().add(forward1.clone().multiplyScalar(2));
          const bullet1 = this.createBullet(spawnPos1, forward1, this.data.attackPower);
          if (bullet1) this.playerBullets.push(bullet1);
        }
        if (this.data.power>=200)
        {
          const forward1 = new THREE.Vector3(0, -0.05, 1);
          const spawnPos1 = this.getHitPosition().clone().add(forward1.clone().multiplyScalar(2));
          const bullet1 = this.createBullet(spawnPos1, forward1, this.data.attackPower);
          if (bullet1) this.playerBullets.push(bullet1);
        }
        if (this.data.power>=300)
        {
          const forward1 = new THREE.Vector3(0.05, 0, 1);
          const spawnPos1 = this.getHitPosition().clone().add(forward1.clone().multiplyScalar(2));
          const bullet1 = this.createBullet(spawnPos1, forward1, this.data.attackPower);
          if (bullet1) this.playerBullets.push(bullet1);
        }
        if (this.data.power>=400)
        {
          const forward1 = new THREE.Vector3(-0.05, 0, 1);
          const spawnPos1 = this.getHitPosition().clone().add(forward1.clone().multiplyScalar(2));
          const bullet1 = this.createBullet(spawnPos1, forward1, this.data.attackPower);
          if (bullet1) this.playerBullets.push(bullet1);
        }
    }
  }
}


export async function createPlayer(enemies, playerBullets, enemyBullets, battleInstance = null) {
  const data = await loadPlayerData();

  const group = new THREE.Group();

  // 判定点核心（红色小球）
  const sphereGeometry = new THREE.SphereGeometry(0.25, 16, 12);
  const sphereMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.3,
    depthWrite: false,
    side: THREE.DoubleSide
  });
  const hitSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
  hitSphere.visible = false;
  hitSphere.position.y += data.hitOffsetY;
  group.add(hitSphere);

  // --- GLB 模型加载逻辑 ---
  const gltfLoader = new GLTFLoader();
  const modelPath = playerData.modelPath;
  const modelScale = playerData.modelScale/7;
  console.log("modelPath=",modelPath);
  gltfLoader.load(modelPath, (gltf) => {
    const model = gltf.scene;

    model.scale.set(modelScale, modelScale, modelScale); 
    

    model.traverse((child) => {
      if (!child.isMesh) return;
      const base = child.material;

      const normal = base.clone();
      normal.transparent = true;
      normal.opacity = 0.5;
      normal.depthWrite = true;
      normal.side = THREE.DoubleSide;

      const red = base.clone();
      red.transparent = true;
      red.opacity = 0.5;
      red.color.set(0xff2222);
      red.emissive.set(0xff0000);
      red.emissiveIntensity = 0.5;
      red.depthWrite = true;
      red.side = THREE.DoubleSide;

      child.userData.normalMat = normal;
      child.userData.redMat = red;

      child.material = normal;
    });

    group.add(model);
  }, 
  (xhr) => {
    // 可选：打印加载进度
    // console.log((xhr.loaded / xhr.total * 100) + '% loaded');
  }, 
  (error) => {
    console.error('An error happened loading the GLB model:', error);
  });

  group.position.copy(new THREE.Vector3(data.position.x, data.position.y, data.position.z));

  return new Player(group, hitSphere, data, enemies, playerBullets, enemyBullets, battleInstance);
}

export function setupControls(rendererDom) {
  document.body.addEventListener('click', () => rendererDom.requestPointerLock());

  document.addEventListener('mousemove', (e) => {
    if (document.pointerLockElement === rendererDom) {
      const sensitivity = 0.002;
      const maxDelta = 0.05;

      yaw -= Math.sign(e.movementX) * Math.min(Math.abs(e.movementX * sensitivity), maxDelta);
      pitch -= Math.sign(e.movementY) * Math.min(Math.abs(e.movementY * sensitivity), maxDelta);

      pitch = Math.max(-Math.PI / 2 + 0.01, Math.min(Math.PI / 2 - 0.01, pitch));
      yaw = THREE.MathUtils.clamp(yaw, -Math.PI / 2, Math.PI / 2);
    }
  });

  document.addEventListener('keydown', (e) => {
    const k = e.key.toLowerCase();
    if (k in keys) keys[k] = true;
    if (k === 'r' && !e.repeat) firstPerson = !firstPerson;
    if (k === 'z' && !e.repeat) shooting = !shooting;
    if (k === 'b' && !e.repeat) {
      currentPlayer?.activateSpellCard();  // 使用 battle.js 里的全局 currentPlayer
    }
  });

  document.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k in keys) keys[k] = false;
  });

  document.addEventListener('wheel', (e) => {
    scrollSpeed += e.deltaY * -SCROLL_SENSITIVITY;
  });
}