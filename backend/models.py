from datetime import datetime
import uuid
import random
import string
from database import db

def generate_user_code():
    """生成8位用户代码"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

class User(db.Model):
    """用户模型"""
    __tablename__ = 'users'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    avatar = db.Column(db.String(255), nullable=True)
    role = db.Column(db.String(20), default='user')  # 'admin' or 'user'
    user_code = db.Column(db.String(8), unique=True, nullable=False, default=generate_user_code)  # 用户代码
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # 关系
    folders = db.relationship('Folder', backref='owner', lazy=True, cascade='all, delete-orphan')
    files = db.relationship('File', backref='owner', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email,
            'avatar': self.avatar,
            'role': self.role,
            'userCode': self.user_code,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }

class Folder(db.Model):
    """文件夹模型"""
    __tablename__ = 'folders'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)
    parent_id = db.Column(db.String(36), db.ForeignKey('folders.id'), nullable=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    is_parent = db.Column(db.Boolean, default=False)  # 是否为父级文件夹
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # 关系
    parent = db.relationship('Folder', remote_side=[id], backref='children')
    files = db.relationship('File', backref='folder', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self, include_children=False):
        result = {
            'id': self.id,
            'name': self.name,
            'parentId': self.parent_id,
            'isParent': self.is_parent,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }
        
        if include_children:
            result['children'] = [child.to_dict() for child in self.children]
            
        return result
    
    def get_file_count(self):
        """获取文件夹中的文件数量（包括子文件夹）"""
        count = len(self.files)
        for child in self.children:
            count += child.get_file_count()
        return count
    
    def get_total_size(self):
        """获取文件夹总大小（包括子文件夹）"""
        size = sum(file.size for file in self.files)
        for child in self.children:
            size += child.get_total_size()
        return size

class File(db.Model):
    """文件模型"""
    __tablename__ = 'files'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    name = db.Column(db.String(255), nullable=False)  # 显示名称
    original_name = db.Column(db.String(255), nullable=False)  # 原始文件名
    filename = db.Column(db.String(255), nullable=False)  # 存储的文件名
    size = db.Column(db.BigInteger, nullable=False)
    type = db.Column(db.String(50), nullable=False)  # 文件类型分类
    mime_type = db.Column(db.String(100), nullable=False)  # MIME类型
    folder_id = db.Column(db.String(36), db.ForeignKey('folders.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    path = db.Column(db.String(500), nullable=False)  # 文件存储路径
    thumbnail_path = db.Column(db.String(500), nullable=True)  # 缩略图路径
    tags = db.Column(db.Text, nullable=True)  # JSON格式的标签
    uploaded_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # 关系
    shares = db.relationship('FileShare', backref='file', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self, include_url=True):
        # 为前端提供统一的文件类型映射
        frontend_type = self.type
        if self.type in ['document', 'spreadsheet', 'presentation']:
            frontend_type = 'document'
        elif self.type == 'text':
            # 根据文件扩展名判断是否为代码文件
            if self.name:
                ext = self.name.lower().split('.')[-1] if '.' in self.name else ''
                code_extensions = {'js', 'ts', 'jsx', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'css', 'html', 'xml', 'json', 'php', 'rb', 'go', 'rs', 'swift', 'kt', 'scala', 'sh', 'bat', 'ps1', 'sql', 'yaml', 'yml', 'toml', 'ini', 'cfg', 'conf'}
                if ext in code_extensions:
                    frontend_type = 'code'
                else:
                    frontend_type = 'document'
        
        result = {
            'id': self.id,
            'name': self.name,
            'originalName': self.original_name,
            'size': self.size,
            'type': frontend_type,  # 使用映射后的前端类型
            'mimeType': self.mime_type,
            'folderId': self.folder_id,
            'uploadedAt': self.uploaded_at.isoformat() if self.uploaded_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None,
            'tags': self.get_tags()
        }
        
        if include_url:
            result['url'] = f'/api/files/{self.id}/download'
            if self.thumbnail_path:
                result['thumbnailUrl'] = f'/api/files/{self.id}/thumbnail'
                
        return result
    
    def get_tags(self):
        """获取标签列表"""
        if self.tags:
            import json
            try:
                return json.loads(self.tags)
            except:
                return []
        return []
    
    def set_tags(self, tags_list):
        """设置标签列表"""
        import json
        self.tags = json.dumps(tags_list) if tags_list else None
    
    @staticmethod
    def get_file_type(mime_type):
        """根据MIME类型确定文件分类"""
        if mime_type.startswith('image/'):
            return 'image'
        elif mime_type.startswith('video/'):
            return 'video'
        elif mime_type.startswith('audio/'):
            return 'audio'
        elif mime_type in ['application/pdf']:
            return 'document'
        elif mime_type in ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']:
            return 'document'
        elif mime_type in ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']:
            return 'spreadsheet'
        elif mime_type in ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']:
            return 'presentation'
        elif mime_type.startswith('text/'):
            return 'text'
        elif mime_type in ['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed', 'application/gzip', 'application/x-tar']:
            return 'archive'
        elif mime_type in ['application/javascript', 'application/json', 'application/xml']:
            return 'text'  # 代码文件归类为text
        else:
            return 'other'

class FileShare(db.Model):
    """文件分享模型"""
    __tablename__ = 'file_shares'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    file_id = db.Column(db.String(36), db.ForeignKey('files.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    share_url = db.Column(db.String(255), unique=True, nullable=False)
    password = db.Column(db.String(255), nullable=True)
    expires_at = db.Column(db.DateTime, nullable=True)
    download_count = db.Column(db.Integer, default=0)
    max_downloads = db.Column(db.Integer, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    # 关系
    user = db.relationship('User', backref='shares')
    
    def to_dict(self):
        return {
            'id': self.id,
            'fileId': self.file_id,
            'shareUrl': self.share_url,
            'expiresAt': self.expires_at.isoformat() if self.expires_at else None,
            'downloadCount': self.download_count,
            'maxDownloads': self.max_downloads,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }
    
    def is_expired(self):
        """检查分享是否已过期"""
        if self.expires_at and datetime.utcnow() > self.expires_at:
            return True
        if self.max_downloads and self.download_count >= self.max_downloads:
            return True
        return False

class TrashItem(db.Model):
    """回收站项目模型"""
    __tablename__ = 'trash_items'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    item_type = db.Column(db.String(20), nullable=False)  # 'file' or 'folder'
    item_id = db.Column(db.String(36), nullable=False)  # 原始项目ID
    name = db.Column(db.String(255), nullable=False)
    original_path = db.Column(db.String(500), nullable=False)  # 原始路径信息
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    deleted_at = db.Column(db.DateTime, default=datetime.now)
    
    # 关系
    user = db.relationship('User', backref='trash_items')
    
    def to_dict(self):
        return {
            'id': self.id,
            'itemType': self.item_type,
            'itemId': self.item_id,
            'name': self.name,
            'originalPath': self.original_path,
            'deletedAt': self.deleted_at.isoformat() if self.deleted_at else None
        }

class Friendship(db.Model):
    """好友关系模型"""
    __tablename__ = 'friendships'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    friend_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.String(20), default='pending')  # 'pending', 'accepted', 'blocked'
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # 关系
    user = db.relationship('User', foreign_keys=[user_id], backref='sent_friend_requests')
    friend = db.relationship('User', foreign_keys=[friend_id], backref='received_friend_requests')
    
    # 唯一约束
    __table_args__ = (db.UniqueConstraint('user_id', 'friend_id', name='unique_friendship'),)
    
    def to_dict(self):
        return {
            'id': self.id,
            'userId': self.user_id,
            'friendId': self.friend_id,
            'status': self.status,
            'user': self.user.to_dict() if self.user else None,
            'friend': self.friend.to_dict() if self.friend else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }

class ChatMessage(db.Model):
    """聊天消息模型"""
    __tablename__ = 'chat_messages'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    sender_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    receiver_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    message_type = db.Column(db.String(20), default='text')  # 'text', 'file', 'image'
    content = db.Column(db.Text, nullable=False)
    file_id = db.Column(db.String(36), db.ForeignKey('files.id'), nullable=True)  # 如果是文件消息
    is_read = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now)
    
    # 关系
    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_messages')
    receiver = db.relationship('User', foreign_keys=[receiver_id], backref='received_messages')
    file = db.relationship('File', backref='chat_messages')
    
    def to_dict(self):
        return {
            'id': self.id,
            'senderId': self.sender_id,
            'receiverId': self.receiver_id,
            'messageType': self.message_type,
            'content': self.content,
            'fileId': self.file_id,
            'isRead': self.is_read,
            'sender': self.sender.to_dict() if self.sender else None,
            'receiver': self.receiver.to_dict() if self.receiver else None,
            'file': self.file.to_dict() if self.file else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None
        }

class PublicShare(db.Model):
    """公共文件分享模型"""
    __tablename__ = 'public_shares'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    file_id = db.Column(db.String(36), db.ForeignKey('files.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    token = db.Column(db.String(64), unique=True, nullable=False)  # 分享token
    password = db.Column(db.String(255), nullable=True)  # 访问密码
    expires_at = db.Column(db.DateTime, nullable=True)  # 过期时间
    allow_download = db.Column(db.Boolean, default=True)  # 是否允许下载
    allow_preview = db.Column(db.Boolean, default=True)  # 是否允许预览
    max_downloads = db.Column(db.Integer, nullable=True)  # 最大下载次数
    download_count = db.Column(db.Integer, default=0)  # 下载次数
    view_count = db.Column(db.Integer, default=0)  # 查看次数
    description = db.Column(db.Text, nullable=True)  # 分享描述
    is_active = db.Column(db.Boolean, default=True)  # 是否激活
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # 关系
    file = db.relationship('File', backref='public_shares')
    user = db.relationship('User', backref='public_shares')
    
    def to_dict(self):
        return {
            'id': self.id,
            'fileId': self.file_id,
            'userId': self.user_id,
            'token': self.token,
            'password': self.password,
            'expiresAt': self.expires_at.isoformat() if self.expires_at else None,
            'allowDownload': self.allow_download,
            'allowPreview': self.allow_preview,
            'maxDownloads': self.max_downloads,
            'downloadCount': self.download_count,
            'viewCount': self.view_count,
            'description': self.description,
            'isActive': self.is_active,
            'file': self.file.to_dict() if self.file else None,
            'user': self.user.to_dict() if self.user else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }
    
    def is_expired(self):
        """检查分享是否已过期"""
        if not self.is_active:
            return True
        if self.expires_at and datetime.utcnow() > self.expires_at:
            return True
        if self.max_downloads and self.download_count >= self.max_downloads:
            return True
        return False

class FriendFileShare(db.Model):
    """好友文件分享模型"""
    __tablename__ = 'friend_file_shares'
    
    id = db.Column(db.String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    file_id = db.Column(db.String(36), db.ForeignKey('files.id'), nullable=False)
    sender_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    receiver_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    message = db.Column(db.Text, nullable=True)  # 分享时的留言
    status = db.Column(db.String(20), default='pending')  # 'pending', 'accepted', 'rejected', 'saved'
    saved_folder_id = db.Column(db.String(36), db.ForeignKey('folders.id'), nullable=True)  # 保存到的文件夹
    created_at = db.Column(db.DateTime, default=datetime.now)
    updated_at = db.Column(db.DateTime, default=datetime.now, onupdate=datetime.now)
    
    # 关系
    file = db.relationship('File', backref='friend_shares')
    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_file_shares')
    receiver = db.relationship('User', foreign_keys=[receiver_id], backref='received_file_shares')
    saved_folder = db.relationship('Folder', backref='shared_files')
    
    def to_dict(self):
        return {
            'id': self.id,
            'fileId': self.file_id,
            'senderId': self.sender_id,
            'receiverId': self.receiver_id,
            'message': self.message,
            'status': self.status,
            'savedFolderId': self.saved_folder_id,
            'file': self.file.to_dict() if self.file else None,
            'sender': self.sender.to_dict() if self.sender else None,
            'receiver': self.receiver.to_dict() if self.receiver else None,
            'savedFolder': self.saved_folder.to_dict() if self.saved_folder else None,
            'createdAt': self.created_at.isoformat() if self.created_at else None,
            'updatedAt': self.updated_at.isoformat() if self.updated_at else None
        }