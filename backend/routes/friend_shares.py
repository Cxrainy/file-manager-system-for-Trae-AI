from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import sys
import os
import shutil
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import db, User, Friendship, FriendFileShare, File, Folder
from utils import jwt_required_with_user
from sqlalchemy import or_, and_, desc

friend_shares_bp = Blueprint('friend_shares', __name__)

@friend_shares_bp.route('/send', methods=['POST'])
@jwt_required_with_user
def share_file_to_friend(current_user):
    """向好友分享文件"""
    try:
        data = request.get_json()
        file_id = data.get('fileId')
        receiver_id = data.get('receiverId')
        message = data.get('message', '')
        
        if not file_id or not receiver_id:
            return jsonify({
                'success': False,
                'error': '文件ID和接收者ID不能为空'
            }), 400
        
        # 验证文件是否存在且属于当前用户
        file = File.query.filter_by(id=file_id, user_id=current_user.id).first()
        if not file:
            return jsonify({
                'success': False,
                'error': '文件不存在或无权限'
            }), 404
        
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
                'error': '非好友关系，无法分享文件'
            }), 403
        
        # 检查是否已经分享过同一个文件给同一个用户
        existing_share = FriendFileShare.query.filter_by(
            file_id=file_id,
            sender_id=current_user.id,
            receiver_id=receiver_id,
            status='pending'
        ).first()
        
        if existing_share:
            return jsonify({
                'success': False,
                'error': '已经分享过此文件给该好友，请等待对方处理'
            }), 409
        
        # 创建文件分享记录
        file_share = FriendFileShare(
            file_id=file_id,
            sender_id=current_user.id,
            receiver_id=receiver_id,
            message=message,
            status='pending'
        )
        
        db.session.add(file_share)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': file_share.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@friend_shares_bp.route('/received', methods=['GET'])
