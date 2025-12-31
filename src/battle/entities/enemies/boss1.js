// src/enemies/GalacticBoss.js
import * as THREE from 'three';
import { Enemy } from './BaseEnemy.js';
import { RiceBullet } from '../enemyBullets/RiceBullet.js';

export class GalacticBoss extends Enemy {
    constructor(scene, player, enemyBullets, options = {}) {
        super(scene, player, enemyBullets, {
            hp: options.hp || 20000,
            ...options
        });
        
        this.hitRadius = options.hitRadius || 12;
        this.stateTimer = 0;
        this.attackPhase = 0;
        this.patternAngle = 0;

        this.lastShootTime = 0;
        this.shootIntervals = {
            spiral: 0.12,   // 略微加快发射频率以匹配高速
            star: 0.35,     
            nebula: 0.06    
        };
    }

    createMesh() {
        const group = new THREE.Group();
        const coreGeo = new THREE.IcosahedronGeometry(8, 2);
        const coreMat = new THREE.MeshStandardMaterial({ 
            color: 0xff00ff, 
            emissive: 0xff00ff,
            emissiveIntensity: 2,
            wireframe: true 
        });
        this.coreMesh = new THREE.Mesh(coreGeo, coreMat);
        group.add(this.coreMesh);

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

        this.mesh.position.y += Math.sin(globalTime * 2) * 0.15;
        this.ring1.rotation.z += delta * 2.0;
        this.ring2.rotation.y += delta * 1.5;
        this.coreMesh.rotation.y -= delta * 0.8;

        this.stateTimer += delta;

        switch (this.attackPhase) {
            case 0: 
                if (this.canShoot('spiral')) this.shootSpiralPetals();
                if (this.stateTimer > 5) this.nextPhase();
                break;
            case 1: 
                this.coreMesh.material.emissiveIntensity = 5 + Math.sin(globalTime * 10) * 5;
                if (this.stateTimer > 1.5) this.nextPhase();
                break;
            case 2: 
                if (this.canShoot('star')) this.shootMovingStar();
                if (this.stateTimer > 6) this.nextPhase();
                break;
            case 3: 
                if (this.canShoot('nebula')) this.shootNebula(globalTime);
                if (this.stateTimer > 5) {
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

    /**
     * 弹幕 1：螺旋推进 (Z轴分量强化)
     */
    shootSpiralPetals() {
        this.patternAngle += 0.4;
        const arms = 5;
        for (let i = 0; i < arms; i++) {
            const angle = this.patternAngle + (i * Math.PI * 2) / arms;
            const dir = new THREE.Vector3(
                Math.cos(angle) * 0.3, // 减小XY扩散比例
                Math.sin(angle) * 0.3, 
                -4.0                   // Z轴速度加倍 (原为 -1.0)
            ).normalize();

            // 速度提升至 60 (原为 20)
            this.fireBullet(dir, 0x00ffff, 60, 2.5);
        }
    }

    /**
     * 弹幕 2：狂暴五角星 (Z轴极速)
     */
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

                // 强化 Z轴权重
                const dir = new THREE.Vector3(x * 0.5, y * 0.5, -4.0).normalize();
                this.fireBullet(dir, 0xffaa00, 70, 2.0);
            }
        }
    }

    /**
     * 弹幕 3：星云大爆发
     */
    shootNebula(globalTime) {
        const count = 16;
        for (let i = 0; i < count; i++) {
            const angle = (i / count) * Math.PI * 2;
            const speedVar = 50 + Math.sin(globalTime * 4) * 15; // 整体基数从 15 提至 50
            
            const dir = new THREE.Vector3(
                Math.cos(angle) * 0.2,
                Math.sin(angle) * 0.2,
                -4.0
            ).normalize();

            this.fireBullet(dir, 0xff00aa, speedVar, 3);
        }
    }

    fireBullet(direction, color, speed, size) {
        const bullet = new RiceBullet(
            this.scene,
            this.mesh.position.clone(),
            direction,
            {
                speed: speed,
                damage: 15,
                color: color,
                size: size,
                grazeThreshold: size * 1.5
            }
        );
        this.enemyBullets.push(bullet);
    }

    onDeath() {
        console.log("Boss Defeated!");
    }
}