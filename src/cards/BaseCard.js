export class BaseCard {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.energy = data.energy ?? 0;
    this.type = data.type;
    this.rarity = data.rarity || 'common';
    this.icon = data.icon || null;
  }

  apply(playerData) {
    throw new Error(`卡牌 ${this.id} (${this.name}) 未实现 apply() 方法！`);
  }

  getDisplayInfo() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      rarity: this.rarity,
      icon: this.icon
    };
  }
}