@jwt_required_with_user
def get_received_shares(current_user):
    """获取收到的文件分享"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        status = request.args.get('status', 'pending')
        
        query = FriendFileShare.query.filter_by(
            receiver_id=current_user.id
        )
        
        if status:
            query = query.filter_by(status=status)
        
        shares = query.order_by(desc(FriendFileShare.created_at)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'success': True,
            'data': {
                'shares': [share.to_dict() for share in shares.items],
                'pagination': {
                    'page': shares.page,
                    'pages': shares.pages,
                    'per_page': shares.per_page,
                    'total': shares.total,
                    'has_next': shares.has_next,
                    'has_prev': shares.has_prev
                }
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@friend_shares_bp.route('/sent', methods=['GET'])
@jwt_required_with_user
def get_sent_shares(current_user):
    """获取发送的文件分享"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        shares = FriendFileShare.query.filter_by(
            sender_id=current_user.id
        ).order_by(desc(FriendFileShare.created_at)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        return jsonify({
            'success': True,
            'data': {
                'shares': [share.to_dict() for share in shares.items],
                'pagination': {
                    'page': shares.page,
                    'pages': shares.pages,
                    'per_page': shares.per_page,
                    'total': shares.total,
                    'has_next': shares.has_next,
                    'has_prev': shares.has_prev
                }
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@friend_shares_bp.route('/<share_id>/accept', methods=['POST'])
@jwt_required_with_user
def accept_file_share(current_user, share_id):
    """接受文件分享"""
    try:
        file_share = FriendFileShare.query.filter_by(
            id=share_id,
            receiver_id=current_user.id,
            status='pending'
        ).first()
        
        if not file_share:
            return jsonify({
                'success': False,
                'error': '文件分享不存在或已处理'
            }), 404
        
        file_share.status = 'accepted'
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': file_share.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@friend_shares_bp.route('/<share_id>/reject', methods=['POST'])
@jwt_required_with_user
def reject_file_share(current_user, share_id):
    """拒绝文件分享"""
    try:
        file_share = FriendFileShare.query.filter_by(
            id=share_id,
            receiver_id=current_user.id,
            status='pending'
        ).first()
        
        if not file_share:
            return jsonify({
                'success': False,
                'error': '文件分享不存在或已处理'
            }), 404
        
        file_share.status = 'rejected'
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': file_share.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@friend_shares_bp.route('/<share_id>/save', methods=['POST'])
@jwt_required_with_user
def save_shared_file(current_user, share_id):
    """保存分享的文件到指定文件夹"""
    try:
        data = request.get_json()
        folder_id = data.get('folderId')
        
        if not folder_id:
            return jsonify({
                'success': False,
                'error': '目标文件夹ID不能为空'
            }), 400
        
        # 验证文件分享是否存在且已接受
        file_share = FriendFileShare.query.filter_by(
            id=share_id,
            receiver_id=current_user.id,
            status='accepted'
        ).first()
        
        if not file_share:
            return jsonify({
                'success': False,
                'error': '文件分享不存在或未接受'
            }), 404
        
        # 验证目标文件夹是否存在且属于当前用户
        target_folder = Folder.query.filter_by(
            id=folder_id,
            user_id=current_user.id
        ).first()
        
        if not target_folder:
            return jsonify({
                'success': False,
                'error': '目标文件夹不存在或无权限'
            }), 404
        
        # 获取原始文件
        original_file = file_share.file
        if not original_file:
            return jsonify({
                'success': False,
                'error': '原始文件不存在'
            }), 404
        
        # 检查目标文件夹中是否已存在同名文件
        existing_file = File.query.filter_by(
            name=original_file.name,
            folder_id=folder_id,
            user_id=current_user.id
        ).first()
        
        if existing_file:
            return jsonify({
                'success': False,
                'error': '目标文件夹中已存在同名文件'
            }), 409
        
        # 复制文件到用户的上传目录
        import uuid
        new_filename = str(uuid.uuid4()) + os.path.splitext(original_file.filename)[1]
        user_upload_dir = os.path.join('uploads', current_user.id)
        os.makedirs(user_upload_dir, exist_ok=True)
        
        new_file_path = os.path.join(user_upload_dir, new_filename)
        
        try:
            shutil.copy2(original_file.path, new_file_path)
        except Exception as copy_error:
            return jsonify({
                'success': False,
                'error': f'文件复制失败: {str(copy_error)}'
            }), 500
        
        # 创建新的文件记录
        new_file = File(
            name=original_file.name,
            original_name=original_file.original_name,
            filename=new_filename,
            size=original_file.size,
            type=original_file.type,
            mime_type=original_file.mime_type,
            folder_id=folder_id,
            user_id=current_user.id,
            path=new_file_path
        )
        
        db.session.add(new_file)
        
        # 更新分享状态
        file_share.status = 'saved'
        file_share.saved_folder_id = folder_id
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'file': new_file.to_dict(),
                'share': file_share.to_dict()
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@friend_shares_bp.route('/<share_id>/download', methods=['GET'])
@jwt_required_with_user
def download_shared_file(current_user, share_id):
    """下载分享的文件"""
    try:
        # 验证文件分享是否存在且已接受
        file_share = FriendFileShare.query.filter_by(
            id=share_id,
            receiver_id=current_user.id,
            status='accepted'
        ).first()
        
        if not file_share:
            return jsonify({
                'success': False,
                'error': '文件分享不存在或未接受'
            }), 404
        
        # 获取原始文件
        original_file = file_share.file
        if not original_file:
            return jsonify({
                'success': False,
                'error': '原始文件不存在'
            }), 404
        
        # 检查文件是否存在
        if not os.path.exists(original_file.path):
            return jsonify({
                'success': False,
                'error': '文件不存在'
            }), 404
        
        from flask import send_file
        return send_file(
            original_file.path,
            as_attachment=True,
            download_name=original_file.original_name
        )
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500