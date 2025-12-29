import { BaseCard } from './baseCard.js';

export class Passive001 extends BaseCard {
  constructor() {
    super({
      id: 'passive001',
      name: '狂怒',
      description: '攻击力增加 10',
      type: 'passive',
      energy: 1,
      rarity: 'common',
      icon: 'picture/cards/passive001.png',
    });
  }

  apply(playerData) {
    playerData.attackPower += 10;
  }
}