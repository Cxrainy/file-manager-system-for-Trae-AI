#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文件管理系统后端启动文件
"""

from app import app
import os
from dotenv import load_dotenv

# 加载环境变量
load_dotenv()

if __name__ == '__main__':
    # 开发环境配置
    debug_mode = os.getenv('FLASK_DEBUG', 'True').lower() == 'true'
    port = int(os.getenv('PORT', 5000))
    host = os.getenv('HOST', '127.0.0.1')
    
    print(f"启动文件管理系统后端服务...")
    print(f"访问地址: http://{host}:{port}")
    print(f"调试模式: {debug_mode}")
    
    app.run(
        host=host,
        port=port,
        debug=debug_mode,
        threaded=True
    )