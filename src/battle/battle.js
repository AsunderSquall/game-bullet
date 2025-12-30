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

    this.gameRunning = true; // 标记游戏是否正在运行
    this.handleResize = null; // 保存resize事件处理器引用
    this.difficulty = 'normal'; // 默认难度
  }

  async start(battleFile = 'battleCur.json') {
    console.log('启动');

    this.scene = createScene();
    this.player = await createPlayer(this.enemies, this.playerBullets);
    currentPlayer = this.player;
    this.scene.add(this.player.object);

    // 恢复玩家满血
    this.restorePlayerHealth();

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

    // 获取难度设置（如果有的话）
    this.difficulty = sessionStorage.getItem('battleDifficulty') || 'normal';
    console.log('战斗难度:', this.difficulty);

    this.animate();
    this.setupResize();
  }

  animate = () => {
    if (!this.gameRunning) return; // 如果游戏未运行，则停止动画循环

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
    if (this.allWavesSpawned) {
      // 情况1：所有敌人已被消灭
      if (this.enemies.length === 0) {
        this.onWin();
        return;
      }

      // 情况2：玩家超过了所有敌人一定距离
      if (this.playerPassedAllEnemies()) {
        this.onWin();
        return;
      }
    }
  }

  // 通关时调用的函数
  onWin() {
    console.log("恭喜通关！");
    // 调用结算画面接口
    this.showVictoryScreen();
  }

  // 检查玩家是否超过了所有敌人
  playerPassedAllEnemies() {
    if (!this.player || !this.enemies || this.enemies.length === 0) {
      return false;
    }

    // 获取玩家的z坐标（前进方向）
    const playerZ = this.player.object.position.z;

    // 获取所有敌人中最前面（z值最大）的敌人的z坐标
    let maxEnemyZ = -Infinity;
    for (const enemy of this.enemies) {
      if (enemy.mesh && !enemy.dead) {
        const enemyZ = enemy.mesh.position.z;
        if (enemyZ > maxEnemyZ) {
          maxEnemyZ = enemyZ;
        }
      }
    }

    // 如果没有存活的敌人，返回false（这种情况应该由其他条件处理）
    if (maxEnemyZ === -Infinity) {
      return false;
    }

    // 定义玩家超过敌人多少距离算作通关（可以根据需要调整）
    const PASS_THRESHOLD = 50; // 玩家超过最前面的敌人50个单位

    // 如果玩家的z坐标大于最前面敌人的z坐标加上阈值，则认为玩家超过了所有敌人
    return playerZ > maxEnemyZ + PASS_THRESHOLD;
  }

  // 预留的结算画面接口
  showVictoryScreen() {
    // 这里是预留的接口，你可以在这里实现结算画面逻辑
    console.log("显示结算画面");

    // 胜利后跳转到地图界面
    this.goToMapScreen();
  }

  // 跳转到地图界面
  async goToMapScreen() {
    console.log("跳转到地图界面");

    // 确保玩家数据已保存
    if (this.player && this.player.data) {
      await storage.save('playerCur.json', this.player.data);
    }

    // 清理当前战斗场景
    this.cleanupBattleScene();

    // 直接调用地图界面函数
    const { showMap } = await import('../map/MapMain.js');
    await showMap();
  }

  // 清理战斗场景
  cleanupBattleScene() {
    // 停止动画循环
    this.gameRunning = false;

    // 移除渲染器
    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }

    // 清理事件监听器
    if (this.handleResize) {
      window.removeEventListener('resize', this.handleResize);
    }
  }

  updateCamera() {
    updateCamera(this.camera, this.player.object);
  }

  // 恢复玩家满血
  restorePlayerHealth() {
    if (this.player && this.player.data) {
      // 将玩家当前血量恢复到最大血量
      this.player.health = this.player.data.maxHealth;
      this.player.data.health = this.player.data.maxHealth;

      // 保存更新后的玩家数据
      storage.save('playerCur.json', this.player.data);

      console.log(`玩家血量已恢复: ${this.player.health}/${this.player.data.maxHealth}`);
    }
  }

  setupResize() {
    this.handleResize = () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', this.handleResize);
  }
}