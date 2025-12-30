// src/map/MapMain.js
import { storage } from '../utils/storage.js';
import { enterRoom } from '../room/RoomMain.js';  // ⭐ 统一房间入口，不要直接跳页面！

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
    console.error('地图容器没找到喵！');
    return;
  }

  await renderMap();
}

async function renderMap() {
  const globalData = await storage.load_global('global.json');
  const mapData = globalData?.map;
  const currentPath = globalData?.currentPath || [];

  if (!mapData || !mapData.layers) {
    document.body.innerHTML += '<p style="color:orange;text-align:center;">还没有地图哦～快去开始新游戏生成一张吧！</p>';
    return;
  }

  lineLayer.innerHTML = '';
  nodeLayer.innerHTML = '';

  // 每层垂直间距，可以自行调整
  const layerVerticalOffset = 120;
  const layerTopBase = 60;

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

      // 可点击判断
      if (isNodeReachable(node, currentPath, mapData)) {
        nodeDiv.classList.add('clickable');
        nodeDiv.onclick = () => selectNode(node);
      } else {
        nodeDiv.classList.add('locked');
      }

      layerDiv.appendChild(nodeDiv);
    });

    nodeLayer.appendChild(layerDiv);
  });

  // 绘制连接线（在所有节点渲染完后再画，确保能获取到位置）
  requestAnimationFrame(() => renderConnections(mapData));
}

function isNodeReachable(node, currentPath, mapData) {
  if (node.layer === 0) return true; // 第一层永远可达
  if (currentPath.length === 0) return false;
  const lastVisited = currentPath[currentPath.length - 1];
  return mapData.connections.some(conn => conn.from === lastVisited && conn.to === node.id);
}

function renderConnections(mapData) {
  // 清空旧的 svg
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

// ⭐ 关键：点击后更新路径 → 刷新地图 → 交给 RoomMain 统一处理房间进入
async function selectNode(node) {
  const globalData = await storage.load_global('global.json');
  globalData.currentPath.push(node.id);
  await storage.save_global('global.json', globalData);

  // 刷新地图，显示新走的路径和高亮
  await renderMap();

  // 统一交给 RoomMain 处理（生成房间、跳转战斗/商店等）
  await enterRoom(node.type);
}

// 窗口大小改变时重绘连线
window.addEventListener('resize', async () => {
  const globalData = await storage.load_global('global.json');
  if (globalData?.map && mapContainer) {
    renderConnections(globalData.map);
  }
});