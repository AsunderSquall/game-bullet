import { BaseCard } from './baseCard.js';

export class Passive008 extends BaseCard {
  constructor() {
    super({
      id: 'passive008',
      name: '再生',
      description: '血量再生0.5/s',
      type: 'passive',
      energy: 1,
      rarity: 'common',
      icon: 'picture/cards/passive008.png',
    });
  }

  apply(playerData) {
    playerData.regenerateInterval = Math.min(playerData.regenerateInterval, 2.0);
  }
}