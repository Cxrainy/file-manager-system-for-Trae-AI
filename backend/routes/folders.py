from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import db, Folder, File, TrashItem
from utils import jwt_required_with_user, validate_folder_path
from sqlalchemy import and_

folders_bp = Blueprint('folders', __name__)

@folders_bp.route('', methods=['GET'])
@jwt_required_with_user
def get_folders(current_user):
    """获取用户的所有文件夹"""
    try:
        user_id = current_user.id
        print(f"[DEBUG] 获取文件夹列表 - 用户ID: {user_id}")
        
        # 获取所有文件夹
        folders = Folder.query.filter_by(user_id=user_id).order_by(Folder.created_at).all()
        print(f"[DEBUG] 查询到 {len(folders)} 个文件夹")
        
        # 转换为字典格式，让前端构建树形结构
        folder_list = []
        for folder in folders:
            folder_data = {
                'id': folder.id,
                'name': folder.name,
                'parentId': folder.parent_id,
                'isParent': folder.is_parent if hasattr(folder, 'is_parent') else False,
                'createdAt': folder.created_at.isoformat() if folder.created_at else None,
                'updatedAt': folder.updated_at.isoformat() if folder.updated_at else None
            }
            folder_list.append(folder_data)
            print(f"[DEBUG] 文件夹: {folder.name}, ID: {folder.id}, 父ID: {folder.parent_id}")
        
        return jsonify({
            'success': True,
            'data': folder_list
        })
        
    except Exception as e:
        print(f"[ERROR] 获取文件夹列表失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@folders_bp.route('/<folder_id>', methods=['GET'])
@jwt_required_with_user
def get_folder(current_user, folder_id):
    """获取文件夹详情"""
    try:
        user_id = current_user.id
        
        folder = Folder.query.filter_by(id=folder_id, user_id=user_id).first()
        if not folder:
            return jsonify({
                'success': False,
                'error': '文件夹不存在'
            }), 404
        
        return jsonify({
            'success': True,
            'data': folder.to_dict(include_children=True)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@folders_bp.route('', methods=['POST'])
@jwt_required_with_user
def create_folder(current_user):
    """创建文件夹"""
    try:
        user_id = current_user.id
        data = request.get_json()
        
        print(f"[DEBUG] 创建文件夹请求 - 用户ID: {user_id}, 数据: {data}")
        
        name = data.get('name')
        parent_id = data.get('parentId')
        
        if not name:
            print(f"[DEBUG] 文件夹名称为空")
            return jsonify({
                'success': False,
                'error': '文件夹名称不能为空'
            }), 400
        
        # 验证父文件夹
        if parent_id:
            parent_folder = Folder.query.filter_by(id=parent_id, user_id=user_id).first()
            if not parent_folder:
                return jsonify({
                    'success': False,
                    'error': '父文件夹不存在'
                }), 404
            
            # 检查同级文件夹名称是否重复
            existing = Folder.query.filter_by(
                name=name, 
                parent_id=parent_id, 
                user_id=user_id
            ).first()
            print(f"[DEBUG] 检查同级文件夹重复 - 名称: {name}, 父ID: {parent_id}, 用户ID: {user_id}")
            print(f"[DEBUG] 查询结果: {existing}")
            if existing:
                print(f"[DEBUG] 发现重复文件夹: ID={existing.id}, 名称={existing.name}")
                return jsonify({
                    'success': False,
                    'error': '同级目录下已存在同名文件夹'
                }), 409
            
            # 子文件夹不能是父级文件夹
            is_parent = False
        else:
            # 检查根级文件夹名称是否重复
            existing = Folder.query.filter_by(
                name=name, 
                parent_id=None, 
                user_id=user_id
            ).first()
            if existing:
                return jsonify({
                    'success': False,
                    'error': '已存在同名的根文件夹'
                }), 409
            
            # 根级文件夹默认为父级文件夹
            is_parent = True
        
        # 创建文件夹
        folder = Folder(
            name=name,
            parent_id=parent_id,
            user_id=user_id,
            is_parent=is_parent
        )
        
        print(f"[DEBUG] 准备创建文件夹: {folder.name}, 父ID: {folder.parent_id}")
        
        db.session.add(folder)
        db.session.commit()
        
        print(f"[DEBUG] 文件夹创建成功: ID={folder.id}, 名称={folder.name}")
        
        return jsonify({
            'success': True,
            'data': folder.to_dict()
        }), 201
        
    except Exception as e:
        print(f"[DEBUG] 创建文件夹异常: {str(e)}")
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@folders_bp.route('/<folder_id>', methods=['PUT'])
@jwt_required_with_user
def update_folder(current_user, folder_id):
    """更新文件夹"""
    try:
        user_id = current_user.id
        data = request.get_json()
        
        print(f"[DEBUG] 更新文件夹请求 - 用户ID: {user_id}, 文件夹ID: {folder_id}, 数据: {data}")
        
        folder = Folder.query.filter_by(id=folder_id, user_id=user_id).first()
        if not folder:
            return jsonify({
                'success': False,
                'error': '文件夹不存在'
            }), 404
        
        name = data.get('name')
        parent_id = data.get('parentId')
        
        # 如果只是重命名
        if name and not parent_id:
            if not name:
                return jsonify({
                    'success': False,
                    'error': '文件夹名称不能为空'
                }), 400
            
            # 检查同级文件夹名称是否重复
            existing = Folder.query.filter(
                and_(
                    Folder.name == name,
                    Folder.parent_id == folder.parent_id,
                    Folder.user_id == user_id,
                    Folder.id != folder_id
                )
            ).first()
            
            if existing:
                return jsonify({
                    'success': False,
                    'error': '同级目录下已存在同名文件夹'
                }), 409
            
            folder.name = name
        
        # 如果是移动文件夹
        elif 'parentId' in data:
            print(f"[DEBUG] 移动文件夹 - 从 {folder.parent_id} 到 {parent_id}")
            
            # 验证目标父文件夹
            if parent_id:
                target_parent = Folder.query.filter_by(id=parent_id, user_id=user_id).first()
                if not target_parent:
                    return jsonify({
                        'success': False,
                        'error': '目标文件夹不存在'
                    }), 404
                
                # 检查是否会创建循环引用
                if _would_create_cycle(folder_id, parent_id):
                    return jsonify({
                        'success': False,
                        'error': '不能将文件夹移动到其子文件夹中'
                    }), 400
            
            # 检查目标位置是否有同名文件夹
            existing = Folder.query.filter(
                and_(
                    Folder.name == folder.name,
                    Folder.parent_id == parent_id,
                    Folder.user_id == user_id,
                    Folder.id != folder_id
                )
            ).first()
            
            if existing:
                return jsonify({
                    'success': False,
                    'error': '目标位置已存在同名文件夹'
                }), 409
            
            folder.parent_id = parent_id
        
        else:
            return jsonify({
                'success': False,
                'error': '请提供要更新的字段'
            }), 400
        
        folder.updated_at = datetime.utcnow()
        db.session.commit()
        
        print(f"[DEBUG] 文件夹更新成功 - ID: {folder_id}")
        
        return jsonify({
            'success': True,
            'data': folder.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] 更新文件夹失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@folders_bp.route('/<folder_id>', methods=['DELETE'])
@jwt_required_with_user
def delete_folder(current_user, folder_id):
    """删除文件夹"""
    try:
        user_id = current_user.id
        
        folder = Folder.query.filter_by(id=folder_id, user_id=user_id).first()
        if not folder:
            return jsonify({
                'success': False,
                'error': '文件夹不存在'
            }), 404
        
        # 检查是否有子文件夹或文件
        has_children = len(folder.children) > 0
        has_files = len(folder.files) > 0
        
        if has_children or has_files:
            # 移动到回收站
            trash_item = TrashItem(
                item_type='folder',
                item_id=folder.id,
                name=folder.name,
                original_path=_get_folder_path(folder),
                user_id=user_id
            )
            db.session.add(trash_item)
            
            # 递归删除子文件夹和文件
            _delete_folder_recursive(folder, user_id)
        
        db.session.delete(folder)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '文件夹删除成功'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@folders_bp.route('/<folder_id>/move', methods=['PUT'])
@jwt_required_with_user
def move_folder(current_user, folder_id):
    """移动文件夹"""
    try:
        user_id = current_user.id
        data = request.get_json()
        
        folder = Folder.query.filter_by(id=folder_id, user_id=user_id).first()
        if not folder:
            return jsonify({
                'success': False,
                'error': '文件夹不存在'
            }), 404
        
        parent_id = data.get('parentId')
        
        # 验证目标父文件夹
        if parent_id:
            parent_folder = Folder.query.filter_by(id=parent_id, user_id=user_id).first()
            if not parent_folder:
                return jsonify({
                    'success': False,
                    'error': '目标父文件夹不存在'
                }), 404
            
            # 检查是否会形成循环引用
            if _would_create_cycle(folder_id, parent_id):
                return jsonify({
                    'success': False,
                    'error': '不能将文件夹移动到其子文件夹中'
                }), 400
        
        # 检查目标位置是否已有同名文件夹
        existing = Folder.query.filter(
            and_(
                Folder.name == folder.name,
                Folder.parent_id == parent_id,
                Folder.user_id == user_id,
                Folder.id != folder_id
            )
        ).first()
        
        if existing:
            return jsonify({
                'success': False,
                'error': '目标位置已存在同名文件夹'
            }), 409
        
        folder.parent_id = parent_id
        # 更新是否为父级文件夹的状态
        folder.is_parent = parent_id is None
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': folder.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

def _get_folder_path(folder):
    """获取文件夹的完整路径"""
    path_parts = [folder.name]
    current = folder.parent
    
    while current:
        path_parts.insert(0, current.name)
        current = current.parent
    
    return '/' + '/'.join(path_parts)

def _delete_folder_recursive(folder, user_id):
    """递归删除文件夹及其内容"""
    # 删除文件夹中的文件
    for file in folder.files:
        trash_item = TrashItem(
            item_type='file',
            item_id=file.id,
            name=file.name,
            original_path=_get_folder_path(folder) + '/' + file.name,
            user_id=user_id
        )
        db.session.add(trash_item)
    
    # 递归删除子文件夹
    for child in folder.children:
        trash_item = TrashItem(
            item_type='folder',
            item_id=child.id,
            name=child.name,
            original_path=_get_folder_path(child),
            user_id=user_id
        )
        db.session.add(trash_item)
        _delete_folder_recursive(child, user_id)

def _would_create_cycle(folder_id, target_parent_id):
    """检查移动操作是否会创建循环引用"""
    current_id = target_parent_id
    
    while current_id:
        if current_id == folder_id:
            return True
        
        folder = Folder.query.get(current_id)
        if not folder:
            break
        
        current_id = folder.parent_id
    
    return False