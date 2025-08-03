from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import db, User, Friendship, ChatMessage, File
from utils import jwt_required_with_user
from sqlalchemy import or_, and_, desc

chat_bp = Blueprint('chat', __name__)

@chat_bp.route('/conversations', methods=['GET'])
@jwt_required_with_user
def get_conversations(current_user):
    """获取聊天会话列表"""
    try:
        # 获取所有好友
        friendships = Friendship.query.filter(
            or_(
                and_(Friendship.user_id == current_user.id, Friendship.status == 'accepted'),
                and_(Friendship.friend_id == current_user.id, Friendship.status == 'accepted')
            )
        ).all()
        
        conversations = []
        for friendship in friendships:
            # 确定好友用户
            if friendship.user_id == current_user.id:
                friend_user = friendship.friend
            else:
                friend_user = friendship.user
            
            # 获取最后一条消息
            last_message = ChatMessage.query.filter(
                or_(
                    and_(ChatMessage.sender_id == current_user.id, ChatMessage.receiver_id == friend_user.id),
                    and_(ChatMessage.sender_id == friend_user.id, ChatMessage.receiver_id == current_user.id)
                )
            ).order_by(desc(ChatMessage.created_at)).first()
            
            # 获取未读消息数量
            unread_count = ChatMessage.query.filter_by(
                sender_id=friend_user.id,
                receiver_id=current_user.id,
                is_read=False
            ).count()
            
            conversations.append({
                'friendId': friend_user.id,
                'friend': friend_user.to_dict(),
                'lastMessage': last_message.to_dict() if last_message else None,
                'unreadCount': unread_count
            })
        
        # 按最后消息时间排序
        conversations.sort(key=lambda x: x['lastMessage']['createdAt'] if x['lastMessage'] else '', reverse=True)
        
        return jsonify({
            'success': True,
            'data': conversations
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@chat_bp.route('/messages/<friend_id>', methods=['GET'])
@jwt_required_with_user
def get_messages(current_user, friend_id):
    """获取与指定好友的聊天记录"""
    try:
        # 验证是否为好友关系
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
                'error': '非好友关系，无法查看聊天记录'
            }), 403
        
        # 获取分页参数
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 50, type=int)
        
        # 获取聊天记录
        messages = ChatMessage.query.filter(
            or_(
                and_(ChatMessage.sender_id == current_user.id, ChatMessage.receiver_id == friend_id),
                and_(ChatMessage.sender_id == friend_id, ChatMessage.receiver_id == current_user.id)
            )
        ).order_by(desc(ChatMessage.created_at)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # 标记消息为已读
        ChatMessage.query.filter_by(
            sender_id=friend_id,
            receiver_id=current_user.id,
            is_read=False
        ).update({'is_read': True})
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'messages': [msg.to_dict() for msg in messages.items],
                'pagination': {
                    'page': messages.page,
                    'pages': messages.pages,
                    'per_page': messages.per_page,
                    'total': messages.total,
                    'has_next': messages.has_next,
                    'has_prev': messages.has_prev
                }
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@chat_bp.route('/send', methods=['POST'])
@jwt_required_with_user
def send_message(current_user):
    """发送消息"""
    try:
        data = request.get_json()
        receiver_id = data.get('receiverId')
        message_type = data.get('messageType', 'text')
        content = data.get('content')
        file_id = data.get('fileId')
        
        if not receiver_id or not content:
            return jsonify({
                'success': False,
                'error': '接收者和消息内容不能为空'
            }), 400
        
        # 验证是否为好友关系
        friendship = Friendship.query.filter(
            or_(
                and_(Friendship.user_id == current_user.id, Friendship.friend_id == receiver_id),
                and_(Friendship.user_id == receiver_id, Friendship.friend_id == current_user.id)
            ),
            Friendship.status == 'accepted'
        ).first()
        
        if not friendship:
            return jsonify({
                'success': False,
                'error': '非好友关系，无法发送消息'
            }), 403
        
        # 如果是文件消息，验证文件是否存在且属于发送者
        if message_type == 'file' and file_id:
            file = File.query.filter_by(id=file_id, user_id=current_user.id).first()
            if not file:
                return jsonify({
                    'success': False,
                    'error': '文件不存在或无权限'
                }), 404
        
        # 创建消息
        message = ChatMessage(
            sender_id=current_user.id,
            receiver_id=receiver_id,
            message_type=message_type,
            content=content,
            file_id=file_id if message_type == 'file' else None
        )
        
        db.session.add(message)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': message.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@chat_bp.route('/messages/<message_id>/read', methods=['POST'])
@jwt_required_with_user
def mark_message_read(current_user, message_id):
    """标记消息为已读"""
    try:
        message = ChatMessage.query.filter_by(
            id=message_id,
            receiver_id=current_user.id
        ).first()
        
        if not message:
            return jsonify({
                'success': False,
                'error': '消息不存在'
            }), 404
        
        message.is_read = True
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '消息已标记为已读'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@chat_bp.route('/unread-count', methods=['GET'])
@jwt_required_with_user
def get_unread_count(current_user):
    """获取未读消息总数"""
    try:
        unread_count = ChatMessage.query.filter_by(
            receiver_id=current_user.id,
            is_read=False
        ).count()
        
        return jsonify({
            'success': True,
            'data': {
                'unreadCount': unread_count
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500