// battle/battle.js
import * as THREE from 'three';
import 'three-mesh-bvh';
import { createScene } from './scene.js';
import { createCamera, updateCamera } from './camera.js';
import { createPlayer, setupControls } from './entities/Player.js';
import { EnemyFactory } from './entities/EnemyFactory.js';
import { storage } from '../utils/storage.js';
import { updateHUD } from '../ui/hud.js';

let currentPlayer = null;


export class Battle {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.player = null;
    this.clock = new THREE.Clock();

    this.enemies = [];
    this.enemyBullets = [];
    this.playerBullets = [];

    this.time = 0;
    this.waves = [];
    this.currentWaveIndex = 0;

    this.lastShootTime = 0;
  }

  async start(battleFile = 'battleCur.json') {
    console.log('启动');

    this.scene = createScene();
    this.player = await createPlayer(this.enemies, this.playerBullets);
    currentPlayer = this.player;
    this.scene.add(this.player.object);

    this.camera = createCamera();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    setupControls(this.renderer.domElement);

    const battleData = await storage.load(battleFile, {
      name: "测试关卡",
      background: 0x000011,
      waves: []
    });

    this.waves = battleData.waves || [];
    this.scene.background = new THREE.Color(battleData.background);

    this.animate();
    this.setupResize();
  }

  animate = () => {
    requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    this.time += delta;

    this.updatePlayer(delta);
    this.updateWaves();
    this.updateEnemies(delta);
    this.updateEnemyBullets(delta);
    this.updatePlayerBullets(delta);
    this.updateCamera();
    updateHUD(currentPlayer);

    this.renderer.render(this.scene, this.camera);
  };

  updatePlayer(delta) { this.player.update(delta); }

  updateWaves() {
    while (this.currentWaveIndex < this.waves.length && this.time >= this.waves[this.currentWaveIndex].time) {
      this.spawnWave(this.waves[this.currentWaveIndex++]);
    }
  }

  spawnWave(wave) {
    wave.enemies?.forEach(def => {
      const enemy = EnemyFactory.create(
        def.type,
        this.scene,
        this.player,
        this.enemyBullets,
        def
      );
      if (enemy) this.enemies.push(enemy);
    });
  }

  updateEnemies(delta) {
    this.enemies = this.enemies.filter(e => {
      if (!e.dead) e.update?.(delta, this.time);
      return !e.dead;
    });
  }

  updateEnemyBullets(delta) {
    for (let i = this.enemyBullets.length - 1; i >= 0; i--) {
      const b = this.enemyBullets[i];
      b.update(delta, this.player, this.time);
      if (b.markedForDeletion) {
        this.enemyBullets.splice(i, 1);
      }
    }
  }

  updatePlayerBullets(delta) {
    for (let i = this.playerBullets.length - 1; i >= 0; i--) {
      const b = this.playerBullets[i];
      b.update(delta,this.enemies,this.time);
      if (b.markedForDeletion) {
        this.playerBullets.splice(i,1);
      }
    }
  }

  updateCamera() {
    updateCamera(this.camera, this.player.object);
  }

  setupResize() {
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }
}