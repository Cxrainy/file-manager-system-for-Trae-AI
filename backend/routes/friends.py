from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import db, User, Friendship, ChatMessage, FriendFileShare, File, Folder
from utils import jwt_required_with_user
from sqlalchemy import or_, and_

friends_bp = Blueprint('friends', __name__)

@friends_bp.route('/search', methods=['POST'])
@jwt_required_with_user
def search_user_by_code(current_user):
    """通过用户代码搜索用户"""
    try:
        data = request.get_json()
        user_code = data.get('userCode', '').strip().upper()
        
        if not user_code:
            return jsonify({
                'success': False,
                'error': '用户代码不能为空'
            }), 400
        
        if user_code == current_user.user_code:
            return jsonify({
                'success': False,
                'error': '不能添加自己为好友'
            }), 400
        
        # 查找用户
        target_user = User.query.filter_by(user_code=user_code).first()
        if not target_user:
            return jsonify({
                'success': False,
                'error': '用户不存在'
            }), 404
        
        # 检查是否已经是好友或已发送请求
        existing_friendship = Friendship.query.filter(
            or_(
                and_(Friendship.user_id == current_user.id, Friendship.friend_id == target_user.id),
                and_(Friendship.user_id == target_user.id, Friendship.friend_id == current_user.id)
            )
        ).first()
        
        friendship_status = None
        if existing_friendship:
            if existing_friendship.user_id == current_user.id:
                friendship_status = f"已发送好友请求 ({existing_friendship.status})"
            else:
                friendship_status = f"已收到好友请求 ({existing_friendship.status})"
        
        return jsonify({
            'success': True,
            'data': {
                'user': target_user.to_dict(),
                'friendshipStatus': friendship_status
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@friends_bp.route('/request', methods=['POST'])
@jwt_required_with_user
def send_friend_request(current_user):
    """发送好友请求"""
    try:
        data = request.get_json()
        friend_id = data.get('friendId')
        
        print(f"[DEBUG] 发送好友请求 - 当前用户: {current_user.id}, 目标用户: {friend_id}")
        
        if not friend_id:
            print(f"[DEBUG] 好友ID为空")
            return jsonify({
                'success': False,
                'error': '好友ID不能为空'
            }), 400
        
        if friend_id == current_user.id:
            print(f"[DEBUG] 尝试添加自己为好友")
            return jsonify({
                'success': False,
                'error': '不能添加自己为好友'
            }), 400
        
        # 检查目标用户是否存在
        target_user = User.query.get(friend_id)
        if not target_user:
            print(f"[DEBUG] 目标用户不存在: {friend_id}")
            return jsonify({
                'success': False,
                'error': '用户不存在'
            }), 404
        
        print(f"[DEBUG] 目标用户存在: {target_user.username}")
        
        # 检查是否已经存在好友关系
        existing_friendship = Friendship.query.filter(
            or_(
                and_(Friendship.user_id == current_user.id, Friendship.friend_id == friend_id),
                and_(Friendship.user_id == friend_id, Friendship.friend_id == current_user.id)
            )
        ).first()
        
        if existing_friendship:
            print(f"[DEBUG] 好友关系已存在 - ID: {existing_friendship.id}, 状态: {existing_friendship.status}")
            if existing_friendship.status == 'pending':
                error_msg = '好友关系已存在 - pending'
            elif existing_friendship.status == 'accepted':
                error_msg = '好友关系已存在 - accepted'
            else:
                error_msg = f'好友关系已存在 - {existing_friendship.status}'
            
            return jsonify({
                'success': False,
                'error': error_msg
            }), 409
        
        print(f"[DEBUG] 没有现有好友关系，创建新的好友请求")
        
        # 创建好友请求
        friendship = Friendship(
            user_id=current_user.id,
            friend_id=friend_id,
            status='pending'
        )
        
        db.session.add(friendship)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': friendship.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@friends_bp.route('/requests', methods=['GET'])
@jwt_required_with_user
def get_friend_requests(current_user):
    """获取好友请求列表"""
    try:
        # 获取收到的好友请求
        received_requests = Friendship.query.filter_by(
            friend_id=current_user.id,
            status='pending'
        ).all()
        
        # 获取发送的好友请求
        sent_requests = Friendship.query.filter_by(
            user_id=current_user.id,
            status='pending'
        ).all()
        
        return jsonify({
            'success': True,
            'data': {
                'received': [req.to_dict() for req in received_requests],
                'sent': [req.to_dict() for req in sent_requests]
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@friends_bp.route('/request/<request_id>/accept', methods=['POST'])
@jwt_required_with_user
def accept_friend_request(current_user, request_id):
    """接受好友请求"""
    try:
        friendship = Friendship.query.filter_by(
            id=request_id,
            friend_id=current_user.id,
            status='pending'
        ).first()
        
        if not friendship:
            return jsonify({
                'success': False,
                'error': '好友请求不存在'
            }), 404
        
        friendship.status = 'accepted'
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': friendship.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@friends_bp.route('/request/<request_id>/reject', methods=['POST'])
@jwt_required_with_user
def reject_friend_request(current_user, request_id):
    """拒绝好友请求"""
    try:
        friendship = Friendship.query.filter_by(
            id=request_id,
            friend_id=current_user.id,
            status='pending'
        ).first()
        
        if not friendship:
            return jsonify({
                'success': False,
                'error': '好友请求不存在'
            }), 404
        
        db.session.delete(friendship)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '已拒绝好友请求'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@friends_bp.route('', methods=['GET'])
@friends_bp.route('/', methods=['GET'])
@jwt_required_with_user
def get_friends_list(current_user):
    """获取好友列表"""
    try:
        print(f"[DEBUG] 获取好友列表 - 用户ID: {current_user.id}")
        
        # 获取所有已接受的好友关系
        friendships = Friendship.query.filter(
            or_(
                and_(Friendship.user_id == current_user.id, Friendship.status == 'accepted'),
                and_(Friendship.friend_id == current_user.id, Friendship.status == 'accepted')
            )
        ).all()
        
        print(f"[DEBUG] 找到 {len(friendships)} 个好友关系")
        
        friends = []
        for friendship in friendships:
            try:
                if friendship.user_id == current_user.id:
                    friend_user = friendship.friend
                else:
                    friend_user = friendship.user
                
                if friend_user:
                    friends.append({
                        'friendshipId': friendship.id,
                        'friend': friend_user.to_dict(),
                        'createdAt': friendship.created_at.isoformat() if friendship.created_at else None
                    })
                    print(f"[DEBUG] 添加好友: {friend_user.username}")
                else:
                    print(f"[DEBUG] 警告: 好友用户对象为空, friendship_id: {friendship.id}")
            except Exception as friend_error:
                print(f"[DEBUG] 处理好友关系时出错: {str(friend_error)}")
                continue
        
        print(f"[DEBUG] 最终返回 {len(friends)} 个好友")
        
        return jsonify({
            'success': True,
            'data': friends
        })
        
    except Exception as e:
        print(f"[DEBUG] 获取好友列表失败: {str(e)}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@friends_bp.route('/<friend_id>', methods=['DELETE'])
@jwt_required_with_user
def remove_friend(current_user, friend_id):
    """删除好友"""
    try:
        friendship = Friendship.query.filter(
            or_(
                and_(Friendship.user_id == current_user.id, Friendship.friend_id == friend_id),
                and_(Friendship.user_id == friend_id, Friendship.friend_id == current_user.id)
            ),
            Friendship.status == 'accepted'
        ).first()
        
        if not friendship:
            return jsonify({
                'success': False,
                'error': '好友关系不存在'
            }), 404
        
        db.session.delete(friendship)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '已删除好友'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500