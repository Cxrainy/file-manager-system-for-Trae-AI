// 清理localStorage的脚本
// 在浏览器控制台中运行此脚本来清理所有存储的数据

function clearAllStorage() {
    console.log('开始清理localStorage...');
    
    // 清理所有相关的localStorage项目
    const keysToRemove = [
        'token',
        'user-storage',
        'theme-storage', 
        'file-storage',
        'ui-storage',
        'searchHistory'
    ];
    
    keysToRemove.forEach(key => {
        if (localStorage.getItem(key)) {
            console.log(`清理: ${key}`);
            localStorage.removeItem(key);
        }
    });
    
    // 清理所有以项目相关前缀开头的项目
    const allKeys = Object.keys(localStorage);
    allKeys.forEach(key => {
        if (key.includes('file') || key.includes('user') || key.includes('folder')) {
            console.log(`清理额外项目: ${key}`);
            localStorage.removeItem(key);
        }
    });
    
    console.log('localStorage清理完成');
    console.log('请刷新页面重新登录');
    
    // 自动刷新页面
    setTimeout(() => {
        window.location.reload();
    }, 1000);
}

// 执行清理
clearAllStorage();