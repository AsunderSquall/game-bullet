// hud.js —— 终极实时版

// 添加CSS样式
const style = document.createElement('style');
style.textContent = `
  #hud-container {
    position: fixed;
    top: 20px;
    left: 20px;
    z-index: 10000; /* 确保HUD在最顶层 */
    font-family: 'Orbitron', 'Courier New', monospace;
    font-size: 22px;
    color: #e6f7ff;
    text-shadow:
      0 0 5px #00bfff,
      0 0 10px #0066cc,
      0 0 15px #003399;
    background: linear-gradient(145deg, rgba(0, 20, 40, 0.8), rgba(0, 40, 80, 0.6));
    padding: 20px;
    border-radius: 15px;
    border: 2px solid rgba(0, 200, 255, 0.6);
    box-shadow:
      0 0 20px rgba(0, 150, 255, 0.5),
      inset 0 0 15px rgba(0, 100, 255, 0.3);
    backdrop-filter: blur(5px);
    min-width: 200px;
  }

  #hud-container div {
    margin: 10px 0;
    display: flex;
    align-items: center;
    padding: 5px 0;
  }

  .hud-icon {
    display: inline-block;
    width: 30px;
    height: 30px;
    margin-right: 10px;
    vertical-align: middle;
  }

  .heart-icon {
    background: radial-gradient(circle at 30% 30%, #ff3333, #cc0000);
    clip-path: path('M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z');
  }

  .shield-icon {
    background:
      linear-gradient(135deg, #44ffff 0%, #00aaff 100%);
    clip-path: polygon(50% 0%, 100% 10%, 100% 60%, 75% 100%, 25% 100%, 0% 60%, 0% 10%);
    position: relative;
  }

  .shield-icon::before {
    content: '';
    position: absolute;
    top: 40%;
    left: 50%;
    transform: translateX(-50%);
    width: 50%;
    height: 40%;
    background: rgba(255, 255, 255, 0.3);
    border-radius: 50%;
  }

  .bomb-icon {
    background:
      radial-gradient(ellipse at center, #6b8e23 0%, #556b2f 70%, #3d5229 100%); /* 军绿色手榴弹 */
    border-radius: 50% 50% 40% 40% / 60% 60% 40% 40%;
    position: relative;
  }

  .bomb-icon::before {
    content: '';
    position: absolute;
    top: -15%;
    left: 50%;
    transform: translateX(-50%);
    width: 12%;
    height: 25%;
    background: #8B4513; /* 棕色引线 */
    border-radius: 50% 50% 0 0;
  }

  .bomb-icon::after {
    content: '';
    position: absolute;
    top: -10%;
    left: 55%;
    width: 3px;
    height: 3px;
    background: #FFD700; /* 金色火花 */
    border-radius: 50%;
    box-shadow: 0 0 3px #FFA500;
  }

  .hud-value {
    flex: 1;
    text-align: right;
    font-weight: bold;
  }

  .health-bar-container {
    width: 100%;
    height: 12px;
    background: rgba(100, 0, 0, 0.5);
    border-radius: 6px;
    margin-top: 5px;
    overflow: hidden;
    border: 1px solid rgba(255, 255, 255, 0.2);
  }

  .health-bar {
    height: 100%;
    background: linear-gradient(90deg, #ff3300, #ff9900);
    border-radius: 6px;
    transition: width 0.3s ease;
  }

  #boss-hud-container {
    position: fixed;
    top: 60px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 9999;
    width: 50vw; /* 宽度为屏幕的一半 */
    font-family: 'Arial', sans-serif;
    text-align: center;
    display: none; /* 默认隐藏，只在有boss时显示 */
  }

  #boss-name {
    color: #ff6666;
    font-size: 20px;
    font-weight: bold;
    margin-bottom: 8px;
    text-shadow: 0 0 5px rgba(255, 0, 0, 0.7);
    letter-spacing: 1px;
  }

  .boss-health-bar-container {
    width: 100%;
    height: 12px; /* 更细的高度 */
    background: rgba(0, 0, 0, 0.5);
    border: 1px solid #ff3333;
    border-radius: 6px; /* 更小的圆角 */
    overflow: hidden;
    position: relative;
  }

  .boss-health-bar {
    height: 100%;
    background: linear-gradient(90deg, #ff3333, #ff6600);
    border-radius: 5px;
    transition: width 0.3s ease;
    position: relative;
  }

  .boss-health-bar::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: linear-gradient(
      90deg,
      transparent,
      rgba(255, 255, 255, 0.3),
      transparent
    );
    animation: boss-shine 2s infinite;
  }

  @keyframes boss-shine {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
`;
document.head.appendChild(style);

