import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from models import db, User, Friendship

with app.app_context():
    # 获取admin用户和接收方用户
    admin_user = User.query.filter_by(username='admin').first()
    receiver_user = User.query.filter_by(username='receiver_user').first()
    
    if not admin_user:
        print("未找到admin用户")
        exit(1)
    
    if not receiver_user:
        print("未找到接收方用户")
        exit(1)
    
    # 检查是否已存在好友关系
    existing = Friendship.query.filter(
        ((Friendship.user_id == admin_user.id) & (Friendship.friend_id == receiver_user.id)) |
        ((Friendship.user_id == receiver_user.id) & (Friendship.friend_id == admin_user.id))
    ).first()
    
    if existing:
        print(f"好友关系已存在，状态: {existing.status}")
    else:
        # 创建从admin到receiver的好友请求
        friendship = Friendship(
            user_id=admin_user.id,
            friend_id=receiver_user.id,
            status='pending'
        )
        
        db.session.add(friendship)
        db.session.commit()
        
        print(f"好友请求创建成功:")
        print(f"发送方: {admin_user.username} (ID: {admin_user.id})")
        print(f"接收方: {receiver_user.username} (ID: {receiver_user.id})")
        print(f"请求ID: {friendship.id}")
        print(f"状态: {friendship.status}")