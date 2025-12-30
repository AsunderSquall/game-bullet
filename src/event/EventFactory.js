import { slimePitEvent } from './Event1.js';
// 以后加新事件，在这里import并注册就好～超级简单！

const eventRegistry = {
  'slime_pit': slimePitEvent,

};

export class EventFactory {
  static create(eventName) {
    const event = eventRegistry[eventName];
    if (!event) {
      console.error(`未知的事件名称喵～: ${eventName}`);
      return null;
    }
    return event;
  }
}