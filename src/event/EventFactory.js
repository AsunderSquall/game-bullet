import { 
  slimePitEvent, 
  beggarElderEvent, 
  cursedChestEvent, 
  forbiddenArmoryEvent, 
  drunkenVeteranEvent,
  fairyGiftEvent
} from './Event1.js';

// 注册表：将字符串 ID 与导入的对象关联起来
const eventRegistry = {
  'slime_pit': slimePitEvent,
  'beggar_elder': beggarElderEvent,
  'cursed_chest': cursedChestEvent,
  'forbidden_armory': forbiddenArmoryEvent,
  'drunken_veteran': drunkenVeteranEvent,
  'fairy_gift': fairyGiftEvent,
};

export class EventFactory {
  /**
   * 根据事件名创建/获取事件
   * @param {string} eventName 
   */
  static create(eventName) {
    const event = eventRegistry[eventName];
    if (!event) {
      console.error(`未知的事件名称: ${eventName}`);
      return null;
    }
    return event;
  }

  static getRandomEventName() {
    const keys = Object.keys(eventRegistry);
    return keys[Math.floor(Math.random() * keys.length)];
  }

  static getAllEvents() {
    return eventRegistry;
  }
}