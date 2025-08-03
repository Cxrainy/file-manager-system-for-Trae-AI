#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
数据库配置和初始化
"""

from flask_sqlalchemy import SQLAlchemy

# 创建SQLAlchemy实例
db = SQLAlchemy()

def init_db(app):
    """初始化数据库"""
    db.init_app(app)
    
def create_tables(app):
    """创建数据库表和默认用户"""
    with app.app_context():
        # 导入所有模型以确保表定义被加载
        from models import User, Folder, File, FileShare, TrashItem
        
        # 创建所有表
        db.create_all()
        print('数据库表创建完成')
        
        # 创建默认管理员用户
        from werkzeug.security import generate_password_hash
        
        try:
            admin = User.query.filter_by(email='admin@example.com').first()
            if not admin:
                admin = User(
                    username='admin',
                    email='admin@example.com',
                    password_hash=generate_password_hash('admin123'),
                    role='admin'
                )
                db.session.add(admin)
                db.session.commit()
                print('默认管理员用户已创建: admin@example.com / admin123')
            else:
                print('管理员用户已存在')
        except Exception as e:
            print(f'创建管理员用户时出错: {e}')
        
        print('数据库初始化完成')