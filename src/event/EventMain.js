// src/events/EventMain.js
import { storage } from '../utils/storage.js';
import { EventFactory } from './EventFactory.js';

export class EventMain {
  constructor() {
    this.eventElement = null;
    this.descriptionElement = null;
    this.choicesContainer = null;
    this.isHTMLLoaded = false;

    // 一启动就加载HTML
    this.loadEventHTML();
  }

  async loadEventHTML() {
    if (this.isHTMLLoaded) return;

    try {
      const response = await fetch('src/ui/Event.html');  // 注意路径！根据你的项目结构改
      // 如果放在 public/ui/ 下，可能要写 '/ui/Event.html'
      if (!response.ok) throw new Error('加载失败');

      const htmlText = await response.text();
      document.body.insertAdjacentHTML('beforeend', htmlText);

      // 加载完成后获取元素
      this.eventElement = document.getElementById('event-container');
      this.descriptionElement = document.getElementById('event-description');
      this.choicesContainer = document.getElementById('event-choices');

      this.isHTMLLoaded = true;
      console.log('事件HTML加载成功喵～');
    } catch (err) {
      console.error('加载Event.html失败了喵！', err);
      alert('事件界面加载失败，请检查Event.html路径');
    }
  }

  async startEvent() {
    // 确保HTML已加载
    if (!this.isHTMLLoaded) {
      await this.loadEventHTML();
      // 如果还是没加载好，就不继续
      if (!this.eventElement) return;
    }

    const eventData = await storage.load('eventCur.json', { name: null });
    if (!eventData.name) {
      console.warn('eventCur.json 里没有事件名称哦～');
      return;
    }


    this.currentEvent = EventFactory.create(eventData.name);
    if (!this.currentEvent) return;

    // 绑定UI回调
    this.currentEvent.onDescriptionChange = (text) => {
      if (this.descriptionElement) {
        this.descriptionElement.innerText = text.replace(/\\\\/g, '\n');
      }
    };

    this.currentEvent.onBackgroundChange = (url) => {
      if (this.eventElement) {
        this.eventElement.style.backgroundImage = `url(${url})`;
      }
    };

    this.currentEvent.onChoicesChange = (choiceTexts) => {
      if (!this.choicesContainer) return;
      this.choicesContainer.innerHTML = '';

      choiceTexts.forEach((text, index) => {
        const button = document.createElement('button');
        button.className = 'event-choice-btn';
        button.innerText = text;
        button.onclick = () => this.currentEvent.selectChoice(index);
        this.choicesContainer.appendChild(button);
      });
    };

    this.currentEvent.onEventEnd = () => {
      this.hideEvent();
    };

    // 显示 + 开始事件
    this.showEvent();
    await this.currentEvent.start();
  }

  showEvent() {
    if (this.eventElement) {
      this.eventElement.style.display = 'flex';
    }
  }

  hideEvent() {
    if (this.eventElement) {
      this.eventElement.style.display = 'none';
      this.eventElement.style.backgroundImage = '';
      if (this.descriptionElement) this.descriptionElement.innerText = '';
      if (this.choicesContainer) this.choicesContainer.innerHTML = '';
    }
  }
}

export const eventMain = new EventMain();