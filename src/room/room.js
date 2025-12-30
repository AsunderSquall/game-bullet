import { storage } from '../utils/storage.js';
import { EnemyFactory } from '../battle/entities/enemies/EnemyFactory.js';

export class RoomGenerator {
  static async generate(type, layer = 1, nodeIndex = 0) {
    const globalData = await storage.load('global.json', {
      seed: 12345,
      currentLayer: 1,
      maxLayer: 5,
      playerPowerLevel: 1,
      clearedRooms: 0
    });

    let seedBase = globalData.seed + layer * 1000 + nodeIndex * 100;
    let rnd = (offset = 0) => seededRandom(seedBase + offset);

    const difficultyScale = 0.8 + globalData.clearedRooms * 0.05 + (layer - 1) * 0.3;

    switch (type) {
      case 'normal':
        return this.generateNormalRoom(rnd, difficultyScale);

      case 'elite':
        return this.generateEliteRoom(rnd, difficultyScale * 1.5);

      case 'shop':
        return this.generateShopRoom(rnd, globalData);

      case 'rest':
        return this.generateRestRoom(rnd);

      case 'event':
        return this.generateEventRoom(rnd);

      case 'boss':
        return this.generateBossRoom(rnd);

      default:
        return this.generateNormalRoom(rnd, difficultyScale);
    }
  }

  static generateNormalRoom(rnd, scale = 1) {
    const enemyCount = 3 + Math.floor(rnd(1) * 3); // 3~5个敌人
    const enemies = [];

    for (let i = 0; i < enemyCount; i++) {
      const types = ['fairy_red', 'fairy_blue'];
      const type = types[Math.floor(rnd(10 + i) * types.length)];

      enemies.push({
        type,
        position: {
          x: (rnd(20 + i) - 0.5) * 200,
          y: 40 + rnd(30 + i) * 30,
          z: -300 + rnd(40 + i) * 100
        },
        hp: type === 'fairy_red' ? Math.floor(60 * scale) : Math.floor(80 * scale)
      });
    }

    return {
      name: "妖精巢穴",
      background: "0x111122",
      waves: [
        { time: 1, enemies }
      ],
      rewards: {
        cards: 2,           // 通关后给2张卡选择
        gold: Math.floor(30 + rnd(50) * 40 * scale)
      }
    };
  }

  // ====================== 精英房间 ======================
  static generateEliteRoom(rnd, scale = 1.5) {
    return {
      name: "精英妖精守卫",
      background: "0x221111",
      waves: [
        {
          time: 1,
          enemies: [
            {
              type: 'fairy_red',
              position: { x: -80, y: 50, z: -350 },
              hp: Math.floor(200 * scale),
              shootInterval: 0.8,
              bulletCount: 30
            },
            {
              type: 'fairy_blue',
              position: { x: 80, y: 50, z: -350 },
              hp: Math.floor(200 * scale),
              shootInterval: 0.8,
              bulletCount: 30
            }
          ]
        }
      ],
      rewards: {
        cards: 3,
        gold: Math.floor(80 * scale),
        relicChance: 0.5  // 50%掉落遗物（后续实现）
      }
    };
  }

  // ====================== 商店房间 ======================
  static generateShopRoom(rnd, globalData) {
    const cardPool = ['fire_ball', 'ice_shield', 'knife_storm', 'heal_potion', 'power_up']; // 你的卡牌ID池
    const items = [];

    // 随机3张卡出售
    for (let i = 0; i < 3; i++) {
      const cardId = cardPool[Math.floor(rnd(100 + i) * cardPool.length)];
      items.push({
        type: 'card',
        id: cardId,
        price: 40 + Math.floor(rnd(200 + i) * 40)
      });
    }

    // 固定出售：卡槽位 + 最大能量（如果还没买过）
    const playerData = storage.get('playerCur.json') || { upgrades: [] };
    if (!playerData.upgrades.includes('extra_slot')) {
      items.push({ type: 'slot', price: 120 });
    }
    if (!playerData.upgrades.includes('extra_energy')) {
      items.push({ type: 'energy', price: 150 });
    }

    // 随机一张符卡（后续补图）
    items.push({
      type: 'spellcard',
      id: 'spell_lunatic',
      price: 200
    });

    return {
      name: "神秘小铺",
      background: "0x112233",
      shopItems: items,
      rewards: { gold: 0 } // 商店不给战斗奖励
    };
  }

  static generateRestRoom(rnd) {
    return {
      name: "休息点",
      background: "0x113311",
      restOptions: ["heal", "upgrade"], // 后续做界面选择
      rewards: { healAmount: 30 }
    };
  }

  static generateEventRoom(rnd) {
    const events = ["赌局", "神秘商人", "诅咒宝箱", "妖精茶会"];
    return {
      name: events[Math.floor(rnd(1) * events.length)],
      background: "0x331133",
      eventId: "random_event_01"
    };
  }

  static generateBossRoom(rnd) {
    return {
      name: "最终试炼",
      background: "0x330000",
      waves: [/* 大Boss数据，后续再设计 */],
      rewards: { cards: 4, gold: 200, relicChance: 1 }
    };
  }
}