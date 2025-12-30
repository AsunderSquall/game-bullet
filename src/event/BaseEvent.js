import { storage } from '../utils/storage.js';

export class SingleLayerEvent {
  constructor({
    description = '',           // 事件描述文字
    background = null,          // 可选背景图
    choices = []                // 选项数组：[{ text: '选项文字', effect: (globalData) => {} }]
  } = {}) {
    this.description = description;
    this.background = background;
    this.choices = choices;     // 每个choice都有自己的effect，执行完就结束
  }

  // 开始事件（直接显示描述和选项）
  async start() {
    const globalData = await storage.load_global('global.json');

    // 通知UI
    if (this.background) this.onBackgroundChange?.(this.background);
    this.onDescriptionChange?.(this.description);
    this.onChoicesChange?.(this.choices.map(c => c.text));  // 只传文字给UI

    this.globalData = globalData;
    this.isRunning = true;
  }

  async selectChoice(choiceIndex) {
    if (!this.isRunning || choiceIndex < 0 || choiceIndex >= this.choices.length) {
      console.warn('无效的选择喵~');
      return;
    }

    const selected = this.choices[choiceIndex];

    if (selected.effect) {
      selected.effect(this.globalData);
    }

    await storage.save_global('global.json', this.globalData);
    this.isRunning = false;
    this.onEventEnd?.();
    console.log('单层事件结束，global.json已保存～');
  }

  // ======== UI回调钩子 ========
  onBackgroundChange = null;   // (url) => {}
  onDescriptionChange = null;  // (text) => {}
  onChoicesChange = null;      // (['选项1', '选项2', ...]) => {}
  onEventEnd = null;           // () => {}
}