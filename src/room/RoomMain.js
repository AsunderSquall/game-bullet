// src/room/RoomMain.js
import { storage } from '../utils/storage.js';
import { ShopMain } from '../shop/ShopMain.js';
import { SelectMain } from '../select/SelectMain.js';
import { showRest } from '../select/RestMain.js';
import { EventMain } from '../event/EventMain.js';

// --- 配置文件：基础数值与分类池 ---
const ENEMY_BASE_STATS = {
    fairy_red:    { hp: 100 * 20, dmg: 8,  speed: 10 },
    wave_enemy:   { hp: 60 * 20,  dmg: 10, speed: 5 },
    spiral_enemy: { hp: 120 * 5, dmg: 6,  speed: 4 },
    fairy_blue:   { hp: 100 * 20, dmg: 10, speed: 8 },
    circle_enemy: { hp: 80 * 20,  dmg: 12, speed: 6 },
    tracker_enemy:{ hp: 50 * 20,  dmg: 8,  speed: 10 }
};

const POOLS = {
    simple: ['fairy_red', 'wave_enemy', 'spiral_enemy'],
    hard:   ['fairy_blue', 'circle_enemy', 'tracker_enemy']
};

/**
 * 辅助函数：根据当前路径计算成长后的敌人配置
 */
function createScaledEnemy(id, x, z, hpGrowth, dmgGrowth, eliteMult) {
    const base = ENEMY_BASE_STATS[id];
    return {
        type: id,
        position: { x, y: 100, z },
        hp: Math.floor(base.hp * hpGrowth * eliteMult),
        options: {
            damage: Math.floor(base.dmg * dmgGrowth),
            forwardSpeed: base.speed // 基础移动速度保持稳定
        }
    };
}

/**
 * 核心逻辑：生成战斗波次
 */
async function generateBattleWaves(type, globalData) {
    // 统计路径中战斗房间的数量 n
    const n = globalData.currentPath ? globalData.currentPath.filter(node => 
        ['normal', 'elite', 'boss'].includes(node.type)
    ).length : 0;

    const hpGrowth = Math.pow(1.1, n);
    const dmgGrowth = Math.pow(1.2, n);
    const eliteMult = (type === 'elite') ? 1.3 : 1.0;

    const waves = [];
    const pickSimple = () => POOLS.simple[Math.floor(Math.random() * POOLS.simple.length)];
    const pickHard = () => POOLS.hard[Math.floor(Math.random() * POOLS.hard.length)];

    if (type === 'normal') {
        // 第一波：随机 3 个简单怪
        waves.push({
            time: 1.0,
            enemies: [
                createScaledEnemy(pickSimple(), 0, 200, hpGrowth, dmgGrowth, eliteMult),
                createScaledEnemy(pickSimple(), 0, 300, hpGrowth, dmgGrowth, eliteMult),
                createScaledEnemy(pickSimple(), 0, 400, hpGrowth, dmgGrowth, eliteMult)
            ]
        });
        // 第二波：随机 1 个困难怪
        waves.push({
            time: 15.0,
            enemies: [
                createScaledEnemy(pickHard(), 0, 400, hpGrowth, dmgGrowth, eliteMult)
            ]
        });
    } else if (type === 'elite') {
        // 第一波：1 困难 + 2 简单
        waves.push({
            time: 1.0,
            enemies: [
                createScaledEnemy(pickHard(), 0, 300, hpGrowth, dmgGrowth, eliteMult),
                createScaledEnemy(pickSimple(), 0, 200, hpGrowth, dmgGrowth, eliteMult),
                createScaledEnemy(pickSimple(), 0, 400, hpGrowth, dmgGrowth, eliteMult)
            ]
        });
        // 第二波：2 困难
        waves.push({
            time: 20.0,
            enemies: [
                createScaledEnemy(pickHard(), -50, 400, hpGrowth, dmgGrowth, eliteMult),
                createScaledEnemy(pickHard(), 50, 400, hpGrowth, dmgGrowth, eliteMult)
            ]
        });
    }
    return waves;
}

// --- 主入口函数 ---
export async function enterRoom(type) {
    const globalData = await storage.load_global('global.json');
    let roomData = {};

    switch (type) {
        case 'normal':
        case 'elite':
            roomData = {
                name: type === 'normal' ? "普通关卡" : "精英关卡",
                background: type === 'normal' ? "0x000022" : "0x110011",
                waves: await generateBattleWaves(type, globalData),
                rewards: { cards: 3, gold: type === 'normal' ? 100 : 250 },
                type: type
            };
            break;

        case 'event': {
            const eventNames = ['slime_pit', 'beggar_elder', 'cursed_chest', 'forbidden_armory', 'drunken_veteran', 'fairy_gift'];
            roomData = { name: eventNames[Math.floor(Math.random() * eventNames.length)] };
            break;
        }

        case 'shop': {
            // 1. 武器抽卡 (1个)
            const isWeapon03 = Math.random() < 0.9;
            const firstWeapon = {
                id: isWeapon03 ? "weapon003" : "weapon002",
                price: isWeapon03 ? Math.floor(Math.random() * 21) + 120 : Math.floor(Math.random() * 21) + 230
            };

            // 2. 被动抽卡 (3个)
            const getRandomPassive = () => ({
                id: `passive00${Math.floor(Math.random() * 8) + 1}`,
                price: Math.floor(Math.random() * 21) + 60
            });

            const getBasePrice = () => Math.floor(Math.random() * 21) + 90;

            roomData = {
                name: "商店",
                background: "0x112233",
                shopItems: [
                    firstWeapon,
                    getRandomPassive(),
                    getRandomPassive(),
                    getRandomPassive() // 改为 3 个被动
                ],
                EnergyPrice: getBasePrice(),
                PostsPrice: getBasePrice(),
                BombPrice: getBasePrice()
            };
            break;
        }

        case 'rest':
            roomData = {
                name: "休息点",
                background: "0x113311",
                restOptions: ["heal"],
                rewards: { healAmount: 100 }
            };
            break;

        case 'boss':
        roomData = {
            name: "最终房间",
            background: "0x000000",
            waves: [
                {
                    time: 5,
                    enemies: [
                        {
                            type: "boss",
                            position: { x: 0, y: 250, z: 400 },
                            hp: 100000 , // Boss 拥有极高血量
                            options: {
                                // 这里可以传入一些自定义的弹幕倍率
                            }
                        }
                    ]
                }
            ],
            type: 'boss'
        };
        break;

        default:
            roomData = { name: "未知房间", waves: [] };
    }

    // --- 数据保存与路由跳转 ---
    globalData.currentStatus = type;

    if (['normal', 'elite', 'boss'].includes(type)) {
        globalData.currentStatus = 'select';
        await storage.save('battleCur.json', roomData);
        await storage.save_global('global.json', globalData);
        await SelectMain();
    } else if (type === 'shop') {
        await storage.save('shopCur.json', roomData);
        await ShopMain();
    } else if (type === 'rest') {
        await showRest();
    } else if (type === 'event') {
        await storage.save('eventCur.json', roomData);
        await EventMain();
    } else {
        alert(`进入${roomData.name}～功能开发中喵！`);
    }
}