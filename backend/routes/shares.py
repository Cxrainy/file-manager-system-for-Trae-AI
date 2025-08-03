from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.exceptions import NotFound, Forbidden, BadRequest
from sqlalchemy import desc
from datetime import datetime, timedelta
import uuid
import sys
import os
import secrets
from urllib.parse import urljoin
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models import db, User, File, PublicShare
from utils import jwt_required_with_user, get_file_path, check_file_exists

shares_bp = Blueprint('shares', __name__, url_prefix='/shares')

@shares_bp.route('', methods=['POST'])
@jwt_required_with_user
def create_share(current_user):
    """创建公共分享链接"""
    try:
        data = request.get_json()
        
        # 验证必需字段
        file_id = data.get('fileId')
        if not file_id:
            return jsonify({
                'success': False,
                'error': '文件ID不能为空'
            }), 400
        
        # 检查文件是否存在且属于当前用户
        file = File.query.filter_by(id=file_id, user_id=current_user.id).first()
        if not file:
            return jsonify({
                'success': False,
                'error': '文件不存在或无权限访问'
            }), 404
        
        # 生成唯一token
        token = secrets.token_urlsafe(32)
        
        # 处理过期时间
        expires_at = None
        expires_at_str = data.get('expiresAt')
        if expires_at_str and expires_at_str != 'never':
            if expires_at_str == '1hour':
                expires_at = datetime.utcnow() + timedelta(hours=1)
            elif expires_at_str == '1day':
                expires_at = datetime.utcnow() + timedelta(days=1)
            elif expires_at_str == '7days':
                expires_at = datetime.utcnow() + timedelta(days=7)
            elif expires_at_str == '30days':
                expires_at = datetime.utcnow() + timedelta(days=30)
        
        # 创建分享记录
        share = PublicShare(
            id=str(uuid.uuid4()),
            file_id=file_id,
            user_id=current_user.id,
            token=token,
            password=data.get('password'),
            expires_at=expires_at,
            allow_download=data.get('allowDownload', True),
            allow_preview=data.get('allowPreview', True),
            max_downloads=data.get('maxDownloads'),
            description=data.get('description'),
            is_active=True
        )
        
        db.session.add(share)
        db.session.commit()
        
        # 生成分享URL
        base_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
        share_url = f"{base_url}/share/{token}"
        
        return jsonify({
            'success': True,
            'data': {
                'id': share.id,
                'token': token,
                'url': share_url,
                'password': share.password,
                'expiresAt': share.expires_at.isoformat() if share.expires_at else None,
                'allowDownload': share.allow_download,
                'allowPreview': share.allow_preview,
                'maxDownloads': share.max_downloads,
                'downloadCount': share.download_count,
                'viewCount': share.view_count,
                'createdAt': share.created_at.isoformat(),
                'isActive': share.is_active
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"创建分享失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': '创建分享失败'
        }), 500

@shares_bp.route('/file/<file_id>', methods=['GET'])
@jwt_required_with_user
def get_file_shares(current_user, file_id):
    """获取文件的所有分享链接"""
    try:
        # 检查文件是否存在且属于当前用户
        file = File.query.filter_by(id=file_id, user_id=current_user.id).first()
        if not file:
            return jsonify({
                'success': False,
                'error': '文件不存在或无权限访问'
            }), 404
        
        # 获取分享链接
        shares = PublicShare.query.filter_by(
            file_id=file_id,
            user_id=current_user.id
        ).order_by(desc(PublicShare.created_at)).all()
        
        # 生成分享URL
        base_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
        
        shares_data = []
        for share in shares:
            share_url = f"{base_url}/share/{share.token}"
            shares_data.append({
                'id': share.id,
                'token': share.token,
                'url': share_url,
                'password': share.password,
                'expiresAt': share.expires_at.isoformat() if share.expires_at else None,
                'allowDownload': share.allow_download,
                'allowPreview': share.allow_preview,
                'maxDownloads': share.max_downloads,
                'downloadCount': share.download_count,
                'viewCount': share.view_count,
                'createdAt': share.created_at.isoformat(),
                'isActive': share.is_active
            })
        
        return jsonify({
            'success': True,
            'data': shares_data
        })
        
    except Exception as e:
        current_app.logger.error(f"获取文件分享失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': '获取分享失败'
        }), 500

