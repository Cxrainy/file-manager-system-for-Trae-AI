from flask import Blueprint, request, jsonify, send_file, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from werkzeug.utils import secure_filename
from datetime import datetime
import os
import uuid
import mimetypes
from PIL import Image
import io
import base64
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import db, File, Folder, TrashItem
from utils import (jwt_required_with_user, allowed_file, get_file_type, 
                   get_file_size_str, generate_file_hash, create_thumbnail, 
                   validate_folder_path, safe_filename, get_mime_type)

files_bp = Blueprint('files', __name__)

# 允许的文件扩展名
ALLOWED_EXTENSIONS = {
    'image': {'png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'},
    'video': {'mp4', 'avi', 'mov', 'wmv', 'flv', 'webm', 'mkv'},
    'audio': {'mp3', 'wav', 'flac', 'aac', 'ogg', 'wma'},
    'document': {'pdf', 'doc', 'docx', 'txt', 'rtf', 'odt'},
    'spreadsheet': {'xls', 'xlsx', 'csv', 'ods'},
    'presentation': {'ppt', 'pptx', 'odp'},
    'archive': {'zip', 'rar', '7z', 'tar', 'gz'},
    'other': set()
}

def allowed_file(filename):
    """检查文件是否允许上传"""
    if '.' not in filename:
        return False
    
    ext = filename.rsplit('.', 1)[1].lower()
    for file_type, extensions in ALLOWED_EXTENSIONS.items():
        if ext in extensions:
            return True
    return True  # 允许其他类型文件

def get_file_type(filename):
    """根据文件名获取文件类型"""
    if '.' not in filename:
        return 'other'
    
    ext = filename.rsplit('.', 1)[1].lower()
    for file_type, extensions in ALLOWED_EXTENSIONS.items():
        if ext in extensions:
            return file_type
    return 'other'

def create_thumbnail(file_path, thumbnail_path, size=(200, 200)):
    """创建缩略图"""
    try:
        with Image.open(file_path) as img:
            img.thumbnail(size, Image.Resampling.LANCZOS)
            img.save(thumbnail_path, 'JPEG', quality=85)
            return True
    except Exception:
        return False

