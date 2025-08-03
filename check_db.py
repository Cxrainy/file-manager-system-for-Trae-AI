import sqlite3

# 检查file_manager.db
conn = sqlite3.connect('backend/instance/file_manager.db')
cursor = conn.cursor()

# 查看public_shares表的具体数据
cursor.execute('SELECT token, is_active, expires_at FROM public_shares')
shares = cursor.fetchall()
print('Public shares tokens and status:')
for share in shares:
    print(f'Token: {share[0]}, Active: {share[1]}, Expires: {share[2]}')

# 检查特定token
test_token = 'e34BhQLjKK-tac3cwNeGFNXbxVa1YiEI2aazmsxvusE'
cursor.execute('SELECT * FROM public_shares WHERE token = ?', (test_token,))
result = cursor.fetchone()
print(f'\nSpecific token search result: {result}')

conn.close()