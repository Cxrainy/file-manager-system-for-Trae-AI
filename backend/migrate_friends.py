#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
好友功能数据库迁移脚本
为现有用户生成用户代码，并创建新的数据库表
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from models import db, User, generate_user_code
from sqlalchemy import text

def migrate_database():
    """执行数据库迁移"""
    with app.app_context():
        try:
            print("开始数据库迁移...")
            
            # 1. 为User表添加user_code字段（如果不存在）
            try:
                # 检查user_code字段是否存在
                result = db.session.execute(text("PRAGMA table_info(users)"))
                columns = [row[1] for row in result.fetchall()]
                
                if 'user_code' not in columns:
                    print("添加user_code字段到users表...")
                    db.session.execute(text("ALTER TABLE users ADD COLUMN user_code VARCHAR(8)"))
                    db.session.commit()
                    print("✓ user_code字段添加成功")
                else:
                    print("✓ user_code字段已存在")
            except Exception as e:
                print(f"添加user_code字段失败: {e}")
                db.session.rollback()
                return False
            
            # 2. 为现有用户生成唯一的用户代码
            try:
                users_without_code = User.query.filter(
                    (User.user_code == None) | (User.user_code == '')
                ).all()
                
                if users_without_code:
                    print(f"为 {len(users_without_code)} 个用户生成用户代码...")
                    
                    for user in users_without_code:
                        # 生成唯一的用户代码
                        while True:
                            new_code = generate_user_code()
                            existing = User.query.filter_by(user_code=new_code).first()
                            if not existing:
                                user.user_code = new_code
                                break
                        
                        print(f"  用户 {user.username} -> {user.user_code}")
                    
                    db.session.commit()
                    print("✓ 用户代码生成完成")
                else:
                    print("✓ 所有用户都已有用户代码")
            except Exception as e:
                print(f"生成用户代码失败: {e}")
                db.session.rollback()
                return False
            
            # 3. 创建新的数据库表
            try:
                print("创建好友功能相关表...")
                db.create_all()
                print("✓ 数据库表创建完成")
            except Exception as e:
                print(f"创建数据库表失败: {e}")
                return False
            
            # 4. 添加唯一约束（如果不存在）
            try:
                # 检查user_code的唯一约束
                db.session.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS idx_users_user_code ON users(user_code)"))
                db.session.commit()
                print("✓ 唯一约束添加完成")
            except Exception as e:
                print(f"添加唯一约束失败: {e}")
                db.session.rollback()
                return False
            
            print("\n数据库迁移完成！")
            
            # 显示迁移结果
            print("\n当前用户列表:")
            users = User.query.all()
            for user in users:
                print(f"  {user.username} ({user.email}) -> 用户代码: {user.user_code}")
            
            return True
            
        except Exception as e:
            print(f"迁移过程中发生错误: {e}")
            db.session.rollback()
            return False

def check_tables():
    """检查数据库表状态"""
    with app.app_context():
        try:
            # 检查所有表
            tables = [
                'users', 'folders', 'files', 'file_shares', 'trash_items',
                'friendships', 'chat_messages', 'friend_file_shares'
            ]
            
            print("数据库表状态:")
            for table in tables:
                try:
                    result = db.session.execute(text(f"SELECT COUNT(*) FROM {table}"))
                    count = result.scalar()
                    print(f"  ✓ {table}: {count} 条记录")
                except Exception as e:
                    print(f"  ✗ {table}: 表不存在或查询失败 ({e})")
            
        except Exception as e:
            print(f"检查表状态失败: {e}")

if __name__ == "__main__":
    print("好友功能数据库迁移工具")
    print("=" * 50)
    
    # 检查当前状态
    print("\n1. 检查当前数据库状态:")
    check_tables()
    
    # 执行迁移
    print("\n2. 执行数据库迁移:")
    success = migrate_database()
    
    if success:
        print("\n3. 迁移后状态检查:")
        check_tables()
        print("\n🎉 迁移成功完成！")
    else:
        print("\n❌ 迁移失败，请检查错误信息")