// 确保HUD元素在需要时被创建
function ensureHUDExists() {
  let container = document.getElementById('hud-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'hud-container';

    // 创建生命值显示
    const hpContainer = document.createElement('div');
    hpContainer.innerHTML = `
      <span class="hud-icon heart-icon"></span>
      <span id="hud-hp-value" class="hud-value">0 / 0</span>
    `;
    container.appendChild(hpContainer);

    // 添加生命值进度条
    const healthBarContainer = document.createElement('div');
    healthBarContainer.className = 'health-bar-container';
    const healthBar = document.createElement('div');
    healthBar.className = 'health-bar';
    healthBarContainer.appendChild(healthBar);
    container.appendChild(healthBarContainer);

    // 创建护盾显示
    const shieldContainer = document.createElement('div');
    shieldContainer.innerHTML = `
      <span class="hud-icon shield-icon"></span>
      <span id="hud-shield-value" class="hud-value">0</span>
    `;
    container.appendChild(shieldContainer);

    // 创建符卡显示
    const bombContainer = document.createElement('div');
    bombContainer.innerHTML = `
      <span class="hud-icon bomb-icon"></span>
      <span id="hud-bomb-value" class="hud-value">0</span>
    `;
    container.appendChild(bombContainer);

    document.body.appendChild(container);
  }

  // 创建boss血量条容器（如果不存在）
  let bossContainer = document.getElementById('boss-hud-container');
  if (!bossContainer) {
    bossContainer = document.createElement('div');
    bossContainer.id = 'boss-hud-container';
    bossContainer.innerHTML = `
      <div id="boss-name">BOSS NAME</div>
      <div class="boss-health-bar-container">
        <div class="boss-health-bar" style="width: 100%"></div>
      </div>
    `;
    document.body.appendChild(bossContainer);
  }

  return {
    hpValue: document.getElementById('hud-hp-value'),
    shieldValue: document.getElementById('hud-shield-value'),
    bombValue: document.getElementById('hud-bomb-value'),
    healthBar: container.querySelector('.health-bar'),
    bossContainer: document.getElementById('boss-hud-container'),
    bossName: document.getElementById('boss-name'),
    bossHealthBar: bossContainer.querySelector('.boss-health-bar')
  };
}

export function updateHUD(player, boss = null) {
  const { hpValue, shieldValue, bombValue, healthBar, bossContainer, bossName, bossHealthBar } = ensureHUDExists();

  if (!player || !player.data) {
    hpValue.textContent = 'Loading...';
    return;
  }

  const d = player.data;
  const currentHealth = Math.floor(player.health);
  const maxHealth = d.maxHealth;
  const healthPercent = maxHealth > 0 ? (currentHealth / maxHealth) * 100 : 0;

  hpValue.textContent = `${currentHealth} / ${maxHealth}`;

  // 更新生命值进度条
  if (healthBar) {
    healthBar.style.width = `${healthPercent}%`;

    // 根据生命值百分比改变进度条颜色
    if (healthPercent > 70) {
      healthBar.style.background = 'linear-gradient(90deg, #00cc66, #00ff88)';
    } else if (healthPercent > 30) {
      healthBar.style.background = 'linear-gradient(90deg, #ffcc00, #ff9900)';
    } else {
      healthBar.style.background = 'linear-gradient(90deg, #ff3300, #ff6600)';
    }
  }

  shieldValue.textContent = `${d.shields || 0}`;
  shieldValue.style.color = (d.shields > 0) ? '#44ffff' : '#666666';

  bombValue.textContent = `${d.bombs || 0}`;
  bombValue.style.color = (d.bombs > 0) ? '#ffff44' : '#666666';

  // 根据生命值改变颜色和发光效果
  if (currentHealth < maxHealth * 0.3) {
    hpValue.style.color = '#ff6666';
    hpValue.style.textShadow = '0 0 8px #ff0000, 0 0 15px #ff3300';
  } else if (currentHealth < maxHealth * 0.6) {
    hpValue.style.color = '#ffff66';
    hpValue.style.textShadow = '0 0 5px #ffcc00, 0 0 10px #ff9900';
  } else {
    hpValue.style.color = '#66ff99';
    hpValue.style.textShadow = '0 0 5px #00cc66, 0 0 10px #00ff88';
  }

  // 更新boss血量条
  if (boss && bossContainer) {
    bossContainer.style.display = 'block'; // 显示boss血量条

    // 更新boss名称（如果提供了名称）
    if (boss.name) {
      bossName.textContent = boss.name;
    } else if (boss.constructor && boss.constructor.name) {
      bossName.textContent = boss.constructor.name.toUpperCase();
    }

    // 计算boss血量百分比
    let bossHealthPercent = 100;
    if (boss.maxHealth && boss.maxHealth > 0) {
      const currentBossHealth = boss.health || 0;
      bossHealthPercent = Math.max(0, (currentBossHealth / boss.maxHealth) * 100);
    }

    // 更新boss血量条
    if (bossHealthBar) {
      bossHealthBar.style.width = `${bossHealthPercent}%`;
    }
  } else {
    // 如果没有boss，隐藏boss血量条
    if (bossContainer) {
      bossContainer.style.display = 'none';
    }
  }
}

