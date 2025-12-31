import { FairyRed } from './enemies/FairyRed.js';
import { FairyBlue } from './enemies/FairyBlue.js';
import { CircleEnemy } from './enemies/CircleEnemy.js';
import { WaveEnemy } from './enemies/WaveEnemy.js';
import { TrackerEnemy } from './enemies/TrackerEnemy.js';
import { SpiralEnemy } from './enemies/SpiralEnemy.js';
import { GalacticBoss } from './enemies/boss1.js';

const registry = {
  'fairy_red': FairyRed,
  'fairy_blue': FairyBlue,
  'circle_enemy': CircleEnemy,
  'wave_enemy': WaveEnemy,
  'tracker_enemy': TrackerEnemy,
  'spiral_enemy': SpiralEnemy,
  'boss': GalacticBoss
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