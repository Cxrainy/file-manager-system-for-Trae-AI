#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from models import db, User, generate_user_code

def update_user_codes():
    """为没有用户代码的用户生成代码"""
    with app.app_context():
        # 查找没有用户代码的用户
        users_without_code = User.query.filter(
            or_(User.user_code == None, User.user_code == '')
        ).all()
        
        print(f"找到 {len(users_without_code)} 个没有用户代码的用户")
        
        for user in users_without_code:
            # 生成唯一的用户代码
            while True:
                new_code = generate_user_code()
                existing = User.query.filter_by(user_code=new_code).first()
                if not existing:
                    break
            
            user.user_code = new_code
            print(f"为用户 {user.username} 生成代码: {new_code}")
        
        # 检查所有用户的代码
        all_users = User.query.all()
        print(f"\n所有用户的代码:")
        for user in all_users:
            print(f"用户: {user.username}, 代码: {user.user_code}")
        
        try:
            db.session.commit()
            print("\n用户代码更新完成!")
        except Exception as e:
            db.session.rollback()
            print(f"更新失败: {e}")

if __name__ == '__main__':
    from sqlalchemy import or_
    update_user_codes()