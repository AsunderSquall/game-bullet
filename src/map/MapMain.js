// src/map/MapMain.js
import { storage } from '../utils/storage.js';
import { enterRoom } from '../room/RoomMain.js';  // ⭐ 统一房间入口，不要直接跳页面！
import { musicManager } from '../utils/musicManager.js';

const NODE_ICONS = {
  normal: '⚔️',
  elite: '💀',
  shop: '🛒',
  rest: '🛏️',
  event: '❓',
  boss: '😈'
};

const SVG_NS = 'http://www.w3.org/2000/svg';

let mapContainer, lineLayer, nodeLayer;

export async function showMap() {
  const response = await fetch('src/ui/map.html');
  if (!response.ok) {
    document.body.innerHTML = '<h1 style="color:red;text-align:center;">地图加载失败了喵...</h1>';
    return;
  }
  document.body.innerHTML = await response.text();

  mapContainer = document.getElementById('map-container');
  lineLayer = document.getElementById('map-lines');
  nodeLayer = document.getElementById('map-nodes');

  if (!mapContainer || !lineLayer || !nodeLayer) {
    console.error('地图容器没找到！');
    return;
  }

  // Add event listener for the main menu button
  const mainMenuBtn = document.getElementById('main-menu-btn');
  if (mainMenuBtn) {
    mainMenuBtn.onclick = () => {
      // Redirect to main menu (assuming index.html is the main menu)
      window.location.href = 'index.html';
    };
  }

  // Play map music
  musicManager.stop(); // Stop any current music
  musicManager.play('map', true);

  await renderMap();

  // Check if boss was defeated and show credit screen after a short delay
  const globalData = await storage.load_global('global.json');
  if (globalData?.bossDefeated) {
    // Show credit screen after a short delay
    setTimeout(() => {
      showCreditScreen();
    }, 500); // 0.5秒延迟
  }
}

async function renderMap() {
  const globalData = await storage.load_global('global.json');
  const mapData = globalData?.map;
  const currentPath = globalData?.currentPath || [];
  const isPlayerDead = globalData?.isPlayerDead || false; // 检查玩家是否死亡

  if (!mapData || !mapData.layers) {
    document.body.innerHTML += '<p style="color:orange;text-align:center;">还没有地图哦～快去开始新游戏生成一张吧！</p>';
    return;
  }

  lineLayer.innerHTML = '';
  nodeLayer.innerHTML = '';

  // 每层垂直间距，可以自行调整
  const layerVerticalOffset = 120;
  const layerTopBase = 100; // Increased from 60 to 100 to make room for the button

  mapData.layers.forEach((layer, layerIndex) => {
    const layerDiv = document.createElement('div');
    layerDiv.className = 'map-layer';
    layerDiv.style.position = 'absolute';
    layerDiv.style.left = '0';
    layerDiv.style.right = '0';
    layerDiv.style.top = `${layerIndex * layerVerticalOffset + layerTopBase}px`;
    // 不使用 flex，由我们手动计算 left 实现完美居中

    // 计算本层节点布局
    const nodeWidth = 100;   // 节点宽度（包括内外边距）
    const gap = 80;          // 节点间距
    const totalWidth = layer.length * nodeWidth + (layer.length - 1) * gap;
    const startX = (window.innerWidth - totalWidth) / 2;

    layer.forEach((node, nodeIndex) => {
      const nodeDiv = document.createElement('div');
      nodeDiv.className = `map-node ${node.type}`;
      nodeDiv.dataset.id = node.id;

      // 绝对定位实现精确居中
      nodeDiv.style.position = 'absolute';
      nodeDiv.style.left = `${startX + nodeIndex * (nodeWidth + gap)}px`;
      nodeDiv.style.width = `${nodeWidth}px`;

      nodeDiv.innerHTML = `
        <div class="node-icon">${NODE_ICONS[node.type] || '❓'}</div>
        <div class="node-text">${node.type.toUpperCase()}</div>
      `;

      // 已访问标记
      if (currentPath.includes(node.id)) {
        nodeDiv.classList.add('visited');
      }

      // 如果玩家死亡，根据节点是否已通关设置样式
      if (isPlayerDead) {
        // 检查该节点是否在已访问路径中（已通关）
        if (currentPath.includes(node.id)) {
          // 已通关的节点 - 暗红色边框
          nodeDiv.classList.add('completed-dead');
          nodeDiv.classList.remove('clickable');
          nodeDiv.onclick = null; // 移除点击事件
        } else {
          // 未通关但已解锁的节点 - 红色边框
          if (isNodeReachable(node, currentPath, mapData)) {
            nodeDiv.classList.add('unreachable');
            nodeDiv.classList.remove('clickable');
            nodeDiv.onclick = null; // 移除点击事件
          } else {
            // 未解锁的节点 - 保持原样
            nodeDiv.classList.add('locked');
          }
        }
      } else {
        // 玩家未死亡，正常逻辑
        if (isNodeReachable(node, currentPath, mapData)) {
          nodeDiv.classList.add('clickable');
          nodeDiv.onclick = () => selectNode(node);
        } else {
          nodeDiv.classList.add('locked');
        }
      }

      layerDiv.appendChild(nodeDiv);
    });

    nodeLayer.appendChild(layerDiv);
  });

  requestAnimationFrame(() => renderConnections(mapData));
}

function isNodeReachable(node, currentPath, mapData) {
  if (node.layer === 0 && currentPath.length == 0) return true; // 第一层永远可达
  if (currentPath.length === 0) return false;
  const lastVisited = currentPath[currentPath.length - 1];
  return mapData.connections.some(conn => conn.from === lastVisited && conn.to === node.id);
}

