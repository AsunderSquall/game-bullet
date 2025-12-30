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

    // 添加通关相关属性
    this.allWavesSpawned = false; // 标记是否已生成所有波次的敌人
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

    // 检查是否已生成所有波次的敌人
    if (this.currentWaveIndex >= this.waves.length && !this.allWavesSpawned) {
      this.allWavesSpawned = true;
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

    // 检查是否通关
    this.checkWinCondition();
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

  // 检查是否满足通关条件
  checkWinCondition() {
    // 只有在所有波次的敌人都已生成后，才检查通关条件
    if (this.allWavesSpawned && this.enemies.length === 0) {
      // 所有敌人已被消灭，判定通关
      this.onWin();
    }
  }

  // 通关时调用的函数
  onWin() {
    console.log("恭喜通关！");
    // 调用结算画面接口
    this.showVictoryScreen();
  }

  // 预留的结算画面接口
  showVictoryScreen() {
    // 这里是预留的接口，你可以在这里实现结算画面逻辑
    console.log("显示结算画面");

    // 可以在这里添加实际的结算画面逻辑
    // 例如：显示胜利界面、统计得分、保存游戏进度等
    if (window.showBattleResult) {
      window.showBattleResult('victory');
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