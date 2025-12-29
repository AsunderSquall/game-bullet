// src/map/MapMain.js
// 完全自主地图界面～自己加载 html 片段 → 塞 body → 拿到容器 → 渲染～超稳定！

import { storage } from '../utils/storage.js';

const NODE_ICONS = {
  normal: '⚔️',
  elite: '💀',
  shop: '🛒',
  rest: '🛏️',
  event: '❓',
  boss: '👹'
};

const SVG_NS = 'http://www.w3.org/2000/svg';

let mapContainer;  // 全局容器，方便其他函数用

// 导出函数：main.js 只需 await showMap() 就行～超级简单！
export async function showMap() {
  // 1. 先确保有地方放内容（虽然大多数情况是 body，但保险起见）
  // 这里直接用 document.body，不需要 containerId 参数啦～

  // 2. 加载 map.html 片段
  let html;
  try {
    const response = await fetch('src/ui/map.html');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    html = await response.text();
    console.log('🗺️ map.html 片段加载成功～');
  } catch (err) {
    console.error('加载地图HTML失败喵～', err);
    document.body.innerHTML = `
      <div style="color:#ff6666;text-align:center;margin-top:40vh;font-size:28px;">
        加载地图界面失败啦～<br>${err.message}<br>请检查路径哦！
      </div>
    `;
    return;
  }

  // 3. 塞进 body
  document.body.innerHTML = html;

  // 4. 拿到容器
  mapContainer = document.getElementById('map-container');
  if (!mapContainer) {
    console.error('片段加载后找不到 #map-container～请检查 map.html 有没有这个 div！');
    return;
  }

  // 5. 开始渲染地图
  await renderMap();
}

async function renderMap() {
  const globalData = await storage.load_global('global.json');
  const mapData = globalData?.map || null;
  const currentPath = globalData?.currentPath || [];

  if (!mapData) {
    mapContainer.innerHTML = `
      <div style="color:#fff;text-align:center;margin-top:40vh;font-size:24px;">
        还没生成地图哦～<br>请先开始新游戏生成一张新地图！
      </div>
    `;
    return;
  }

  mapContainer.innerHTML = '';

  mapData.layers.forEach((layer, layerIndex) => {
    const layerDiv = document.createElement('div');
    layerDiv.className = 'map-layer';
    layerDiv.style.top = `${layerIndex * 120 + 50}px`;

    const nodeWidth = 100;
    const gap = 60;
    const totalWidth = layer.length * nodeWidth + (layer.length - 1) * gap;
    const startX = (window.innerWidth - totalWidth) / 2;

    layer.forEach((node, nodeIndex) => {
      const nodeDiv = document.createElement('div');
      nodeDiv.className = `map-node ${node.type}`;
      nodeDiv.dataset.id = node.id;
      nodeDiv.style.left = `${startX + nodeIndex * (nodeWidth + gap)}px`;

      nodeDiv.innerHTML = `
        <div class="node-icon">${NODE_ICONS[node.type] || '❓'}</div>
        <div class="node-text">${node.type.toUpperCase()}</div>
      `;

      if (currentPath.includes(node.id)) nodeDiv.classList.add('visited');

      if (isNodeReachable(node, currentPath, mapData)) {
        nodeDiv.classList.add('clickable');
        nodeDiv.onclick = () => selectNode(node);
      } else {
        nodeDiv.classList.add('locked');
      }

      layerDiv.appendChild(nodeDiv);
    });

    mapContainer.appendChild(layerDiv);
  });

  renderConnections(mapData);
}

// ================ 辅助函数 ================
function isNodeReachable(node, currentPath, mapData) {
  if (node.layer === 0) return true;
  if (currentPath.length === 0) return false;
  const last = currentPath[currentPath.length - 1];
  return mapData.connections.some(c => c.from === last && c.to === node.id);
}

function renderConnections(mapData) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  Object.assign(svg.style, {
    position: 'absolute',
    top: '0', left: '0',
    width: '100%', height: '100%',
    pointerEvents: 'none'
  });

  mapData.connections.forEach(conn => {
    const from = mapContainer.querySelector(`.map-node[data-id="${conn.from}"]`);
    const to = mapContainer.querySelector(`.map-node[data-id="${conn.to}"]`);
    if (!from || !to) return;

    const fr = from.getBoundingClientRect();
    const tr = to.getBoundingClientRect();
    const cr = mapContainer.getBoundingClientRect();

    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', fr.left + fr.width/2 - cr.left);
    line.setAttribute('y1', fr.top + fr.height/2 - cr.top);
    line.setAttribute('x2', tr.left + tr.width/2 - cr.left);
    line.setAttribute('y2', tr.top + tr.height/2 - cr.top);
    line.setAttribute('stroke', '#aaaaaa');
    line.setAttribute('stroke-width', '4');
    line.setAttribute('opacity', '0.6');
    svg.appendChild(line);
  });

  mapContainer.appendChild(svg);
}

async function selectNode(node) {
  const globalData = await storage.load_global('global.json');
  globalData.currentPath.push(node.id);
  await storage.save_global('global.json', globalData);

  alert(`即将进入 ${node.type.toUpperCase()} 房间～✨`);

  const pages = { shop: 'shop.html', rest: 'rest.html', boss: 'boss.html' };
  location.href = pages[node.type] || 'battle.html';
}