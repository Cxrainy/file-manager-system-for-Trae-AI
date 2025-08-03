#!/usr/bin/env python3
# 批量修复files.py中的get_jwt_identity()调用

import re

def fix_files_jwt():
    file_path = 'routes/files.py'
    
    # 读取文件内容
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 替换所有的 get_jwt_identity() 为 current_user.id
    # 但要保留在函数定义行中的情况
    lines = content.split('\n')
    fixed_lines = []
    
    for line in lines:
        # 如果这一行包含函数定义，跳过
        if 'def ' in line and 'current_user' in line:
            fixed_lines.append(line)
        # 否则替换 get_jwt_identity() 为 current_user.id
        elif 'get_jwt_identity()' in line:
            # 替换 user_id = get_jwt_identity() 为 user_id = current_user.id
            if 'user_id = get_jwt_identity()' in line:
                line = line.replace('user_id = get_jwt_identity()', 'user_id = current_user.id')
            # 替换其他情况
            else:
                line = line.replace('get_jwt_identity()', 'current_user.id')
            fixed_lines.append(line)
        else:
            fixed_lines.append(line)
    
    # 写回文件
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(fixed_lines))
    
    print(f"已修复 {file_path} 中的JWT调用")

if __name__ == '__main__':
    fix_files_jwt()