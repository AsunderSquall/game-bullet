# 3D 弹幕游戏框架

这是一个基于 Three.js 构建的大型 3D 弹幕游戏，支持复杂的弹幕模式和角色系统。

## 功能特性

- 基于 Three.js 的 3D 弹幕游戏引擎
- 加入肉鸽元素
- 支持多种弹幕模式和敌人行为
- 内置存档系统，支持游戏进度保存和加载
- 可扩展的角色和卡片系统
- 支持自定义模型和资源

## 系统要求

- Node.js (版本 16.x 或更高)
- npm 包管理器
- 现代浏览器（支持 WebGL）

## 安装步骤

1. 克隆或下载项目到本地：
   ```bash
   git clone https://github.com/AsunderSquall/game-bullet
   cd game-bullet
   ```

2. 安装项目依赖：
   ```bash
   npm install
   ```

## 运行游戏

### 运行游戏服务端

要启动开发服务器，请在项目根目录下打开两个终端窗口并分别运行以下命令：

**终端 1 - 启动后端服务器：**
```bash
node server/server.cjs
```

**终端 2 - 启动前端开发服务器：**
```bash
npm run dev
```

然后在浏览器中访问 `http://localhost:5173` 即可开始游戏。

## 项目结构

- `src/` - 主要源代码目录
  - `battle/` - 战斗相关逻辑
  - `cards/` - 卡片系统
  - `defaults/` - 默认配置
  - `event/` - 事件系统
  - `map/` - 地图相关
  - `room/` - 房间系统
  - `select/` - 选择界面
  - `shop/` - 商店系统
  - `ui/` - 用户界面组件
  - `utils/` - 工具函数
- `server/` - 后端服务器代码
- `models/` - 3D 模型文件
- `music/` - 音乐文件
- `data/` - 存档和配置数据
- `picture/` - 图片资源

## 配置选项

服务器默认运行在端口 3001 上，前端开发服务器通常运行在端口 5173 上。如果需要更改端口，可以在 `server/server.cjs` 中修改 `PORT` 变量。

## 贡献

欢迎提交问题报告和拉取请求。对于重大变更，请先开 issue 讨论您想要改变的内容。

## 许可证

MIT License