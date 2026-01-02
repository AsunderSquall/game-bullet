// hud.js —— 终极实时版

// 添加CSS样式
const style = document.createElement('style');
style.textContent = `
  #hud-container {
    position: fixed;
    top: 20px;
    left: 20px;
    z-index: 10000; /* 确保HUD在最顶层 */
    font-family: 'Courier New', monospace;
    font-size: 20px;
    color: white;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.8);
    background-color: rgba(0, 0, 0, 0.5);
    padding: 15px;
    border-radius: 10px;
    border: 2px solid rgba(255, 255, 255, 0.3);
  }

  #hud-container div {
    margin: 5px 0;
  }
`;
document.head.appendChild(style);

// 确保HUD元素在需要时被创建
function ensureHUDExists() {
  let container = document.getElementById('hud-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'hud-container';

    const hpText = document.createElement('div');
    hpText.id = 'hud-hp';
    const shieldText = document.createElement('div');
    shieldText.id = 'hud-shield';
    const bombText = document.createElement('div');
    bombText.id = 'hud-bomb';

    container.appendChild(hpText);
    container.appendChild(shieldText);
    container.appendChild(bombText);

    document.body.appendChild(container);
  }

  return {
    hpText: document.getElementById('hud-hp'),
    shieldText: document.getElementById('hud-shield'),
    bombText: document.getElementById('hud-bomb')
  };
}

export function updateHUD(player) {
  const { hpText, shieldText, bombText } = ensureHUDExists();

  if (!player || !player.data) {
    hpText.textContent = 'Loading...';
    return;
  }

  const d = player.data;

  hpText.textContent = `♥ ${Math.floor(player.health)} / ${d.maxHealth}`;

  shieldText.textContent = `◆ ${d.shields || 0}`;
  shieldText.style.color = (d.shields > 0) ? '#44ffff' : '#666666';

  bombText.textContent = `☼ ${d.bombs || 0}`;
  bombText.style.color = (d.bombs > 0) ? '#ffff44' : '#666666';

  if (d.health < d.maxHealth * 0.3) {
    hpText.style.color = '#ff4444';
    hpText.style.textShadow = '0 0 10px #ff0000';
  } else {
    hpText.style.color = 'white';
    hpText.style.textShadow = '2px 2px 4px rgba(0,0,0,0.8)';
  }
}