@shares_bp.route('/<token>', methods=['GET'])
def get_public_share(token):
    """获取公共分享信息"""
    try:
        current_app.logger.info(f"Received request for token: {token}")
        share = PublicShare.query.filter_by(
            token=token,
            is_active=True
        ).first()
        current_app.logger.info(f"Found share: {share is not None}")
        
        if not share:
            return jsonify({
                'success': False,
                'error': '分享不存在或已被禁用'
            }), 404
        
        # 检查是否过期
        if share.expires_at and share.expires_at < datetime.utcnow():
            return jsonify({
                'success': False,
                'error': '分享已过期'
            }), 410
        
        # 检查是否需要密码
        if share.password:
            password = request.headers.get('X-Share-Password')
            if not password or password != share.password:
                return jsonify({
                    'success': False,
                    'error': '需要密码访问'
                }), 401
        
        # 获取文件信息
        file = File.query.get(share.file_id)
        if not file:
            return jsonify({
                'success': False,
                'error': '文件不存在'
            }), 404
        
        # 获取用户信息
        user = User.query.get(share.user_id)
        
        # 增加查看次数
        share.view_count += 1
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'id': share.id,
                'token': share.token,
                'file': {
                    'id': file.id,
                    'name': file.name,
                    'size': file.size,
                    'type': file.type,
                    'mimeType': file.mime_type,
                    'createdAt': file.uploaded_at.isoformat()
                },
                'user': {
                    'username': user.username
                },
                'description': share.description,
                'allowDownload': share.allow_download,
                'allowPreview': share.allow_preview,
                'expiresAt': share.expires_at.isoformat() if share.expires_at else None,
                'maxDownloads': share.max_downloads,
                'downloadCount': share.download_count,
                'viewCount': share.view_count,
                'createdAt': share.created_at.isoformat(),
                'isActive': share.is_active
            }
        })
        
    except Exception as e:
        import traceback
        current_app.logger.error(f"获取公共分享失败: {str(e)}")
        current_app.logger.error(f"异常详情: {traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': '获取分享信息失败'
        }), 500

@shares_bp.route('/<token>/download', methods=['GET'])
def download_public_share(token):
    """下载公共分享文件"""
    try:
        share = PublicShare.query.filter_by(
            token=token,
            is_active=True
        ).first()
        
        if not share:
            return jsonify({
                'success': False,
                'error': '分享不存在或已被禁用'
            }), 404
        
        # 检查是否过期
        if share.expires_at and share.expires_at < datetime.utcnow():
            return jsonify({
                'success': False,
                'error': '分享已过期'
            }), 410
        
        # 检查是否允许下载
        if not share.allow_download:
            return jsonify({
                'success': False,
                'error': '不允许下载此文件'
            }), 403
        
        # 检查下载次数限制
        if share.max_downloads and share.download_count >= share.max_downloads:
            return jsonify({
                'success': False,
                'error': '下载次数已达上限'
            }), 403
        
        # 检查密码
        if share.password:
            password = request.headers.get('X-Share-Password')
            if not password or password != share.password:
                return jsonify({
                    'success': False,
                    'error': '需要密码访问'
                }), 401
        
        # 获取文件信息
        file = File.query.get(share.file_id)
        if not file:
            return jsonify({
                'success': False,
                'error': '文件不存在'
            }), 404
        
        # 构建文件路径
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], file.path)
        
        if not os.path.exists(file_path):
            return jsonify({
                'success': False,
                'error': '文件不存在'
            }), 404
        
        # 增加下载次数
        share.download_count += 1
        db.session.commit()
        
        return send_file(
            file_path,
            as_attachment=True,
            download_name=file.name,
            mimetype=file.mime_type
        )
        
    except Exception as e:
        current_app.logger.error(f"下载公共分享文件失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': '下载失败'
        }), 500

@shares_bp.route('/<token>/preview', methods=['GET'])
def preview_public_share(token):
    """预览公共分享文件"""
    try:
        share = PublicShare.query.filter_by(
            token=token,
            is_active=True
        ).first()
        
        if not share:
            return jsonify({
                'success': False,
                'error': '分享不存在或已被禁用'
            }), 404
        
        # 检查是否过期
        if share.expires_at and share.expires_at < datetime.utcnow():
            return jsonify({
                'success': False,
                'error': '分享已过期'
            }), 410
        
        # 检查是否允许预览
        if not share.allow_preview:
            return jsonify({
                'success': False,
                'error': '不允许预览此文件'
            }), 403
        
        # 检查密码
        if share.password:
            password = request.args.get('password')
            if not password or password != share.password:
                return jsonify({
                    'success': False,
                    'error': '需要密码访问'
                }), 401
        
        # 获取文件信息
        file = File.query.get(share.file_id)
        if not file:
            return jsonify({
                'success': False,
                'error': '文件不存在'
            }), 404
        
        # 构建文件路径
        file_path = os.path.join(current_app.config['UPLOAD_FOLDER'], file.path)
        
        if not os.path.exists(file_path):
            return jsonify({
                'success': False,
                'error': '文件不存在'
            }), 404
        
        return send_file(
            file_path,
            mimetype=file.mime_type
        )
        
    except Exception as e:
        current_app.logger.error(f"预览公共分享文件失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': '预览失败'
        }), 500

