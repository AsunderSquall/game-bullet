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
  const playerHealth = globalData?.health || 100; // 获取玩家当前血量

  if (!mapData || !mapData.layers) {
    document.body.innerHTML += '<p style="color:orange;text-align:center;">还没有地图哦～快去开始新游戏生成一张吧！</p>';
    return;
  }

  // 检查玩家是否死亡（使用专门的死亡状态标记）
  const isPlayerDead = globalData?.isPlayerDead === true || playerHealth <= 0;

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

      // 检查节点是否已完成（在currentPath中）
      const isNodeCompleted = currentPath.includes(node.id);
      if (isNodeCompleted) {
        nodeDiv.classList.add('visited');
      }

      // 如果玩家死亡，根据节点状态设置不同样式
      if (isPlayerDead) {
        if (isNodeCompleted) {
          // 已完成的节点变成暗红色
          nodeDiv.classList.add('completed-dead');
          // 移除点击事件
          nodeDiv.onclick = null;
        } else if (isNodeReachable(node, currentPath, mapData)) {
          // 已解锁但未完成的节点变成红色，且不可进入
          nodeDiv.classList.add('unreachable');
          // 移除点击事件
          nodeDiv.onclick = null;
        } else {
          // 未解锁的节点保持锁定状态
          nodeDiv.classList.add('locked');
          // 移除点击事件
          nodeDiv.onclick = null;
        }
      } else {
        // 玩家未死亡，按正常逻辑处理
        if (isNodeCompleted) {
          // 已访问的节点保持visited状态
        } else if (isNodeReachable(node, currentPath, mapData)) {
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

// ⭐ 关键：点击后更新路径 → 交给 RoomMain 统一处理房间进入
async function selectNode(node) {
  const globalData = await storage.load_global('global.json');

  if (node.type === 'shop') {
    // 对于商店节点，在进入时添加到路径（因为进入商店通常意味着完成该节点）
    if (!globalData.currentPath.includes(node.id)) {
      globalData.currentPath.push(node.id);
      await storage.save_global('global.json', globalData);
    }

    // 加载商店界面
    import('../shop/ShopMain.js').then(module => {
      if (module.ShopMain) {
        module.ShopMain();
      } else {
        // 如果没有ShopMain函数，则执行默认的main函数
        module.default && module.default();
      }
    }).catch(err => {
      console.error('加载商店界面失败:', err);
    });
  } else if (node.type === 'rest') {
    // 对于休息节点，在进入时添加到路径（因为进入休息通常意味着完成该节点）
    if (!globalData.currentPath.includes(node.id)) {
      globalData.currentPath.push(node.id);
      await storage.save_global('global.json', globalData);
    }

    // 加载休息界面
    import('../select/RestMain.js').then(({ showRest }) => {
      showRest();
    }).catch(err => {
      console.error('加载休息界面失败:', err);
    });
  } else if (node.type === 'event') {
    // 对于事件节点，在进入时添加到路径
    if (!globalData.currentPath.includes(node.id)) {
      globalData.currentPath.push(node.id);
      await storage.save_global('global.json', globalData);
    }

    // 预留event节点的接口
    console.log('进入事件房间');
    // 这里可以预留event界面的接口
  } else if (node.type === 'boss') {
    // 对于BOSS节点，在进入时添加到路径
    if (!globalData.currentPath.includes(node.id)) {
      globalData.currentPath.push(node.id);
      await storage.save_global('global.json', globalData);
    }

    // 预留boss节点的接口
    console.log('进入BOSS房间');
    // 这里可以预留boss界面的接口
  } else {
    // 对于战斗节点（normal, elite），只传递节点ID，不立即添加到路径
    // 只有在战斗成功后才添加到路径

    // 先清空当前页面内容，然后启动战斗场景
    document.body.innerHTML = '<div id="battle-container"></div>';
    import('../battle/battle.js').then(({ Battle }) => {
      const game = new Battle();
      // 传递节点ID给战斗场景，以便战斗结束后可以保存
      game.currentNodeId = node.id;
      game.start('random'); // 使用随机生成的关卡
    }).catch(err => {
      console.error('加载战斗场景失败:', err);
    });
  }
}

// 窗口大小改变时重绘连线
window.addEventListener('resize', async () => {
  const globalData = await storage.load_global('global.json');
  if (globalData?.map && mapContainer) {
    renderConnections(globalData.map);
  }
});