#!/usr/bin/env node
/**
 * 文件管理系统一键启动脚本
 * 跨平台启动前端和后端服务
 */

const { spawn, exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');

// 颜色输出
const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

function log(message, color = 'white') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function checkCommand(command) {
  return new Promise((resolve) => {
    exec(`${command} --version`, (error) => {
      resolve(!error);
    });
  });
}

function installDependencies() {
  return new Promise((resolve, reject) => {
    if (!fs.existsSync('node_modules')) {
      log('正在安装前端依赖...', 'yellow');
      const npmCmd = os.platform() === 'win32' ? 'npm.cmd' : 'npm';
      const npm = spawn(npmCmd, ['install'], { stdio: 'inherit' });
      npm.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error('前端依赖安装失败'));
        }
      });
    } else {
      resolve();
    }
  });
}

function startBackend() {
  return new Promise((resolve) => {
    log('启动后端服务...', 'yellow');
    const backendPath = path.join(__dirname, 'backend');
    const pythonCmd = os.platform() === 'win32' ? 'python' : 'python3';
    
    const backend = spawn(pythonCmd, ['run.py'], {
      cwd: backendPath,
      stdio: 'pipe'
    });
    
    backend.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('启动文件管理系统后端服务')) {
        log('后端服务启动成功', 'green');
      }
      process.stdout.write(`[后端] ${output}`);
    });
    
    backend.stderr.on('data', (data) => {
      process.stderr.write(`[后端错误] ${data}`);
    });
    
    backend.on('close', (code) => {
      log(`后端服务已停止 (退出码: ${code})`, 'yellow');
    });
    
    resolve(backend);
  });
}

function startFrontend() {
  return new Promise((resolve) => {
    log('启动前端服务...', 'yellow');
    const npmCmd = os.platform() === 'win32' ? 'npm.cmd' : 'npm';
    const frontend = spawn(npmCmd, ['run', 'dev'], { stdio: 'inherit' });
    
    frontend.on('close', (code) => {
      log(`前端服务已停止 (退出码: ${code})`, 'yellow');
      resolve();
    });
    
    return frontend;
  });
}

async function main() {
  try {
    log('=== 文件管理系统启动脚本 ===', 'green');
    log('正在检查环境...', 'yellow');
    
    // 检查Node.js
    const hasNode = await checkCommand('node');
    if (!hasNode) {
      log('错误: 未找到Node.js，请先安装Node.js', 'red');
      process.exit(1);
    }
    log('✓ Node.js 已安装', 'green');
    
    // 检查Python
    const pythonCmd = os.platform() === 'win32' ? 'python' : 'python3';
    const hasPython = await checkCommand(pythonCmd);
    if (!hasPython) {
      log(`错误: 未找到${pythonCmd}，请先安装Python`, 'red');
      process.exit(1);
    }
    log('✓ Python 已安装', 'green');
    
    // 安装依赖
    await installDependencies();
    log('✓ 依赖检查完成', 'green');
    
    log('\n=== 启动服务 ===', 'green');
    log('前端地址: http://localhost:3000', 'cyan');
    log('后端地址: http://localhost:5000', 'cyan');
    log('按 Ctrl+C 停止所有服务\n', 'yellow');
    
    // 启动后端
    const backendProcess = await startBackend();
    
    // 等待后端启动
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 处理退出信号
    process.on('SIGINT', () => {
      log('\n正在停止服务...', 'yellow');
      backendProcess.kill('SIGTERM');
      process.exit(0);
    });
    
    process.on('SIGTERM', () => {
      backendProcess.kill('SIGTERM');
      process.exit(0);
    });
    
    // 启动前端（阻塞）
    await startFrontend();
    
  } catch (error) {
    log(`错误: ${error.message}`, 'red');
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = { main };