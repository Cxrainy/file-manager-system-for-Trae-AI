@echo off
chcp 65001 >nul
echo ========================================
echo    文件管理系统一键启动脚本
echo ========================================
echo.

REM 检查Node.js
echo [1/4] 检查Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到Node.js，请先安装Node.js
    echo 下载地址: https://nodejs.org/
    pause
    exit /b 1
)
echo [✓] Node.js 已安装

REM 检查Python
echo [2/4] 检查Python...
python --version >nul 2>&1
if errorlevel 1 (
    echo [错误] 未找到Python，请先安装Python
    echo 下载地址: https://python.org/
    pause
    exit /b 1
)
echo [✓] Python 已安装

REM 安装前端依赖
echo [3/4] 检查前端依赖...
if not exist "node_modules" (
    echo [安装] 正在安装前端依赖，请稍候...
    npm install
    if errorlevel 1 (
        echo [错误] 前端依赖安装失败
        pause
        exit /b 1
    )
    echo [✓] 前端依赖安装完成
) else (
    echo [✓] 前端依赖已存在
)

REM 检查后端依赖
echo [4/4] 检查后端环境...
if not exist "backend\requirements.txt" (
    echo [错误] 未找到后端requirements.txt文件
    pause
    exit /b 1
)
echo [✓] 后端环境检查完成

echo.
echo ========================================
echo           启动服务
echo ========================================
echo 前端地址: http://localhost:3000
echo 后端地址: http://localhost:5000
echo.
echo 提示: 按 Ctrl+C 可停止所有服务
echo ========================================
echo.

REM 启动后端服务（新窗口）
echo [启动] 后端服务启动中...
start "后端服务" cmd /k "cd /d %~dp0backend && python run.py"

REM 等待后端启动
echo [等待] 等待后端服务启动...
timeout /t 5 /nobreak >nul

REM 启动前端服务
echo [启动] 前端服务启动中...
echo.
npm run dev

echo.
echo ========================================
echo 前端服务已停止，后端服务仍在运行
echo 请手动关闭后端服务窗口
echo ========================================
pause