// src/enemies/GalacticBoss.js
import * as THREE from 'three';
import { Enemy } from './BaseEnemy.js';
import { RiceBullet } from '../enemyBullets/RiceBullet.js';
import { HomingBullet } from '../enemyBullets/HomingBullet.js';

export class GalacticBoss extends Enemy {
    constructor(scene, player, enemyBullets, options = {}) {
        super(scene, player, enemyBullets, {
            hp: options.hp || 20000,
            ...options
        });

        this.baseHitRadius = options.hitRadius || 30;
        this.hitRadius = this.baseHitRadius;
        this.stateTimer = 0;
        this.attackPhase = 0;
        this.patternAngle = 0;

        this.lastShootTime = 0;
        this.shootIntervals = {
            spiral: 0.12,
            star: 0.30,
            nebula: 0.06,
            void: 0.08 // 第四阶段射击频率
        };
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
        group.add(this.ring1);
        group.add(this.ring2);

        const light = new THREE.PointLight(0xff00ff, 100, 100);
        group.add(light);
        
        return group;
    }

    update(delta, globalTime) {
        if (this.dead) return;

        // --- 1. 尺寸缩放逻辑 ---
        // 只有在第四阶段（case 4）时变为 3 倍大小，平时为 1 倍
        const targetScale = this.attackPhase === 4 ? 3.0 : 1.0;
        // 使用 lerp 实现平滑的缩放过渡
        this.mesh.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), delta * 2.0);
        // 同步更新碰撞半径，确保判定准确
        this.hitRadius = this.baseHitRadius * this.mesh.scale.x;

        // --- 2. 基础运动轨迹 (周期性组合波) ---
        this.mesh.position.x += Math.sin(globalTime * 1.5) * 1.0 + Math.cos(globalTime * 2.7) * 1.2 + Math.sin(globalTime * 4) * 1.2;
        this.mesh.position.y += Math.cos(globalTime * 0.8) * 0.5 + Math.sin(globalTime * 2.4) * 0.5 + Math.sin(globalTime * 3.3) * 1.8;
        
        // 自转动画
        this.ring1.rotation.z += delta * 2.0;
        this.ring2.rotation.y += delta * 1.5;
        this.coreMesh.rotation.y -= delta * 0.8;

        this.stateTimer += delta;

        // --- 3. 攻击阶段状态机 ---
        switch (this.attackPhase) {
            case 0: // 螺旋模式
                if (this.canShoot('spiral')) this.shootSpiralPetals();
                if (this.stateTimer > 5) this.nextPhase();
                break;
            case 1: // 蓄力模式 (视觉警告)
                this.coreMesh.material.emissiveIntensity = 5 + Math.sin(globalTime * 10) * 5;
                if (this.stateTimer > 1.5) this.nextPhase();
                break;
            case 2: // 五角星模式
                if (this.canShoot('star')) this.shootMovingStar();
                if (this.stateTimer > 6) this.nextPhase();
                break;
            case 3: // 星云模式
                if (this.canShoot('nebula')) this.shootNebula(globalTime);
                if (this.stateTimer > 5) this.nextPhase();
                break;
            case 4: // 第四阶段：虚空坍缩 (变大阶段)
                // 核心颜色变为红色警示
                this.coreMesh.material.color.setHex(0xff0000);
                this.coreMesh.material.emissive.setHex(0xff0000);
                
                if (this.canShoot('void')) this.shootVoidCollapse(globalTime);
                
                if (this.stateTimer > 8) {
                    // 循环回到阶段 0，并重置颜色
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
        this.coreMesh.material.emissiveIntensity = 2;
    }

    canShoot(type) {
        const now = performance.now() / 1000;
        if (now - this.lastShootTime > this.shootIntervals[type]) {
            this.lastShootTime = now;
            return true;
        }
        return false;
    }

    // 阶段 0: 螺旋
    shootSpiralPetals() {
        this.patternAngle += 0.4;
        const arms = 5;
        for (let i = 0; i < arms; i++) {
            const angle = this.patternAngle + (i * Math.PI * 2) / arms;
            const dir = new THREE.Vector3(
                Math.cos(angle) * 0.3,
                Math.sin(angle) * 0.3,
                -4.0
            ).normalize();
            this.fireBullet(dir, 0x00ffff, 60, 1.5);
        }
    }

    // 阶段 2: 五角星
    shootMovingStar() {
        const points = 5;
        const bulletsPerSide = 6;
        const step = (Math.PI * 2) / points;
        this.patternAngle += 0.15;

        for (let i = 0; i < points; i++) {
            const startAngle = i * step + this.patternAngle;
            const endAngle = (i + 2) * step + this.patternAngle;
            const p1 = { x: Math.cos(startAngle), y: Math.sin(startAngle) };
            const p2 = { x: Math.cos(endAngle), y: Math.sin(endAngle) };

            for (let j = 0; j < bulletsPerSide; j++) {
                const t = j / bulletsPerSide;
                const x = p1.x * (1 - t) + p2.x * t;
                const y = p1.y * (1 - t) + p2.y * t;
                
                // 计算初始方向
                const dir = new THREE.Vector3(x * 0.5, y * 0.5, -4.0).normalize();
                
                // --- 关键修改：实例化追踪弹 ---
                const hBullet = new HomingBullet(
                    this.scene,
                    this.mesh.position.clone(),
                    dir,
                    {
                        speed: 45,            // 追踪弹速度通常比普通弹慢一点，给玩家反应时间
                        damage: 15,
                        color: 0xffaa00,      // 五角星原色：橙黄色
                        target: this.player,  // 设置追踪目标为玩家
                        maxTurnAngle: 0.02,   // 控制转向灵活性，值越大越难躲
                        size: 1.2,
                        isPlayerBullet: false
                    }
                );
                
                this.enemyBullets.push(hBullet);
            }
        }
    }

    // 阶段 3: 星云
    shootNebula(globalTime) {
        const count = 16;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speedVar = 50 + Math.sin(globalTime * 4) * 15;
            const dir = new THREE.Vector3(
                Math.cos(angle) * 0.2,
                Math.sin(angle) * 0.2,
                -4.0
            ).normalize();
            this.fireBullet(dir, 0xff00aa, speedVar, 2);
        }
    }

    shootVoidCollapse(globalTime) {
        const count = 10;
        this.patternAngle += 0.25;
        
        const pulse = Math.sin(globalTime * 3); 

        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2 + this.patternAngle;
            
            const spread = pulse > 0 ? 1.2 : -0.6;
            
            const dir = new THREE.Vector3(
                Math.cos(angle) * spread,
                Math.sin(angle) * spread,
                -3.5
            ).normalize();

            this.fireBullet(dir, 0xff0000, 85, 3.0);
        }
    }

    fireBullet(direction, color, speed, size) {
        const bullet = new RiceBullet(
            this.scene,
            this.mesh.position.clone(),
            direction,
            {
                speed: speed,
                damage: 20,
                color: color,
                size: size,
                grazeThreshold: size * 1.5
            }
        );
        this.enemyBullets.push(bullet);
    }

    onDeath() {
        console.log("Galactic Boss has been neutralized!");
    }
}