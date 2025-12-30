// ==========================
// Player.js（重构版）
// ==========================
import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { storage } from '../../utils/storage.js';
import { SakuyaKnife } from './playerBullets/SakuyaKnife.js';

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
    power: 400,
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
  constructor(group, hitSphere, data, enemies, playerBullets) {
    this.enemies = enemies;
    this.playerBullets = playerBullets;
    this.object = group;
    this.hitSphere = hitSphere;
    this.data = data;
    this.shootTimer = 0;
    this.lastShooting = false;

    this.health = data.health;
    this.maxHealth = data.maxHealth;
    this.invulnerableUntil = 0;

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
    // 根据子弹类型创建不同的子弹
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

  update(delta) {
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

export async function createPlayer(enemies, playerBullets) {
  const data = await loadPlayerData();

  const group = new THREE.Group();

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

  const mtlLoader = new MTLLoader();
  mtlLoader.setPath('../models/sakuya-plushie/');
  mtlLoader.load('model.mtl', (materials) => {
    materials.preload();

    const objLoader = new OBJLoader();
    objLoader.setMaterials(materials);
    objLoader.setPath('/models/sakuya-plushie/');
    objLoader.load('model.obj', (obj) => {
      obj.scale.set(0.2, 0.2, 0.2);
      obj.rotation.x = -Math.PI / 2;

      obj.traverse((child) => {
        if (!child.isMesh) return;

        const base = child.material;

        const normal = base.clone();
        normal.transparent = true;
        normal.opacity = 0.3;
        normal.depthWrite = false;
        normal.side = THREE.DoubleSide;

        const red = base.clone();
        red.transparent = true;
        red.opacity = 0.25;
        red.color.set(0xff2222);
        red.emissive.set(0xff5555);
        red.emissiveIntensity = 0.2;
        red.depthWrite = false;
        red.side = THREE.DoubleSide;

        child.userData.normalMat = normal;
        child.userData.redMat = red;

        child.material = normal;
      });
      group.add(obj);
    });
  });

  group.position.copy(new THREE.Vector3(data.position.x, data.position.y, data.position.z));

  return new Player(group, hitSphere, data, enemies, playerBullets);
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
  });

  document.addEventListener('keyup', (e) => {
    const k = e.key.toLowerCase();
    if (k in keys) keys[k] = false;
  });

  document.addEventListener('wheel', (e) => {
    scrollSpeed += e.deltaY * -SCROLL_SENSITIVITY;
  });
}
