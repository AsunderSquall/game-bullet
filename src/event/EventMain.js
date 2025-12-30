// src/ui/EventMain.js
import { storage } from '../utils/storage.js';
import { EventFactory } from './EventFactory.js';

let currentEvent = null;
let tempGlobalData = null;

let backgroundImg, descriptionDiv, choicesContainer;

export async function EventMain() {
  // 并行加载配置和全局数据，更快更高效～
  const [eventConfig, globalData] = await Promise.all([
    storage.load('eventCur.json', { name: 'slime_pit' }),
    storage.load_global('global.json')
  ]);

  tempGlobalData = globalData;

  const name = eventConfig.name || 'slime_pit';

  // 加载事件专用HTML模板
  const response = await fetch('src/ui/event.html');
  if (!response.ok) throw new Error('加载事件HTML失败');
  const htmlContent = await response.text();

  // 完全替换页面内容
  document.open();
  document.write(htmlContent);
  document.close();

  // 【关键修复】直接在这里初始化，不用等 window.onload！
  // 因为 document.close() 后新页面已经解析完毕，可以安全访问DOM了～
  backgroundImg = document.getElementById('event-background');
  descriptionDiv = document.getElementById('event-description');
  choicesContainer = document.getElementById('event-choices');

  if (!backgroundImg || !descriptionDiv || !choicesContainer) {
    console.error('事件页面缺少必要元素！请检查 event.html');
    return;
  }

  // 创建事件实例
  currentEvent = EventFactory.create(name);
  if (!currentEvent) {
    alert(`找不到事件 "${name}" 喵～要检查 eventCur.json 哦！`);
    return;
  }

  // 设置背景回调
  currentEvent.onBackgroundChange = (url) => {
    if (url && backgroundImg) {
      backgroundImg.src = url;
      backgroundImg.style.display = 'block';
    } else if (backgroundImg) {
      backgroundImg.style.display = 'none';
    }
  };

  // 设置描述回调
  currentEvent.onDescriptionChange = (text) => {
    if (descriptionDiv) descriptionDiv.textContent = text;
  };

  // 设置选项回调 —— 【关键修复】使用事件委托，完美解决 document.write 后 onclick 失效问题！
  currentEvent.onChoicesChange = (choiceTexts) => {
    if (!choicesContainer) return;
    choicesContainer.innerHTML = ''; // 清空旧按钮

    if (!choicesContainer.dataset.choiceDelegated) {
      choicesContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('button.choice-btn');
        if (!btn) return;

        const buttons = choicesContainer.querySelectorAll('button.choice-btn');
        const index = Array.from(buttons).indexOf(btn);

        if (index !== -1) {
          selectChoice(index);
        }
      });
      choicesContainer.dataset.choiceDelegated = 'true';
    }

    // 创建新按钮（不再需要单独绑定 onclick）
    choiceTexts.forEach((text) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = text;
      choicesContainer.appendChild(btn);
    });
  };

  currentEvent.onEventEnd = async () => {
    
    tempGlobalData = await storage.load_global('global.json');
    tempGlobalData.currentStatus = 'map';
    await storage.save_global('global.json', tempGlobalData);

    // 动态导入地图模块并显示
    import('../map/MapMain.js')
      .then(({ showMap }) => showMap())
      .catch(err => console.error('返回地图失败', err));
  };

  // 正式启动事件！
  await currentEvent.start();
}

// 选择选项函数
async function selectChoice(index) {
  console.log("selectChoice triggered! 选中了选项:", index); // 你会看到这行打印啦～✨

  if (!currentEvent || !currentEvent.isRunning) return;

  const buttons = choicesContainer.querySelectorAll('button.choice-btn');
  buttons.forEach(btn => {
    btn.disabled = true;
    btn.style.opacity = '0.6'; // 可选：视觉反馈
  });
  console.log("start selectChoice inside");
  await currentEvent.selectChoice(index);
}