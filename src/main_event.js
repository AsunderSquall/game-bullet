import { eventMain } from './event/EventMain.js';
import { storage } from './utils/storage.js';

await storage.save('eventCur.json', { name: 'slime_pit' });

// 启动事件！
await eventMain.startEvent();