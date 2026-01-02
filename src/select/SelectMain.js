import { storage } from '../utils/storage.js';
import { tempPlayerDefault } from '../defaults/tempPlayerDefault.js';
import { createCardFromId } from '../cards/CardFactory.js';
import { Battle } from '../battle/battle.js';
import { musicManager } from '../utils/musicManager.js';


// 临时全局数据（内存操作）
let tempGlobalData = null;

let currentWeaponCard = null;
let currentPassiveCards = [];

let deckInventory = {};

let maxPassiveSlots = 8;
let maxEnergy = 5;

// DOM
let weaponSlot, passiveSlots, deckContainer, display, confirmBtn;

export async function SelectMain() {
  try {
    const response = await fetch('src/ui/SelectMain.html');
    if (!response.ok) throw new Error('加载失败');
    document.body.innerHTML = await response.text();
  } catch (err) {
    console.error(err);
    document.body.innerHTML = '<h1 style="color:red;">加载失败！</h1>';
    return;
  }

  weaponSlot = document.getElementById('weapon-slot');
  passiveSlots = document.querySelectorAll('.passive-slot');
  deckContainer = document.getElementById('deck-container');
  display = {
    weaponName: document.getElementById('weapon-name'),
    atk: document.getElementById('atk'),
    speed: document.getElementById('speed'),
    maxhp: document.getElementById('maxhp'),
    hp: document.getElementById('hp'),
    bomb: document.getElementById('bomb'),
    usedSlots: document.getElementById('used-slots'),
    maxSlots: document.getElementById('max-slots'),
    usedEnergy: document.getElementById('used-energy'),
    maxEnergy: document.getElementById('max-energy'),
    hitRadius: document.getElementById('hit-radius'),
    lives: document.getElementById('lives'),
    power: document.getElementById('power'),
    upgrades: document.getElementById('upgrades')
  };
  confirmBtn = document.getElementById('confirm-btn');

  if (!deckContainer || !weaponSlot || !confirmBtn) {
    console.error('元素没找到！');
    return;
  }

  // Play select music
  musicManager.stop(); // Stop any current music
  musicManager.play('select', true);

  await init();
}

async function init() {
  tempGlobalData = await storage.load_global('global.json', {
    deck: {},
    max_passive_slots: 8,
    max_energy: 5,
    // 可以加其他全局默认，如初始maxhp、bomb、lives等
    base_maxHealth: 100,
    base_bombs: 3,
    base_lives: 2,
    base_power: 250,
    base_maxPower: 400
  });

  deckInventory = { ...tempGlobalData.deck };
  maxPassiveSlots = tempGlobalData.max_passive_slots || 8;
  maxEnergy = tempGlobalData.max_energy || 5;

  // 重置当前选中的卡牌
  currentWeaponCard = null;
  currentPassiveCards = [];

  // 清空现有的卡牌容器
  deckContainer.innerHTML = '';

  for (const id in deckInventory) {
    if (deckInventory[id] > 0) {
      const card = createCardFromId(id);
      if (card) createDeckCardPrototype(card, deckInventory[id]);
    }
  }

  setupDragAndDrop();
  renderSlots(); // 渲染空的槽位
  recalculateParams();

  // 确认出战：生成 playerCur.json（继承global + 计算值）
  confirmBtn.onclick = async () => {
    // 计算选卡后的实际参数
    const computed = { ...tempPlayerDefault };
    computed.upgrades = [];
    if (currentWeaponCard) currentWeaponCard.apply(computed);
    currentPassiveCards.forEach(card => card.apply(computed));

    // 生成 playerCur.json（从global继承基础值 + 计算覆盖）
    const playerCur = {
      health: computed.maxHealth ?? tempGlobalData.base_maxHealth ?? 100,
      maxHealth: computed.maxHealth ?? tempGlobalData.base_maxHealth ?? 100,
      shields: computed.shields ?? 0,
      bombs: computed.bombs ?? tempGlobalData.base_bombs ?? 3,
      lives: computed.lives ?? tempGlobalData.base_lives ?? 2,
      power: computed.power ?? tempGlobalData.base_power ?? 250,
      maxPower: computed.maxPower ?? tempGlobalData.base_maxPower ?? 400,

      hitRadius: computed.hitRadius ?? 0.65,
      hitOffsetY: 0.65,
      grazeRadius: computed.grazeRadius ?? 1.5,

      attackPower: computed.attackPower ?? 28,
      attackSpeed: computed.attackSpeed ?? 0.09,
      bulletType: currentWeaponCard.bulletType || "sakuya_knife",

      position: { x: 0, y: 250, z: 0 },

      upgrades: computed.upgrades || [],  // 临时升级不漏！
      modelPath: tempGlobalData.modelPath,
      modelScale: tempGlobalData.modelScale
    };

    try {
      await storage.save('playerCur.json', playerCur);

      if (currentWeaponCard) {
        tempGlobalData.deck[currentWeaponCard.id] = (tempGlobalData.deck[currentWeaponCard.id] || 0) - 1;
      }
      currentPassiveCards.forEach(card => {
        tempGlobalData.deck[card.id] = (tempGlobalData.deck[card.id] || 0) - 1;
      });
      tempGlobalData.currentStatus = 'battle';

      await storage.save_global('global.json', tempGlobalData);

      // Stop current music before starting battle
      musicManager.stop();
      musicManager.play('battle', true);

      const game = new Battle();
      await game.start('battleCur.json');
    } catch (err) {
      alert('保存失败了～进度可能丢失(>﹏<)');
      console.error(err);
    }
  };
}

// 以下函数完全保持不变（createDeckCardPrototype ~ updateAllDeckCounts）～你的原代码超完美！

