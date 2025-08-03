import os
import hashlib
import mimetypes
from functools import wraps
from flask import jsonify, request
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
from PIL import Image
import io
import base64

def allowed_file(filename, allowed_extensions=None):
    """检查文件扩展名是否允许"""
    if allowed_extensions is None:
        allowed_extensions = {
            'txt', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx',
            'xls', 'xlsx', 'ppt', 'pptx', 'zip', 'rar', '7z', 'mp3',
            'mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'
        }
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in allowed_extensions

def get_file_type(filename):
    """根据文件扩展名获取文件类型"""
    ext = filename.rsplit('.', 1)[1].lower() if '.' in filename else ''
    
    type_mapping = {
        # 图片
        'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image',
        'bmp': 'image', 'svg': 'image', 'webp': 'image',
        # 文档
        'pdf': 'document', 'doc': 'document', 'docx': 'document',
        'txt': 'document', 'rtf': 'document', 'odt': 'document',
        # 表格
        'xls': 'spreadsheet', 'xlsx': 'spreadsheet', 'csv': 'spreadsheet',
        'ods': 'spreadsheet',
        # 演示文稿
        'ppt': 'presentation', 'pptx': 'presentation', 'odp': 'presentation',
        # 视频
        'mp4': 'video', 'avi': 'video', 'mov': 'video', 'wmv': 'video',
        'flv': 'video', 'mkv': 'video', 'webm': 'video', '3gp': 'video',
        # 音频
        'mp3': 'audio', 'wav': 'audio', 'flac': 'audio', 'aac': 'audio',
        'ogg': 'audio', 'wma': 'audio',
        # 压缩文件
        'zip': 'archive', 'rar': 'archive', '7z': 'archive', 'tar': 'archive',
        'gz': 'archive', 'bz2': 'archive',
        # 代码
        'py': 'code', 'js': 'code', 'html': 'code', 'css': 'code',
        'php': 'code', 'java': 'code', 'cpp': 'code', 'c': 'code',
        'json': 'code', 'xml': 'code', 'sql': 'code'
    }
    
    return type_mapping.get(ext, 'other')

def get_file_size_str(size_bytes):
    """将字节数转换为可读的文件大小字符串"""
    if size_bytes == 0:
        return "0B"
    size_names = ["B", "KB", "MB", "GB", "TB"]
    i = 0
    while size_bytes >= 1024 and i < len(size_names) - 1:
        size_bytes /= 1024.0
        i += 1
    return f"{size_bytes:.1f}{size_names[i]}"

def generate_file_hash(file_path):
    """生成文件的MD5哈希值"""
    hash_md5 = hashlib.md5()
    try:
        with open(file_path, "rb") as f:
            for chunk in iter(lambda: f.read(4096), b""):
                hash_md5.update(chunk)
        return hash_md5.hexdigest()
    except Exception:
        return None

def create_thumbnail(file_path, max_size=(200, 200)):
    """为图片文件创建缩略图"""
    try:
        with Image.open(file_path) as img:
            # 转换为RGB模式（如果是RGBA或其他模式）
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            
            # 创建缩略图
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # 转换为base64
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG', quality=85)
            img_str = base64.b64encode(buffer.getvalue()).decode()
            return f"data:image/jpeg;base64,{img_str}"
    except Exception as e:
        print(f"创建缩略图失败: {e}")
        return None

def jwt_required_with_user(f):
    """JWT认证装饰器，同时返回用户信息，支持URL参数token"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # 首先尝试从Authorization头获取token
            try:
                verify_jwt_in_request()
                current_user_id = get_jwt_identity()
            except:
                # 如果头部认证失败，尝试从URL参数获取token
                from flask import request
                from flask_jwt_extended import decode_token
                
                token = request.args.get('token')
                if not token:
                    return jsonify({'error': '认证失败'}), 401
                
                try:
                    decoded_token = decode_token(token)
                    current_user_id = decoded_token['sub']
                except:
                    return jsonify({'error': '无效的token'}), 401
            
            # 导入放在函数内部避免循环导入
            from models import User
            current_user = User.query.get(current_user_id)
            
            if not current_user:
                return jsonify({'error': '用户不存在'}), 401
                
            return f(current_user, *args, **kwargs)
        except Exception as e:
            return jsonify({'error': '认证失败'}), 401
    
    return decorated_function

def admin_required(f):
    """管理员权限装饰器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            verify_jwt_in_request()
            current_user_id = get_jwt_identity()
            
            from models import User
            current_user = User.query.get(current_user_id)
            
            if not current_user or current_user.role != 'admin':
                return jsonify({'error': '需要管理员权限'}), 403
                
            return f(current_user, *args, **kwargs)
        except Exception as e:
            return jsonify({'error': '认证失败'}), 401
    
    return decorated_function

def validate_folder_path(user_id, folder_id):
    """验证文件夹路径是否属于用户"""
    if not folder_id:
        return True
    
    from models import Folder
    folder = Folder.query.filter_by(id=folder_id, user_id=user_id).first()
    return folder is not None

def get_folder_path(folder_id):
    """获取文件夹的完整路径"""
    if not folder_id:
        return '/'
    
    from models import Folder
    path_parts = []
    current_folder = Folder.query.get(folder_id)
    
    while current_folder:
        path_parts.insert(0, current_folder.name)
        current_folder = Folder.query.get(current_folder.parent_id) if current_folder.parent_id else None
    
    return '/' + '/'.join(path_parts) if path_parts else '/'

def get_file_path(relative_path):
    """获取文件的绝对路径"""
    if os.path.isabs(relative_path):
        return relative_path
    return os.path.abspath(relative_path)

def check_file_exists(file_path):
    """检查文件是否存在"""
    return os.path.exists(file_path) and os.path.isfile(file_path)

def safe_filename(filename):
    """生成安全的文件名"""
    # 移除或替换不安全的字符
    import re
    filename = re.sub(r'[<>:"/\\|?*]', '_', filename)
    filename = filename.strip('. ')
    
    # 确保文件名不为空
    if not filename:
        filename = 'unnamed_file'
    
    return filename

def get_mime_type(filename):
    """获取文件的MIME类型"""
    mime_type, _ = mimetypes.guess_type(filename)
    return mime_type or 'application/octet-stream'