const NODE_TYPES = ['normal', 'elite', 'shop', 'rest', 'event'];

export function createMap(layers = 8, minNodes = 3, maxNodes = 6) {
  const mapLayers = [];       // 每层节点数组
  const connections = [];     // 所有连接 {from, to}

  for (let layer = 0; layer < layers; layer++) {
    const numNodes = Math.floor(Math.random() * (maxNodes - minNodes + 1)) + minNodes;
    const layerNodes = [];
    for (let n = 0; n < numNodes; n++) {
      const type = NODE_TYPES[Math.floor(Math.random() * NODE_TYPES.length)];
      layerNodes.push({
        id: `${layer}-${n}`,
        type,
        layer,
        index: n
      });
    }
    mapLayers.push(layerNodes);
  }

  // 添加Boss层
  mapLayers.push([{
    id: `${layers}-0`,
    type: 'boss',
    layer: layers,
    index: 0
  }]);

  // 生成连接
  for (let layer = 0; layer < mapLayers.length - 1; layer++) {
    const current = mapLayers[layer];
    const next = mapLayers[layer + 1];
    const hasParent = new Array(next.length).fill(false);

    current.forEach(fromNode => {
      const start = Math.max(0, fromNode.index - 1);
      const end = Math.min(next.length - 1, fromNode.index + 2);

      if (start > end) return;

      // 随机连1或2条
      const num = Math.random() < 0.5 ? 1 : 2;
      const possible = end - start + 1;
      const toConnect = Math.min(num, possible);
      if (toConnect <= 0) return;

      const selected = new Set();

      // 优先连接孤儿节点（保证可达）
      const orphans = [];
      for (let i = start; i <= end; i++) {
        if (!hasParent[i]) orphans.push(i);
      }

      for (let i = 0; i < Math.min(orphans.length, toConnect); i++) {
        const idx = orphans[i];
        selected.add(idx);
        hasParent[idx] = true;
      }

      // 剩余随机连接
      const remain = toConnect - selected.size;
      for (let i = 0; i < remain; i++) {
        let idx;
        do {
          idx = start + Math.floor(Math.random() * possible);
        } while (selected.has(idx));
        selected.add(idx);
        hasParent[idx] = true;
      }

      selected.forEach(idx => {
        connections.push({
          from: fromNode.id,
          to: next[idx].id
        });
      });
    });

    // 补救任何遗漏的孤儿节点
    for (let i = 0; i < next.length; i++) {
      if (!hasParent[i]) {
        const closest = Math.max(0, Math.min(current.length - 1, i));
        connections.push({
          from: current[closest].id,
          to: next[i].id
        });
      }
    }
  }

  return {
    layers: mapLayers,
    connections
  };
}