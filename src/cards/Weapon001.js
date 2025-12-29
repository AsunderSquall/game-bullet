import { BaseCard } from './baseCard.js';

export class Weapon001 extends BaseCard {
  constructor() {
    super({
      id: 'weapon001',
      name: '普通飞刀',
      bulletType: '',
      description: '高速直线飞刀，射速快、伤害稳定',
      type: 'weapon',
      energy: 1,
      rarity: 'common',
      icon: 'picture/cards/weapon001.png',
    });
  }

  apply(playerData) {
    playerData.bulletType = 'sakuya_knife';
    playerData.attackPower = 28;
    playerData.attackSpeed = 0.09;
  }
}