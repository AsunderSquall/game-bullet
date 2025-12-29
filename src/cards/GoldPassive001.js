import { BaseCard } from './baseCard.js';

export class GoldPassive001 extends BaseCard {
  constructor() {
    super({
      id: 'goldpassive001',
      name: '暴怒',
      description: '攻击力增加 50',
      type: 'passive',
      energy: 1,
      rarity: 'golden',
      icon: 'picture/cards/goldpassive001.png',
    });
  }

  apply(playerData) {
    playerData.attackPower += 50;
  }
}