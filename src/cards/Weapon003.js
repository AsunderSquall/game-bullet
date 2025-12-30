import { BaseCard } from './baseCard.js';

export class Weapon003 extends BaseCard {
  constructor() {
    super({
      id: 'weapon003',
      name: '散射飞刀',
      description: '更多数量的散射飞刀',
      type: 'weapon',
      energy: 1,
      rarity: 'rare',
      icon: 'picture/cards/weapon003.png',
    });
  }

  apply(playerData) {
    playerData.power = 400;
    playerData.bulletType = 'sakuya_knife';
    playerData.attackPower = 14;
    playerData.attackSpeed = 0.10;
  }
}