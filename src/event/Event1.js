import { SingleLayerEvent } from './BaseEvent.js';
import { Info } from '../ui/info.js'; // 确保路径指向你存放 info.js 的位置

export const slimePitEvent = new SingleLayerEvent({
  description: `你掉进了一个水坑里。\n
可是坑里全是史莱姆黏液！\n
你感觉到这黏液似乎会灼伤你，便拼命想要从坑中脱身。\n
你的耳朵、鼻子和全身都被黏液给浸透了。\n
爬出来后，你发现自己的金币似乎变少了。你回头一看，发现水坑里不但有你掉落的钱，还有不少其他不幸的冒险者们落下的金币。`,
  background: 'picture/events/Event1.webp',
  choices: [
    {
      text: '收集金币（获得75金币，失去 15 生命）',
      effect: async (data) => { // 改为 async
        data.money += 75;
        data.health = Math.max(0, data.health - 15);
        // 如果这里也想弹窗可以加：await Info.alert("你忍痛捞起了金币...");
      }
    },
    {
      text: '放手吧（失去20~50金币）',
      effect: async (data) => {
        const loss = Math.floor(Math.random() * 31) + 20;
        data.money = Math.max(0, data.money - loss);
      }
    }
  ]
});

export const beggarElderEvent = new SingleLayerEvent({
  description: `路边坐着一个衣衫褴褛的老人，他颤巍巍地伸出手。\n
「好心的冒险者，能否施舍 50 金币？老朽已饥肠辘辘。」\n
他的眼神深邃，似乎隐藏着什么秘密。\n
你犹豫了片刻……`,
  background: 'picture/events/beggar_elder.webp',
  choices: [
    {
      text: '施舍 50 金币',
      effect: async (data) => {
        if (data.money >= 50) {
          data.money -= 50; // 原代码这里是30，建议统一成50
          data.health = data.maxHealth;
          await Info.alert('老人的眼中闪过一丝光芒，你的生命瞬间回满！\n神秘力量涌入体内，伤势尽愈。');
        } else {
          await Info.alert('金币不足，无法施舍。');
        }
      }
    },
    {
      text: '无视他，继续前行',
      effect: async (data) => {
        await Info.alert('你头也不回地走开，什么都没发生。');
      }
    }
  ]
});

export const cursedChestEvent = new SingleLayerEvent({
  description: `你在废墟中发现了一个散发着紫黑气息的宝箱。\n
盖子微微颤动，似乎在诱惑你打开它。\n
你感受到一股强烈的恶意，但也闻到了宝物的芬香。`,
  background: 'picture/events/cursed_chest.webp',
  choices: [
    {
      text: '强行开启（获得150金币，最大生命值永久-30）',
      effect: async (data) => {
        data.money += 150;
        data.maxHealth = Math.max(1, data.maxHealth - 30);
        data.health = Math.min(data.health, data.maxHealth);
        await Info.alert('你获得了财富，但身体感到一阵虚弱……');
      }
    },
    {
      text: '净化后开启（消耗50金币，获得一个强力Buff）',
      effect: async (data) => {
        if (data.money >= 50) {
          data.money -= 50;
          data.attack = (data.attack || 10) + 5;
          await Info.alert('圣光驱散了迷雾，你感觉力量涌现！');
        } else {
          await Info.alert('你没有足够的金币进行净化。');
        }
      }
    },
    {
      text: '敬而远之',
      effect: async (data) => { /* 无事发生 */ }
    }
  ]
});

export const fairyGiftEvent = new SingleLayerEvent({
  description: `你在森林深处救下了一只被藤蔓困住的小仙女。\n
她轻盈地扇动翅膀，洒下点点星光：\n
「勇敢的冒险者，谢谢你！请收下这些谢礼中的一件吧。」`,
  background: 'picture/events/fairy_gift.webp',
  choices: [
    {
      text: '接受沉甸甸的金币（获得 150 金币）',
      effect: async (data) => {
        data.money += 150;
        await Info.alert('你的钱包变沉了！获得了 150 金币。');
      }
    },
    {
      text: '获取神秘的卷轴（获得 1 张随机普通被动卡）',
      effect: async (data) => {
        const commonPassives = ['passive001', 'passive002', 'passive003', 'passive004'];
        const randomID = commonPassives[Math.floor(Math.random() * commonPassives.length)];
        data.deck = data.deck || {};
        data.deck[randomID] = (data.deck[randomID] || 0) + 1;
        await Info.alert(`你领悟了新的力量！获得了被动卡：${randomID}`);
      }
    },
    {
      text: '请求治愈之光（回复 30 生命值）',
      effect: async (data) => {
        const recoverAmount = 30;
        const actualRecover = Math.min(data.maxHealth - data.health, recoverAmount);
        data.health += actualRecover;
        await Info.alert(`温暖的光芒包裹着你，恢复了 ${actualRecover} 点生命值。`);
      }
    }
  ]
});

