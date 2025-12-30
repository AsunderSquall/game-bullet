// src/room/RoomMain.js
import { storage } from '../utils/storage.js';
import { ShopMain } from '../shop/ShopMain.js';
import { SelectMain } from '../select/SelectMain.js';
// import { showEvent } from '../event/EventMain.js';

export async function enterRoom(type) {
  const globalData = await storage.load_global('global.json');

  let roomData = {};

  switch (type) {
    case 'normal':
      roomData = {
      name: "测试关卡",
      background: "0x000022",
      waves: [
        {
          time: 1.0,
          enemies: [
            {
              type: "fairy_blue",
              position: { x: 0, y: 100, z: 200 },
              hp: 6000,
              options: { shootInterval: 3, bulletCount: 24, bulletSpeed: 20 }
            }
          ]
        },
        {
          time: 15.0,
          enemies: [
            {
              type: "fairy_red",
              position: { x: 0, y: 50, z: 300 },
              hp: 6000,
              options: { shootInterval: 3, bulletCount: 24, bulletSpeed: 20 }
            },
            {
              type: "fairy_red",
              position: { x: 0, y: 100, z: 300 },
              hp: 6000,
              options: { shootInterval: 3, bulletCount: 24, bulletSpeed: 20 }
            },
            {
              type: "fairy_red",
              position: { x: 0, y: 150, z: 300 },
              hp: 6000,
              options: { shootInterval: 3, bulletCount: 24, bulletSpeed: 20 }
            }
          ]
        }
      ],
      rewards: { cards: 3, gold: 100 }  // 猫娘随便加个奖励，主人可以改～
    };
      break;

    case 'elite':
      roomData = {
      name: "测试关卡",
      background: "0x000022",
      waves: [
        {
          time: 1.0,
          enemies: [
            {
              type: "fairy_blue",
              position: { x: 0, y: 100, z: 200 },
              hp: 6000,
              options: { shootInterval: 3, bulletCount: 24, bulletSpeed: 20 }
            }
          ]
        },
        {
          time: 15.0,
          enemies: [
            {
              type: "fairy_red",
              position: { x: 0, y: 50, z: 300 },
              hp: 6000,
              options: { shootInterval: 3, bulletCount: 24, bulletSpeed: 20 }
            },
            {
              type: "fairy_red",
              position: { x: 0, y: 100, z: 300 },
              hp: 6000,
              options: { shootInterval: 3, bulletCount: 24, bulletSpeed: 20 }
            },
            {
              type: "fairy_red",
              position: { x: 0, y: 150, z: 300 },
              hp: 6000,
              options: { shootInterval: 3, bulletCount: 24, bulletSpeed: 20 }
            }
          ]
        }
      ],
      rewards: { cards: 3, gold: 100 }  // 猫娘随便加个奖励，主人可以改～
    };
      break;

    case 'shop':
      roomData = {
      name: "商店",
      background: "0x112233",
      shopItems: [
        { id: "weapon003", price: 120 },
        { id: "passive004", price: 50 },
        { id: "passive002", price: 50 }
      ],
      EnergyPrice: 100,
      PostsPrice: 100,
      BombPrice: 100
    };
    await storage.save('shopCur.json',roomData)
      break;

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
        name: "Boss",
        background: "0x330000",
        waves: [ /* 以后放大Boss */ ]
      };
      break;

    default:
      roomData = { name: "未知房间", waves: [] };
  }
  
  

  globalData.currentStatus = type;

  switch (type) {
    case 'normal':
    case 'elite':
    case 'boss':
      globalData.currentStatus = 'select';
      await storage.save_global('global.json', globalData);
      await SelectMain();
      break;
    case 'shop':
      await ShopMain();
      break;
    default:
      alert(`进入${roomData.name}～功能开发中喵！`);
      break;
  }
}