from app import app
from models import db, Friendship

with app.app_context():
    friendships = Friendship.query.all()
    print(f'数据库中的好友关系数量: {len(friendships)}')
    for f in friendships:
        print(f'ID: {f.id}, 用户: {f.user_id}, 好友: {f.friend_id}, 状态: {f.status}')