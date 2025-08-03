from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime, timedelta
import os
import psutil
import shutil
import sqlite3
import platform
import json
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import db, File, Folder, User, TrashItem
from utils import jwt_required_with_user, admin_required, get_file_size_str

system_bp = Blueprint('system', __name__)

@system_bp.route('/info', methods=['GET'])
@jwt_required()
def get_system_info():
    """获取系统信息"""
    try:
        # 获取系统基本信息
        system_info = {
            'platform': platform.system(),
            'platform_version': platform.version(),
            'python_version': platform.python_version(),
            'architecture': platform.architecture()[0]
        }
        
        # 获取存储信息
        upload_dir = 'uploads'
        if os.path.exists(upload_dir):
            # 计算上传目录大小
            total_size = 0
            for dirpath, dirnames, filenames in os.walk(upload_dir):
                for filename in filenames:
                    filepath = os.path.join(dirpath, filename)
                    if os.path.exists(filepath):
                        total_size += os.path.getsize(filepath)
            
            # 获取磁盘使用情况
            disk_usage = psutil.disk_usage('.')
            storage_info = {
                'used': total_size,
                'total': disk_usage.total,
                'free': disk_usage.free,
                'upload_dir_size': total_size
            }
        else:
            storage_info = {
                'used': 0,
                'total': 0,
                'free': 0,
                'upload_dir_size': 0
            }
        
        # 获取系统运行时间（这里简化为应用启动时间）
        uptime = 0  # 实际应用中可以记录应用启动时间
        
        return jsonify({
            'success': True,
            'data': {
                'version': '1.0.0',
                'uptime': uptime,
                'storage': storage_info,
                'system': system_info
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@system_bp.route('/health', methods=['GET'])
def health_check():
    """健康检查"""
    try:
        # 检查数据库连接
        db.session.execute('SELECT 1')
        
        # 检查上传目录
        upload_dir = 'uploads'
        upload_dir_accessible = os.path.exists(upload_dir) and os.access(upload_dir, os.W_OK)
        
        # 获取系统资源使用情况
        memory_usage = psutil.virtual_memory().percent
        cpu_usage = psutil.cpu_percent(interval=1)
        disk_usage = psutil.disk_usage('.').percent
        
        # 判断系统健康状态
        status = 'healthy'
        issues = []
        
        if not upload_dir_accessible:
            issues.append('Upload directory not accessible')
            status = 'warning'
        
        if memory_usage > 90:
            issues.append('High memory usage')
            status = 'warning'
        
        if cpu_usage > 90:
            issues.append('High CPU usage')
            status = 'warning'
        
        if disk_usage > 95:
            issues.append('Low disk space')
            status = 'critical'
        
        return jsonify({
            'success': True,
            'data': {
                'status': status,
                'timestamp': datetime.utcnow().isoformat(),
                'checks': {
                    'database': 'ok',
                    'upload_directory': 'ok' if upload_dir_accessible else 'error',
                    'memory_usage': f'{memory_usage}%',
                    'cpu_usage': f'{cpu_usage}%',
                    'disk_usage': f'{disk_usage}%'
                },
                'issues': issues
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'data': {
                'status': 'error',
                'timestamp': datetime.utcnow().isoformat(),
                'error': str(e)
            }
        }), 500

@system_bp.route('/stats', methods=['GET'])
@jwt_required()
def get_system_stats():
    """获取系统统计信息"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        # 检查是否为管理员
        if not user or user.role != 'admin':
            return jsonify({
                'success': False,
                'error': '权限不足'
            }), 403
        
        # 系统级统计
        total_users = User.query.count()
        total_files = File.query.count()
        total_folders = Folder.query.count()
        
        # 计算总存储使用量
        from sqlalchemy import func
        total_storage_result = db.session.query(func.sum(File.size)).scalar()
        total_storage = total_storage_result or 0
        
        # 活跃用户（最近30天有上传活动的用户）
        from datetime import timedelta
        thirty_days_ago = datetime.utcnow() - timedelta(days=30)
        active_users = db.session.query(File.user_id).filter(
            File.uploaded_at >= thirty_days_ago
        ).distinct().count()
        
        # 按用户统计
        user_stats = db.session.query(
            User.username,
            func.count(File.id).label('file_count'),
            func.sum(File.size).label('storage_used')
        ).outerjoin(File).group_by(User.id, User.username).all()
        
        user_statistics = []
        for stat in user_stats:
            user_statistics.append({
                'username': stat.username,
                'fileCount': stat.file_count or 0,
                'storageUsed': stat.storage_used or 0
            })
        
        return jsonify({
            'success': True,
            'data': {
                'totalUsers': total_users,
                'totalFiles': total_files,
                'totalFolders': total_folders,
                'totalStorage': total_storage,
                'activeUsers': active_users,
                'userStatistics': user_statistics
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@system_bp.route('/cleanup', methods=['POST'])
@jwt_required()
def cleanup_system():
    """系统清理"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        # 检查是否为管理员
        if not user or user.role != 'admin':
            return jsonify({
                'success': False,
                'error': '权限不足'
            }), 403
        
        data = request.get_json()
        cleanup_type = data.get('type', 'orphaned_files')
        
        cleaned_count = 0
        cleaned_size = 0
        
        if cleanup_type == 'orphaned_files':
            # 清理孤立文件（数据库中不存在但物理文件存在）
            upload_dir = 'uploads'
            if os.path.exists(upload_dir):
                for root, dirs, files in os.walk(upload_dir):
                    for filename in files:
                        filepath = os.path.join(root, filename)
                        # 检查文件是否在数据库中存在
                        file_record = File.query.filter_by(filename=filename).first()
                        if not file_record:
                            try:
                                file_size = os.path.getsize(filepath)
                                os.remove(filepath)
                                cleaned_count += 1
                                cleaned_size += file_size
                            except Exception:
                                pass
        
        elif cleanup_type == 'missing_files':
            # 清理数据库中存在但物理文件不存在的记录
            files = File.query.all()
            for file in files:
                if not os.path.exists(file.path):
                    cleaned_size += file.size
                    db.session.delete(file)
                    cleaned_count += 1
            
            db.session.commit()
        
        elif cleanup_type == 'empty_folders':
            # 清理空文件夹（没有文件的文件夹）
            folders = Folder.query.all()
            for folder in folders:
                if len(folder.files) == 0 and len(folder.children) == 0 and not folder.is_parent:
                    db.session.delete(folder)
                    cleaned_count += 1
            
            db.session.commit()
        
        return jsonify({
            'success': True,
            'data': {
                'cleanupType': cleanup_type,
                'cleanedCount': cleaned_count,
                'cleanedSize': cleaned_size
            }
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@system_bp.route('/backup', methods=['POST'])
@jwt_required()
def create_backup():
    """创建系统备份"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        # 检查是否为管理员
        if not user or user.role != 'admin':
            return jsonify({
                'success': False,
                'error': '权限不足'
            }), 403
        
        # 这里应该实现实际的备份逻辑
        # 例如：备份数据库、备份上传的文件等
        
        backup_filename = f"backup_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.sql"
        
        # 简化的备份信息返回
        return jsonify({
            'success': True,
            'data': {
                'backupFile': backup_filename,
                'timestamp': datetime.utcnow().isoformat(),
                'message': '备份创建成功（演示版本）'
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@system_bp.route('/logs', methods=['GET'])
@jwt_required()
def get_system_logs():
    """获取系统日志"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        # 检查是否为管理员
        if not user or user.role != 'admin':
            return jsonify({
                'success': False,
                'error': '权限不足'
            }), 403
        
        # 这里应该实现实际的日志读取逻辑
        # 简化的日志信息返回
        logs = [
            {
                'timestamp': datetime.now().isoformat(),
                'level': 'INFO',
                'message': 'System started successfully',
                'module': 'system'
            },
            {
                'timestamp': (datetime.now() - timedelta(minutes=5)).isoformat(),
                'level': 'INFO',
                'message': 'User logged in',
                'module': 'auth'
            }
        ]
        
        return jsonify({
            'success': True,
            'data': logs
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@system_bp.route('/performance', methods=['GET'])
@jwt_required()
def get_performance_stats():
    """获取系统性能统计"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        # 检查是否为管理员
        if not user or user.role != 'admin':
            return jsonify({
                'success': False,
                'error': '权限不足'
            }), 403
        
        # 获取系统性能数据
        cpu_percent = psutil.cpu_percent(interval=1)
        memory = psutil.virtual_memory()
        disk = psutil.disk_usage('.')
        
        # 获取网络统计
        network = psutil.net_io_counters()
        
        return jsonify({
            'success': True,
            'data': {
                'cpu': {
                    'usage': cpu_percent,
                    'cores': psutil.cpu_count()
                },
                'memory': {
                    'total': memory.total,
                    'available': memory.available,
                    'used': memory.used,
                    'percent': memory.percent
                },
                'disk': {
                    'total': disk.total,
                    'used': disk.used,
                    'free': disk.free,
                    'percent': (disk.used / disk.total) * 100
                },
                'network': {
                    'bytes_sent': network.bytes_sent,
                    'bytes_recv': network.bytes_recv,
                    'packets_sent': network.packets_sent,
                    'packets_recv': network.packets_recv
                }
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@system_bp.route('/config', methods=['GET'])
@jwt_required()
def get_system_config():
    """获取系统配置"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        # 检查是否为管理员
        if not user or user.role != 'admin':
            return jsonify({
                'success': False,
                'error': '权限不足'
            }), 403
        
        # 读取系统配置
        config_file = 'system_config.json'
        default_config = {
            'backup': {
                'enabled': True,
                'frequency': 'daily',
                'retention': 30
            },
            'maintenance': {
                'mode': False,
                'scheduled': None
            },
            'updates': {
                'auto_update': True,
                'check_interval': 24,
                'last_check': datetime.now().isoformat()
            },
            'monitoring': {
                'performance_monitoring': True,
                'error_reporting': True,
                'log_level': 'INFO',
                'max_log_size': 100
            },
            'security': {
                'session_timeout': 24,
                'max_login_attempts': 5,
                'password_policy': {
                    'min_length': 8,
                    'require_uppercase': True,
                    'require_lowercase': True,
                    'require_numbers': True,
                    'require_symbols': False
                }
            },
            'storage': {
                'max_file_size': 104857600,  # 100MB
                'allowed_extensions': ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.txt', '.md', '.doc', '.docx'],
                'auto_cleanup': False,
                'cleanup_days': 30
            }
        }
        
        if os.path.exists(config_file):
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)
                    # 合并默认配置
                    for key, value in default_config.items():
                        if key not in config:
                            config[key] = value
            except:
                config = default_config
        else:
            config = default_config
        
        return jsonify({
            'success': True,
            'data': config
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@system_bp.route('/config', methods=['PUT'])
@jwt_required()
def update_system_config():
    """更新系统配置"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        # 检查是否为管理员
        if not user or user.role != 'admin':
            return jsonify({
                'success': False,
                'error': '权限不足'
            }), 403
        
        data = request.get_json()
        if not data:
            return jsonify({
                'success': False,
                'error': '无效的请求数据'
            }), 400
        
        config_file = 'system_config.json'
        
        # 读取现有配置
        if os.path.exists(config_file):
            try:
                with open(config_file, 'r', encoding='utf-8') as f:
                    config = json.load(f)
            except:
                config = {}
        else:
            config = {}
        
        # 更新配置
        config.update(data)
        
        # 保存配置
        try:
            with open(config_file, 'w', encoding='utf-8') as f:
                json.dump(config, f, ensure_ascii=False, indent=2)
            
            return jsonify({
                'success': True,
                'data': config,
                'message': '系统配置更新成功'
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'配置保存失败: {str(e)}'
            }), 500
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500