function renderConnections(mapData) {
  lineLayer.innerHTML = '';

  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.style.position = 'absolute';
  svg.style.inset = '0';
  svg.style.pointerEvents = 'none';

  mapData.connections.forEach(conn => {
    const fromNode = nodeLayer.querySelector(`.map-node[data-id="${conn.from}"]`);
    const toNode = nodeLayer.querySelector(`.map-node[data-id="${conn.to}"]`);
    if (!fromNode || !toNode) return;

    const fromRect = fromNode.getBoundingClientRect();
    const toRect = toNode.getBoundingClientRect();
    const containerRect = mapContainer.getBoundingClientRect();

    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', fromRect.left + fromRect.width / 2 - containerRect.left);
    line.setAttribute('y1', fromRect.top + fromRect.height / 2 - containerRect.top);
    line.setAttribute('x2', toRect.left + toRect.width / 2 - containerRect.left);
    line.setAttribute('y2', toRect.top + toRect.height / 2 - containerRect.top);
    line.setAttribute('stroke', '#aaaaaa');
    line.setAttribute('stroke-width', '4');
    line.setAttribute('opacity', '0.6');

    svg.appendChild(line);
  });

  lineLayer.appendChild(svg);
}

async function selectNode(node) {
  const globalData = await storage.load_global('global.json');
  globalData.currentPath.push(node.id);
  await storage.save_global('global.json', globalData);

  await renderMap();
  await enterRoom(node.type);
}

// 显示信用/结算画面
async function showCreditScreen() {
  // 停止当前音乐并播放结算音乐
  musicManager.stop();
  musicManager.play('credit', true);

  // 创建覆盖层
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: url('picture/credit.png') center/cover;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    overflow: hidden;
    font-family: 'Arial', sans-serif;
  `;

  // 创建内容容器
  const container = document.createElement('div');
  container.style.cssText = `
    text-align: center;
    max-width: 800px;
    padding: 40px;
    background: rgba(0, 0, 0, 0.7);
    border-radius: 20px;
    box-shadow: 0 0 50px rgba(0, 150, 255, 0.5);
    border: 2px solid #00a8ff;
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(10px);
  `;

  // 添加装饰元素
  const decoration = document.createElement('div');
  decoration.style.cssText = `
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background:
      radial-gradient(circle at 20% 20%, rgba(0, 150, 255, 0.1) 0%, transparent 40%),
      radial-gradient(circle at 80% 80%, rgba(0, 200, 150, 0.1) 0%, transparent 40%);
    pointer-events: none;
    z-index: -1;
  `;
  container.appendChild(decoration);

  // 添加标题
  const title = document.createElement('h1');
  title.textContent = '恭喜通关！';
  title.style.cssText = `
    font-size: 48px;
    color: #00a8ff;
    margin: 0 0 20px 0;
    text-shadow: 0 0 10px rgba(0, 168, 255, 0.7);
    letter-spacing: 3px;
    font-weight: bold;
  `;

  // 添加角色图片
  const characterImage = document.createElement('img');
  characterImage.src = 'models/sakuya-plushie/thumbnail.jpg';
  characterImage.style.cssText = `
    max-width: 100%;
    max-height: 300px;
    border-radius: 10px;
    margin: 20px 0;
    border: 2px solid #00a8ff;
    box-shadow: 0 0 20px rgba(0, 168, 255, 0.5);
  `;
  characterImage.alt = 'Character Image';

  // 添加感谢信息
  const thanks = document.createElement('div');
  thanks.innerHTML = `
    <p style="color: #e6e6e6; font-size: 20px; margin: 20px 0; line-height: 1.6;">
      感谢您游玩我们的游戏！<br>
      您的冒险精神令人钦佩！
    </p>
  `;

  // 添加按钮容器
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = `
    display: flex;
    justify-content: center;
    gap: 20px;
    margin-top: 30px;
    flex-wrap: wrap;
  `;

  // 返回地图按钮
  const mapButton = document.createElement('button');
  mapButton.textContent = '返回地图';
  mapButton.style.cssText = `
    padding: 15px 30px;
    font-size: 18px;
    background: linear-gradient(to bottom, #00a8ff, #0077b6);
    color: white;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    min-width: 150px;
  `;
  mapButton.onclick = () => {
    document.body.removeChild(overlay);
    // 重新显示地图
    showMap();
  };

  // 返回主菜单按钮
  const menuButton = document.createElement('button');
  menuButton.textContent = '主菜单';
  menuButton.style.cssText = `
    padding: 15px 30px;
    font-size: 18px;
    background: linear-gradient(to bottom, #9c89b8, #7f63a1);
    color: white;
    border: none;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
    min-width: 150px;
  `;
  menuButton.onclick = () => {
    document.body.removeChild(overlay);
    window.location.href = 'index.html';
  };

  buttonContainer.appendChild(mapButton);
  buttonContainer.appendChild(menuButton);

  // 添加到容器
  container.appendChild(title);
  container.appendChild(characterImage);
  container.appendChild(thanks);
  container.appendChild(buttonContainer);
  overlay.appendChild(container);
  document.body.appendChild(overlay);

  // 添加进入动画
  container.style.opacity = '0';
  container.style.transform = 'scale(0.8)';
  setTimeout(() => {
    container.style.transition = 'all 0.8s ease';
    container.style.opacity = '1';
    container.style.transform = 'scale(1)';
  }, 50);
}

window.addEventListener('resize', async () => {
  const globalData = await storage.load_global('global.json');
  if (globalData?.map && mapContainer) {
    renderConnections(globalData.map);
  }
});