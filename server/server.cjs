const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 打印所有请求日志（调试神器～）
app.use((req, res, next) => {
  console.log(`\n[请求到来] ${new Date().toLocaleString()}`);
  console.log(`方法: ${req.method}`);
  console.log(`路径: ${req.path}`);
  console.log(`查询参数:`, req.query);
  console.log(`请求体:`, req.body ? JSON.stringify(req.body, null, 2).slice(0, 500) + '...' : '无');
  next();
});

const ROOT_DIR = path.join(__dirname, '..');  // 项目根目录

// GET：读取文件
app.get('/api/file', (req, res) => {
  try {
    const relativePath = req.query.path;
    console.log('[处理GET请求] 读取文件:', relativePath);

    if (!relativePath || !relativePath.startsWith('data/')) {
      return res.status(400).json({ success: false, error: '无效路径，必须以 data/ 开头' });
    }

    const filePath = path.join(ROOT_DIR, relativePath);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ success: false, error: '文件不存在' });
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    res.json({ success: true, data });
  } catch (err) {
    console.error('[读取错误]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST：写入文件
app.post('/api/file', (req, res) => {
  try {
    const { path: relativePath, data } = req.body;
    console.log('[处理POST请求] 保存文件:', relativePath);
    console.log('保存数据预览:', JSON.stringify(data, null, 2).slice(0, 300) + '...');

    if (!relativePath || !relativePath.startsWith('data/')) {
      return res.status(400).json({ success: false, error: '无效路径，必须以 data/ 开头' });
    }

    const filePath = path.join(ROOT_DIR, relativePath);
    // 自动创建文件夹
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    console.log(`[保存成功] ${relativePath}`);
    res.json({ success: true });
  } catch (err) {
    console.error('[保存错误]', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// 启动服务器
const PORT = 3001;
app.listen(PORT, () => {
  console.log(`后端存档服务器启动成功！监听 http://localhost:${PORT}`);
});