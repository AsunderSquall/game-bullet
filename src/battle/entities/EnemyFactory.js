import { FairyRed } from './enemies/FairyRed.js';
import { FairyBlue } from './enemies/FairyBlue.js';

const registry = {
  'fairy_red': FairyRed,
  'fairy_blue': FairyBlue,
};

export class EnemyFactory {
  static create(type, scene, player, enemyBullets, options = {}) {
    const EnemyClass = registry[type.toLowerCase()];
    if (!EnemyClass) {
      console.error(`未知敌人类型: ${type}`);
      return null;
    }
    return new EnemyClass(scene, player, enemyBullets, options);
  }
}