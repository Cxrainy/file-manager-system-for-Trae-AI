#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from models import User

def check_admin_user():
    """检查管理员用户信息"""
    with app.app_context():
        admin = User.query.filter_by(email='admin@example.com').first()
        
        if admin:
            print(f"管理员用户: {admin.username}")
            print(f"邮箱: {admin.email}")
            print(f"用户代码: {admin.user_code}")
            print(f"用户ID: {admin.id}")
            print(f"角色: {admin.role}")
            print(f"创建时间: {admin.created_at}")
        else:
            print("管理员用户不存在")
        
        # 检查所有用户的用户代码
        all_users = User.query.all()
        print(f"\n总共有 {len(all_users)} 个用户:")
        for user in all_users:
            print(f"  {user.username} ({user.email}) - 代码: {user.user_code}")

if __name__ == '__main__':
    check_admin_user()