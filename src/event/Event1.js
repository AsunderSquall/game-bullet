import { SingleLayerEvent } from './BaseEvent.js';

export const slimePitEvent = new SingleLayerEvent({
  description: `你掉进了一个水坑里。\n
可是坑里全是史莱姆黏液！\n
你感觉到这黏液似乎会灼伤你，便拼命想要从坑中脱身。\n
你的耳朵、鼻子和全身都被黏液给浸透了。\n
爬出来后，你发现自己的金币似乎变少了。你回头一看，发现水坑里不但有你掉落的钱，还有不少其他不幸的冒险者们落下的金币。`,
  background: 'SlimePit',
  choices: [
    {
      text: '收集金币（获得75金币，失去 15 生命）',
      effect: (data) => {
        data.money += 75;
        data.health = Math.max(0, data.health - 15);
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


export const beggarElderEvent = new SingleLayerEvent({
  description: `路边坐着一个衣衫褴褛的老人，他颤巍巍地伸出手。\n
「好心的冒险者，能否施舍 50 金币？老朽已饥肠辘辘。」\n
他的眼神深邃，似乎隐藏着什么秘密。\n
你犹豫了片刻……`,
  background: 'BeggarElder',
  choices: [
    {
      text: '施舍 50 金币',
      effect: (data) => {
        if (data.money >= 50) {
          data.money -= 30;
          data.health = data.maxHealth;
          alert('老人的眼中闪过一丝光芒，你的生命瞬间回满！\n神秘力量涌入体内，伤势尽愈。');
        } else {
          alert('金币不足，无法施舍。');
        }
      }
    },
    {
      text: '无视他，继续前行',
      effect: (data) => {
        alert('你头也不回地走开，什么都没发生。');
      }
    }
  ]
});


export const cursedChestEvent = new SingleLayerEvent({
  description: `你在废墟中发现了一个散发着紫黑气息的宝箱。\n
盖子微微颤动，似乎在诱惑你打开它。\n
你感受到一股强烈的恶意，但也闻到了宝物的芬香。`,
  background: 'CursedChest',
  choices: [
    {
      text: '强行开启（获得150金币，最大生命值永久-30）',
      effect: (data) => {
        data.money += 150;
        data.maxHealth = Math.max(1, data.maxHealth - 30);
        data.health = Math.min(data.health, data.maxHealth);
        alert('你获得了财富，但身体感到一阵虚弱……');
      }
    },
    {
      text: '净化后开启（消耗50金币，获得一个强力Buff）',
      effect: (data) => {
        if (data.money >= 50) {
          data.money -= 50;
          data.attack = (data.attack || 10) + 5;
          alert('圣光驱散了迷雾，你感觉力量涌现！');
        } else {
          alert('你没有足够的金币进行净化。');
        }
      }
    },
    {
      text: '敬而远之',
      effect: (data) => { /* 无事发生 */ }
    }
  ]
});

export const fairyGiftEvent = new SingleLayerEvent({
  description: `你在森林深处救下了一只被藤蔓困住的小仙女。\n
她轻盈地扇动翅膀，洒下点点星光：\n
「勇敢的冒险者，谢谢你！请收下这些谢礼中的一件吧。」`,
  background: 'FairyGift',
  choices: [
    {
      text: '接受沉甸甸的金币（获得 150 金币）',
      effect: (data) => {
        data.money += 150;
        alert('你的钱包变沉了！获得了 150 金币。');
      }
    },
    {
      text: '获取神秘的卷轴（获得 1 张随机普通被动卡）',
      effect: (data) => {
        // 假设这是你的普通被动卡池
        const commonPassives = ['passive001', 'passive002', 'passive003', 'passive004'];
        const randomID = commonPassives[Math.floor(Math.random() * commonPassives.length)];

        data.deck = data.deck || {};
        data.deck[randomID] = (data.deck[randomID] || 0) + 1;

        // 这里可以根据 ID 获取卡片名称，为了示例直接弹框
        alert(`你领悟了新的力量！获得了被动卡：${randomID}`);
      }
    },
    {
      text: '请求治愈之光（回复 30 生命值）',
      effect: (data) => {
        const recoverAmount = 30;
        // 确保回复后不超过生命上限
        const actualRecover = Math.min(data.maxHealth - data.health, recoverAmount);
        data.health += actualRecover;
        alert(`温暖的光芒包裹着你，恢复了 ${actualRecover} 点生命值。`);
      }
    }
  ]
});

export const forbiddenArmoryEvent = new SingleLayerEvent({
  description: `你走进了一间充满血腥味的密室，中央悬浮着一把散发着寒气的飞刀。\n
墙上的刻痕显示，无数冒险者曾试图掌控它，但都被其反噬。\n
一个虚弱的声音在你耳边回荡：\n
「想要绝对的命中吗？交出你的生命力，它就是你的……」`,
  background: 'ForbiddenArmory',
  choices: [
    {
      text: '握住飞刀（获得【追踪飞刀】，HP 变为 1）',
      effect: (data) => {
        // 获得武器逻辑：向 deck 对象中添加 weapon002
        data.deck = data.deck || {};
        data.deck["weapon002"] = (data.deck["weapon002"] || 0) + 1;

        // 生命值惩罚：强制归 1
        data.health = 1;

        alert('你握住飞刀的瞬间，生命力被抽离了大半。\n你获得了【追踪飞刀】，但现在任何擦碰都将致命！');
      }
    },
    {
      text: '保持理智，转身离开',
      effect: (data) => {
        alert('你感受到了致命的威胁，决定不冒这个险。');
      }
    }
  ]
});


export const drunkenVeteranEvent = new SingleLayerEvent({
  description: `酒馆角落坐着一个浑身酒气的壮汉，他正对着一把破旧的剑自言自语。\n
看到你走近，他打了个酒嗝，含糊不清地嚷道：\n
「嘿……你！嗝……看你骨骼惊奇，想学两招，还是……陪老子喝一杯？」`,
  background: 'DrunkenVeteran',
  choices: [
    {
      text: '请他喝最烈的酒（失去 300 金币，获得 1 张随机攻击强化卡）',
      effect: (data) => {
        if (data.money >= 300) {
          data.money -= 300;
          // 模拟随机抽取攻击类被动
          const attackCards = ['goldpassive001', 'goldpassive002', 'goldpassive006', 'goldpassive007'];
          const nameCards = ['暴怒','闪电博尔特','护甲','不死图腾'];
          const cardid = Math.floor(Math.random() * attackCards.length);
          const reward = attackCards[cardid];

          data.deck = data.deck || {};
          data.deck[reward] = (data.deck[reward] || 0) + 1;
          alert(`醉汉开心地拍了拍你的肩膀：\n「好酒！来，这可是老子的看家本领……」\n你获得了：${nameCards[cardid]}`);
        } else {
          alert('你翻遍口袋也没凑够酒钱，醉汉嫌弃地把你推开了。');
        }
      }
    },
    {
      text: '切磋一下（失去 15 生命，50% 增加被动牌数上限或者 另外 50% 增加能量上限）',
      effect: (data) => {
        const damage = 15;
        data.health = Math.max(1, data.health - damage);

        if (Math.random() < 0.5){
          data.max_passive_slots += 1;
          alert('醉汉突然暴起打了一套醉拳！\n你被打得青一块紫一块，但似乎领悟了如何使用强大的战斗技巧。');
        } else
        {
          data.max_energy += 1;
          alert('醉汉突然暴起打了一套醉拳！\n你被打得青一块紫一块，但似乎领悟了如何使用更多的战斗技巧。');
        }
      }
    },
    {
      text: '趁他睡着摸走他的钱包（50% 几率得100金币，50% 被揍一顿失血20）',
      effect: (data) => {
        if (Math.random() < 0.5) {
          data.money += 100;
          alert('你轻手轻脚地拿走了他的钱袋，他只是翻了个身，嘟囔了一句梦话。');
        } else {
          data.health = Math.max(1, data.health - 20);
          alert('你刚伸手，就被他一把抓住了手腕！\n「小毛贼，找打！」你被一脚踢了出来。');
        }
      }
    }
  ]
});