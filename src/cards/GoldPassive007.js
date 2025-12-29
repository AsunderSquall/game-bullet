import { BaseCard } from './baseCard.js';

export class GoldPassive007 extends BaseCard {
  constructor() {
    super({
      id: 'goldpassive007',
      name: '不死图腾',
      description: '抵挡一次死亡，并回满血',
      type: 'passive',
      energy: 1,
      rarity: 'golden',
      icon: 'picture/cards/goldpassive007.png',
    });
  }

  apply(playerData) {
    playerData.totem += 1;
  }
}