# 文件管理系统后端

基于 Flask 的文件管理系统后端 API 服务。

## 功能特性

- 用户认证与授权（JWT）
- 文件上传、下载、预览
- 文件夹管理（创建、删除、移动）
- 文件搜索与过滤
- 批量操作
- 回收站功能
- 统计分析
- 系统管理

## 技术栈

- **框架**: Flask 2.3.3
- **数据库**: SQLite3 (可扩展至 PostgreSQL/MySQL)
- **认证**: Flask-JWT-Extended
- **ORM**: SQLAlchemy
- **图片处理**: Pillow
- **系统监控**: psutil

## 安装与运行

### 1. 环境要求

- Python 3.8+
- pip

### 2. 安装依赖

```bash
cd backend
pip install -r requirements.txt
```

### 3. 环境配置

复制 `.env` 文件并根据需要修改配置：

```bash
cp .env.example .env
```

主要配置项：
- `SECRET_KEY`: Flask 密钥
- `JWT_SECRET_KEY`: JWT 密钥
- `DATABASE_URL`: 数据库连接字符串
- `UPLOAD_FOLDER`: 文件上传目录
- `ADMIN_EMAIL`: 管理员邮箱
- `ADMIN_PASSWORD`: 管理员密码

### 4. 启动服务

```bash
python run.py
```

服务将在 `http://127.0.0.1:5000` 启动。

## API 文档

### 认证接口

- `POST /api/auth/login` - 用户登录
- `POST /api/auth/register` - 用户注册
- `GET /api/auth/me` - 获取当前用户信息
- `PUT /api/auth/profile` - 更新用户资料
- `PUT /api/auth/password` - 修改密码

### 文件夹接口

- `GET /api/folders` - 获取文件夹列表
- `POST /api/folders` - 创建文件夹
- `PUT /api/folders/<id>` - 更新文件夹
- `DELETE /api/folders/<id>` - 删除文件夹
- `POST /api/folders/<id>/move` - 移动文件夹

### 文件接口

- `GET /api/files` - 获取文件列表
- `POST /api/files/upload` - 上传文件
- `GET /api/files/<id>/download` - 下载文件
- `GET /api/files/<id>/preview` - 预览文件
- `PUT /api/files/<id>` - 重命名文件
- `DELETE /api/files/<id>` - 删除文件
- `POST /api/files/batch-delete` - 批量删除
- `POST /api/files/<id>/move` - 移动文件
- `GET /api/files/search` - 搜索文件

### 统计接口

- `GET /api/statistics/overview` - 统计概览
- `GET /api/statistics/storage` - 存储使用情况
- `GET /api/statistics/file-types` - 文件类型分布
- `GET /api/statistics/upload-trend` - 上传趋势

### 系统接口

- `GET /api/system/info` - 系统信息
- `GET /api/system/health` - 健康检查

## 项目结构

```
backend/
├── app.py              # Flask 应用主文件
├── models.py           # 数据库模型
├── utils.py            # 工具函数
├── requirements.txt    # 依赖包列表
├── run.py             # 启动文件
├── .env               # 环境配置
└── routes/            # 路由模块
    ├── auth.py        # 认证路由
    ├── folders.py     # 文件夹路由
    ├── files.py       # 文件路由
    ├── statistics.py  # 统计路由
    └── system.py      # 系统路由
```

## 开发说明

### 数据库初始化

首次运行时，系统会自动创建数据库表和默认管理员账户。

### 文件存储

上传的文件默认存储在 `uploads/` 目录下，按用户ID分组存储。

### 安全考虑

- 所有 API 接口都需要 JWT 认证
- 文件上传有类型和大小限制
- 用户只能访问自己的文件
- 管理员接口需要额外权限验证

## 部署

### 生产环境配置

1. 修改 `.env` 文件中的密钥
2. 配置生产数据库
3. 设置文件存储路径
4. 使用 Gunicorn 部署：

```bash
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

### Docker 部署

```dockerfile
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

## 许可证

MIT License