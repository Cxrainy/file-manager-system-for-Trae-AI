from flask import Blueprint, request, jsonify
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from werkzeug.security import generate_password_hash, check_password_hash
import re
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from models import db, User, generate_user_code

auth_bp = Blueprint('auth', __name__)

def validate_email(email):
    """验证邮箱格式"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """验证密码强度"""
    if len(password) < 6:
        return False, "密码长度至少6位"
    return True, ""

@auth_bp.route('/login', methods=['POST'])
def login():
    """用户登录"""
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        if not password or (not username and not email):
            return jsonify({
                'success': False,
                'error': '用户名/邮箱和密码不能为空'
            }), 400
        
        # 查找用户（支持用户名或邮箱登录）
        if email:
            user = User.query.filter_by(email=email).first()
        else:
            user = User.query.filter_by(username=username).first()
            
        if not user or not check_password_hash(user.password_hash, password):
            return jsonify({
                'success': False,
                'error': '用户名或密码错误'
            }), 401
        
        # 创建访问令牌
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'success': True,
            'data': {
                'user': user.to_dict(),
                'token': access_token
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@auth_bp.route('/register', methods=['POST'])
def register():
    """用户注册"""
    try:
        data = request.get_json()
        username = data.get('username')
        email = data.get('email')
        password = data.get('password')
        
        # 验证输入
        if not username or not email or not password:
            return jsonify({
                'success': False,
                'error': '用户名、邮箱和密码不能为空'
            }), 400
        
        if not validate_email(email):
            return jsonify({
                'success': False,
                'error': '邮箱格式不正确'
            }), 400
        
        is_valid, error_msg = validate_password(password)
        if not is_valid:
            return jsonify({
                'success': False,
                'error': error_msg
            }), 400
        
        # 检查用户名是否已存在
        if User.query.filter_by(username=username).first():
            return jsonify({
                'success': False,
                'error': '用户名已存在'
            }), 409
        
        # 检查邮箱是否已存在
        if User.query.filter_by(email=email).first():
            return jsonify({
                'success': False,
                'error': '邮箱已被注册'
            }), 409
        
        # 生成唯一的用户代码
        while True:
            user_code = generate_user_code()
            if not User.query.filter_by(user_code=user_code).first():
                break
        
        # 创建新用户
        user = User(
            username=username,
            email=email,
            password_hash=generate_password_hash(password),
            user_code=user_code
        )
        
        db.session.add(user)
        db.session.commit()
        
        # 创建访问令牌
        access_token = create_access_token(identity=user.id)
        
        return jsonify({
            'success': True,
            'data': {
                'user': user.to_dict(),
                'token': access_token
            }
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@auth_bp.route('/verify', methods=['GET'])
@jwt_required()
def verify_token():
    """验证token有效性"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'error': '用户不存在'
            }), 404
        
        return jsonify({
            'success': True,
            'data': {
                'user': user.to_dict()
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """获取当前用户信息"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'error': '用户不存在'
            }), 404
        
        user_data = user.to_dict()
        print(f"[DEBUG] /api/auth/me 返回用户数据: {user_data}")
        
        return jsonify({
            'success': True,
            'data': {
                'user': user_data
            }
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@auth_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile():
    """更新用户资料"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'error': '用户不存在'
            }), 404
        
        data = request.get_json()
        
        # 更新用户名
        if 'username' in data:
            new_username = data['username']
            if new_username != user.username:
                # 检查新用户名是否已存在
                if User.query.filter_by(username=new_username).first():
                    return jsonify({
                        'success': False,
                        'error': '用户名已存在'
                    }), 409
                user.username = new_username
        
        # 更新邮箱
        if 'email' in data:
            new_email = data['email']
            if new_email != user.email:
                if not validate_email(new_email):
                    return jsonify({
                        'success': False,
                        'error': '邮箱格式不正确'
                    }), 400
                # 检查新邮箱是否已存在
                if User.query.filter_by(email=new_email).first():
                    return jsonify({
                        'success': False,
                        'error': '邮箱已被注册'
                    }), 409
                user.email = new_email
        
        # 更新头像
        if 'avatar' in data:
            user.avatar = data['avatar']
        
        db.session.commit()
        
        return jsonify({
            'success': True,
            'data': user.to_dict()
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@auth_bp.route('/password', methods=['PUT'])
@jwt_required()
def change_password():
    """修改密码"""
    try:
        user_id = get_jwt_identity()
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({
                'success': False,
                'error': '用户不存在'
            }), 404
        
        data = request.get_json()
        old_password = data.get('oldPassword')
        new_password = data.get('newPassword')
        
        if not old_password or not new_password:
            return jsonify({
                'success': False,
                'error': '旧密码和新密码不能为空'
            }), 400
        
        # 验证旧密码
        if not check_password_hash(user.password_hash, old_password):
            return jsonify({
                'success': False,
                'error': '旧密码错误'
            }), 401
        
        # 验证新密码
        is_valid, error_msg = validate_password(new_password)
        if not is_valid:
            return jsonify({
                'success': False,
                'error': error_msg
            }), 400
        
        # 更新密码
        user.password_hash = generate_password_hash(new_password)
        db.session.commit()
        
        return jsonify({
            'success': True,
            'message': '密码修改成功'
        })
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500