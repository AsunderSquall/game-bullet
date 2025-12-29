// hud.js —— 终极实时版
const container = document.createElement('div');


const hpText = document.createElement('div');
const shieldText = document.createElement('div');
const bombText = document.createElement('div');
container.appendChild(hpText);
container.appendChild(shieldText);
container.appendChild(bombText);
document.body.appendChild(container);

// 直接接收 player 实例！
export function updateHUD(player) {
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