// ShopMain.js —— 完整版商店主逻辑
import { storage } from '../utils/storage.js';
import { createCardFromId } from '../cards/CardFactory.js';

let currentGold = 0;
let maxPassiveSlots = 8;
let maxEnergy = 5;
let currentBomb = 0;  // 新增：符卡数量

let deckInventory = {};  // { id: count }

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
    bomb: document.getElementById('current-bombs')  // 新增！
  };

  await init();
}

async function init() {
  // 加载全局存档
  tempGlobalData = await storage.load_global('global.json', {
    money: 1000,
    deck: {},
    max_passive_slots: 8,
    max_energy: 5,
    bomb: 0  // 默认0个符卡
  });

  // 读取到内存变量
  currentGold = tempGlobalData.money ?? 1000;
  deckInventory = { ...tempGlobalData.deck };
  maxPassiveSlots = tempGlobalData.max_passive_slots ?? 8;
  maxEnergy = tempGlobalData.max_energy ?? 5;
  currentBomb = tempGlobalData.bomb ?? 0;

  // 加载商店配置（包含三个固定升级价格）
  const shopData = await storage.load('shopCur.json', {
    shopItems: [],
    PostsPrice: 100,
    EnergyPrice: 100,
    BombPrice: 100
  });

  // 把价格存进临时数据，方便后面使用
  tempGlobalData.PostsPrice = shopData.PostsPrice ?? 100;
  tempGlobalData.EnergyPrice = shopData.EnergyPrice ?? 100;
  tempGlobalData.BombPrice = shopData.BombPrice ?? 100;

  // 上架普通卡牌
  const shopItems = shopData.shopItems || [];
  for (const item of shopItems) {
    if (!item || !item.id) continue;

    const card = createCardFromId(item.id);
    if (!card) {
      console.warn(`商店试图上架未知卡牌: ${item.id}`);
      continue;
    }

    const price = item.price !== undefined ? item.price : card.price;
    if (price === undefined) {
      console.warn(`卡牌 ${item.id} 没有价格，无法上架`);
      continue;
    }

    createShopCard(card, price);
  }

  // 渲染已拥有卡牌
  for (const id in deckInventory) {
    if (deckInventory[id] > 0) {
      const card = createCardFromId(id);
      if (card) createInventoryCard(card, deckInventory[id]);
    }
  }

  // ========== 升级项购买逻辑（买一次就消失）==========
  const slotCard = document.querySelector('.card[data-type="slot-upgrade"]');
  const energyCard = document.querySelector('.card[data-type="energy-upgrade"]');
  const bombCard = document.querySelector('.card[data-type="bomb-upgrade"]');

  const slotPriceSpan = document.getElementById('slot-price');
  const energyPriceSpan = document.getElementById('energy-price');
  const bombPriceSpan = document.getElementById('bomb-price');

  // 更新价格显示
  slotPriceSpan.textContent = tempGlobalData.PostsPrice;
  energyPriceSpan.textContent = tempGlobalData.EnergyPrice;
  bombPriceSpan.textContent = tempGlobalData.BombPrice;

  // 卡槽位购买
  if (slotCard) {
    slotCard.querySelector('.buy-btn').onclick = () => {
      const price = tempGlobalData.PostsPrice;
      if (currentGold >= price) {
        currentGold -= price;
        maxPassiveSlots += 1;
        tempGlobalData.max_passive_slots = maxPassiveSlots;

        slotCard.remove();
        updateTopInfo();
      } else {
        alert('金币不够！');
      }
    };
  }

  // 最大能量购买
  if (energyCard) {
    energyCard.querySelector('.buy-btn').onclick = () => {
      const price = tempGlobalData.EnergyPrice;
      if (currentGold >= price) {
        currentGold -= price;
        maxEnergy += 1;
        tempGlobalData.max_energy = maxEnergy;
        energyCard.remove();
        updateTopInfo();
      } else {
        alert('金币不够！');
      }
    };
  }

  // 符卡购买
  if (bombCard) {
    bombCard.querySelector('.buy-btn').onclick = () => {
      const price = tempGlobalData.BombPrice;
      if (currentGold >= price) {
        currentGold -= price;
        currentBomb += 1;
        tempGlobalData.bomb = currentBomb;

        bombCard.remove();
        updateTopInfo();
      } else {
        alert('金币不足！');
      }
    };
  }

  // 返回按钮：离开时保存所有更改
  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.onclick = async () => {
      tempGlobalData.money = currentGold;
      tempGlobalData.deck = { ...deckInventory };
      tempGlobalData.max_passive_slots = maxPassiveSlots;
      tempGlobalData.max_energy = maxEnergy;
      tempGlobalData.bomb = currentBomb;

      try {
        await storage.save_global('global.json', tempGlobalData);
        alert('存档已保存');
        // location.href = 'menu.html';  // 实际项目中跳转主菜单
      } catch (err) {
        alert('保存失败');
        console.error(err);
      }
    };
  }

  updateTopInfo();
}

// 普通卡牌上架
function createShopCard(card, price) {
  const div = document.createElement('div');
  div.className = `card ${card.type}`;
  div.innerHTML = `
    <img src="${card.icon}" class="card-icon">
    <div class="card-name">${card.name}</div>
    <div class="card-price">${price} 💰</div>
    <button class="buy-btn ${currentGold < price ? 'disabled' : ''}">
      购买
    </button>
  `;

  const btn = div.querySelector('.buy-btn');
  btn.onclick = () => buyCard(card, div, price);

  shopContainer.appendChild(div);
}

// 购买普通卡牌
function buyCard(card, shopDiv, price) {
  if (currentGold >= price) {
    currentGold -= price;
    deckInventory[card.id] = (deckInventory[card.id] || 0) + 1;


    shopDiv.remove();  // 买完消失

    const existing = document.querySelector(`#inventory-container .card[data-id="${card.id}"]`);
    if (existing) {
      existing.updateCount();
    } else {
      createInventoryCard(card, deckInventory[card.id]);
    }

    updateTopInfo();
  } else {
    alert('金币');
  }
}

// 库存卡牌显示
function createInventoryCard(card, count) {
  const div = document.createElement('div');
  div.className = `card ${card.type} ${count === 0 ? 'disabled' : ''}`;
  div.dataset.id = card.id;
  div.innerHTML = `
    <img src="${card.icon}" class="card-icon">
    <div class="card-name">${card.name}</div>
    <div class="card-count">x${count}</div>
  `;

  div.updateCount = () => {
    const cur = deckInventory[card.id] || 0;
    div.querySelector('.card-count').textContent = `x${cur}`;
    div.classList.toggle('disabled', cur === 0);
  };

  inventoryContainer.appendChild(div);
}

// 更新顶部信息
function updateTopInfo() {
  display.gold.textContent = currentGold;
  display.slots.textContent = maxPassiveSlots;
  display.maxEnergy.textContent = maxEnergy;
  display.bomb.textContent = currentBomb;
}
