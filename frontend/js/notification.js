// 自定义弹窗函数，兼容浏览器和 Electron 环境
function showMessage(message, type = 'info') {
    // 检查是否在 Electron 环境中
    if (typeof require !== 'undefined' && require('electron')) {
        const { dialog } = require('electron');
        dialog.showMessageBoxSync({
            type: type === 'error' ? 'error' : 'info',
            message: message,
            buttons: ['确定']
        });
    } else {
        // 浏览器环境，使用自定义样式的弹窗
        // 创建弹窗元素
        const popup = document.createElement('div');
        popup.className = 'custom-popup';
        popup.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            z-index: 9999;
            min-width: 250px;
            text-align: center;
            font-family: Arial, sans-serif;
        `;
        
        // 创建消息内容
        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        messageElement.style.marginBottom = '20px';
        
        // 创建关闭按钮
        const closeButton = document.createElement('button');
        closeButton.textContent = '确定';
        closeButton.style.cssText = `
            padding: 8px 16px;
            background: #4CAF50;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
        `;
        
        closeButton.addEventListener('click', () => {
            document.body.removeChild(popup);
            document.body.removeChild(overlay);
        });
        
        // 创建遮罩层
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            z-index: 9998;
        `;
        
        // 组装弹窗
        popup.appendChild(messageElement);
        popup.appendChild(closeButton);
        
        // 添加到页面
        document.body.appendChild(overlay);
        document.body.appendChild(popup);
    }
}

// 自定义确认对话框函数，兼容浏览器和 Electron 环境
function showConfirm(message) {
    return new Promise((resolve) => {
        // 检查是否在 Electron 环境中
        if (typeof require !== 'undefined' && require('electron')) {
            const { dialog } = require('electron');
            const result = dialog.showMessageBoxSync({
                type: 'question',
                message: message,
                buttons: ['取消', '确定']
            });
            resolve(result === 1);
        } else {
            // 浏览器环境，使用自定义样式的确认对话框
            // 创建弹窗元素
            const popup = document.createElement('div');
            popup.className = 'custom-confirm';
            popup.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: white;
                padding: 20px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 9999;
                min-width: 300px;
                text-align: center;
                font-family: Arial, sans-serif;
            `;
            
            // 创建消息内容
            const messageElement = document.createElement('p');
            messageElement.textContent = message;
            messageElement.style.marginBottom = '20px';
            
            // 创建按钮容器
            const buttonContainer = document.createElement('div');
            buttonContainer.style.display = 'flex';
            buttonContainer.style.justifyContent = 'center';
            buttonContainer.style.gap = '10px';
            
            // 创建取消按钮
            const cancelButton = document.createElement('button');
            cancelButton.textContent = '取消';
            cancelButton.style.cssText = `
                padding: 8px 16px;
                background: #9e9e9e;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            `;
            
            // 创建确定按钮
            const confirmButton = document.createElement('button');
            confirmButton.textContent = '确定';
            confirmButton.style.cssText = `
                padding: 8px 16px;
                background: #4CAF50;
                color: white;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-size: 14px;
            `;
            
            // 绑定按钮事件
            cancelButton.addEventListener('click', () => {
                document.body.removeChild(popup);
                document.body.removeChild(overlay);
                resolve(false);
            });
            
            confirmButton.addEventListener('click', () => {
                document.body.removeChild(popup);
                document.body.removeChild(overlay);
                resolve(true);
            });
            
            // 创建遮罩层
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                z-index: 9998;
            `;
            
            // 组装弹窗
            buttonContainer.appendChild(cancelButton);
            buttonContainer.appendChild(confirmButton);
            popup.appendChild(messageElement);
            popup.appendChild(buttonContainer);
            
            // 添加到页面
            document.body.appendChild(overlay);
            document.body.appendChild(popup);
        }
    });
}
