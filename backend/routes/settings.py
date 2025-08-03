from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import os
import sys
import json
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import db, User
from utils import jwt_required_with_user

settings_bp = Blueprint('settings', __name__)

# 设置文件路径
SETTINGS_DIR = 'settings'
if not os.path.exists(SETTINGS_DIR):
    os.makedirs(SETTINGS_DIR)

def get_user_settings_file(user_id):
    """获取用户设置文件路径"""
    return os.path.join(SETTINGS_DIR, f'user_{user_id}_settings.json')

def load_user_settings(user_id):
    """加载用户设置"""
    settings_file = get_user_settings_file(user_id)
    if os.path.exists(settings_file):
        try:
            with open(settings_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    
    # 返回默认设置
    return {
        'general': {
            'theme': 'light',
            'language': 'zh-CN',
            'timezone': 'Asia/Shanghai',
            'dateFormat': 'YYYY-MM-DD',
            'timeFormat': '24h'
        },
        'notifications': {
            'emailNotifications': True,
            'pushNotifications': True,
            'soundEnabled': True,
            'desktopNotifications': True
        },
        'privacy': {
            'profileVisibility': 'friends',
            'showOnlineStatus': True,
            'allowFriendRequests': True,
            'dataCollection': False
        },
        'storage': {
            'autoCleanup': False,
            'cleanupDays': 30,
            'fileCompression': False,
            'duplicateDetection': False,
            'versionControl': False,
            'maxVersions': 5,
            'trashRetention': 30,
            'cacheLimit': 1024,
            'autoOptimize': False,
            'smartCompression': False
        },
        'security': {
            'twoFactorEnabled': False,
            'loginNotifications': True,
            'ipWhitelist': '',
            'sessionTimeout': 24,
            'dataEncryption': True,
            'auditLog': True
        },
        'system': {
            'autoUpdate': True,
            'debugMode': False,
            'performanceMonitoring': True,
            'errorReporting': True,
            'logLevel': 'INFO',
            'maxLogSize': 100,
            'resourceLimit': 80
        },
        'preview': {
            'enablePreview': True,
            'previewMode': 'hover',
            'thumbnailGeneration': True,
            'maxPreviewSize': 10,
            'supportedFormats': ['jpg', 'png', 'gif', 'pdf', 'txt', 'md']
        },
        'sharing': {
            'defaultPermission': 'view',
            'linkExpiration': 7,
            'passwordProtection': False,
            'downloadLimit': 0,
            'allowPublicSharing': True
        },
        'sync': {
            'autoSync': True,
            'syncInterval': 5,
            'conflictResolution': 'ask',
            'bandwidthLimit': 0,
            'syncOnMobile': False
        }
    }

def save_user_settings(user_id, settings):
    """保存用户设置"""
    settings_file = get_user_settings_file(user_id)
    try:
        with open(settings_file, 'w', encoding='utf-8') as f:
            json.dump(settings, f, ensure_ascii=False, indent=2)
        return True
    except Exception as e:
        print(f"保存设置失败: {e}")
        return False

@settings_bp.route('', methods=['GET'])
@jwt_required()
def get_settings():
    """获取用户设置"""
    try:
        user_id = get_jwt_identity()
        settings = load_user_settings(user_id)
        
        return jsonify({
            'success': True,
            'data': settings
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@settings_bp.route('', methods=['PUT'])
@jwt_required()
def update_settings():
    """更新用户设置"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': '无效的请求数据'
            }), 400
        
        # 加载现有设置
        current_settings = load_user_settings(user_id)
        
        # 更新设置
        category = data.get('category')
        settings = data.get('settings')
        
        if category and settings:
            current_settings[category] = {**current_settings.get(category, {}), **settings}
        else:
            # 批量更新
            for key, value in data.items():
                if key in current_settings:
                    current_settings[key] = {**current_settings[key], **value}
        
        # 保存设置
        if save_user_settings(user_id, current_settings):
            return jsonify({
                'success': True,
                'data': current_settings,
                'message': '设置保存成功'
            })
        else:
            return jsonify({
                'success': False,
                'error': '设置保存失败'
            }), 500
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@settings_bp.route('/reset', methods=['POST'])
@jwt_required()
def reset_settings():
    """重置用户设置"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        category = data.get('category') if data else None
        
        if category:
            # 重置特定分类
            current_settings = load_user_settings(user_id)
            default_settings = load_user_settings(None)  # 获取默认设置
            current_settings[category] = default_settings[category]
            
            if save_user_settings(user_id, current_settings):
                return jsonify({
                    'success': True,
                    'data': current_settings,
                    'message': f'{category}设置已重置'
                })
        else:
            # 重置所有设置
            settings_file = get_user_settings_file(user_id)
            if os.path.exists(settings_file):
                os.remove(settings_file)
            
            default_settings = load_user_settings(user_id)  # 这会返回默认设置
            return jsonify({
                'success': True,
                'data': default_settings,
                'message': '所有设置已重置为默认值'
            })
        
        return jsonify({
            'success': False,
            'error': '重置失败'
        }), 500
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@settings_bp.route('/export', methods=['GET'])
@jwt_required()
def export_settings():
    """导出用户设置"""
    try:
        user_id = get_jwt_identity()
        settings = load_user_settings(user_id)
        
        # 添加导出信息
        export_data = {
            'version': '1.0',
            'exported_at': datetime.utcnow().isoformat(),
            'user_id': user_id,
            'settings': settings
        }
        
        return jsonify({
            'success': True,
            'data': export_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@settings_bp.route('/import', methods=['POST'])
@jwt_required()
def import_settings():
    """导入用户设置"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        
        if not data or 'settings' not in data:
            return jsonify({
                'success': False,
                'error': '无效的导入数据'
            }), 400
        
        imported_settings = data['settings']
        
        # 验证设置格式
        required_categories = ['general', 'notifications', 'privacy', 'storage', 'security', 'system']
        for category in required_categories:
            if category not in imported_settings:
                return jsonify({
                    'success': False,
                    'error': f'缺少必要的设置分类: {category}'
                }), 400
        
        # 保存导入的设置
        if save_user_settings(user_id, imported_settings):
            return jsonify({
                'success': True,
                'data': imported_settings,
                'message': '设置导入成功'
            })
        else:
            return jsonify({
                'success': False,
                'error': '设置导入失败'
            }), 500
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500