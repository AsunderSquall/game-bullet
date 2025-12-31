/**
 * Info 模块 - 修正版
 */
const injectStyles = () => {
    if (document.getElementById('info-module-styles')) return;
    const style = document.createElement('style');
    style.id = 'info-module-styles';
    style.textContent = `
        .info-overlay {
            position: fixed !important; 
            top: 0 !important; left: 0 !important; 
            width: 100vw !important; height: 100vh !important;
            background: rgba(0, 0, 0, 0.6) !important; 
            backdrop-filter: blur(8px) !important;
            -webkit-backdrop-filter: blur(8px);
            display: flex !important; align-items: center !important; justify-content: center !important;
            z-index: 2147483647 !important; /* 设为最大值，防止被其他 UI 遮挡 */
            opacity: 0; transition: opacity 0.2s ease-out;
            pointer-events: auto !important;
        }
        .info-card {
            background: white !important; width: 300px !important; padding: 24px !important; 
            border-radius: 20px !important;
            box-shadow: 0 20px 40px rgba(0,0,0,0.4) !important;
            transform: scale(0.8); transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
            text-align: center !important;
        }
        .info-overlay.active { opacity: 1 !important; }
        .info-overlay.active .info-card { transform: scale(1) !important; }
        .info-title { font-size: 18px !important; font-weight: bold !important; color: #333 !important; margin-bottom: 10px !important; font-family: sans-serif !important;}
        .info-message { font-size: 14px !important; color: #666 !important; margin-bottom: 20px !important; line-height: 1.5 !important; font-family: sans-serif !important;}
        .info-btn {
            background: #007AFF !important; color: white !important; border: none !important; width: 100% !important;
            padding: 12px !important; border-radius: 12px !important; font-size: 16px !important; font-weight: 600 !important;
            cursor: pointer !important;
        }
    `;
    document.head.appendChild(style);
};

export const Info = {
    async alert(message, title = "提示") {
        injectStyles();
        
        // 确保 body 已经存在
        if (!document.body) {
            await new Promise(r => window.addEventListener('DOMContentLoaded', r));
        }

        return new Promise((resolve) => {
            const overlay = document.createElement('div');
            overlay.className = 'info-overlay';
            // 兜底 inline style 确保它一定在屏幕中间
            overlay.style.cssText = "position:fixed;top:0;left:0;width:100%;height:100%;z-index:999999;display:flex;align-items:center;justify-content:center;";
            
            overlay.innerHTML = `
                <div class="info-card">
                    <div class="info-title">${title}</div>
                    <div class="info-message">${message.replace(/\n/g, '<br>')}</div>
                    <button class="info-btn">确定</button>
                </div>
            `;

            document.body.appendChild(overlay);
            
            // 强制重绘
            overlay.offsetHeight; 
            overlay.classList.add('active');

            const btn = overlay.querySelector('.info-btn');
            btn.onclick = () => {
                overlay.classList.remove('active');
                // 动画结束后移除
                setTimeout(() => {
                    overlay.remove();
                    resolve();
                }, 200);
            };
        });
    }
};