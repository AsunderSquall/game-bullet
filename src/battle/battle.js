// battle/battle.js
import * as THREE from 'three';
import 'three-mesh-bvh';
import { createScene } from './scene.js';
import { createCamera, updateCamera } from './camera.js';
import { createPlayer, setupControls } from './entities/Player.js';
import { EnemyFactory } from './entities/EnemyFactory.js';
import { storage } from '../utils/storage.js';
import { updateHUD } from '../ui/hud.js';
import { RandomBattleGenerator } from './utils/randomBattleGenerator.js';
import { musicManager } from '../utils/musicManager.js';
import { createCardFromId } from '../cards/CardFactory.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { CopyShader } from 'three/examples/jsm/shaders/CopyShader.js';

export let currentPlayer = null;

export class Battle {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.player = null;
    this.clock = new THREE.Clock();
    this.totalEnemiesCount = 0;
    this.killedEnemiesCount = 0;

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
    this.celebrateSoundPlayed = false; // 标记庆祝音效是否已播放

    // 后处理效果相关
    this.composer = null;
    this.renderPass = null;
    this.blurPass = null;
    this.copyPass = null;

    // 动态模糊参数
    this.dynamicBlurEnabled = true;
    this.baseBlurAmount = 0.0;
    this.maxBlurAmount = 0.03;  // 增加最大模糊量以获得更明显的效果
    this.blurSpeed = 0.05;
  }

  async start(battleFile = 'battleCur.json') {
    console.log('启动');

    // 重置庆祝音效播放标志
    this.celebrateSoundPlayed = false;

    // 清理之前的UI界面内容，但保留HUD等必要元素
    const elementsToRemove = [];
    for (let i = 0; i < document.body.children.length; i++) {
      const child = document.body.children[i];
      // 保留canvas、HUD容器和其他重要元素，只移除非战斗相关的UI元素
      if (child.tagName !== 'CANVAS' &&
          child.id !== 'hud-container' &&
          !child.classList.contains('hud-element')) {
        elementsToRemove.push(child);
      }
    }

    elementsToRemove.forEach(child => {
      document.body.removeChild(child);
    });

    this.scene = createScene();
    // ★ 关键修改：多传 this.enemyBullets 给 createPlayer
    this.player = await createPlayer(this.enemies, this.playerBullets, this.enemyBullets, this);
    currentPlayer = this.player;
    this.scene.add(this.player.object);

    // 不再自动恢复玩家满血，保留玩家当前血量状态
    // this.restorePlayerHealth();

    this.camera = createCamera();
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // 设置canvas的z-index确保它在HUD后面
    this.renderer.domElement.style.zIndex = '1';
    document.body.appendChild(this.renderer.domElement);

    setupControls(this.renderer.domElement);

    // 初始化后处理效果
    this.initPostProcessing();

    // 检查是否需要生成随机关卡
    let battleData;
    if (battleFile === 'random') {
      battleData = RandomBattleGenerator.generateRandomBattle();
    } else {
      battleData = await storage.load(battleFile, {
        name: "测试关卡",
        background: 0x000011,
        waves: []
      });
    }

    this.waves = battleData.waves || [];
    // Note: 3D background is handled in scene.js, so we don't set a flat background color
    // If you want to adjust lighting based on background, you can do it here
    // For now, we'll keep the 3D background as defined in scene.js

    // 获取难度设置（如果有的话）
    this.difficulty = sessionStorage.getItem('battleDifficulty') || 'normal';
    console.log('战斗难度:', this.difficulty);

    this.animate();
    this.setupResize();
  }

  initPostProcessing() {
    // 创建 EffectComposer
    this.composer = new EffectComposer(this.renderer);

    // 创建渲染通道
    this.renderPass = new RenderPass(this.scene, this.camera);
    this.composer.addPass(this.renderPass);

    // 创建动态模糊着色器
    const dynamicBlurShader = {
      uniforms: {
        "tDiffuse": { value: null },
        "amount": { value: 0.0 },
        "direction": { value: new THREE.Vector2(0, 0) }
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D tDiffuse;
        uniform float amount;
        uniform vec2 direction;
        varying vec2 vUv;

        void main() {
          vec4 sum = vec4(0.0);
          vec2 inc = direction * amount * 0.01;

          sum += texture2D(tDiffuse, vUv - 4.0 * inc) * 0.05;
          sum += texture2D(tDiffuse, vUv - 3.0 * inc) * 0.09;
          sum += texture2D(tDiffuse, vUv - 2.0 * inc) * 0.12;
          sum += texture2D(tDiffuse, vUv - inc) * 0.15;
          sum += texture2D(tDiffuse, vUv) * 0.16;
          sum += texture2D(tDiffuse, vUv + inc) * 0.15;
          sum += texture2D(tDiffuse, vUv + 2.0 * inc) * 0.12;
          sum += texture2D(tDiffuse, vUv + 3.0 * inc) * 0.09;
          sum += texture2D(tDiffuse, vUv + 4.0 * inc) * 0.05;

          gl_FragColor = sum;
        }
      `
    };

    // 创建模糊通道
    this.blurPass = new ShaderPass(dynamicBlurShader);
    this.composer.addPass(this.blurPass);

    // 添加复制通道作为最终输出
    this.copyPass = new ShaderPass(CopyShader);
    this.composer.addPass(this.copyPass);

    // 确保最后一个通道渲染到屏幕
    this.copyPass.renderToScreen = true;
  }

  animate = () => {
    if (!this.gameRunning) return; // 如果游戏未运行，则停止动画循环

    requestAnimationFrame(this.animate);
    const delta = this.clock.getDelta();
    this.time += delta;

    this.updatePlayer(delta);

    // 检查玩家是否死亡
    if (this.player && this.player.dead) {
      this.onPlayerDeath();
      return;
    }

    this.updateWaves();
    this.updateEnemies(delta);
    this.updateEnemyBullets(delta);
    this.updatePlayerBullets(delta);
    this.updateCamera();
    this.updateBackground(delta); // Update the dynamic background

    // 检测是否有boss敌人
    const boss = this.findBossEnemy();
    updateHUD(currentPlayer, boss);

    // 更新动态模糊效果
    this.updateDynamicBlur(delta);

    // 更新相机抖动效果
    if (this.player) {
      this.player.updateCameraShake(delta);
    }

    // 使用 EffectComposer 渲染场景
    this.composer.render();
  };

  updatePlayer(delta) { this.player.update(delta); }

  updateDynamicBlur(delta) {
    if (!this.dynamicBlurEnabled) return;

    let blurAmount = 0;
    let blurDirection = new THREE.Vector2(0, 0); // 默认无方向

    if (this.camera && this.player && this.player.object) {
      // 使用相机位置来计算移动速度，因为相机跟随玩家
      if (!this.previousCameraPosition) {
        this.previousCameraPosition = this.camera.position.clone();
        this.previousCameraTime = performance.now();
      } else {
        const currentTime = performance.now();
        const deltaTime = (currentTime - this.previousCameraTime) / 1000; // 转换为秒
        const currentCameraPos = this.camera.position.clone();
        const displacement = new THREE.Vector3().subVectors(currentCameraPos, this.previousCameraPosition);
        const distance = displacement.length();

        // 计算速度（单位：单位/秒）
        const speed = deltaTime > 0 ? distance / deltaTime : 0;

        // 使用更大的系数来获得更明显的模糊效果
        blurAmount = Math.min(speed * 0.001, this.maxBlurAmount); // 调整系数以获得更好的效果

        // 计算模糊方向（如果移动距离足够大）
        if (distance > 0.001) { // 避免除以接近零的值
          const direction = displacement.normalize();
          // 将3D方向向量转换为屏幕空间方向（简化处理）
          blurDirection.set(direction.x, direction.y);
        }

        // 更新上一个位置和时间
        this.previousCameraPosition.copy(currentCameraPos);
        this.previousCameraTime = currentTime;
      }
    }

    // 更新模糊着色器的参数
    if (this.blurPass && this.blurPass.uniforms) {
      if (this.blurPass.uniforms.amount) {
        this.blurPass.uniforms.amount.value = blurAmount;
      }
      if (this.blurPass.uniforms.direction) {
        this.blurPass.uniforms.direction.value = blurDirection;
      }
    }
  }

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
      if (enemy) this.enemies.push(enemy),this.totalEnemiesCount++;

    });
  }

  updateEnemies(delta) {
    this.enemies = this.enemies.filter(e => {
      if (!e.dead) {
        e.update?.(delta, this.time);
        return true;
      } else {
        if (e.kill_by_player && !e._countedAsKilled) {
          this.killedEnemiesCount++;
          e._countedAsKilled = true;
          console.log(`击杀确认！当前击杀数: ${this.killedEnemiesCount}`);
        }
        
        return false;
      }
    });

    this.checkWinCondition();
  }

  // 检测是否有boss敌人
  findBossEnemy() {
    // 遍历所有敌人，查找boss类型的敌人
    for (const enemy of this.enemies) {
      // 检查敌人是否是boss类型（通过检查是否有boss相关属性或类型）
      if (enemy.isBoss ||
          enemy.constructor.name.includes('Boss') ||
          enemy.type === 'boss' ||
          enemy.name?.toLowerCase().includes('boss') ||
          enemy.constructor.name === 'GalacticBoss') { // 特别检查GalacticBoss
        return enemy;
      }
    }
    return null; // 没有找到boss
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
      // 检查子弹类型，如果是HomingKnife则传递globalTime参数
      if (b.constructor.name === 'HomingKnife') {
        b.update(delta, this.enemies, this.time);
      } else {
        b.update(delta, this.enemies);
      }
      if (b.markedForDeletion) {
        this.playerBullets.splice(i,1);
      }
    }
  }

  // 检查是否满足通关条件
  checkWinCondition() {
    // this.onWin();
    // return;
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
  async onWin() {
    console.log("恭喜通关！");

    try {
      // 检查是否是boss战，只有boss战才设置击败标志
      const battleData = await storage.load('battleCur.json');
      const isBossBattle = battleData && battleData.type === "boss";

      if (isBossBattle) {
        // 设置boss击败标志，以便在地图界面显示信用画面
        const globalData = await storage.load_global('global.json');
        globalData.bossDefeated = true;
        await storage.save_global('global.json', globalData);
      }
    } catch (error) {
      console.warn("无法加载战斗数据，将作为普通战斗处理:", error);
      // 如果无法加载战斗数据，继续执行而不设置boss标志
    }

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

  // 玩家死亡处理
  async onPlayerDeath() {
    console.log("玩家死亡，游戏暂停");

    // 停止游戏运行
    this.gameRunning = false;

    // Play death music (non-looping)
    musicManager.playDeathMusic();

    // 保存玩家死亡状态到全局数据
    if (this.player && this.player.data) {
      const globalData = await storage.load_global('global.json');
      globalData.health = 0; // 设置健康值为0表示死亡
      globalData.isPlayerDead = true; // 添加专门的死亡状态标记
      await storage.save_global('global.json', globalData);
    }

    // 创建死亡界面
    this.showDeathScreen();
  }

  // 显示死亡界面
  showDeathScreen() {
    // 引入恐怖风格字体
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Creepster&display=swap';
    fontLink.rel = 'stylesheet';

    // 创建半透明覆盖层
    const overlay = document.createElement('div');
    overlay.style.position = 'absolute';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.85)';
    overlay.style.display = 'flex';
    overlay.style.flexDirection = 'column';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.color = '#ff6666';
    overlay.style.zIndex = '1000';
    overlay.style.pointerEvents = 'auto';

    // 添加主容器
    const container = document.createElement('div');
    container.style.textAlign = 'center';
    container.style.padding = '40px 60px';
    container.style.backgroundColor = 'rgba(30, 0, 0, 0.7)';
    container.style.borderRadius = '20px';
    container.style.boxShadow = '0 0 40px rgba(255, 50, 50, 0.6), inset 0 0 20px rgba(0, 0, 0, 0.5)';
    container.style.border = '2px solid #990000';
    container.style.position = 'relative';
    container.style.overflow = 'hidden';
    container.style.opacity = '0';
    container.style.transform = 'scale(0.8)';
    container.style.transition = 'all 0.5s ease-out';
    container.style.fontFamily = '"Creepster", "Courier New", monospace, Arial, sans-serif';

    // 添加装饰性元素
    const decoration = document.createElement('div');
    decoration.style.position = 'absolute';
    decoration.style.top = '10px';
    decoration.style.left = '10px';
    decoration.style.right = '10px';
    decoration.style.bottom = '10px';
    decoration.style.border = '1px solid rgba(255, 100, 100, 0.3)';
    decoration.style.borderRadius = '15px';
    decoration.style.pointerEvents = 'none';

    // 添加"你死了"标题
    const deathTitle = document.createElement('div');
    deathTitle.textContent = '💀 GAME OVER 💀';
    deathTitle.style.fontSize = '48px';
    deathTitle.style.fontWeight = 'bold';
    deathTitle.style.marginBottom = '20px';
    deathTitle.style.textShadow = '0 0 10px rgba(255, 50, 50, 0.8), 0 0 20px rgba(255, 0, 0, 0.6)';
    deathTitle.style.letterSpacing = '3px';
    deathTitle.style.opacity = '0';
    deathTitle.style.transform = 'translateY(-20px)';
    deathTitle.style.transition = 'all 0.8s ease 0.2s';
    deathTitle.style.fontFamily = '"Creepster", "Courier New", monospace';
    deathTitle.style.textTransform = 'uppercase';

    // 添加副标题
    const subtitle = document.createElement('div');
    subtitle.textContent = '你的冒险到此结束...';
    subtitle.style.fontSize = '24px';
    subtitle.style.marginBottom = '30px';
    subtitle.style.color = '#ff9999';
    subtitle.style.textShadow = '0 0 5px rgba(255, 100, 100, 0.6)';
    subtitle.style.opacity = '0';
    subtitle.style.transform = 'translateY(20px)';
    subtitle.style.transition = 'all 0.8s ease 0.4s';
    subtitle.style.fontFamily = '"Creepster", "Courier New", monospace';

    // 添加返回按钮容器
    const buttonContainer = document.createElement('div');
    buttonContainer.style.marginTop = '30px';
    buttonContainer.style.opacity = '0';
    buttonContainer.style.transition = 'all 0.8s ease 0.6s';

    // 添加返回按钮
    const backButton = document.createElement('button');
    backButton.textContent = '返回地图';
    backButton.style.padding = '15px 40px';
    backButton.style.fontSize = '22px';
    backButton.style.fontWeight = 'bold';
    backButton.style.backgroundColor = '#cc0000';
    backButton.style.color = 'white';
    backButton.style.border = 'none';
    backButton.style.borderRadius = '50px';
    backButton.style.cursor = 'pointer';
    backButton.style.margin = '10px';
    backButton.style.transition = 'all 0.3s ease';
    backButton.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
    backButton.style.letterSpacing = '1px';

    // 按钮悬停效果
    backButton.onmouseover = () => {
      backButton.style.backgroundColor = '#ff3333';
      backButton.style.transform = 'scale(1.05)';
      backButton.style.boxShadow = '0 8px 20px rgba(0, 0, 0, 0.4)';
    };

    backButton.onmouseout = () => {
      backButton.style.backgroundColor = '#cc0000';
      backButton.style.transform = 'scale(1)';
      backButton.style.boxShadow = '0 5px 15px rgba(0, 0, 0, 0.3)';
    };

    backButton.onclick = () => {
      // 移除覆盖层
      document.body.removeChild(overlay);
      // 移除字体链接
      if (fontLink.parentNode) {
        document.head.removeChild(fontLink);
      }
      // 跳转到地图界面
      this.goToMapScreen();
    };

    // 将元素添加到容器
    buttonContainer.appendChild(backButton);
    container.appendChild(deathTitle);
    container.appendChild(subtitle);
    container.appendChild(buttonContainer);
    container.appendChild(decoration);

    // 将容器添加到覆盖层
    overlay.appendChild(container);

    // 将覆盖层添加到页面
    document.body.appendChild(overlay);

    // 等待字体加载完成后再添加动画
    fontLink.onload = () => {
      // 触发进入动画
      setTimeout(() => {
        container.style.opacity = '1';
        container.style.transform = 'scale(1)';

        setTimeout(() => {
          deathTitle.style.opacity = '1';
          deathTitle.style.transform = 'translateY(0)';

          setTimeout(() => {
            subtitle.style.opacity = '1';
            subtitle.style.transform = 'translateY(0)';

            setTimeout(() => {
              buttonContainer.style.opacity = '1';
            }, 300);
          }, 300);
        }, 100);
      }, 50);
    };

    // 如果字体加载失败，也显示界面
    fontLink.onerror = () => {
      // 触发进入动画
      setTimeout(() => {
        container.style.opacity = '1';
        container.style.transform = 'scale(1)';

        setTimeout(() => {
          deathTitle.style.opacity = '1';
          deathTitle.style.transform = 'translateY(0)';

          setTimeout(() => {
            subtitle.style.opacity = '1';
            subtitle.style.transform = 'translateY(0)';

            setTimeout(() => {
              buttonContainer.style.opacity = '1';
            }, 300);
          }, 300);
        }, 100);
      }, 50);
    };

    // 添加字体链接到head
    document.head.appendChild(fontLink);
  }

  // 预留的结算画面接口
async showVictoryScreen() {
    console.log("显示结算画面");
    this.gameRunning = false;

    // --- 1. 获取基础数据 ---
    const battleData = await storage.load('battleCur.json');
    const baseRewards = battleData.rewards || { gold: 0, cards: 0 };
    const isElite = battleData.type === "elite"; // 判断是否为精英战斗

    // --- 2. 计算基础倍率与奖励 ---
    const killRate = this.totalEnemiesCount > 0 ? (this.killedEnemiesCount / this.totalEnemiesCount) : 1.0;
    const multiplier = Math.pow(killRate, 1.5);
    
    const finalGold = Math.floor(multiplier * baseRewards.gold);
    const finalCardsCount = Math.floor(multiplier * baseRewards.cards);

    // 抽取卡牌逻辑
    const pool = ['passive001', 'passive002', 'passive003', 'passive004', 'passive005', 'passive006', 'passive007', 'passive008'];
    const rewardedCards = [];
    for (let i = 0; i < finalCardsCount; i++) {
        const randomId = pool[Math.floor(Math.random() * pool.length)];
        const card = createCardFromId(randomId);
        if (card) rewardedCards.push(card);
    }

    // --- 3. 精英怪额外奖励逻辑 (独立概率判断) ---
    let extraRewardsInfo = [];
    let extraSlotsAdded = 0;
    let extraEnergyAdded = 0;
    let extraBomb = 0;

    if (isElite) {
        // 独立判定：倍率越接近 1，获得概率越高
        if (Math.random() < multiplier * 0.67) {
            extraSlotsAdded = 1;
            extraRewardsInfo.push(`<div style="color: #ff00ff;">💎 被动槽位上限 + ${extraSlotsAdded}</div>`);
        }
        if (Math.random() < multiplier * 0.67) {
            extraEnergyAdded = 1;
            extraRewardsInfo.push(`<div style="color: #00ff00;">🔋 能量上限 + ${extraEnergyAdded}</div>`);
        }
        if (Math.random() < multiplier * 0.67) {
            extraBomb = 1;
            extraRewardsInfo.push(`<div style="color: #00ff00;">💣 符卡数量+ ${extraBomb}</div>`);
        }
    }

    // --- 4. 数据存入 global.json ---
    const globalData = await storage.load_global('global.json');
    globalData.money = (globalData.money || 0) + finalGold;
    
    // 更新被动槽位和能量上限
    if (extraSlotsAdded > 0) globalData.max_passive_slots = (globalData.max_passive_slots || 0) + extraSlotsAdded;
    if (extraEnergyAdded > 0) globalData.max_energy = (globalData.max_energy || 0) + extraEnergyAdded;
    globalData.bomb += extraBomb;

    // 更新卡牌库
    if (!globalData.deck) globalData.deck = {};
    rewardedCards.forEach(card => {
        globalData.deck[card.id] = (globalData.deck[card.id] || 0) + 1;
    });

    await storage.save_global('global.json', globalData);

    // 播放庆祝音效（所有战斗胜利时都播放，只播放一次）
    if (!this.celebrateSoundPlayed) {
      musicManager.stop(); // 停止当前音乐
      this.celebrateAudio = new Audio('music/celebrate.ogg');
      this.celebrateAudio.volume = musicManager.volume;
      this.celebrateAudio.play().catch(e => {
        console.warn('Celebrate sound play failed:', e);
      });
      this.celebrateSoundPlayed = true; // 标记庆祝音效已播放
    }

    // --- 5. UI 构建 (包含额外奖励展示) ---
    const fontLink = document.createElement('link');
    fontLink.href = 'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700&display=swap';
    fontLink.rel = 'stylesheet';
    document.head.appendChild(fontLink);

    const overlay = document.createElement('div');
    overlay.style.cssText = `position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: radial-gradient(circle, rgba(0, 40, 80, 0.7) 0%, rgba(0, 0, 0, 0.9) 100%); display: flex; flex-direction: column; justify-content: center; align-items: center; z-index: 1000; pointer-events: auto; font-family: 'Orbitron', sans-serif;`;

    const container = document.createElement('div');
    container.style.cssText = `text-align: center; padding: 50px 80px; background: rgba(0, 20, 40, 0.8); border-radius: 15px; border: 2px solid ${isElite ? '#ff00ff' : '#00d4ff'}; box-shadow: 0 0 50px rgba(0, 212, 255, 0.5); transform: scale(0.8); opacity: 0; transition: all 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);`;

    const title = document.createElement('div');
    title.textContent = isElite ? '✦ 精英战胜利 ✦' : '战斗胜利！';
    title.style.cssText = `font-size: 56px; font-weight: bold; color: #fff; margin-bottom: 10px; text-shadow: 0 0 20px ${isElite ? '#ff00ff' : '#00d4ff'}; letter-spacing: 5px;`;

    const subtitle = document.createElement('div');
    subtitle.textContent = `击杀了 ${this.killedEnemiesCount} / ${this.totalEnemiesCount} 敌人 (${(killRate * 100).toFixed(0)}%)`;
    subtitle.style.cssText = `font-size: 18px; color: #00d4ff; margin-bottom: 40px; opacity: 0.8;`;

    const rewardContainer = document.createElement('div');
    rewardContainer.style.cssText = `margin: 20px 0; padding: 20px; min-width: 400px; background: rgba(255, 255, 255, 0.05); border-top: 1px solid rgba(0, 212, 255, 0.3); border-bottom: 1px solid rgba(0, 212, 255, 0.3);`;

    let cardsHTML = rewardedCards.map(card => {
        const info = card.getDisplayInfo();
        return `<div style="width: 100px; background: rgba(0,0,0,0.5); border: 1px solid #00d4ff; border-radius: 5px; padding: 5px; font-size: 10px;"><div style="color: #ffd700; font-size: 8px;">⚡ ${card.energy}</div><img src="${info.icon}" style="width: 40px; height: 40px; margin: 5px 0;"><div style="color: #fff; font-weight: bold; overflow: hidden; white-space: nowrap;">${info.name}</div><div style="color: #aaa; font-size: 8px; height: 24px; overflow: hidden;">${info.description}</div></div>`;
    }).join('');

    rewardContainer.innerHTML = `
        <div style="color: #aaa; font-size: 14px; margin-bottom: 10px;">获得奖励 (倍率 x${multiplier.toFixed(2)})</div>
        <div style="color: #ffd700; font-size: 24px; font-weight: bold; margin-bottom: 15px;">💰 + ${finalGold}</div>
        ${extraRewardsInfo.length > 0 ? `<div style="margin-bottom: 20px; font-size: 16px; font-weight: bold;">${extraRewardsInfo.join('')}</div>` : ''}
        <div style="display: flex; justify-content: center; gap: 10px; flex-wrap: wrap;">
            ${cardsHTML || '<span style="color: #666;">无卡牌奖励</span>'}
        </div>
    `;

    // --- 6. 确认按钮逻辑 ---
    const confirmButton = document.createElement('button');
    confirmButton.textContent = '确认并继续';
    confirmButton.style.cssText = `margin-top: 40px; padding: 15px 60px; font-size: 20px; font-family: 'Orbitron'; background: transparent; color: #00d4ff; border: 2px solid #00d4ff; border-radius: 5px; cursor: pointer; transition: all 0.3s ease; text-transform: uppercase;`;

    confirmButton.onmouseover = () => { confirmButton.style.background = '#00d4ff'; confirmButton.style.color = '#000'; };
    confirmButton.onmouseout = () => { confirmButton.style.background = 'transparent'; confirmButton.style.color = '#00d4ff'; };
    confirmButton.onclick = () => {
      // 停止庆祝音效
      if (this.celebrateAudio) {
        this.celebrateAudio.pause();
        this.celebrateAudio = null;
      }
      document.body.removeChild(overlay);
      this.goToMapScreen();
    };

    container.appendChild(title);
    container.appendChild(subtitle);
    container.appendChild(rewardContainer);
    container.appendChild(confirmButton);
    overlay.appendChild(container);
    document.body.appendChild(overlay);

    requestAnimationFrame(() => {
        setTimeout(() => {
            container.style.opacity = '1';
            container.style.transform = 'scale(1)';
        }, 100);
    });
}
  async goToMapScreen() {
    console.log("跳转到地图界面");

    if (this.player && this.player.data) {
      await storage.save('playerCur.json', this.player.data);
    }
    if (this.currentNodeId) {
      const globalData = await storage.load_global('global.json');
      if (!globalData.currentPath.includes(this.currentNodeId)) {
        globalData.currentPath.push(this.currentNodeId);
        await storage.save_global('global.json', globalData);
      }
    }
    this.cleanupBattleScene();

    // Play map music when going to map
    musicManager.stop(); // Stop any current music (like death music)
    musicManager.play('map', true);

    const { showMap } = await import('../map/MapMain.js');
    await showMap();
  }

  cleanupBattleScene() {
    this.gameRunning = false;

    if (this.renderer && this.renderer.domElement && this.renderer.domElement.parentNode) {
      this.renderer.domElement.parentNode.removeChild(this.renderer.domElement);
    }

    // 清理后处理效果
    if (this.composer) {
      this.composer.renderPass = null;
      this.composer.passes = [];
      this.composer = null;
    }

    // 清理粒子系统
    if (this.player && this.player.particleSystem) {
      this.player.particleSystem.dispose();
    }

    // 清理事件监听器
    if (this.handleResize) {
      window.removeEventListener('resize', this.handleResize);
    }
  }

  updateCamera() {
    updateCamera(this.camera, this.player.object);
  }

  updateBackground(delta) {
    // Update the starfield to simulate forward movement
    if (this.scene) {
      // Update the starfield to move toward the player (creating forward movement illusion)
      this.scene.traverse((child) => {
        if (child instanceof THREE.Points && child.userData && child.userData.starCount) {
          // This is our starfield, update positions to simulate forward movement
          this.updateStarfield(child, delta);
        }
      });

      // Move particles slightly for atmospheric effect
      this.scene.traverse((child) => {
        if (child instanceof THREE.Points && child.geometry.attributes.position.count === 200) {
          // This is our particle field, make it gently rotate
          child.rotation.y += delta * 0.03;
        }
      });

      // Animate lights if they exist
      if (this.scene.userData && this.scene.userData.lights) {
        const lights = this.scene.userData.lights;
        const time = this.time;

        // Animate main light position in a circular pattern
        if (lights.main) {
          lights.main.position.x = 400 * Math.sin(time * 0.3);
          lights.main.position.z = 400 * Math.cos(time * 0.3);
          lights.main.position.y = 300 + 100 * Math.sin(time * 0.5);
        }

        // Animate back light position
        if (lights.back) {
          lights.back.position.x = -300 * Math.sin(time * 0.2);
          lights.back.position.z = -300 * Math.cos(time * 0.2);
          lights.back.position.y = -100 + 50 * Math.cos(time * 0.4);
        }

        // Animate side light position
        if (lights.side) {
          lights.side.position.x = 300 * Math.cos(time * 0.4);
          lights.side.position.z = 100 * Math.sin(time * 0.3);
          lights.side.position.y = 200 + 100 * Math.sin(time * 0.6);
        }

        // Animate blood moon if it exists
        if (this.scene.userData && this.scene.userData.bloodMoon) {
          const bloodMoon = this.scene.userData.bloodMoon;
          const moonLight = this.scene.userData.moonLight;

          // Move the moon slowly in a way that keeps it visible in the side-front
          bloodMoon.position.x = -200 + 50 * Math.sin(time * 0.02);  // Gentle horizontal movement
          bloodMoon.position.y = 400 + 30 * Math.cos(time * 0.03);   // Gentle vertical movement
          bloodMoon.position.z = 800 + 20 * Math.sin(time * 0.01);  // Gentle depth movement

          // Update the moon light position to match the moon
          if (moonLight) {
            moonLight.position.copy(bloodMoon.position);

            // Add subtle pulsing to the moon's glow
            const glowIntensity = 0.6 + 0.15 * Math.sin(time * 1.5);
            moonLight.intensity = glowIntensity;
          }
        }
      }
    }
  }

  updateStarfield(stars, delta) {
    // Get the player's forward movement speed (negative Z direction)
    const playerSpeed = 60; // Adjust this value to control the speed of movement
    const movement = playerSpeed * delta;

    // Get the positions array
    const positions = stars.geometry.attributes.position.array;
    const radius = stars.userData.radius;

    // Update each star's position to simulate forward movement
    for (let i = 0; i < positions.length; i += 3) {
      // Move star away from the player (in the negative Z direction to simulate forward movement)
      positions[i + 2] -= movement;

      // If a star goes too far behind the player, reset it to the front
      if (positions[i + 2] < -radius + 100) { // If star is too far behind
        // Generate new spherical coordinates for the star at the front
        const theta = Math.random() * Math.PI * 2;
        const phi = Math.acos(2 * Math.random() - 1);

        // Position the star at the front of the sphere (toward player)
        positions[i] = radius * Math.sin(phi) * Math.cos(theta);
        positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
        positions[i + 2] = radius * Math.cos(phi);
      }
    }

    // Mark the position attribute as needing update
    stars.geometry.attributes.position.needsUpdate = true;
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

      // 更新 EffectComposer 大小
      if (this.composer) {
        this.composer.setSize(window.innerWidth, window.innerHeight);
      }
    };
    window.addEventListener('resize', this.handleResize);
  }
}