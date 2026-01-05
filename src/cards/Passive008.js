import { BaseCard } from './baseCard.js';

export class Passive008 extends BaseCard {
  constructor() {
    super({
      id: 'passive008',
      name: '再生',
      description: '血量再生0.5/s',
      type: 'passive',
      energy: 1,
      rarity: 'common',
      icon: 'picture/cards/passive008.png',
    });
  }

  apply(playerData) {
    // 如果当前没有激活再生（值为负数），则设置为2.0秒一次
    // 如果已经激活再生（值为正数），则进一步缩短间隔
    if (playerData.regenerateInterval < 0) {
      playerData.regenerateInterval = 2.0; // 2秒一次
    } else {
      playerData.regenerateInterval = Math.min(playerData.regenerateInterval, 2.0); // 进一步缩短
    }
  }
}