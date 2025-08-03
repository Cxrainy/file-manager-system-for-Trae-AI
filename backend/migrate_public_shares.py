#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
公共分享功能数据库迁移脚本
创建 public_shares 表
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from models import db, PublicShare
from sqlalchemy import text

def migrate_public_shares():
    """创建公共分享表"""
    with app.app_context():
        try:
            # 检查表是否已存在
            result = db.session.execute(text(
                "SELECT name FROM sqlite_master WHERE type='table' AND name='public_shares'"
            )).fetchone()
            
            if result:
                print("public_shares 表已存在，跳过创建")
                return
            
            # 创建表
            print("正在创建 public_shares 表...")
            db.create_all()
            
            print("public_shares 表创建成功！")
            
        except Exception as e:
            print(f"迁移失败: {str(e)}")
            db.session.rollback()
            raise

if __name__ == '__main__':
    migrate_public_shares()