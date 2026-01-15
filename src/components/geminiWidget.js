window.renderGeminiWidget = function () {
    // Inject styles
    const style = document.createElement('style');
    style.textContent = `
        #gemini-float-btn {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            width: 60px;
            height: 60px;
            background: linear-gradient(135deg, #1e40af, #8b5cf6);
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            z-index: 9999;
            transition: transform 0.2s, box-shadow 0.2s;
            border: 2px solid rgba(255,255,255,0.2);
        }
        #gemini-float-btn:hover {
            transform: scale(1.05);
            box-shadow: 0 6px 16px rgba(0,0,0,0.4);
        }
        #gemini-window {
            position: fixed;
            bottom: 7rem;
            right: 2rem;
            width: 350px;
            height: 500px;
            background: #0f172a;
            border: 1px solid rgba(255,255,255,0.1);
            border-radius: 16px;
            box-shadow: 0 10px 25px -5px rgba(0,0,0,0.5);
            z-index: 9998;
            display: none;
            flex-direction: column;
            overflow: hidden;
            opacity: 0;
            transform: translateY(10px);
            transition: opacity 0.3s, transform 0.3s;
        }
        #gemini-window.active {
            display: flex;
            opacity: 1;
            transform: translateY(0);
        }
        .gemini-header {
            background: linear-gradient(to right, #1e293b, #0f172a);
            padding: 1rem;
            border-bottom: 1px solid rgba(255,255,255,0.05);
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .close-btn {
            background: none;
            border: none;
            color: #94a3b8;
            cursor: pointer;
            padding: 4px;
        }
        .close-btn:hover { color: white; }
        .gemini-body {
            flex-grow: 1;
            padding: 1.5rem;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            color: #cbd5e1;
            background: radial-gradient(circle at top, rgba(139, 92, 246, 0.1), transparent 70%);
        }
    `;
    document.head.appendChild(style);

    // Create Elements
    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <div id="gemini-window">
            <div class="gemini-header">
                <h3 style="margin: 0; font-size: 1rem; color: white; display: flex; align-items: center; gap: 0.5rem;">
                    <i data-lucide="sparkles" style="color: #8b5cf6;"></i> 3DWork AI Assistant
                </h3>
                <button class="close-btn" id="gemini-close"><i data-lucide="x" style="width: 18px;"></i></button>
            </div>
            <div class="gemini-body">
                <!-- Mascot Image Placeholder -->
                <div style="width: 80px; height: 80px; background: rgba(255,255,255,0.05); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-bottom: 1rem; border: 2px solid rgba(139, 92, 246, 0.3); overflow: hidden;">
                    <!-- REPLACE 'src' WITH YOUR MASCOT URL -->
                    <img id="mascot-img" src="" alt="3DWork" style="width: 100%; height: 100%; object-fit: cover; display: none;">
                    <i id="mascot-icon" data-lucide="bot" style="width: 40px; height: 40px; color: #8b5cf6;"></i>
                </div>
                
                <h3 style="color: white; margin-bottom: 0.5rem;">3DWork AI Assistant</h3>
                <p style="font-size: 0.9rem; margin-bottom: 1.5rem; line-height: 1.5;">
                    Need help with calibration or troubleshooting?
                </p>

                <div style="width: 100%; display: flex; flex-direction: column; gap: 0.5rem;">
                    <textarea id="gemini-input" placeholder="Type your question here..." style="width: 100%; padding: 0.75rem; border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); background: rgba(0,0,0,0.3); color: white; resize: none; height: 80px; font-family: inherit; font-size: 0.9rem;"></textarea>
                    
                    <div style="background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.3); border-radius: 8px; padding: 0.75rem; margin-bottom: 0.5rem; display: flex; align-items: start; gap: 0.5rem; text-align: left;">
                        <i data-lucide="info" style="width: 16px; height: 16px; color: #a78bfa; flex-shrink: 0; margin-top: 2px;"></i>
                        <p style="font-size: 0.75rem; color: #e2e8f0; margin: 0; line-height: 1.4;">
                            A new window will open to chat with our Assistant. Simply <strong>PASTE (Ctrl+V)</strong> your question to start!
                        </p>
                    </div>

                    <button id="gemini-send-btn" style="background: white; color: black; border: none; padding: 0.75rem; border-radius: 12px; font-weight: bold; font-size: 0.9rem; display: flex; align-items: center; justify-content: center; gap: 0.5rem; cursor: pointer; transition: transform 0.2s;">
                        <i data-lucide="send"></i> Send to 3DWork AI Assistant
                    </button>
                    
                    <p id="gemini-status" style="font-size: 0.75rem; color: #10b981; height: 1rem; opacity: 0; transition: opacity 0.3s;">
                        Message copied! Paste (Ctrl+V) in the new window.
                    </p>
                </div>
            </div>
        </div>
        
        <div id="gemini-float-btn" title="Open AI Assistant">
            <!-- Icon/Logo -->
             <img id="btn-mascot-img" src="" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%; display: none;">
            <i id="btn-mascot-icon" data-lucide="sparkles" style="width: 32px; height: 32px; color: white;"></i>
        </div>
    `;

    document.body.appendChild(wrapper);

    // Logic
    const btn = document.getElementById('gemini-float-btn');
    const win = document.getElementById('gemini-window');
    const close = document.getElementById('gemini-close');

    const sendBtn = document.getElementById('gemini-send-btn');
    const input = document.getElementById('gemini-input');
    const status = document.getElementById('gemini-status');

    function toggleWindow() {
        win.classList.toggle('active');
        if (win.classList.contains('active')) {
            if (window.lucide) window.lucide.createIcons();
            if (input) input.focus();
        }
    }

    if (sendBtn) {
        sendBtn.onclick = async () => {
            const text = input.value.trim();
            if (!text) {
                input.focus();
                return;
            }

            // Copy to clipboard
            try {
                await navigator.clipboard.writeText(text);

                // Show feedback
                status.style.opacity = '1';
                setTimeout(() => { status.style.opacity = '0'; }, 3000);

                // Open Gem
                window.open('https://gemini.google.com/gem/1TYqo3T-MBERHgTqjIudDoAoVMaMDhOS_?usp=sharing', '_blank');
            } catch (err) {
                console.error('Clipboard failed', err);
                // Fallback: just open window
                window.open('https://gemini.google.com/gem/1TYqo3T-MBERHgTqjIudDoAoVMaMDhOS_?usp=sharing', '_blank');
            }
        };
    }

    // Allow Enter key to send
    if (input) {
        input.onkeypress = (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendBtn.click();
            }
        };
    }

    btn.onclick = toggleWindow;
    close.onclick = toggleWindow;

    // Refresh icons
    if (window.lucide) window.lucide.createIcons();

    // EXPOSED METHOD TO SET LOGO
    window.setMascotLogo = function (url) {
        if (!url) return;
        const mainImg = document.getElementById('mascot-img');
        const mainIcon = document.getElementById('mascot-icon');
        const btnImg = document.getElementById('btn-mascot-img');
        const btnIcon = document.getElementById('btn-mascot-icon');

        if (mainImg && btnImg) {
            mainImg.src = url;
            mainImg.style.display = 'block';
            mainIcon.style.display = 'none';

            btnImg.src = url;
            btnImg.style.display = 'block';
            btnIcon.style.display = 'none';
        }
    };
}
