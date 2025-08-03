#!/usr/bin/env python3
# -*- coding: utf-8 -*-

import jwt
import os
from datetime import datetime

# JWT密钥（从环境变量或默认值获取）
JWT_SECRET_KEY = os.getenv('JWT_SECRET_KEY', 'your-secret-key-here')

def decode_jwt_token(token):
    """解码JWT token"""
    try:
        # 移除Bearer前缀（如果存在）
        if token.startswith('Bearer '):
            token = token[7:]
        
        # 解码token
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=['HS256'])
        
        print("JWT Token 内容:")
        print(f"用户ID: {payload.get('sub')}")
        print(f"签发时间: {datetime.fromtimestamp(payload.get('iat', 0))}")
        print(f"过期时间: {datetime.fromtimestamp(payload.get('exp', 0))}")
        print(f"是否过期: {'是' if datetime.now().timestamp() > payload.get('exp', 0) else '否'}")
        
        return payload
        
    except jwt.ExpiredSignatureError:
        print("Token已过期")
        return None
    except jwt.InvalidTokenError as e:
        print(f"Token无效: {e}")
        return None
    except Exception as e:
        print(f"解码失败: {e}")
        return None

def main():
    print("请输入JWT token进行调试（不包含Bearer前缀）:")
    token = input().strip()
    
    if token:
        decode_jwt_token(token)
    else:
        print("未输入token")

if __name__ == "__main__":
    main()