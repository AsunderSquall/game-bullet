import { BaseCard } from './baseCard.js';

export class Passive002 extends BaseCard {
  constructor() {
    super({
      id: 'passive002',
      name: '敏捷',
      description: '碰撞球大小缩小 0.05',
      type: 'passive',
      energy: 1,
      rarity: 'common',
      icon: 'picture/cards/passive002.png',
    });
  }

  apply(playerData) {
    playerData.hitRadius -= 0.05;
  }
}