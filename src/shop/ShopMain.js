import { storage } from '../utils/storage.js';
import { createCardFromId } from '../cards/CardFactory.js';

let currentGold = 0;
let maxPassiveSlots = 8;
let maxEnergy = 5;

let deckInventory = {};  // { id: count }

// 新增！临时全局数据对象（内存中操作）
let tempGlobalData = null;

let shopContainer, inventoryContainer, display;

async function main() {
  const response = await fetch('src/ui/shop.html');
  if (!response.ok) throw new Error('加载商店HTML失败～');
  document.body.innerHTML = await response.text();

  shopContainer = document.getElementById('shop-container');
  inventoryContainer = document.getElementById('inventory-container');
  display = {
    gold: document.getElementById('current-gold'),
    slots: document.getElementById('current-slots'),
    maxEnergy: document.getElementById('max-energy')
  };

  await init();
}

async function init() {
  // 加载全局数据（整个对象读出来！）
  tempGlobalData = await storage.load_global('global.json', {
    money: 1000,
    deck: {},
    max_passive_slots: 8,
    max_energy: 5
  });

  // 从临时对象取值
  currentGold = tempGlobalData.money ?? 1000;
  deckInventory = { ...tempGlobalData.deck };
  maxPassiveSlots = tempGlobalData.max_passive_slots ?? 8;
  maxEnergy = tempGlobalData.max_energy ?? 5;

  // 加载当前商店上架卡牌（不变）
  const shopData = await storage.load('shopCur.json', { shopItems: [] });
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
      console.warn(`卡牌 ${item.id} (${card.name || ''}) 没有价格，无法上架`);
      continue;
    }

    createShopCard(card, price);
  }

  // 渲染右边已拥有卡牌
  for (const id in deckInventory) {
    if (deckInventory[id] > 0) {
      const card = createCardFromId(id);
      if (card) createInventoryCard(card, deckInventory[id]);
    }
  }

  updateTopInfo();

  // 重要！返回按钮：离开时一次性保存临时数据回文件
  const backBtn = document.getElementById('back-btn');
  if (backBtn) {
    backBtn.onclick = async () => {
      // 点击返回时，把临时数据写回global.json
      tempGlobalData.money = currentGold;
      tempGlobalData.deck = { ...deckInventory };
      tempGlobalData.max_passive_slots = maxPassiveSlots;
      tempGlobalData.max_energy = maxEnergy;

      try {
        await storage.save_global('global.json', tempGlobalData);
        alert('存档已保存～返回主菜单啦！');
        // 实际项目中可以跳转页面或关闭商店
        // location.href = 'menu.html';
      } catch (err) {
        alert('保存失败了喵～进度可能丢失(>﹏<)');
        console.error(err);
      }
    };
  }
}

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

function buyCard(card, shopDiv, price) {
  if (currentGold >= price) {
    currentGold -= price;
    deckInventory[card.id] = (deckInventory[card.id] || 0) + 1;

    // 只改内存变量！不立即保存～超流畅！
    alert(`成功购买 ${card.name}！花费 ${price} 金币！`);

    shopDiv.remove();  // 买完移除

    const existing = document.querySelector(`#inventory-container .card[data-id="${card.id}"]`);
    if (existing) {
      existing.updateCount();
    } else {
      createInventoryCard(card, deckInventory[card.id]);
    }

    updateTopInfo();
  } else {
    alert('金币不够！');
  }
}

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

function updateTopInfo() {
  display.gold.textContent = currentGold;
  display.slots.textContent = maxPassiveSlots;
  display.maxEnergy.textContent = maxEnergy;
}

main();