@files_bp.route('', methods=['GET'])
@jwt_required_with_user
def get_files(current_user):
    """获取文件列表"""
    try:
        user_id = current_user.id
        folder_id = request.args.get('folderId')
        
        query = File.query.filter_by(user_id=user_id)
        
        if folder_id:
            # 验证文件夹是否存在且属于当前用户
            folder = Folder.query.filter_by(id=folder_id, user_id=user_id).first()
            if not folder:
                return jsonify({
                    'success': False,
                    'error': '文件夹不存在'
                }), 404
            
            query = query.filter_by(folder_id=folder_id)
        
        files = query.order_by(File.uploaded_at.desc()).all()
        
        return jsonify({
            'success': True,
            'data': [file.to_dict() for file in files]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@files_bp.route('/<file_id>', methods=['GET'])
@jwt_required_with_user
def get_file(current_user, file_id):
    """获取文件详情"""
    try:
        user_id = current_user.id
        
        file = File.query.filter_by(id=file_id, user_id=user_id).first()
        if not file:
            return jsonify({
                'success': False,
                'error': '文件不存在'
            }), 404
        
        return jsonify({
            'success': True,
            'data': file.to_dict()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@files_bp.route('/upload', methods=['POST'])
@jwt_required_with_user
def upload_file(current_user):
    """上传文件"""
    try:
        user_id = current_user.id
        
        # 检查是否有文件
        if 'file' not in request.files:
            return jsonify({
                'success': False,
                'error': '没有选择文件'
            }), 400
        
        file = request.files['file']
        folder_id = request.form.get('folderId')
        
        if file.filename == '':
            return jsonify({
                'success': False,
                'error': '没有选择文件'
            }), 400
        
        if not folder_id:
            return jsonify({
                'success': False,
                'error': '必须指定目标文件夹'
            }), 400
        
        # 验证文件夹
        folder = Folder.query.filter_by(id=folder_id, user_id=user_id).first()
        if not folder:
            return jsonify({
                'success': False,
                'error': '目标文件夹不存在'
            }), 404
        
        # 检查是否为父级文件夹（父级文件夹不能直接存储文件）
        if folder.is_parent:
            return jsonify({
                'success': False,
                'error': '不能直接上传文件到父级文件夹，请选择子文件夹'
            }), 400
        
        if not allowed_file(file.filename):
            return jsonify({
                'success': False,
                'error': '不支持的文件类型'
            }), 400

        # 检查同名文件是否已存在
        original_filename = file.filename
        existing_file = File.query.filter_by(
            name=original_filename,
            folder_id=folder_id,
            user_id=user_id
        ).first()
        
        if existing_file:
            return jsonify({
                'success': False,
                'error': f'文件 "{original_filename}" 已存在于当前文件夹中'
            }), 409

        # 生成安全的文件名
        file_extension = os.path.splitext(original_filename)[1]
        safe_filename = str(uuid.uuid4()) + file_extension
        
        # 确保上传目录存在
        upload_dir = os.path.join('uploads', user_id)
        os.makedirs(upload_dir, exist_ok=True)
        
        # 保存文件
        file_path = os.path.join(upload_dir, safe_filename)
        file.save(file_path)
        
        # 获取文件信息
        file_size = os.path.getsize(file_path)
        mime_type, _ = mimetypes.guess_type(original_filename)
        if not mime_type:
            mime_type = 'application/octet-stream'
        
        file_type = File.get_file_type(mime_type)
        
        # 创建缩略图（仅对图片）
        thumbnail_path = None
        if file_type == 'image':
            thumbnail_filename = f"thumb_{safe_filename}"
            thumbnail_path = os.path.join(upload_dir, thumbnail_filename)
            if create_thumbnail(file_path, thumbnail_path):
                thumbnail_path = thumbnail_filename
            else:
                thumbnail_path = None
        
        # 保存文件记录
        file_record = File(
            name=original_filename,
            original_name=original_filename,
            filename=safe_filename,
            size=file_size,
            type=file_type,
            mime_type=mime_type,
            folder_id=folder_id,
            user_id=user_id,
            path=file_path,
            thumbnail_path=thumbnail_path
        )
        
        db.session.add(file_record)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': file_record.to_dict()
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@files_bp.route('/<file_id>', methods=['DELETE'])
@jwt_required_with_user
def delete_file(current_user, file_id):
    """删除文件"""
    try:
        user_id = current_user.id
        
        file = File.query.filter_by(id=file_id, user_id=user_id).first()
        if not file:
            return jsonify({
                'success': False,
                'error': '文件不存在'
            }), 404
        
        # 移动到回收站
        folder_path = _get_file_folder_path(file)
        trash_item = TrashItem(
            item_type='file',
            item_id=file.id,
            name=file.name,
            original_path=folder_path + '/' + file.name,
            user_id=user_id
        )
        db.session.add(trash_item)
        
        # 删除物理文件
        try:
            if os.path.exists(file.path):
                os.remove(file.path)
            if file.thumbnail_path and os.path.exists(os.path.join(os.path.dirname(file.path), file.thumbnail_path)):
                os.remove(os.path.join(os.path.dirname(file.path), file.thumbnail_path))
        except Exception:
            pass  # 忽略文件删除错误
        
        db.session.delete(file)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '文件删除成功'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@files_bp.route('/batch', methods=['DELETE'])
@jwt_required_with_user
def delete_files(current_user):
    """批量删除文件"""
    try:
        user_id = current_user.id
        data = request.get_json()
        file_ids = data.get('ids', [])
        
        if not file_ids:
            return jsonify({
                'success': False,
                'error': '没有指定要删除的文件'
            }), 400
        
        files = File.query.filter(
            File.id.in_(file_ids),
            File.user_id == user_id
        ).all()
        
        if len(files) != len(file_ids):
            return jsonify({
                'success': False,
                'error': '部分文件不存在或无权限'
            }), 404
        
        # 批量移动到回收站并删除
        for file in files:
            folder_path = _get_file_folder_path(file)
            trash_item = TrashItem(
                item_type='file',
                item_id=file.id,
                name=file.name,
                original_path=folder_path + '/' + file.name,
                user_id=user_id
            )
            db.session.add(trash_item)
            
            # 删除物理文件
            try:
                if os.path.exists(file.path):
                    os.remove(file.path)
                if file.thumbnail_path and os.path.exists(os.path.join(os.path.dirname(file.path), file.thumbnail_path)):
                    os.remove(os.path.join(os.path.dirname(file.path), file.thumbnail_path))
            except Exception:
                pass
            
            db.session.delete(file)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'成功删除 {len(files)} 个文件'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@files_bp.route('/<file_id>/rename', methods=['PUT'])
@jwt_required_with_user
def rename_file(current_user, file_id):
    """重命名文件"""
    try:
        user_id = current_user.id
        data = request.get_json()
        
        file = File.query.filter_by(id=file_id, user_id=user_id).first()
        if not file:
            return jsonify({
                'success': False,
                'error': '文件不存在'
            }), 404
        
        new_name = data.get('name')
        if not new_name:
            return jsonify({
                'success': False,
                'error': '文件名不能为空'
            }), 400
        
        # 检查同文件夹下是否已有同名文件
        existing = File.query.filter(
            File.name == new_name,
            File.folder_id == file.folder_id,
            File.user_id == user_id,
            File.id != file_id
        ).first()
        
        if existing:
            return jsonify({
                'success': False,
                'error': '文件夹中已存在同名文件'
            }), 409
        
        file.name = new_name
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': file.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@files_bp.route('/<file_id>/move', methods=['PUT'])
@jwt_required_with_user
def move_file(current_user, file_id):
    """移动文件"""
    try:
        user_id = current_user.id
        data = request.get_json()
        
        file = File.query.filter_by(id=file_id, user_id=user_id).first()
        if not file:
            return jsonify({
                'success': False,
                'error': '文件不存在'
            }), 404
        
        folder_id = data.get('folderId')
        if not folder_id:
            return jsonify({
                'success': False,
                'error': '必须指定目标文件夹'
            }), 400
        
        # 验证目标文件夹
        folder = Folder.query.filter_by(id=folder_id, user_id=user_id).first()
        if not folder:
            return jsonify({
                'success': False,
                'error': '目标文件夹不存在'
            }), 404
        
        # 检查是否为父级文件夹
        if folder.is_parent:
            return jsonify({
                'success': False,
                'error': '不能移动文件到父级文件夹，请选择子文件夹'
            }), 400
        
        # 检查目标文件夹是否已有同名文件
        existing = File.query.filter(
            File.name == file.name,
            File.folder_id == folder_id,
            File.user_id == user_id,
            File.id != file_id
        ).first()
        
        if existing:
            return jsonify({
                'success': False,
                'error': '目标文件夹中已存在同名文件'
            }), 409
        
        file.folder_id = folder_id
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': file.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@files_bp.route('/batch/move', methods=['PUT'])
@jwt_required_with_user
def move_files(current_user):
    """批量移动文件"""
    try:
        user_id = current_user.id
        data = request.get_json()
        
        file_ids = data.get('ids', [])
        folder_id = data.get('folderId')
        
        if not file_ids:
            return jsonify({
                'success': False,
                'error': '没有指定要移动的文件'
            }), 400
        
        if not folder_id:
            return jsonify({
                'success': False,
                'error': '必须指定目标文件夹'
            }), 400
        
        # 验证目标文件夹
        folder = Folder.query.filter_by(id=folder_id, user_id=user_id).first()
        if not folder:
            return jsonify({
                'success': False,
                'error': '目标文件夹不存在'
            }), 404
        
        if folder.is_parent:
            return jsonify({
                'success': False,
                'error': '不能移动文件到父级文件夹，请选择子文件夹'
            }), 400
        
        files = File.query.filter(
            File.id.in_(file_ids),
            File.user_id == user_id
        ).all()
        
        if len(files) != len(file_ids):
            return jsonify({
                'success': False,
                'error': '部分文件不存在或无权限'
            }), 404
        
        # 检查目标文件夹中是否有同名文件
        existing_names = {f.name for f in File.query.filter_by(folder_id=folder_id, user_id=user_id).all()}
        conflict_files = [f.name for f in files if f.name in existing_names and f.folder_id != folder_id]
        
        if conflict_files:
            return jsonify({
                'success': False,
                'error': f'目标文件夹中已存在同名文件: {", ".join(conflict_files)}'
            }), 409
        
        # 批量移动
        for file in files:
            file.folder_id = folder_id
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'成功移动 {len(files)} 个文件'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@files_bp.route('/<file_id>/download', methods=['GET'])
@jwt_required_with_user
def download_file(current_user, file_id):
    """下载文件"""
    try:
        user_id = current_user.id
        
        file = File.query.filter_by(id=file_id, user_id=user_id).first()
        if not file:
            return jsonify({
                'success': False,
                'error': '文件不存在'
            }), 404
        
        if not os.path.exists(file.path):
            return jsonify({
                'success': False,
                'error': '文件已损坏或丢失'
            }), 404
        
        return send_file(
            file.path,
            as_attachment=True,
            download_name=file.name,
            mimetype=file.mime_type
        )
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@files_bp.route('/<file_id>/preview', methods=['GET'])
@jwt_required_with_user
def preview_file(current_user, file_id):
    """预览文件"""
    try:
        user_id = current_user.id
        
        file = File.query.filter_by(id=file_id, user_id=user_id).first()
        if not file:
            return jsonify({
                'success': False,
                'error': '文件不存在'
            }), 404
        
        if not os.path.exists(file.path):
            return jsonify({
                'success': False,
                'error': '文件已损坏或丢失'
            }), 404
        
        # 获取文件类型
        file_type = get_file_type(file.name)
        
        # 对于文本类型文件，返回文本内容
        if file_type in ['document', 'spreadsheet'] or file.name.lower().endswith(('.txt', '.md', '.markdown', '.json', '.xml', '.csv', '.js', '.ts', '.jsx', '.tsx', '.html', '.css', '.scss', '.py', '.java', '.cpp', '.c', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.dart', '.vue', '.yml', '.yaml', '.toml', '.ini', '.cfg', '.conf')):
            try:
                with open(file.path, 'r', encoding='utf-8') as f:
                    content = f.read()
                return content, 200, {'Content-Type': 'text/plain; charset=utf-8'}
            except UnicodeDecodeError:
                # 如果UTF-8解码失败，尝试其他编码
                try:
                    with open(file.path, 'r', encoding='gbk') as f:
                        content = f.read()
                    return content, 200, {'Content-Type': 'text/plain; charset=utf-8'}
                except:
                    # 如果仍然失败，返回二进制文件
                    return send_file(file.path, mimetype=file.mime_type)
        
        # 对于其他类型文件（图片、视频、音频等），返回文件流
        return send_file(
            file.path,
            mimetype=file.mime_type,
            as_attachment=False
        )
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@files_bp.route('/<file_id>/thumbnail', methods=['GET'])
@jwt_required_with_user
def get_thumbnail(current_user, file_id):
    """获取缩略图"""
    try:
        user_id = current_user.id
        
        file = File.query.filter_by(id=file_id, user_id=user_id).first()
        if not file or not file.thumbnail_path:
            return jsonify({
                'success': False,
                'error': '缩略图不存在'
            }), 404
        
        thumbnail_full_path = os.path.join(os.path.dirname(file.path), file.thumbnail_path)
        if not os.path.exists(thumbnail_full_path):
            return jsonify({
                'success': False,
                'error': '缩略图文件丢失'
            }), 404
        
        return send_file(
            thumbnail_full_path,
            mimetype='image/jpeg'
        )
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@files_bp.route('/search', methods=['GET'])
@jwt_required_with_user
def search_files(current_user):
    """搜索文件"""
    try:
        user_id = current_user.id
        
        query_text = request.args.get('query', '')
        file_type = request.args.get('fileType') or request.args.get('type')
        folder_id = request.args.get('folderId')
        sort_by = request.args.get('sortBy', 'uploadedAt')
        sort_order = request.args.get('sortOrder', 'desc')
        page = int(request.args.get('page', 1))
        limit = int(request.args.get('limit', 20))
        
        # 构建查询
        query = File.query.filter_by(user_id=user_id)
        
        if query_text:
            query = query.filter(File.name.contains(query_text))
        
        if file_type and file_type != 'all':
            # 映射前端文件类型到后端文件类型
            if file_type == 'document':
                # 文档类型包括document、spreadsheet、presentation、text
                query = query.filter(File.type.in_(['document', 'spreadsheet', 'presentation', 'text']))
            elif file_type == 'code':
                # 代码类型映射到text类型
                query = query.filter_by(type='text')
            else:
                # 其他类型直接匹配
                query = query.filter_by(type=file_type)
        
        if folder_id:
            query = query.filter_by(folder_id=folder_id)
        
        # 排序
        if sort_by == 'name':
            order_column = File.name
        elif sort_by == 'size':
            order_column = File.size
        else:
            order_column = File.uploaded_at
        
        if sort_order == 'desc':
            query = query.order_by(order_column.desc())
        else:
            query = query.order_by(order_column.asc())
        
        # 分页
        total = query.count()
        files = query.offset((page - 1) * limit).limit(limit).all()
        
        return jsonify({
            'success': True,
            'data': {
                'files': [file.to_dict() for file in files],
                'total': total
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def _get_file_folder_path(file):
    """获取文件所在文件夹的完整路径"""
    folder = file.folder
    path_parts = [folder.name]
    current = folder.parent
    
    while current:
        path_parts.insert(0, current.name)
        current = current.parent
    
    return '/' + '/'.join(path_parts)