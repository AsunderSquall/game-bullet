import { storage } from '../utils/storage.js';
import { createCardFromId } from '../cards/CardFactory.js';
import { Info } from '../ui/info.js';

let currentGold = 0;
let maxPassiveSlots = 8;
let maxEnergy = 5;
let currentBomb = 0;
let deckInventory = {};
let tempGlobalData = null;
let shopContainer, inventoryContainer, display;

export async function ShopMain() {
  const response = await fetch('src/ui/shop.html');
  if (!response.ok) throw new Error('加载商店HTML失败～');
  document.body.innerHTML = await response.text();

  shopContainer = document.getElementById('shop-container');
  inventoryContainer = document.getElementById('inventory-container');
  display = {
    gold: document.getElementById('current-gold'),
    slots: document.getElementById('current-slots'),
    maxEnergy: document.getElementById('max-energy'),
    bomb: document.getElementById('current-bombs')
  };

  await init();
}

async function init() {
  tempGlobalData = await storage.load_global('global.json', {
    money: 1000,
    deck: {},
    max_passive_slots: 8,
    max_energy: 5,
    bomb: 0
  });

  currentGold = tempGlobalData.money ?? 1000;
  deckInventory = { ...tempGlobalData.deck };
  maxPassiveSlots = tempGlobalData.max_passive_slots ?? 8;
  maxEnergy = tempGlobalData.max_energy ?? 5;
  currentBomb = tempGlobalData.bomb ?? 0;

  const shopData = await storage.load('shopCur.json', {
    shopItems: [],
    PostsPrice: 100,
    EnergyPrice: 100,
    BombPrice: 100
  });

  tempGlobalData.PostsPrice = shopData.PostsPrice ?? 100;
  tempGlobalData.EnergyPrice = shopData.EnergyPrice ?? 100;
  tempGlobalData.BombPrice = shopData.BombPrice ?? 100;

  const shopItems = shopData.shopItems || [];
  for (const item of shopItems) {
    if (!item || !item.id) continue;
    const card = createCardFromId(item.id);
    if (!card) continue;
    const price = item.price !== undefined ? item.price : card.price;
    createShopCard(card, price);
  }

  for (const id in deckInventory) {
    if (deckInventory[id] > 0) {
      const card = createCardFromId(id);
      if (card) createInventoryCard(card, deckInventory[id]);
    }
  }

  // 升级项逻辑 - 注意加上 async
  const slotCard = document.querySelector('.card[data-type="slot-upgrade"]');
  const energyCard = document.querySelector('.card[data-type="energy-upgrade"]');
  const bombCard = document.querySelector('.card[data-type="bomb-upgrade"]');

  if (slotCard) {
    slotCard.querySelector('.buy-btn').onclick = async () => { // 添加 async
      const price = tempGlobalData.PostsPrice;
      if (currentGold >= price) {
        currentGold -= price;
        maxPassiveSlots += 1;
        slotCard.remove();
        updateTopInfo();
      } else {
        await Info.alert('金币不够！');
      }
    };
  }

  if (energyCard) {
    energyCard.querySelector('.buy-btn').onclick = async () => { // 添加 async
      const price = tempGlobalData.EnergyPrice;
      if (currentGold >= price) {
        currentGold -= price;
        maxEnergy += 1;
        energyCard.remove();
        updateTopInfo();
      } else {
        await Info.alert('金币不够！');
      }
    };
  }

  if (bombCard) {
    bombCard.querySelector('.buy-btn').onclick = async () => { // 添加 async
      const price = tempGlobalData.BombPrice;
      if (currentGold >= price) {
        currentGold -= price;
        currentBomb += 1;
        bombCard.remove();
        updateTopInfo();
      } else {
        await Info.alert('金币不足！');
      }
    };
  }

  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.onclick = async () => {
      tempGlobalData.money = currentGold;
      tempGlobalData.deck = { ...deckInventory };
      tempGlobalData.max_passive_slots = maxPassiveSlots;
      tempGlobalData.max_energy = maxEnergy;
      tempGlobalData.bomb = currentBomb;

      try {
        tempGlobalData.currentStatus = 'map';
        await storage.save_global('global.json', tempGlobalData);
        await Info.alert('存档已保存', '成功');
        // 跳转逻辑...
        import('../map/MapMain.js').then(m => m.showMap());
      } catch (err) {
        await Info.alert('保存失败');
      }
    };
  }
  updateTopInfo();
}

function createShopCard(card, price) {
  const div = document.createElement('div');
  div.className = `card ${card.type}`;
  div.innerHTML = `
    <img src="${card.icon}" class="card-icon">
    <div class="card-name">${card.name}</div>
    <div class="card-price">${price} 💰</div>
    <button class="buy-btn">购买</button>
  `;
  // 注意这里调用 buyCard
  div.querySelector('.buy-btn').onclick = () => buyCard(card, div, price);
  shopContainer.appendChild(div);
}

// 修正为 async function
async function buyCard(card, shopDiv, price) {
  if (currentGold >= price) {
    currentGold -= price;
    deckInventory[card.id] = (deckInventory[card.id] || 0) + 1;
    shopDiv.remove();
    const existing = document.querySelector(`#inventory-container .card[data-id="${card.id}"]`);
    if (existing) existing.updateCount();
    else createInventoryCard(card, deckInventory[card.id]);
    updateTopInfo();
  } else {
    await Info.alert('金币不足');
  }
}

function createInventoryCard(card, count) {
  const div = document.createElement('div');
  div.className = `card ${card.type}`;
  div.dataset.id = card.id;
  div.innerHTML = `
    <img src="${card.icon}" class="card-icon">
    <div class="card-name">${card.name}</div>
    <div class="card-count">x${count}</div>
  `;
  div.updateCount = () => {
    const cur = deckInventory[card.id] || 0;
    div.querySelector('.card-count').textContent = `x${cur}`;
  };
  inventoryContainer.appendChild(div);
}

function updateTopInfo() {
  if(display.gold) display.gold.textContent = currentGold;
  if(display.slots) display.slots.textContent = maxPassiveSlots;
  if(display.maxEnergy) display.maxEnergy.textContent = maxEnergy;
  if(display.bomb) display.bomb.textContent = currentBomb;
}