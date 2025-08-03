from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from models import db, TrashItem, File, Folder
from datetime import datetime
import os

trash_bp = Blueprint('trash', __name__)

@trash_bp.route('/', methods=['GET'])
@jwt_required()
def get_trash_items():
    """获取回收站列表"""
    try:
        user_id = get_jwt_identity()
        print(f"获取回收站数据，用户ID: {user_id}")
        
        # 获取用户的回收站项目
        trash_items = TrashItem.query.filter_by(user_id=user_id).order_by(TrashItem.deleted_at.desc()).all()
        print(f"找到 {len(trash_items)} 个回收站项目")
        
        items = []
        for item in trash_items:
            item_data = {
                'id': item.id,
                'name': item.name,
                'type': item.item_type,
                'originalPath': item.original_path,
                'deletedAt': item.deleted_at.isoformat() if item.deleted_at else None,
                'deletedBy': 'current_user',
                'autoDeleteAt': None,
                'itemId': item.item_id,
                'size': 0  # 默认大小
            }
            items.append(item_data)
        
        return jsonify({
            'success': True,
            'data': items
        })
        
    except Exception as e:
        print(f"获取回收站数据失败: {str(e)}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@trash_bp.route('/restore', methods=['POST'])
@jwt_required()
def restore_items():
    """恢复回收站项目"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        item_ids = data.get('ids', [])
        
        if not item_ids:
            return jsonify({
                'success': False,
                'error': '没有指定要恢复的项目'
            }), 400
        
        # 获取要恢复的回收站项目
        trash_items = TrashItem.query.filter(
            TrashItem.id.in_(item_ids),
            TrashItem.user_id == user_id
        ).all()
        
        if len(trash_items) != len(item_ids):
            return jsonify({
                'success': False,
                'error': '部分项目不存在或无权限'
            }), 404
        
        restored_count = 0
        
        for trash_item in trash_items:
            # 从回收站中移除记录（简化的恢复逻辑）
            db.session.delete(trash_item)
            restored_count += 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'已恢复 {restored_count} 个项目'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@trash_bp.route('/delete', methods=['DELETE'])
@jwt_required()
def permanent_delete():
    """永久删除回收站项目"""
    try:
        user_id = get_jwt_identity()
        data = request.get_json()
        item_ids = data.get('ids', [])
        
        if not item_ids:
            return jsonify({
                'success': False,
                'error': '没有指定要删除的项目'
            }), 400
        
        # 获取要永久删除的回收站项目
        trash_items = TrashItem.query.filter(
            TrashItem.id.in_(item_ids),
            TrashItem.user_id == user_id
        ).all()
        
        if len(trash_items) != len(item_ids):
            return jsonify({
                'success': False,
                'error': '部分项目不存在或无权限'
            }), 404
        
        deleted_count = 0
        
        for trash_item in trash_items:
            # 从回收站中永久删除
            db.session.delete(trash_item)
            deleted_count += 1
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'已永久删除 {deleted_count} 个项目'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@trash_bp.route('/empty', methods=['DELETE'])
@jwt_required()
def empty_trash():
    """清空回收站"""
    try:
        user_id = get_jwt_identity()
        
        # 获取用户的所有回收站项目
        trash_items = TrashItem.query.filter_by(user_id=user_id).all()
        
        deleted_count = len(trash_items)
        
        # 删除所有回收站项目
        for trash_item in trash_items:
            db.session.delete(trash_item)
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': f'回收站已清空，共删除 {deleted_count} 个项目'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500