export const forbiddenArmoryEvent = new SingleLayerEvent({
  description: `你走进了一间充满血腥味的密室，中央悬浮着一把散发着寒气的飞刀。\n
墙上的刻痕显示，无数冒险者曾试图掌控它，但都被其反噬。\n
一个虚弱的声音在你耳边回荡：\n
「想要绝对的命中吗？交出你的生命力，它就是你的……」`,
  background: 'picture/events/forbidden_armory.webp',
  choices: [
    {
      text: '握住飞刀（获得【追踪飞刀】，HP 变为 1）',
      effect: async (data) => {
        data.deck = data.deck || {};
        data.deck["weapon002"] = (data.deck["weapon002"] || 0) + 1;
        data.health = 1;
        await Info.alert('你握住飞刀的瞬间，生命力被抽离了大半。\n你获得了【追踪飞刀】，但现在任何擦碰都将致命！');
      }
    },
    {
      text: '保持理智，转身离开',
      effect: async (data) => {
        await Info.alert('你感受到了致命的威胁，决定不冒这个险。');
      }
    }
  ]
});

export const drunkenVeteranEvent = new SingleLayerEvent({
  description: `酒馆角落坐着一个浑身酒气的壮汉，他正对着一把破旧的剑自言自语。\n
看到你走近，他打了个酒嗝，含糊不清地嚷道：\n
「嘿……你！嗝……看你骨骼惊奇，想学两招，还是……陪老子喝一杯？」`,
  background: 'picture/events/drunken_veteran.webp',
  choices: [
    {
      text: '请他喝最烈的酒（失去 300 金币，获得 1 张随机攻击强化卡）',
      effect: async (data) => {
        if (data.money >= 300) {
          data.money -= 300;
          const attackCards = ['goldpassive001', 'goldpassive002', 'goldpassive006', 'goldpassive007'];
          const nameCards = ['暴怒','闪电博尔特','护甲','不死图腾'];
          const cardid = Math.floor(Math.random() * attackCards.length);
          const reward = attackCards[cardid];
          
          data.deck = data.deck || {};
          data.deck[reward] = (data.deck[reward] || 0) + 1;
          await Info.alert(`醉汉开心地拍了拍你的肩膀：\n「好酒！来，这可是老子的看家本领……」\n你获得了：${nameCards[cardid]}`);
        } else {
          await Info.alert('你翻遍口袋也没凑够酒钱，醉汉嫌弃地把你推开了。');
        }
      }
    },
    {
      text: '切磋一下（15伤害，增加卡槽或能量上限）',
      effect: async (data) => {
        data.health = Math.max(1, data.health - 15);
        if (Math.random() < 0.5){
          data.max_passive_slots += 1;
          await Info.alert('醉汉突然暴起打了一套醉拳！\n你被打得青一块紫一块，但似乎领悟了如何使用强大的战斗技巧（卡槽+1）。');
        } else {
          data.max_energy += 1;
          await Info.alert('醉汉突然暴起打了一套醉拳！\n你被打得青一块紫一块，但似乎领悟了如何使用更多的战斗技巧（能量+1）。');
        }
      }
    },
    {
      text: '趁他睡着摸走他的钱包（50% 成功/被揍）',
      effect: async (data) => {
        if (Math.random() < 0.5) {
          data.money += 100;
          await Info.alert('你轻手轻脚地拿走了他的钱袋，他只是翻了个身，嘟囔了一句梦话。');
        } else {
          data.health = Math.max(1, data.health - 20);
          await Info.alert('你刚伸手，就被他一把抓住了手腕！\n「小毛贼，找打！」你被一脚踢了出来。');
        }
      }
    }
  ]
});