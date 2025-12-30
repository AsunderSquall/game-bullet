import { BaseCard } from './baseCard.js';

export class Passive007 extends BaseCard {
  constructor() {
    super({
      id: 'passive007',
      name: '连击',
      description: '攻击间隔减少 0.01s',
      type: 'passive',
      energy: 1,
      rarity: 'common',
      icon: 'picture/cards/passive007.png',
    });
  }

  apply(playerData) {
    playerData.attackSpeed -= 0.01;
  }
}