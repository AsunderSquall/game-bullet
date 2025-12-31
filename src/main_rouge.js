
import { storage } from './utils/storage.js';
import { createMap } from './map/CreateMap.js';
import { showMap } from './map/MapMain.js';
import { SelectMain } from './select/SelectMain.js';
import { ShopMain } from './shop/ShopMain.js';
import { Battle } from './battle/battle.js';
import { showRest } from './select/RestMain.js';
import { EventMain } from './event/EventMain.js';
import { musicManager } from './utils/musicManager.js';

console.log('✨ 猫娘来啦～欢迎主人进入弹幕冒险世界！');

let btnStart, btnContinue, btnSettings, messageDiv;

async function main() {
  try {
    const response = await fetch('src/ui/start.html');
    if (!response.ok) throw new Error(`加载失败：${response.status}`);
    document.body.innerHTML = await response.text();
  } catch (err) {
    console.error('开始界面加载失败', err);
    document.body.innerHTML = '<h1 style="color:red;text-align:center;margin-top:100px;">加载失败</h1>';
    return;
  }

  btnStart = document.getElementById('btn-start');
  btnContinue = document.getElementById('btn-continue');
  btnSettings = document.getElementById('btn-settings');
  messageDiv = document.getElementById('message');

  if (!btnStart || !btnSettings) {
    console.error('开始界面元素没找到！');
    return;
  }

  // Play main menu music
  musicManager.play('main', true);

  // Add event listeners to resume music if autoplay was blocked
  document.addEventListener('click', function() {
    musicManager.resumePendingPlay();
  }, { once: true });

  document.addEventListener('keydown', function() {
    musicManager.resumePendingPlay();
  }, { once: true });

  await init();
}

async function init() {
  const globalData = await storage.load_global('global.json');
  if (globalData && globalData.map) {
    btnContinue.style.display = 'block';
  }

  btnStart.onclick = startNewGame;
  btnContinue.onclick = continueGame;
  btnSettings.onclick = openSettings;
}

async function startNewGame() {
  console.log('✨ 生成专属地图！');

  const newMap = createMap(8);

  let globalData = {
    money: 100,
    health: 100,
    bomb: 1,
    currentPath: [],
    deck: {
      weapon001: 1,
      passive001: 1,
      passive002: 1,
    },
    max_passive_slots: 2,
    max_energy: 3
  };

  globalData.map = newMap;
  globalData.currentPath = [];
  globalData.bossDefeated = false; // 重置boss击败标志

  await storage.save_global('global.json', globalData);

  // 重置玩家当前数据
  const playerData = {
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
  };

  await storage.save('playerCur.json', playerData);

  console.log('✅ 地图生成成功！');
  document.body.innerHTML = '';
  await showMap();
}

async function continueGame() {
  console.log('加载存档中！');
  document.body.innerHTML = '';
  const globalData = await storage.load_global('global.json');

  // 检查玩家是否已死亡
  if (globalData.isPlayerDead) {
    musicManager.stop(); // Stop current music
    musicManager.play('map', true); // Play map music when returning to map after death
    await showMap(); // 如果玩家死亡，直接返回地图
    return;
  }

  if (globalData.currentStatus === 'select') {
    musicManager.stop(); // Stop current music
    musicManager.play('select', true);
    await SelectMain();
  }
  else if (globalData.currentStatus === 'shop') {
    musicManager.stop(); // Stop current music
    musicManager.play('map', true); // Shop uses map music
    await ShopMain();
  }
  else if (globalData.currentStatus === 'map') {
    musicManager.stop(); // Stop current music
    musicManager.play('map', true);
    await showMap();
  }
  else if (globalData.currentStatus === 'rest') {
    musicManager.stop(); // Stop current music
    musicManager.play('map', true); // Rest uses map music
    await showRest();
  }
  else if (globalData.currentStatus === 'event') {
    musicManager.stop(); // Stop current music
    musicManager.play('event', true);
    await EventMain();
  }
  else if (globalData.currentStatus === 'battle') {
    musicManager.stop(); // Stop current music
    musicManager.play('battle', true);
    const game = new Battle();
    await game.start('battleCur.json');
  }
  else {
    musicManager.stop(); // Stop current music
    musicManager.play('map', true); // 默认加载地图
    await showMap();
  }
}

function openSettings() {
  showMessage('设定功能还在开发中！', 3000);
}

function showMessage(text, duration = 2500) {
  messageDiv.textContent = text;
  messageDiv.style.opacity = '1';
  setTimeout(() => messageDiv.style.opacity = '0', duration);
}

// 启动！
main();