class GameStorage {
  constructor() {
    this.cache = new Map();
    this.backendUrl = 'http://localhost:3001/api/file';  // 后端地址
    this.useBackend = true;  // 开关：true用后端写文件，false只用localStorage
  }

  // 当前进度加载
  async load(key, defaultData = {}) {
    return this._load(key, defaultData, 'data/cur');
  }

  // 全局存档加载
  async load_global(key, defaultData = {}) {
    return this._load(key, defaultData, 'data/archive1');
  }

  // 内部统一加载逻辑
  async _load(key, defaultData, folder) {
    const fullPath = `${folder}/${key}`;

    // 先试后端
    if (this.useBackend) {
      try {
        const res = await fetch(`${this.backendUrl}?path=${encodeURIComponent(fullPath)}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            this.cache.set(key, json.data);
            console.log(`[后端加载成功] ${fullPath}`, json.data);
            return json.data;
          }
        }
      } catch (err) {
        console.warn('[后端加载失败] 降级本地', err);
      }
    }

    // 后端失败或关闭，用localStorage
    const localKey = `danmaku_${folder.replace('/', '_')}_${key}`;
    const saved = localStorage.getItem(localKey);
    if (saved) {
      const data = JSON.parse(saved);
      this.cache.set(key, data);
      console.log(`[本地加载] ${key}`, data);
      return data;
    }

    // 都没，用默认
    this.cache.set(key, defaultData);
    await this._save(key, defaultData, folder);
    return defaultData;
  }

  // 当前进度保存
  async save(key, data) {
    await this._save(key, data, 'data/cur');
  }

  // 全局存档保存（商店用这个！）
  async save_global(key, data) {
    await this._save(key, data, 'data/archive1');
  }

  // 内部统一保存逻辑
  async _save(key, data, folder) {
    this.cache.set(key, data);

    const fullPath = `${folder}/${key}`;

    if (this.useBackend) {
      try {
        const res = await fetch(this.backendUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ path: fullPath, data })
        });
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            console.log(`[后端保存成功] ${fullPath}`);
            return;
          }
        }
        console.warn('[后端保存失败] 降级本地');
      } catch (err) {
        console.warn('[后端连接失败] 降级本地', err);
      }
    }

    // 降级本地
    const localKey = `danmaku_${folder.replace('/', '_')}_${key}`;
    localStorage.setItem(localKey, JSON.stringify(data, null, 2));
    console.log(`[本地保存] ${key}`);
  }

  get(key) {
    return this.cache.get(key);
  }

  set(key, data, isGlobal = false) {
    this.cache.set(key, data);
    if (isGlobal) {
      this.save_global(key, data);
    } else {
      this.save(key, data);
    }
  }
}

export const storage = new GameStorage();