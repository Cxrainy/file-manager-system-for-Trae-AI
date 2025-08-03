import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app import app
from models import db, User, Friendship

with app.app_context():
    # 删除测试用户
    test_user = User.query.filter_by(username='testuser2').first()
    if test_user:
        print(f"删除测试用户: {test_user.username} (ID: {test_user.id})")
        # 删除相关的好友关系
        friendships = Friendship.query.filter(
            (Friendship.user_id == test_user.id) | (Friendship.friend_id == test_user.id)
        ).all()
        for friendship in friendships:
            print(f"删除好友关系: {friendship.id}")
            db.session.delete(friendship)
        
        db.session.delete(test_user)
        db.session.commit()
        print("测试用户和相关数据已删除")
    else:
        print("未找到测试用户")
    
    # 删除所有pending状态的好友关系
    pending_friendships = Friendship.query.filter_by(status='pending').all()
    for friendship in pending_friendships:
        print(f"删除pending好友关系: {friendship.id}")
        db.session.delete(friendship)
    
    db.session.commit()
    print("清理完成")