@shares_bp.route('', methods=['GET'])
@jwt_required_with_user
def get_user_shares(current_user):
    """获取用户的所有分享"""
    try:
        page = request.args.get('page', 1, type=int)
        per_page = request.args.get('per_page', 20, type=int)
        
        shares = PublicShare.query.filter_by(
            user_id=current_user.id
        ).order_by(desc(PublicShare.created_at)).paginate(
            page=page, per_page=per_page, error_out=False
        )
        
        # 生成分享URL
        base_url = current_app.config.get('FRONTEND_URL', 'http://localhost:3000')
        
        shares_data = []
        for share in shares.items:
            share_url = f"{base_url}/share/{share.token}"
            shares_data.append({
                'id': share.id,
                'token': share.token,
                'url': share_url,
                'file': {
                    'id': share.file.id,
                    'name': share.file.name,
                    'size': share.file.size,
                    'mimeType': share.file.mime_type
                },
                'password': share.password,
                'expiresAt': share.expires_at.isoformat() if share.expires_at else None,
                'allowDownload': share.allow_download,
                'allowPreview': share.allow_preview,
                'maxDownloads': share.max_downloads,
                'downloadCount': share.download_count,
                'viewCount': share.view_count,
                'createdAt': share.created_at.isoformat(),
                'isActive': share.is_active
            })
        
        return jsonify({
            'success': True,
            'data': {
                'shares': shares_data,
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
        current_app.logger.error(f"获取用户分享失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': '获取分享失败'
        }), 500

@shares_bp.route('/<share_id>', methods=['PUT'])
@jwt_required_with_user
def update_share(current_user, share_id):
    """更新分享设置"""
    try:
        share = PublicShare.query.filter_by(
            id=share_id,
            user_id=current_user.id
        ).first()
        
        if not share:
            return jsonify({
                'success': False,
                'error': '分享不存在或无权限访问'
            }), 404
        
        data = request.get_json()
        
        # 更新字段
        if 'isActive' in data:
            share.is_active = data['isActive']
        if 'allowDownload' in data:
            share.allow_download = data['allowDownload']
        if 'allowPreview' in data:
            share.allow_preview = data['allowPreview']
        if 'password' in data:
            share.password = data['password']
        if 'maxDownloads' in data:
            share.max_downloads = data['maxDownloads']
        if 'description' in data:
            share.description = data['description']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '分享设置已更新'
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"更新分享失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': '更新分享失败'
        }), 500

@shares_bp.route('/<share_id>', methods=['DELETE'])
@jwt_required_with_user
def delete_share(current_user, share_id):
    """删除分享"""
    try:
        share = PublicShare.query.filter_by(
            id=share_id,
            user_id=current_user.id
        ).first()
        
        if not share:
            return jsonify({
                'success': False,
                'error': '分享不存在或无权限访问'
            }), 404
        
        db.session.delete(share)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '分享已删除'
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"删除分享失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': '删除分享失败'
        }), 500

@shares_bp.route('/access/<token>', methods=['POST'])
def access_share(token):
    """通过token访问分享（公开访问）"""
    try:
        share = PublicShare.query.filter_by(token=token).first()
        
        if not share:
            return jsonify({
                'success': False,
                'error': '分享链接不存在'
            }), 404
        
        # 检查分享是否有效
        if not share.is_active:
            return jsonify({
                'success': False,
                'error': '分享链接已被禁用'
            }), 403
        
        # 检查是否过期
        if share.expires_at and share.expires_at < datetime.utcnow():
            return jsonify({
                'success': False,
                'error': '分享链接已过期'
            }), 403
        
        # 检查密码
        data = request.get_json() or {}
        if share.password:
            provided_password = data.get('password')
            if not provided_password or provided_password != share.password:
                return jsonify({
                    'success': False,
                    'error': '密码错误',
                    'requirePassword': True
                }), 401
        
        # 增加查看次数
        share.view_count += 1
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'file': {
                    'id': share.file.id,
                    'name': share.file.name,
                    'size': share.file.size,
                    'mimeType': share.file.mime_type,
                    'createdAt': share.file.created_at.isoformat(),
                    'updatedAt': share.file.updated_at.isoformat()
                },
                'allowDownload': share.allow_download,
                'allowPreview': share.allow_preview,
                'description': share.description,
                'viewCount': share.view_count,
                'downloadCount': share.download_count
            }
        })
        
    except Exception as e:
        current_app.logger.error(f"访问分享失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': '访问分享失败'
        }), 500

