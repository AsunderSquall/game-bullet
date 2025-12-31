import { BaseCard } from './baseCard.js';

export class Passive003 extends BaseCard {
  constructor() {
    super({
      id: 'passive003',
      name: '吸血',
      description: '增加词条：吸血，杀死敌人的时候回复 5 点生命。',
      type: 'passive',
      energy: 1,
      rarity: 'common',
      icon: 'picture/cards/passive003.png',
    });
  }

  apply(playerData) {
    playerData.upgrades.push("吸血");
  }
}