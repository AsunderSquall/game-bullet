import { SingleLayerEvent } from './BaseEvent.js';

export const slimePitEvent = new SingleLayerEvent({
  description: `你掉进了一个水坑里。\n
可是坑里全是史莱姆黏液！\n
你感觉到这黏液似乎会灼伤你，便拼命想要从坑中脱身。\n
你的耳朵、鼻子和全身都被黏液给浸透了。\n
爬出来后，你发现自己的金币似乎变少了。你回头一看，发现水坑里不但有你掉落的钱，还有不少其他不幸的冒险者们落下的金币。`,
  background: 'picture/events/Event1.webp',
  choices: [
    {
      text: '收集金币（获得75金币，失去11生命）',
      effect: (data) => {
        data.money += 75;
        data.health = Math.max(0, data.health - 11);
      }
    },
    {
      text: '放手吧（失去20~50金币）',
      effect: (data) => {
        const loss = Math.floor(Math.random() * 31) + 20;
        data.money = Math.max(0, data.money - loss);
      }
    }
  ]
});