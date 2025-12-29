// src/cards/CardFactory.js
import { Weapon001 } from './Weapon001.js';
import { Weapon002 } from './Weapon002.js';
import { Weapon003 } from './Weapon003.js';
import { Passive001 } from './Passive001.js';
import { Passive002 } from './Passive002.js';
import { Passive003 } from './Passive003.js';
import { Passive004 } from './Passive004.js';
import { Passive005 } from './Passive005.js';

const registry = {
  'weapon001': Weapon001,
  'weapon002': Weapon002,
  'weapon003': Weapon003,
  'passive001': Passive001,
  'passive002': Passive002,
  'passive003': Passive003,
  'passive004': Passive004,
  'passive005': Passive005,
};

export function createCardFromId(id) {
  const CardClass = registry[id];
  if (!CardClass) {
    console.warn(`未知卡牌 ID: ${id}，已忽略`);
    return null;
  }
  return new CardClass(); // 直接 new 一个新实例
}