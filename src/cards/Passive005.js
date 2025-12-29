import { BaseCard } from './baseCard.js';

export class Passive005 extends BaseCard {
  constructor() {
    super({
      id: 'passive005',
      name: '穿透',
      description: '增加词条：穿透',
      type: 'passive',
      energy: 1,
      rarity: 'common',
      icon: 'picture/cards/passive005.png',
    });
  }

  apply(playerData) {
    playerData.upgrades.push("穿透");
  }
}