import { storage } from '../utils/storage.js';

const NODE_ICONS = {
  normal: '⚔️',
  elite: '💀',
  shop: '🛒',
  rest: '🛏️',
  event: '❓',
  boss: '😈'
};

const SVG_NS = 'http://www.w3.org/2000/svg';

let mapContainer;
let lineLayer;
let nodeLayer;

export async function showMap() {
  const response = await fetch('src/ui/map.html');
  document.body.innerHTML = await response.text();

  mapContainer = document.getElementById('map-container');
  lineLayer = document.getElementById('map-lines');
  nodeLayer = document.getElementById('map-nodes');

  await renderMap();
}

async function renderMap() {
  const globalData = await storage.load_global('global.json');
  const mapData = globalData?.map;
  const currentPath = globalData?.currentPath || [];

  if (!mapData) return;

  lineLayer.innerHTML = '';
  nodeLayer.innerHTML = '';

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
        <div class="node-icon">${NODE_ICONS[node.type]}</div>
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

    nodeLayer.appendChild(layerDiv);
  });

  renderConnections(mapData);
}

function isNodeReachable(node, currentPath, mapData) {
  if (node.layer === 0) return true;
  if (currentPath.length === 0) return false;
  const last = currentPath[currentPath.length - 1];
  return mapData.connections.some(c => c.from === last && c.to === node.id);
}

function renderConnections(mapData) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.style.position = 'absolute';
  svg.style.inset = '0';

  mapData.connections.forEach(conn => {
    const from = nodeLayer.querySelector(`.map-node[data-id="${conn.from}"]`);
    const to = nodeLayer.querySelector(`.map-node[data-id="${conn.to}"]`);
    if (!from || !to) return;

    const fr = from.getBoundingClientRect();
    const tr = to.getBoundingClientRect();
    const cr = mapContainer.getBoundingClientRect();

    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', fr.left + fr.width / 2 - cr.left);
    line.setAttribute('y1', fr.top + fr.height / 2 - cr.top);
    line.setAttribute('x2', tr.left + tr.width / 2 - cr.left);
    line.setAttribute('y2', tr.top + tr.height / 2 - cr.top);
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

  alert(`即将进入 ${node.type.toUpperCase()} 房间～✨`);

  const pages = { shop: 'shop.html', rest: 'rest.html', boss: 'boss.html' };
  location.href = pages[node.type] || 'battle.html';
}
