from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from sqlalchemy import func, desc
from datetime import datetime, timedelta
import os
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import db, File, Folder, User
from utils import jwt_required_with_user, get_file_size_str

statistics_bp = Blueprint('statistics', __name__)

@statistics_bp.route('', methods=['GET'])
@jwt_required()
def get_statistics():
    """获取统计数据"""
    try:
        user_id = get_jwt_identity()
        
        # 总文件数
        total_files = File.query.filter_by(user_id=user_id).count()
        
        # 总文件夹数
        total_folders = Folder.query.filter_by(user_id=user_id).count()
        
        # 总存储大小
        total_size_result = db.session.query(func.sum(File.size)).filter_by(user_id=user_id).scalar()
        total_size = total_size_result or 0
        
        # 最近7天上传的文件数
        seven_days_ago = datetime.now() - timedelta(days=7)
        recent_uploads = File.query.filter(
            File.user_id == user_id,
            File.uploaded_at >= seven_days_ago
        ).count()
        
        # 存储限制（这里设置为10GB，实际应该从配置或用户设置中获取）
        storage_limit = 10 * 1024 * 1024 * 1024  # 10GB
        
        return jsonify({
            'success': True,
            'data': {
                'totalFiles': total_files,
                'totalFolders': total_folders,
                'totalSize': total_size,
                'recentUploads': recent_uploads,
                'storageUsed': total_size,
                'storageLimit': storage_limit
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@statistics_bp.route('/storage', methods=['GET'])
@jwt_required()
def get_storage_usage():
    """获取存储使用情况"""
    try:
        user_id = get_jwt_identity()
        
        # 计算已使用存储
        used_result = db.session.query(func.sum(File.size)).filter_by(user_id=user_id).scalar()
        used = used_result or 0
        
        # 存储限制（这里设置为10GB）
        total = 10 * 1024 * 1024 * 1024  # 10GB
        
        # 计算使用百分比
        percentage = (used / total * 100) if total > 0 else 0
        
        return jsonify({
            'success': True,
            'data': {
                'used': used,
                'total': total,
                'percentage': round(percentage, 2)
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@statistics_bp.route('/file-types', methods=['GET'])
@jwt_required()
def get_file_type_distribution():
    """获取文件类型分布"""
    try:
        user_id = get_jwt_identity()
        
        # 按文件类型统计数量和大小
        results = db.session.query(
            File.type,
            func.count(File.id).label('count'),
            func.sum(File.size).label('size')
        ).filter_by(user_id=user_id).group_by(File.type).all()
        
        distribution = []
        for result in results:
            distribution.append({
                'type': result.type,
                'count': result.count,
                'size': result.size or 0
            })
        
        return jsonify({
            'success': True,
            'data': distribution
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@statistics_bp.route('/upload-trend', methods=['GET'])
@jwt_required()
def get_upload_trend():
    """获取上传趋势"""
    try:
        user_id = get_jwt_identity()
        days = int(request.args.get('days', 30))
        
        # 计算日期范围
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=days-1)
        
        # 按日期统计上传数量和大小
        results = db.session.query(
            func.date(File.uploaded_at).label('date'),
            func.count(File.id).label('count'),
            func.sum(File.size).label('size')
        ).filter(
            File.user_id == user_id,
            func.date(File.uploaded_at) >= start_date,
            func.date(File.uploaded_at) <= end_date
        ).group_by(func.date(File.uploaded_at)).all()
        
        # 创建完整的日期序列
        trend_data = []
        current_date = start_date
        
        # 将查询结果转换为字典以便快速查找
        results_dict = {result.date: result for result in results}
        
        while current_date <= end_date:
            result = results_dict.get(current_date)
            trend_data.append({
                'date': current_date.isoformat(),
                'count': result.count if result else 0,
                'size': result.size if result and result.size else 0
            })
            current_date += timedelta(days=1)
        
        return jsonify({
            'success': True,
            'data': trend_data
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@statistics_bp.route('/recent-files', methods=['GET'])
@jwt_required()
def get_recent_files():
    """获取最近上传的文件"""
    try:
        user_id = get_jwt_identity()
        limit = int(request.args.get('limit', 10))
        
        files = File.query.filter_by(user_id=user_id).order_by(
            File.uploaded_at.desc()
        ).limit(limit).all()
        
        return jsonify({
            'success': True,
            'data': [file.to_dict() for file in files]
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@statistics_bp.route('/popular-types', methods=['GET'])
@jwt_required()
def get_popular_file_types():
    """获取热门文件类型"""
    try:
        user_id = get_jwt_identity()
        limit = int(request.args.get('limit', 5))
        
        # 按文件类型统计数量，按数量降序排列
        results = db.session.query(
            File.type,
            func.count(File.id).label('count')
        ).filter_by(user_id=user_id).group_by(
            File.type
        ).order_by(desc('count')).limit(limit).all()
        
        popular_types = []
        for result in results:
            popular_types.append({
                'type': result.type,
                'count': result.count
            })
        
        return jsonify({
            'success': True,
            'data': popular_types
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@statistics_bp.route('/folder-stats', methods=['GET'])
@jwt_required()
def get_folder_statistics():
    """获取文件夹统计信息"""
    try:
        user_id = get_jwt_identity()
        
        # 获取所有文件夹及其文件统计
        folders = Folder.query.filter_by(user_id=user_id).all()
        
        folder_stats = []
        for folder in folders:
            file_count = File.query.filter_by(folder_id=folder.id).count()
            total_size_result = db.session.query(func.sum(File.size)).filter_by(folder_id=folder.id).scalar()
            total_size = total_size_result or 0
            
            folder_stats.append({
                'id': folder.id,
                'name': folder.name,
                'isParent': folder.is_parent,
                'fileCount': file_count,
                'totalSize': total_size,
                'parentId': folder.parent_id
            })
        
        return jsonify({
            'success': True,
            'data': folder_stats
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@statistics_bp.route('/activity', methods=['GET'])
@jwt_required()
def get_activity_stats():
    """获取活动统计"""
    try:
        user_id = get_jwt_identity()
        days = int(request.args.get('days', 7))
        
        # 计算日期范围
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # 统计期间内的活动
        uploads = File.query.filter(
            File.user_id == user_id,
            File.uploaded_at >= start_date
        ).count()
        
        folders_created = Folder.query.filter(
            Folder.user_id == user_id,
            Folder.created_at >= start_date
        ).count()
        
        # 按小时统计活动（最近24小时）
        twenty_four_hours_ago = datetime.now() - timedelta(hours=24)
        hourly_activity = []
        
        for i in range(24):
            hour_start = twenty_four_hours_ago + timedelta(hours=i)
            hour_end = hour_start + timedelta(hours=1)
            
            hour_uploads = File.query.filter(
                File.user_id == user_id,
                File.uploaded_at >= hour_start,
                File.uploaded_at < hour_end
            ).count()
            
            hourly_activity.append({
                'hour': hour_start.hour,
                'uploads': hour_uploads
            })
        
        return jsonify({
            'success': True,
            'data': {
                'uploads': uploads,
                'foldersCreated': folders_created,
                'hourlyActivity': hourly_activity
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@statistics_bp.route('/summary', methods=['GET'])
@jwt_required()
def get_summary():
    """获取统计摘要"""
    try:
        user_id = get_jwt_identity()
        
        # 基本统计
        total_files = File.query.filter_by(user_id=user_id).count()
        total_folders = Folder.query.filter_by(user_id=user_id).count()
        total_size_result = db.session.query(func.sum(File.size)).filter_by(user_id=user_id).scalar()
        total_size = total_size_result or 0
        
        # 最大文件
        largest_file = File.query.filter_by(user_id=user_id).order_by(File.size.desc()).first()
        
        # 最新文件
        latest_file = File.query.filter_by(user_id=user_id).order_by(File.uploaded_at.desc()).first()
        
        # 平均文件大小
        avg_file_size = total_size / total_files if total_files > 0 else 0
        
        return jsonify({
            'success': True,
            'data': {
                'totalFiles': total_files,
                'totalFolders': total_folders,
                'totalSize': total_size,
                'averageFileSize': avg_file_size,
                'largestFile': largest_file.to_dict() if largest_file else None,
                'latestFile': latest_file.to_dict() if latest_file else None
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500