# File Manager System

一个功能完整的文件管理系统，包含React前端和Python后端。

## 功能特性

### 前端功能
- 📁 文件和文件夹管理
- 🔍 文件搜索功能
- 📤 文件上传和下载
- 👥 好友系统和文件分享
- 💬 聊天功能
- 🗑️ 回收站管理
- ⚙️ 系统设置
- 📊 系统分析
- 🎨 主题切换（明暗模式）
- 📱 响应式设计

### 后端功能
- 🔐 用户认证和授权
- 📂 文件存储和管理
- 👫 好友关系管理
- 🔗 文件分享链接
- 💾 数据库管理
- 📈 系统统计

## 技术栈

### 前端
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Zustand (状态管理)
- React Router

### 后端
- Python
- Flask
- SQLite
- JWT认证

## 快速开始

### 前端启动
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev
```

### 后端启动
```bash
# 进入后端目录
cd backend

# 安装依赖
pip install -r requirements.txt

# 启动后端服务
python run.py
```

## 项目结构

```
├── src/                    # 前端源码
│   ├── components/         # React组件
│   ├── pages/             # 页面组件
│   ├── store/             # 状态管理
│   ├── services/          # API服务
│   └── types/             # TypeScript类型定义
├── backend/               # 后端源码
│   ├── routes/            # API路由
│   ├── models.py          # 数据模型
│   ├── database.py        # 数据库配置
│   └── app.py             # 主应用
└── README.md
```

## 开发说明

- 前端运行在 `http://localhost:3001`
- 后端运行在 `http://localhost:5000`
- 数据库文件位于 `backend/instance/`

## 贡献

欢迎提交Issue和Pull Request！

## 许可证

MIT License