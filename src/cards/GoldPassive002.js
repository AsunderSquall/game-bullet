import { BaseCard } from './baseCard.js';

export class GoldPassive002 extends BaseCard {
  constructor() {
    super({
      id: 'goldpassive002',
      name: '闪电博尔特',
      description: '碰撞球大小缩小 0.35',
      type: 'passive',
      energy: 1,
      rarity: 'golden',
      icon: 'picture/cards/goldpassive002.png',
    });
  }

  apply(playerData) {
    playerData.hitRadius -= 0.25;
  }
}