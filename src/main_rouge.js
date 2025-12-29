// src/main.js
// 超简洁入口～生成地图 → 保存 → 调用 MapMain 自己显示界面

import { createMap } from './map/CreateMap.js';
import { storage } from './utils/storage.js';
import { showMap } from './map/MapMain.js';

async function startNewGame() {
  console.log('✨ 开始新游戏！生成专属地图～');

  const newMap = createMap(6);

  let globalData = await storage.load_global('global.json');

  if (!globalData) {
    globalData = {
      money: 0,
      health: 100,
      bomb: 5,
      currentPath: [],
      deck: {
        weapon001: 1,
        weapon002: 1,
        passive001: 1
      },
      max_passive_slots: 3,
      max_energy: 4
    };
  }

  globalData.map = newMap;
  globalData.currentPath = [];

  await storage.save_global('global.json', globalData);

  console.log('✅ 地图生成并保存成功！正在显示地图～');

  // 直接调用 MapMain 的静态方法～它会自己加载 html 片段并渲染！
  await showMap();
}

// 自动启动
document.addEventListener('DOMContentLoaded', startNewGame);