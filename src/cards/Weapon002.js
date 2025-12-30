import { BaseCard } from './baseCard.js';

export class Weapon002 extends BaseCard {
  constructor() {
    super({
      id: 'weapon002',
      name: '追踪飞刀',
      bulletType: 'homeing_knife',
      description: '子弹会在一定程度上自动追踪最近的敌人',
      type: 'weapon',
      energy: 2,
      rarity: 'rare',
      icon: 'picture/cards/weapon002.png',
    });
  }

  apply(playerData) {
    playerData.power = 0;
    playerData.bulletType = 'homeing_knife';
    playerData.attackPower = 20;
    playerData.attackSpeed = 0.12;
  }
}