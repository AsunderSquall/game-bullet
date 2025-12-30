// src/battle/utils/randomBattleGenerator.js
// 随机关卡生成器

export class RandomBattleGenerator {
  static generateRandomBattle() {
    console.log('生成随机关卡...');
    
    // 定义敌人类型
    const enemyTypes = ['fairy_red', 'fairy_blue', 'circle_enemy', 'tracker_enemy', 'spiral_enemy', 'wave_enemy'];
    
    // 随机决定波次数（2-4波）
    const numWaves = Math.floor(Math.random() * 3) + 2; // 2-4波
    
    // 分配每波的敌人数量（总共6个敌人）
    let enemiesLeft = 6;
    const waveDistribution = [];
    
    // 随机分配每波的敌人数量
    for (let i = 0; i < numWaves - 1; i++) {
      // 每波至少1个敌人，最多剩余数量
      const maxEnemiesForWave = Math.max(1, enemiesLeft - (numWaves - i - 1)); // 确保后续波次至少有1个敌人
      const enemiesInWave = Math.floor(Math.random() * maxEnemiesForWave) + 1;
      waveDistribution.push(enemiesInWave);
      enemiesLeft -= enemiesInWave;
    }
    
    // 最后一波包含剩余的所有敌人
    waveDistribution.push(enemiesLeft);
    
    // 生成波次
    const waves = [];
    for (let waveIdx = 0; waveIdx < numWaves; waveIdx++) {
      const waveTime = (waveIdx + 1) * 6.0; // 每6秒一波
      const waveEnemies = [];
      
      for (let j = 0; j < waveDistribution[waveIdx]; j++) {
        const enemyType = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        const enemy = RandomBattleGenerator.generateRandomEnemy(enemyType);
        waveEnemies.push(enemy);
      }
      
      waves.push({
        time: waveTime,
        enemies: waveEnemies
      });
    }
    
    console.log(`生成了 ${numWaves} 波敌人，总共 6 个敌人`);
    
    return {
      name: "随机生成关卡",
      background: 0x220022,
      waves: waves
    };
  }