function createDeckCardPrototype(card, count) {
  const div = document.createElement('div');
  div.className = `card ${card.type} ${count === 0 ? 'disabled' : ''}`;
  div.draggable = count > 0;
  div.innerHTML = `
    <img src="${card.icon}" alt="${card.name}" class="card-icon">
    <div class="card-name">${card.name}</div>
    <div class="card-description">${card.description}</div>
    <div class="card-count">x${count}</div>
    ${card.energy > 0 ? `<div class="card-energy">所需能量: ${card.energy}</div>` : ''}
  `;
  div.dataset.id = card.id;

  const updateCount = () => {
    const currentCount = deckInventory[card.id] || 0;
    div.querySelector('.card-count').textContent = `x${currentCount}`;
    div.draggable = currentCount > 0;
    div.classList.toggle('disabled', currentCount === 0);
  };

  div.addEventListener('dragstart', e => {
    if (deckInventory[card.id] > 0) {
      e.dataTransfer.setData('cardId', card.id);
      e.dataTransfer.setData('cardType', card.type);
    }
  });

  div.updateCount = updateCount;
  deckContainer.appendChild(div);
}

function getCurrentEnergyCost() {
  let total = 0;
  if (currentWeaponCard) total += currentWeaponCard.energy || 0;
  currentPassiveCards.forEach(c => total += c.energy || 0);
  return total;
}

function setupDragAndDrop() {
  weaponSlot.addEventListener('dragover', e => e.preventDefault());
  passiveSlots.forEach(slot => slot.addEventListener('dragover', e => e.preventDefault()));

  weaponSlot.addEventListener('drop', e => {
    e.preventDefault();
    const id = e.dataTransfer.getData('cardId');
    const type = e.dataTransfer.getData('cardType');
    if (type === 'weapon' && deckInventory[id] > 0) {
      if (currentWeaponCard) {
        deckInventory[currentWeaponCard.id]++;
        updateAllDeckCounts();
      }
      currentWeaponCard = createCardFromId(id);
      deckInventory[id]--;
      updateAllDeckCounts();
      renderSlots();
      recalculateParams();
    }
  });

  passiveSlots.forEach(slot => {
    slot.addEventListener('drop', e => {
      e.preventDefault();
      const id = e.dataTransfer.getData('cardId');
      const type = e.dataTransfer.getData('cardType');
      if (type === 'passive' && deckInventory[id] > 0) {
        const card = createCardFromId(id);
        const newTotalEnergy = getCurrentEnergyCost() + (card.energy || 0);
        if (currentPassiveCards.length < maxPassiveSlots && newTotalEnergy <= maxEnergy) {
          currentPassiveCards.push(card);
          deckInventory[id]--;
          updateAllDeckCounts();
          renderSlots();
          recalculateParams();
        }
      }
    });

    slot.addEventListener('contextmenu', e => {
      e.preventDefault();
      const index = Array.from(passiveSlots).indexOf(slot);
      const removedCard = currentPassiveCards[index];
      if (removedCard) {
        currentPassiveCards.splice(index, 1);
        deckInventory[removedCard.id]++;
        updateAllDeckCounts();
        renderSlots();
        recalculateParams();
      }
    });
  });
}

function renderSlots() {
  weaponSlot.innerHTML = currentWeaponCard 
    ? `<img src="${currentWeaponCard.icon}" alt="${currentWeaponCard.name}" class="slot-icon">
       <div style="font-size:11px;margin-top:4px;">${currentWeaponCard.name}</div>`
    : '武器槽<br>(限1)';

  passiveSlots.forEach((slot, i) => {
    const card = currentPassiveCards[i];
    slot.innerHTML = card 
      ? `<img src="${card.icon}" alt="${card.name}" class="slot-icon">
         <div style="font-size:10px;margin-top:4px;">${card.name}</div>`
      : '';
  });
}

const style = document.createElement('style');
style.textContent = `
  .slot-icon {
    width: 80px;
    height: 80px;
    object-fit: contain;
    border-radius: 10px;
    box-shadow: 0 4px 8px rgba(0,0,0,0.5);
  }
`;
document.head.appendChild(style);

function recalculateParams() {
  const computed = { ...tempPlayerDefault };
  computed.upgrades = [];
  if (currentWeaponCard) currentWeaponCard.apply(computed);
  currentPassiveCards.forEach(card => card.apply(computed));

  display.weaponName.textContent = currentWeaponCard ? currentWeaponCard.name : '无';
  display.atk.textContent = computed.attackPower ?? 28;
  display.speed.textContent = (computed.attackSpeed ?? 0.09).toFixed(3);
  display.maxhp.textContent = computed.maxHealth ?? tempGlobalData.base_maxHealth ?? 100;
  display.hp.textContent = computed.maxHealth ?? tempGlobalData.base_maxHealth ?? 100;  // 当前hp = maxhp
  display.bomb.textContent = computed.bombs ?? tempGlobalData.base_bombs ?? 3;
  display.usedSlots.textContent = currentPassiveCards.length + (currentWeaponCard ? 1 : 0);
  display.usedEnergy.textContent = getCurrentEnergyCost();
  display.maxEnergy.textContent = maxEnergy;
  display.maxSlots.textContent = maxPassiveSlots + 1;
  display.power.textContent = computed.power ?? tempGlobalData.base_power ?? 250;
  display.hitRadius.textContent = computed.hitRadius ?? 0.65;
  display.lives.textContent = computed.lives ?? tempGlobalData.base_lives ?? 2;
  display.upgrades.textContent = computed.upgrades?.length > 0 ? computed.upgrades.join(', ') : '无';
}


function updateAllDeckCounts() {
  document.querySelectorAll('.card').forEach(protoCard => {
    if (protoCard.updateCount) protoCard.updateCount();
  });
}
