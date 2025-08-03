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
    # 创建接收方测试用户
    user_code = generate_user_code()
    receiver_user = User(
        username='receiver_user',
        email='receiver@example.com',
        password_hash=generate_password_hash('password123'),
        user_code=user_code
    )
    
    db.session.add(receiver_user)
    db.session.commit()
    
    print(f"接收方用户创建成功:")
    print(f"用户名: {receiver_user.username}")
    print(f"邮箱: {receiver_user.email}")
    print(f"密码: password123")
    print(f"用户代码: {receiver_user.user_code}")
    print(f"用户ID: {receiver_user.id}")