@shares_bp.route('/download/<token>', methods=['POST'])
def download_shared_file(token):
    """下载分享文件（公开访问）"""
    try:
        share = PublicShare.query.filter_by(token=token).first()
        
        if not share:
            return jsonify({
                'success': False,
                'error': '分享链接不存在'
            }), 404
        
        # 检查分享是否有效
        if not share.is_active:
            return jsonify({
                'success': False,
                'error': '分享链接已被禁用'
            }), 403
        
        # 检查是否过期
        if share.expires_at and share.expires_at < datetime.utcnow():
            return jsonify({
                'success': False,
                'error': '分享链接已过期'
            }), 403
        
        # 检查是否允许下载
        if not share.allow_download:
            return jsonify({
                'success': False,
                'error': '此分享不允许下载'
            }), 403
        
        # 检查下载次数限制
        if share.max_downloads and share.download_count >= share.max_downloads:
            return jsonify({
                'success': False,
                'error': '下载次数已达上限'
            }), 403
        
        # 检查密码
        data = request.get_json() or {}
        if share.password:
            provided_password = data.get('password')
            if not provided_password or provided_password != share.password:
                return jsonify({
                    'success': False,
                    'error': '密码错误'
                }), 401
        
        # 获取文件路径
        file_path = get_file_path(share.file.path)
        
        if not check_file_exists(file_path):
            return jsonify({
                'success': False,
                'error': '文件不存在'
            }), 404
        
        # 增加下载次数
        share.download_count += 1
        db.session.commit()
        
        return send_file(
            file_path,
            as_attachment=True,
            download_name=share.file.name,
            mimetype=share.file.mime_type
        )
        
    except Exception as e:
        current_app.logger.error(f"下载分享文件失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': '下载失败'
        }), 500

@shares_bp.route('/preview/<token>', methods=['POST'])
def preview_shared_file(token):
    """预览分享文件（公开访问）"""
    try:
        share = PublicShare.query.filter_by(token=token).first()
        
        if not share:
            return jsonify({
                'success': False,
                'error': '分享链接不存在'
            }), 404
        
        # 检查分享是否有效
        if not share.is_active:
            return jsonify({
                'success': False,
                'error': '分享链接已被禁用'
            }), 403
        
        # 检查是否过期
        if share.expires_at and share.expires_at < datetime.utcnow():
            return jsonify({
                'success': False,
                'error': '分享链接已过期'
            }), 403
        
        # 检查是否允许预览
        if not share.allow_preview:
            return jsonify({
                'success': False,
                'error': '此分享不允许预览'
            }), 403
        
        # 检查密码
        data = request.get_json() or {}
        if share.password:
            provided_password = data.get('password')
            if not provided_password or provided_password != share.password:
                return jsonify({
                    'success': False,
                    'error': '密码错误'
                }), 401
        
        # 获取文件路径
        file_path = get_file_path(share.file.path)
        
        if not check_file_exists(file_path):
            return jsonify({
                'success': False,
                'error': '文件不存在'
            }), 404
        
        return send_file(
            file_path,
            mimetype=share.file.mime_type
        )
        
    except Exception as e:
        current_app.logger.error(f"预览分享文件失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': '预览失败'
        }), 500

@shares_bp.route('/<token>/save', methods=['POST'])
@jwt_required_with_user
def save_public_share_to_folder(current_user, token):
    """保存公共分享的文件到用户文件夹"""
    try:
        data = request.get_json()
        folder_id = data.get('folderId')
        
        if not folder_id:
            return jsonify({
                'success': False,
                'error': '目标文件夹ID不能为空'
            }), 400
        
        # 验证公共分享是否存在且有效
        share = PublicShare.query.filter_by(
            token=token,
            is_active=True
        ).first()
        
        if not share:
            return jsonify({
                'success': False,
                'error': '分享不存在或已被禁用'
            }), 404
        
        # 检查是否过期
        if share.expires_at and share.expires_at < datetime.utcnow():
            return jsonify({
                'success': False,
                'error': '分享已过期'
            }), 410
        
        # 检查密码
        if share.password:
            password = data.get('password')
            if not password or password != share.password:
                return jsonify({
                    'success': False,
                    'error': '需要密码访问'
                }), 401
        
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
        original_file = share.file
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
        import shutil
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
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '文件已成功保存到您的文件夹',
            'data': {
                'id': new_file.id,
                'name': new_file.name,
                'folderId': folder_id
            }
        })
        
    except Exception as e:
        db.session.rollback()
        current_app.logger.error(f"保存公共分享文件失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': '保存文件失败'
        }), 500