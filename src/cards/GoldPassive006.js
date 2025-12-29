import { BaseCard } from './baseCard.js';

export class GoldPassive006 extends BaseCard {
  constructor() {
    super({
      id: 'goldpassive006',
      name: '护甲',
      description: '护甲增加50',
      type: 'passive',
      energy: 1,
      rarity: 'golden',
      icon: 'picture/cards/goldpassive006.png',
    });
  }

  apply(playerData) {
    playerData.shields += 50;
  }
}