  // 生成单个随机敌人
  static generateRandomEnemy(enemyType) {
    // 基础参数配置
    const baseParams = {
      "fairy_red": {
        hp_range: [90, 110],
        shoot_interval_range: [1.8, 2.2],
        bullet_speed_range: [7, 9],
        bullet_count_range: [14, 20]
      },
      "fairy_blue": {
        hp_range: [90, 110],
        shoot_interval_range: [2.3, 2.7],
        bullet_speed_range: [18, 22],
        bullet_count_range: [22, 26]
      },
      "tracker_enemy": {
        hp_range: [45, 55],
        tracking_speed_range: [2.5, 3.5],
        shoot_interval_range: [1.3, 1.7],
        bullet_speed_range: [14, 16],
        bullet_count_range: [1, 1],
        is_rotating_options: [true, false],
        rotation_speed_range: [1.3, 1.7]
      },
      "circle_enemy": {
        hp_range: [70, 90],
        circle_radius_range: [20, 30],
        circle_speed_range: [1.8, 2.2],
        shoot_interval_range: [1.3, 1.7],
        bullet_speed_range: [5, 7],
        bullet_count_range: [7, 9]
      },
      "spiral_enemy": {
        hp_range: [110, 130],
        spiral_radius_range: [10, 14],
        spiral_speed_range: [1.3, 1.7],
        forward_speed_range: [3.5, 4.5],
        shoot_interval_range: [0.9, 1.1],
        bullet_speed_range: [5.5, 6.5],
        bullet_count_range: [18, 22]
      },
      "wave_enemy": {
        hp_range: [55, 65],
        wave_amplitude_range: [9, 11],
        wave_frequency_range: [2.7, 3.3],
        wave_speed_range: [3.5, 4.5],
        forward_speed_range: [5.5, 6.5],
        shoot_interval_range: [1.8, 2.2],
        bullet_speed_range: [6.5, 7.5],
        bullet_count_range: [10, 14]
      }
    };

    const params = baseParams[enemyType];
    const hp = Math.floor(Math.random() * (params.hp_range[1] - params.hp_range[0] + 1)) + params.hp_range[0];
    
    const enemy = {
      type: enemyType,
      position: {
        x: Math.floor(Math.random() * 61) - 30, // -30 to 30
        y: Math.floor(Math.random() * 61) + 70, // 70 to 130
        z: Math.floor(Math.random() * 601) + 200 // 200 to 800
      },
      hp: hp,
      options: {}
    };

    // 根据敌人类型添加特定参数
    if (enemyType === "fairy_red") {
      enemy.options = {
        shootInterval: parseFloat((Math.random() * (params.shoot_interval_range[1] - params.shoot_interval_range[0]) + params.shoot_interval_range[0]).toFixed(2)),
        bulletSpeed: parseFloat((Math.random() * (params.bullet_speed_range[1] - params.bullet_speed_range[0]) + params.bullet_speed_range[0]).toFixed(2)),
        bulletCount: Math.floor(Math.random() * (params.bullet_count_range[1] - params.bullet_count_range[0] + 1)) + params.bullet_count_range[0]
      };
    } else if (enemyType === "fairy_blue") {
      enemy.options = {
        shootInterval: parseFloat((Math.random() * (params.shoot_interval_range[1] - params.shoot_interval_range[0]) + params.shoot_interval_range[0]).toFixed(2)),
        bulletSpeed: parseFloat((Math.random() * (params.bullet_speed_range[1] - params.bullet_speed_range[0]) + params.bullet_speed_range[0]).toFixed(2)),
        bulletCount: Math.floor(Math.random() * (params.bullet_count_range[1] - params.bullet_count_range[0] + 1)) + params.bullet_count_range[0]
      };
    } else if (enemyType === "tracker_enemy") {
      enemy.options = {
        trackingSpeed: parseFloat((Math.random() * (params.tracking_speed_range[1] - params.tracking_speed_range[0]) + params.tracking_speed_range[0]).toFixed(2)),
        shootInterval: parseFloat((Math.random() * (params.shoot_interval_range[1] - params.shoot_interval_range[0]) + params.shoot_interval_range[0]).toFixed(2)),
        bulletSpeed: parseFloat((Math.random() * (params.bullet_speed_range[1] - params.bullet_speed_range[0]) + params.bullet_speed_range[0]).toFixed(2)),
        bulletCount: Math.floor(Math.random() * (params.bullet_count_range[1] - params.bullet_count_range[0] + 1)) + params.bullet_count_range[0],
        isRotating: params.is_rotating_options[Math.floor(Math.random() * params.is_rotating_options.length)]
      };
      if (enemy.options.isRotating) {
        enemy.options.rotationSpeed = parseFloat((Math.random() * (params.rotation_speed_range[1] - params.rotation_speed_range[0]) + params.rotation_speed_range[0]).toFixed(2));
      }
    } else if (enemyType === "circle_enemy") {
      enemy.options = {
        circleRadius: parseFloat((Math.random() * (params.circle_radius_range[1] - params.circle_radius_range[0]) + params.circle_radius_range[0]).toFixed(2)),
        circleSpeed: parseFloat((Math.random() * (params.circle_speed_range[1] - params.circle_speed_range[0]) + params.circle_speed_range[0]).toFixed(2)),
        shootInterval: parseFloat((Math.random() * (params.shoot_interval_range[1] - params.shoot_interval_range[0]) + params.shoot_interval_range[0]).toFixed(2)),
        bulletSpeed: parseFloat((Math.random() * (params.bullet_speed_range[1] - params.bullet_speed_range[0]) + params.bullet_speed_range[0]).toFixed(2)),
        bulletCount: Math.floor(Math.random() * (params.bullet_count_range[1] - params.bullet_count_range[0] + 1)) + params.bullet_count_range[0]
      };
    } else if (enemyType === "spiral_enemy") {
      enemy.options = {
        spiralRadius: parseFloat((Math.random() * (params.spiral_radius_range[1] - params.spiral_radius_range[0]) + params.spiral_radius_range[0]).toFixed(2)),
        spiralSpeed: parseFloat((Math.random() * (params.spiral_speed_range[1] - params.spiral_speed_range[0]) + params.spiral_speed_range[0]).toFixed(2)),
        forwardSpeed: parseFloat((Math.random() * (params.forward_speed_range[1] - params.forward_speed_range[0]) + params.forward_speed_range[0]).toFixed(2)),
        shootInterval: parseFloat((Math.random() * (params.shoot_interval_range[1] - params.shoot_interval_range[0]) + params.shoot_interval_range[0]).toFixed(2)),
        bulletSpeed: parseFloat((Math.random() * (params.bullet_speed_range[1] - params.bullet_speed_range[0]) + params.bullet_speed_range[0]).toFixed(2)),
        bulletCount: Math.floor(Math.random() * (params.bullet_count_range[1] - params.bullet_count_range[0] + 1)) + params.bullet_count_range[0]
      };
    } else if (enemyType === "wave_enemy") {
      enemy.options = {
        waveAmplitude: parseFloat((Math.random() * (params.wave_amplitude_range[1] - params.wave_amplitude_range[0]) + params.wave_amplitude_range[0]).toFixed(2)),
        waveFrequency: parseFloat((Math.random() * (params.wave_frequency_range[1] - params.wave_frequency_range[0]) + params.wave_frequency_range[0]).toFixed(2)),
        waveSpeed: parseFloat((Math.random() * (params.wave_speed_range[1] - params.wave_speed_range[0]) + params.wave_speed_range[0]).toFixed(2)),
        forwardSpeed: parseFloat((Math.random() * (params.forward_speed_range[1] - params.forward_speed_range[0]) + params.forward_speed_range[0]).toFixed(2)),
        shootInterval: parseFloat((Math.random() * (params.shoot_interval_range[1] - params.shoot_interval_range[0]) + params.shoot_interval_range[0]).toFixed(2)),
        bulletSpeed: parseFloat((Math.random() * (params.bullet_speed_range[1] - params.bullet_speed_range[0]) + params.bullet_speed_range[0]).toFixed(2)),
        bulletCount: Math.floor(Math.random() * (params.bullet_count_range[1] - params.bullet_count_range[0] + 1)) + params.bullet_count_range[0]
      };
    }

    return enemy;
  }
}