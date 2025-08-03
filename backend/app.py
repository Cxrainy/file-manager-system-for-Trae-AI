#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
文件管理系统后端主应用
"""

from flask import Flask, jsonify
from flask_jwt_extended import JWTManager
from flask_cors import CORS
from datetime import datetime
import os
from dotenv import load_dotenv
from database import db, init_db, create_tables

# 加载环境变量
load_dotenv()

# 创建Flask应用
app = Flask(__name__)

# 配置
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///file_manager.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt-secret-key')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = int(os.getenv('JWT_ACCESS_TOKEN_EXPIRES', 86400))
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', 'uploads')
app.config['MAX_CONTENT_LENGTH'] = int(os.getenv('MAX_CONTENT_LENGTH', 104857600))

# 配置日志
import logging
logging.basicConfig(level=logging.DEBUG)
app.logger.setLevel(logging.DEBUG)

# 初始化扩展
jwt = JWTManager(app)
CORS(app)

# 添加请求日志中间件
@app.before_request
def log_request_info():
    from flask import request
    app.logger.info(f"收到请求: {request.method} {request.url}")

# JWT错误处理
@jwt.expired_token_loader
def expired_token_callback(jwt_header, jwt_payload):
    return jsonify({
        'success': False,
        'error': 'Token已过期'
    }), 401

@jwt.invalid_token_loader
def invalid_token_callback(error):
    return jsonify({
        'success': False,
        'error': 'Token无效'
    }), 401

@jwt.unauthorized_loader
def missing_token_callback(error):
    return jsonify({
        'success': False,
        'error': '缺少认证Token'
    }), 401

# 确保上传目录存在
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# 初始化数据库
init_db(app)
create_tables(app)

# 注册蓝图
from routes.auth import auth_bp
from routes.folders import folders_bp
from routes.files import files_bp
from routes.statistics import statistics_bp
from routes.system import system_bp
from routes.trash import trash_bp
from routes.friends import friends_bp
from routes.chat import chat_bp
from routes.friend_shares import friend_shares_bp
from routes.settings import settings_bp
from routes.shares import shares_bp

app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(folders_bp, url_prefix='/api/folders')
app.register_blueprint(files_bp, url_prefix='/api/files')
app.register_blueprint(statistics_bp, url_prefix='/api/statistics')
app.register_blueprint(system_bp, url_prefix='/api/system')
app.register_blueprint(trash_bp, url_prefix='/api/trash')
app.register_blueprint(friends_bp, url_prefix='/api/friends')
app.register_blueprint(chat_bp, url_prefix='/api/chat')
app.register_blueprint(friend_shares_bp, url_prefix='/api/friend-shares')
app.register_blueprint(settings_bp, url_prefix='/api/settings')
app.register_blueprint(shares_bp, url_prefix='/api/shares')

# 错误处理
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': '接口不存在'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': '服务器内部错误'}), 500

@app.errorhandler(413)
def file_too_large(error):
    return jsonify({'error': '文件过大'}), 413

# 健康检查
@app.route('/api/health')
def health_check():
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.utcnow().isoformat(),
        'version': '1.0.0'
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)