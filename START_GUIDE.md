# 文件管理系统启动指南

本项目提供了多种一键启动方式，可以同时启动前端和后端服务。

## 启动方式

### 方式一：使用 npm 命令（推荐）
```bash
npm run start
# 或者
npm run start:all
```

### 方式二：使用 Node.js 脚本（跨平台）
```bash
node start.cjs
```

### 方式三：使用 PowerShell 脚本（Windows）
```powershell
.\start.ps1
```

### 方式四：使用批处理脚本（Windows）
```cmd
start.bat
```

## 服务地址

启动成功后，可以通过以下地址访问：

- **前端服务**: http://localhost:3000
- **后端API**: http://localhost:5000

## 环境要求

### 必需软件
- **Node.js** (版本 16 或更高)
- **Python** (版本 3.8 或更高)
- **npm** (通常随 Node.js 一起安装)

### 依赖安装

启动脚本会自动检查并安装依赖，但你也可以手动安装：

#### 前端依赖
```bash
npm install
```

#### 后端依赖
```bash
cd backend
python -m venv venv
# Windows
venv\Scripts\activate
# macOS/Linux
source venv/bin/activate
pip install -r requirements.txt
```

## 停止服务

在终端中按 `Ctrl + C` 即可停止所有服务。

## 故障排除

### 常见问题

1. **端口被占用**
   - 前端默认端口：3000
   - 后端默认端口：5000
   - 如果端口被占用，请先停止占用端口的进程

2. **Python 虚拟环境问题**
   - 确保在 backend 目录下创建了虚拟环境
   - Windows: `python -m venv venv`
   - macOS/Linux: `python3 -m venv venv`

3. **依赖安装失败**
   - 检查网络连接
   - 尝试使用国内镜像源
   - 清除缓存后重新安装

4. **权限问题（Windows）**
   - 以管理员身份运行 PowerShell
   - 或者修改执行策略：`Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser`

### 手动启动

如果自动启动脚本有问题，可以手动分别启动：

#### 启动后端
```bash
cd backend
python run.py
```

#### 启动前端
```bash
npm run dev
```

## 开发模式

所有启动脚本都会以开发模式启动服务，包括：
- 热重载（前端）
- 调试模式（后端）
- 详细日志输出

## 生产部署

生产环境部署请参考项目根目录下的部署文档。