import { BaseCard } from './baseCard.js';

export class Passive006 extends BaseCard {
  constructor() {
    super({
      id: 'passive006',
      name: '护甲',
      description: '护甲增加10',
      type: 'passive',
      energy: 1,
      rarity: 'common',
      icon: 'picture/cards/passive006.png',
    });
  }

  apply(playerData) {
    playerData.shields += 10;
  }
}