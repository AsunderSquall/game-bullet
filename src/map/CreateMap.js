const NODE_TYPES = ['normal', 'elite', 'shop', 'rest', 'event'];

const MIDDLE_TYPE_WEIGHTS = [
  { type: 'normal', weight: 0.4 },
  { type: 'elite',  weight: 0.15 },
  { type: 'event',  weight: 0.2 },
  { type: 'rest',   weight: 0.15 },
  { type: 'shop',   weight: 0.1 }
];

export function createMap(layers = 8, minNodes = 3, maxNodes = 6) {
  const mapLayers = [];
  const connections = [];

  // ---------- 生成普通层 ----------
  for (let layer = 0; layer < layers; layer++) {
    const numNodes =
      Math.floor(Math.random() * (maxNodes - minNodes + 1)) + minNodes;

    const layerNodes = [];
    for (let i = 0; i < numNodes; i++) {
      let type;

      // 第 0 层：全部普通战斗
      if (layer === 0) {
        type = 'normal';
      }
      // 倒数第二层：全部休息
      else if (layer === layers - 1) {
        type = 'rest';
      }
      // 中间层：按概率
      else {
        type = pickWeightedType(MIDDLE_TYPE_WEIGHTS);
      }

      layerNodes.push({
        id: `${layer}-${i}`,
        type,
        layer,
        index: i
      });
    }
    mapLayers.push(layerNodes);
  }

  // ---------- Boss 层 ----------
  mapLayers.push([
    {
      id: `${layers}-0`,
      type: 'boss',
      layer: layers,
      index: 0
    }
  ]);

  // ---------- 连线 ----------
  for (let layer = 0; layer < mapLayers.length - 1; layer++) {
    const current = mapLayers[layer];
    const next = mapLayers[layer + 1];
    const isBeforeBoss = next.length === 1;

    connections.push(
      ...connectLayers(current, next, isBeforeBoss)
    );
  }

  return {
    layers: mapLayers,
    connections
  };
}

// =======================================================
// 按权重随机选择房间类型
// =======================================================
function pickWeightedType(weights) {
  let r = Math.random();
  for (const { type, weight } of weights) {
    r -= weight;
    if (r <= 0) return type;
  }
  // 理论上不会走到这里，兜底
  return weights[weights.length - 1].type;
}

// =======================================================
// 连线核心逻辑（按你的规则）
// =======================================================

function biasedRandomHigh() {
  const r = Math.random();
  return 1 - (1 - r) * (1 - r) * (1 - r); // 向 1 偏
}
function connectLayers(current, next, isBeforeBoss) {
  const result = [];

  // ---------- Boss 前一层 ----------
  if (isBeforeBoss) {
    current.forEach(node => {
      result.push({ from: node.id, to: next[0].id });
    });
    return result;
  }

  const U = current.length;
  const D = next.length;

  // ---------- 1️⃣ 总连线数 ----------
  const minEdges = Math.max(U,D);
  const maxEdges = Math.min(D * 2, U * 2);
  const t = biasedRandomHigh();
  const totalEdges =
  minEdges + Math.floor(t * (maxEdges - minEdges + 1));
  
  // ---------- 2️⃣ 哪些上层节点有 2 条 ----------
  const twoCount = totalEdges - U;

  const upperIndices = [...Array(U).keys()];
  shuffle(upperIndices);

  const twoEdgeSet = new Set(upperIndices.slice(0, twoCount));

  // ---------- 3️⃣ 计算需要复用的次数 ----------
  const reuseCount = totalEdges - D;

  const twoEdgeIndices = [...Array(U - 1).keys()].map(i => i + 1);

  shuffle(twoEdgeIndices);

  const reuseSet = new Set(twoEdgeIndices.slice(0, reuseCount));

  // ---------- 4️⃣ 双指针连线 ----------
  let j = 0;

  for (let i = 0; i < U; i++) {
    const from = current[i];
    const hasTwo = twoEdgeSet.has(i);
    const canReuse = reuseSet.has(i);

    
    if (i!=0 && !canReuse) {
      j++;
    }
    result.push({ from: from.id, to: next[j].id });


    // 第二条
    if (hasTwo) {
      j++;
      result.push({
        from: from.id,
        to: next[Math.min(j, D - 1)].id
      });
    }

    if (j >= D) j = D - 1;
  }

  return result;
}

// ---------- 工具：洗牌 ----------
function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
}