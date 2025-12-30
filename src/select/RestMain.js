// RestMain.js —— 休息界面主逻辑
import { storage } from '../utils/storage.js';

let currentHealth = 60;
let maxHealth = 100;
let healingInterval = null;
const healingRate = 2; // 每秒恢复2点生命值

export async function showRest() {
  const response = await fetch('src/ui/rest.html');
  if (!response.ok) throw new Error('加载休息HTML失败～');
  document.body.innerHTML = await response.text();

  // 加载全局数据
  const globalData = await storage.load_global('global.json');
  currentHealth = globalData.health || 60;
  maxHealth = globalData.max_health || 100;

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
  // 每秒恢复一定生命值
  healingInterval = setInterval(() => {
    if (currentHealth < maxHealth) {
      // 恢复生命值
      currentHealth += healingRate;

      // 确保不超过最大生命值
      if (currentHealth > maxHealth) {
        currentHealth = maxHealth;
      }

      updateHealthDisplay();

      // 显示恢复动画
      document.getElementById('healing-animation').style.display = 'block';
      setTimeout(() => {
        document.getElementById('healing-animation').style.display = 'none';
      }, 500);

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
  }, 1000); // 每秒恢复一次
}

function updateHealthDisplay() {
  const healthPercent = (currentHealth / maxHealth) * 100;
  document.getElementById('health-fill').style.width = healthPercent + '%';
  document.getElementById('health-text').textContent = Math.floor(currentHealth) + '/' + maxHealth;
}