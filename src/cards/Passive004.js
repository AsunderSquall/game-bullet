import { BaseCard } from './baseCard.js';

export class Passive004 extends BaseCard {
  constructor() {
    super({
      id: 'passive004',
      name: '穿甲',
      description: '增加词条：穿甲',
      type: 'passive',
      energy: 1,
      rarity: 'common',
      icon: 'picture/cards/passive004.png',
    });
  }

  apply(playerData) {
    playerData.upgrades.push("穿甲");
  }
}