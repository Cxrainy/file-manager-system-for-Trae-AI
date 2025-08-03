#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import sqlite3
import sys
import os

# 添加当前目录到Python路径
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def check_users():
    """检查数据库中的用户记录"""
    try:
        # 连接数据库
        conn = sqlite3.connect('instance/file_manager.db')
        cursor = conn.cursor()
        
        # 查询所有用户
        cursor.execute("SELECT id, username, email, created_at FROM users ORDER BY created_at")
        users = cursor.fetchall()
        
        print(f"数据库中共有 {len(users)} 个用户:")
        print("-" * 80)
        for user in users:
            print(f"ID: {user[0]}")
            print(f"用户名: {user[1]}")
            print(f"邮箱: {user[2]}")
            print(f"创建时间: {user[3]}")
            print("-" * 80)
        
        # 检查是否有重复邮箱
        cursor.execute("SELECT email, COUNT(*) FROM users GROUP BY email HAVING COUNT(*) > 1")
        duplicates = cursor.fetchall()
        
        if duplicates:
            print("\n发现重复邮箱:")
            for email, count in duplicates:
                print(f"邮箱 {email} 有 {count} 个记录")
        else:
            print("\n没有发现重复邮箱")
        
        # 查询每个用户的文件夹数量
        print("\n每个用户的文件夹数量:")
        cursor.execute("""
            SELECT u.email, u.id, COUNT(f.id) as folder_count
            FROM users u
            LEFT JOIN folders f ON u.id = f.user_id
            GROUP BY u.id, u.email
        """)
        folder_stats = cursor.fetchall()
        
        for email, user_id, folder_count in folder_stats:
            print(f"用户 {email} (ID: {user_id}): {folder_count} 个文件夹")
        
        # 查询每个用户的文件数量
        print("\n每个用户的文件数量:")
        cursor.execute("""
            SELECT u.email, u.id, COUNT(f.id) as file_count
            FROM users u
            LEFT JOIN files f ON u.id = f.user_id
            GROUP BY u.id, u.email
        """)
        file_stats = cursor.fetchall()
        
        for email, user_id, file_count in file_stats:
            print(f"用户 {email} (ID: {user_id}): {file_count} 个文件")
        
        conn.close()
        
    except Exception as e:
        print(f"查询失败: {e}")

if __name__ == "__main__":
    check_users()