// src/room/RoomMain.js
import { storage } from '../utils/storage.js';
import { ShopMain } from '../shop/ShopMain.js';
import { SelectMain } from '../select/SelectMain.js';
import { showRest } from '../select/RestMain.js';
import { EventMain } from '../event/EventMain.js';

export async function enterRoom(type) {
  const globalData = await storage.load_global('global.json');

  let roomData = {};

  switch (type) {
    case 'normal':
      roomData = {
      name: "普通关卡",
      background: "0x000022",
      waves: [
        {
          time: 1.0,
          enemies: [
            {
              type: "fairy_blue",
              position: { x: 0, y: 100, z: 200 },
              hp: 4000,
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
              hp: 3000,
              options: { shootInterval: 3, bulletCount: 24, bulletSpeed: 20 }
            },
            {
              type: "fairy_red",
              position: { x: 0, y: 100, z: 300 },
              hp: 3000,
              options: { shootInterval: 3, bulletCount: 24, bulletSpeed: 20 }
            },
            {
              type: "fairy_red",
              position: { x: 0, y: 150, z: 300 },
              hp: 3000,
              options: { shootInterval: 3, bulletCount: 24, bulletSpeed: 20 }
            }
          ]
        }
      ],
      rewards: { cards: 3, gold: 100 },
      type: 'normal',
    };
      break;
    
    case 'elite':
      roomData = {
      name: "精英关卡",
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
      rewards: { cards: 3, gold: 100 },
      type: 'elite'
    };
      break;

    case 'event': {
      const eventNames = [
        'slime_pit', 
        'beggar_elder', 
        'cursed_chest', 
        'forbidden_armory', 
        'drunken_veteran', 
        'fairy_gift'
      ];

      const randomName = eventNames[Math.floor(Math.random() * eventNames.length)];

      roomData = {
        name: randomName,
      };
      break;
    }

    case 'shop': {
      // 1. 处理第一张牌的概率和价格
      const isWeapon03 = Math.random() < 0.9;
      const firstWeapon = {
        id: isWeapon03 ? "weapon003" : "weapon002",
        price: isWeapon03 
          ? Math.floor(Math.random() * (140 - 120 + 1)) + 120  // 120~140
          : Math.floor(Math.random() * (250 - 230 + 1)) + 230  // 230~250
      };

      // 2. 处理后两张被动牌 (Passive01~08)
      const getRandomPassive = () => {
        const idNum = Math.floor(Math.random() * 8) + 1; // 1~8
        return {
          id: `passive00${idNum}`,
          price: Math.floor(Math.random() * (80 - 60 + 1)) + 60 // 60~80
        };
      };

      // 3. 生成基础物品价格 (90~110)
      const getBasePrice = () => Math.floor(Math.random() * (110 - 90 + 1)) + 90;

      roomData = {
        name: "商店",
        background: "0x112233",
        shopItems: [
          firstWeapon,
          getRandomPassive(),
          getRandomPassive()
        ],
        EnergyPrice: getBasePrice(),
        PostsPrice: getBasePrice(),
        BombPrice: getBasePrice()
      };

      await storage.save('shopCur.json', roomData);
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
      
      await storage.save('battleCur.json',roomData)
      await storage.save_global('global.json', globalData);
      await SelectMain();
      break;
    case 'shop':
      await storage.save('shopCur.json',roomData)
      await ShopMain();
      break;
    case 'rest':
      await showRest();
      break;
    case 'event':
      await storage.save('eventCur.json',roomData)
      console.log("event start");
      await EventMain();
      break;
    default:
      alert(`进入${roomData.name}～功能开发中喵！`);
      break;
  }
}