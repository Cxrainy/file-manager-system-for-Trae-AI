import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from models import db, User
from werkzeug.security import generate_password_hash
import random
import string

def generate_user_code():
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

with app.app_context():
    # 创建测试用户
    user_code = generate_user_code()
    test_user = User(
        username='testuser3',
        email='testuser3@example.com',
        password_hash=generate_password_hash('password123'),
        user_code=user_code
    )
    
    db.session.add(test_user)
    db.session.commit()
    
    print(f"测试用户创建成功:")
    print(f"用户名: {test_user.username}")
    print(f"用户代码: {test_user.user_code}")
    print(f"用户ID: {test_user.id}")