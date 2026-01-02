import * as THREE from 'three';
import { Enemy } from './BaseEnemy.js';
import { RiceBullet } from '../enemyBullets/RiceBullet.js';
import { HomingBullet } from '../enemyBullets/HomingBullet.js';

export class GalacticBoss extends Enemy {
    constructor(scene, player, enemyBullets, options = {}) {
        super(scene, player, enemyBullets, { hp: options.hp || 20000, ...options });

        this.hitRadius = 15; // 初始判定半径
        this.stateTimer = 0;
        this.attackPhase = 0;
        this.patternAngle = 0;
        this.lastShootTime = 0;

        this.shootIntervals = { spiral: 0.12, star: 0.30, nebula: 0.06, void: 0.08 };
    }

    createMesh() {
        const group = new THREE.Group();
        
        // 核心：二十面体
        const coreGeo = new THREE.IcosahedronGeometry(8, 2);
        const coreMat = new THREE.MeshStandardMaterial({ 
            color: 0xff00ff, 
            emissive: 0xff00ff, 
            emissiveIntensity: 2, 
            wireframe: true 
        });
        this.coreMesh = new THREE.Mesh(coreGeo, coreMat);
        group.add(this.coreMesh);

        // 装饰环
        const ringGeo = new THREE.TorusGeometry(12, 0.4, 16, 100);
        const ringMat = new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff });
        this.ring1 = new THREE.Mesh(ringGeo, ringMat);
        this.ring2 = new THREE.Mesh(ringGeo, ringMat);
        this.ring2.rotation.x = Math.PI / 2;
        group.add(this.ring1, this.ring2);

        group.add(new THREE.PointLight(0xff00ff, 100, 100));
        return group;
    }

    update(delta, globalTime) {
        if (this.dead) return;

        // --- 1. 缩放与判定同步 ---
        // 第4阶段变3倍，否则1倍
        const isRageMode = (this.attackPhase === 4);
        const targetScale = isRageMode ? 3.0 : 1.0;
        
        // 平滑缩放模型
        this.mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 2.0);

        // 判定半径同步：从 1.0(对应15) 平滑过渡到 3.0(对应45)
        const t = (this.mesh.scale.x - 1.0) / (3.0 - 1.0);
        this.hitRadius = THREE.MathUtils.lerp(15, 45, t);

        // --- 2. 基础运动与自转 ---
        this.mesh.position.x += Math.sin(globalTime * 1.5) + Math.cos(globalTime * 2.7);
        this.mesh.position.y += Math.cos(globalTime * 0.8) + Math.sin(globalTime * 3.3);
        this.ring1.rotation.z += delta * 2;
        this.ring2.rotation.y += delta * 1.5;
        this.coreMesh.rotation.y -= delta * 0.8;

        this.stateTimer += delta;

        // --- 3. 攻击阶段状态机与变色逻辑 ---
        switch (this.attackPhase) {
            case 0: // 螺旋
                if (this.canShoot('spiral')) this.shootSpiralPetals();
                if (this.stateTimer > 5) this.nextPhase();
                break;
            case 1: // 蓄力警告
                this.coreMesh.material.emissiveIntensity = 5 + Math.sin(globalTime * 10) * 5;
                if (this.stateTimer > 1.5) this.nextPhase();
                break;
            case 2: // 五角星追踪
                if (this.canShoot('star')) this.shootMovingStar();
                if (this.stateTimer > 6) this.nextPhase();
                break;
            case 3: // 星云
                if (this.canShoot('nebula')) this.shootNebula(globalTime);
                if (this.stateTimer > 5) this.nextPhase();
                break;
            case 4: // 狂暴：虚空坍缩 (变大 + 变红)
                // 变为红色警示
                this.coreMesh.material.color.setHex(0xff0000);
                this.coreMesh.material.emissive.setHex(0xff0000);
                
                if (this.canShoot('void')) this.shootVoidCollapse(globalTime);
                
                if (this.stateTimer > 8) {
                    // 回到阶段 0 前重置为原始紫色
                    this.coreMesh.material.color.setHex(0xff00ff);
                    this.coreMesh.material.emissive.setHex(0xff00ff);
                    this.attackPhase = 0;
                    this.stateTimer = 0;
                }
                break;
        }
    }

    nextPhase() { 
        this.attackPhase++; 
        this.stateTimer = 0; 
        this.coreMesh.material.emissiveIntensity = 2; // 重置发光强度
    }

    canShoot(type) {
        const now = performance.now() / 1000;
        if (now - this.lastShootTime > this.shootIntervals[type]) {
            this.lastShootTime = now;
            return true;
        }
        return false;
    }

    // 弹幕函数部分保持不变...
    shootSpiralPetals() {
        this.patternAngle += 0.4;
        for (let i = 0; i < 5; i++) {
            const angle = this.patternAngle + (i * Math.PI * 2) / 5;
            const dir = new THREE.Vector3(Math.cos(angle) * 0.3, Math.sin(angle) * 0.3, -4).normalize();
            this.fireBullet(dir, 0x00ffff, 60, 1.5);
        }
    }

    shootMovingStar() {
        this.patternAngle += 0.15;
        for (let i = 0; i < 5; i++) {
            const startAngle = i * ((Math.PI * 2) / 5) + this.patternAngle;
            const endAngle = (i + 2) * ((Math.PI * 2) / 5) + this.patternAngle;
            for (let j = 0; j < 6; j++) {
                const t = j / 6;
                const x = Math.cos(startAngle) * (1 - t) + Math.cos(endAngle) * t;
                const y = Math.sin(startAngle) * (1 - t) + Math.sin(endAngle) * t;
                const dir = new THREE.Vector3(x * 0.5, y * 0.5, -4).normalize();
                this.enemyBullets.push(new HomingBullet(this.scene, this.mesh.position.clone(), dir, {
                    speed: 45, damage: 15, color: 0xffaa00, target: this.player, maxTurnAngle: 0.02, size: 1.2
                }));
            }
        }
    }

    shootNebula(globalTime) {
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const dir = new THREE.Vector3(Math.cos(angle) * 0.2, Math.sin(angle) * 0.2, -4).normalize();
            this.fireBullet(dir, 0xff00aa, 50 + Math.sin(globalTime * 4) * 15, 2);
        }
    }

    shootVoidCollapse(globalTime) {
        this.patternAngle += 0.25;
        const spread = Math.sin(globalTime * 3) > 0 ? 1.2 : -0.6;
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2 + this.patternAngle;
            const dir = new THREE.Vector3(Math.cos(angle) * spread, Math.sin(angle) * spread, -3.5).normalize();
            this.fireBullet(dir, 0xff0000, 85, 3.0);
        }
    }

    fireBullet(direction, color, speed, size) {
        this.enemyBullets.push(new RiceBullet(this.scene, this.mesh.position.clone(), direction, {
            speed, damage: 20, color, size, grazeThreshold: size * 1.5
        }));
    }
}