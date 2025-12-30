// RestMain.js —— 休息界面主逻辑
import { storage } from '../utils/storage.js';

let currentHealth = 60;
let maxHealth = 100;
let healingInterval = null;
const healingRate = 0.5; // 每秒恢复0.5点生命值，大幅减缓回血速度

export async function showRest() {
  const response = await fetch('src/ui/rest.html');
  if (!response.ok) throw new Error('加载休息HTML失败～');
  document.body.innerHTML = await response.text();

  // 加载玩家当前数据
  const playerData = await storage.load_global('global.json');
  currentHealth = playerData.health || 60;
  maxHealth = playerData.max_health || 100;

  // 限制生命值不超过最大值
  if (currentHealth > maxHealth) {
    currentHealth = maxHealth;
  }

  updateHealthDisplay();

  // 开始自动恢复生命值
  startAutoHealing();

  // 继续冒险功能
  document.getElementById('continue-btn').addEventListener('click', async function() {
    // 停止自动恢复
    if (healingInterval) {
      clearInterval(healingInterval);
      healingInterval = null;
    }

    // 保存当前健康状态
    const globalData = await storage.load_global('global.json');
    globalData.health = currentHealth;
    globalData.currentStatus = 'map';
    await storage.save_global('global.json', globalData);

    // 跳转到地图界面
    import('../map/MapMain.js').then(({ showMap }) => {
      showMap();
    }).catch(err => {
      console.error('加载地图界面失败:', err);
    });
  });
}

function startAutoHealing() {
  // 每2秒恢复一定生命值 (由于恢复速度降低，间隔可以相应调整)
  healingInterval = setInterval(() => {
    if (currentHealth < maxHealth) {
      // 恢复生命值
      currentHealth += healingRate;

      // 确保不超过最大生命值
      if (currentHealth > maxHealth) {
        currentHealth = maxHealth;
      }

      updateHealthDisplay();

      // 触发恢复动画，使用CSS动画而不是简单的显示/隐藏
      triggerHealingAnimation();

      // 更新消息
      document.getElementById('message').textContent = `生命值正在缓慢恢复中... (${Math.floor(currentHealth)}/${maxHealth})`;
    } else {
      // 生命值已满，停止恢复
      document.getElementById('message').textContent = `生命值已满！(${maxHealth}/${maxHealth})`;
      if (healingInterval) {
        clearInterval(healingInterval);
        healingInterval = null;
      }
    }
  }, 2000); // 每2秒恢复一次，配合较慢的恢复速度
}

function triggerHealingAnimation() {
  // 创建一个临时的动画元素，避免影响布局
  const animationElement = document.createElement('div');
  animationElement.textContent = '+0.5';
  animationElement.style.position = 'fixed';
  animationElement.style.top = '50%';
  animationElement.style.left = '50%';
  animationElement.style.transform = 'translate(-50%, -50%)';
  animationElement.style.color = '#00ff00';
  animationElement.style.fontSize = '24px';
  animationElement.style.fontWeight = 'bold';
  animationElement.style.pointerEvents = 'none'; // 不影响鼠标事件
  animationElement.style.zIndex = '9999'; // 确保在最顶层
  animationElement.style.opacity = '1';
  animationElement.style.transition = 'opacity 1.5s ease-out';
  animationElement.style.userSelect = 'none'; // 防止选择文本
  animationElement.style.mozUserSelect = 'none';
  animationElement.style.webkitUserSelect = 'none';
  animationElement.style.msUserSelect = 'none';

  document.body.appendChild(animationElement);

  // 触发淡出动画
  setTimeout(() => {
    animationElement.style.opacity = '0';
  }, 100);

  // 移除元素
  setTimeout(() => {
    if (animationElement.parentNode) {
      animationElement.parentNode.removeChild(animationElement);
    }
  }, 1600);
}

function updateHealthDisplay() {
  const healthPercent = (currentHealth / maxHealth) * 100;
  document.getElementById('health-fill').style.width = healthPercent + '%';
  document.getElementById('health-text').textContent = Math.floor(currentHealth) + '/' + maxHealth;
}