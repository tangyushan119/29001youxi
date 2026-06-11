class UIManager {
    constructor() {
        this.elements = new Map();
        this.modals = [];
        this.toasts = [];
        this.hudElements = [];
        this.currentModal = null;
        
        this.styleSheet = this.createStyleSheet();
    }

    createStyleSheet() {
        const style = document.createElement('style');
        style.textContent = `
            .ui-element {
                position: fixed;
                pointer-events: auto;
                z-index: 100;
            }
            
            .ui-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.7);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }
            
            .ui-modal {
                background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
                border: 2px solid #4a69bd;
                border-radius: 15px;
                padding: 25px;
                box-shadow: 0 20px 60px rgba(0, 0, 0, 0.8);
                max-width: 90%;
                max-height: 90%;
                overflow-y: auto;
            }
            
            .ui-modal-title {
                color: #4a69bd;
                font-size: 20px;
                margin-bottom: 20px;
                text-align: center;
                border-bottom: 1px solid rgba(74, 105, 189, 0.3);
                padding-bottom: 10px;
            }
            
            .ui-toast {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background: rgba(0, 0, 0, 0.85);
                color: #fff;
                padding: 15px 25px;
                border-radius: 10px;
                font-size: 14px;
                z-index: 2000;
                animation: slideUp 0.3s ease;
                border: 1px solid rgba(74, 105, 189, 0.5);
            }
            
            .ui-toast-success {
                border-color: #27ae60;
            }
            
            .ui-toast-error {
                border-color: #e74c3c;
            }
            
            .ui-toast-warning {
                border-color: #f39c12;
            }
            
            .ui-button {
                padding: 10px 20px;
                border: none;
                border-radius: 8px;
                font-size: 14px;
                font-weight: bold;
                cursor: pointer;
                transition: all 0.2s ease;
                background: linear-gradient(145deg, #4a69bd, #3a5a9d);
                color: #fff;
            }
            
            .ui-button:hover {
                background: linear-gradient(145deg, #5a79cd, #4a6abd);
                transform: translateY(-2px);
            }
            
            .ui-button:active {
                transform: translateY(0);
            }
            
            .ui-button-danger {
                background: linear-gradient(145deg, #e74c3c, #c0392b);
            }
            
            .ui-button-danger:hover {
                background: linear-gradient(145deg, #f75c4c, #d0493b);
            }
            
            .ui-panel {
                background: rgba(26, 26, 46, 0.95);
                border: 2px solid #4a69bd;
                border-radius: 12px;
                padding: 20px;
            }
            
            .ui-progress-bar {
                width: 100%;
                height: 20px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 10px;
                overflow: hidden;
            }
            
            .ui-progress-fill {
                height: 100%;
                border-radius: 10px;
                transition: width 0.3s ease;
            }
            
            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateX(-50%) translateY(20px);
                }
                to {
                    opacity: 1;
                    transform: translateX(-50%) translateY(0);
                }
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        return style;
    }

    createElement(type, options = {}) {
        const element = document.createElement(type);
        
        if (options.className) {
            element.className = `ui-element ${options.className}`;
        } else {
            element.className = 'ui-element';
        }
        
        if (options.id) {
            element.id = options.id;
        }
        
        if (options.text) {
            element.textContent = options.text;
        }
        
        if (options.html) {
            element.innerHTML = options.html;
        }
        
        if (options.style) {
            Object.assign(element.style, options.style);
        }
        
        if (options.parent) {
            options.parent.appendChild(element);
        } else {
            document.body.appendChild(element);
        }
        
        if (options.click) {
            element.addEventListener('click', options.click);
        }
        
        if (options.id) {
            this.elements.set(options.id, element);
        }
        
        return element;
    }

    getElement(id) {
        return this.elements.get(id);
    }

    removeElement(id) {
        const element = this.elements.get(id);
        if (element) {
            element.remove();
            this.elements.delete(id);
        }
    }

    showModal(options) {
        if (this.currentModal) {
            this.hideModal();
        }

        const overlay = document.createElement('div');
        overlay.className = 'ui-modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = 'ui-modal';
        
        if (options.title) {
            const title = document.createElement('h2');
            title.className = 'ui-modal-title';
            title.textContent = options.title;
            modal.appendChild(title);
        }
        
        if (options.content) {
            if (typeof options.content === 'string') {
                const content = document.createElement('div');
                content.innerHTML = options.content;
                modal.appendChild(content);
            } else {
                modal.appendChild(options.content);
            }
        }
        
        if (options.buttons) {
            const buttonContainer = document.createElement('div');
            buttonContainer.style.display = 'flex';
            buttonContainer.style.gap = '10px';
            buttonContainer.style.justifyContent = 'center';
            buttonContainer.style.marginTop = '20px';
            
            for (const btn of options.buttons) {
                const button = document.createElement('button');
                button.className = `ui-button ${btn.danger ? 'ui-button-danger' : ''}`;
                button.textContent = btn.text;
                button.addEventListener('click', () => {
                    btn.click?.();
                    this.hideModal();
                });
                buttonContainer.appendChild(button);
            }
            
            modal.appendChild(buttonContainer);
        }
        
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
        
        this.currentModal = { overlay, modal };
        this.modals.push(this.currentModal);
    }

    hideModal() {
        if (this.currentModal) {
            this.currentModal.overlay.remove();
            this.modals = this.modals.filter(m => m !== this.currentModal);
            this.currentModal = null;
        }
    }

    showToast(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `ui-toast ui-toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        this.toasts.push(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideUp 0.3s ease reverse';
            setTimeout(() => {
                toast.remove();
                this.toasts = this.toasts.filter(t => t !== toast);
            }, 300);
        }, duration);
    }

    showSuccess(message) {
        this.showToast(message, 'success');
    }

    showError(message) {
        this.showToast(message, 'error');
    }

    showWarning(message) {
        this.showToast(message, 'warning');
    }

    createProgressBar(options = {}) {
        const container = document.createElement('div');
        container.className = 'ui-progress-bar';
        
        const fill = document.createElement('div');
        fill.className = 'ui-progress-fill';
        fill.style.width = `${options.value || 0}%`;
        
        if (options.color) {
            fill.style.background = options.color;
        }
        
        container.appendChild(fill);
        
        if (options.parent) {
            options.parent.appendChild(container);
        }
        
        return {
            element: container,
            fill,
            setValue: (value) => {
                fill.style.width = `${Math.min(100, Math.max(0, value))}%`;
            },
            setColor: (color) => {
                fill.style.background = color;
            }
        };
    }

    createButton(options = {}) {
        const button = document.createElement('button');
        button.className = `ui-button ${options.danger ? 'ui-button-danger' : ''}`;
        button.textContent = options.text || 'Button';
        
        if (options.click) {
            button.addEventListener('click', options.click);
        }
        
        if (options.parent) {
            options.parent.appendChild(button);
        }
        
        return button;
    }

    createPanel(options = {}) {
        const panel = document.createElement('div');
        panel.className = 'ui-panel';
        
        if (options.title) {
            const title = document.createElement('h3');
            title.style.color = '#4a69bd';
            title.style.marginBottom = '15px';
            title.textContent = options.title;
            panel.appendChild(title);
        }
        
        if (options.parent) {
            options.parent.appendChild(panel);
        }
        
        return panel;
    }

    createHUD(options = {}) {
        const hud = {
            elements: [],
            container: this.createElement('div', {
                className: 'ui-hud',
                style: {
                    position: 'fixed',
                    top: '10px',
                    left: '10px',
                    zIndex: '50'
                }
            })
        };
        
        if (options.statusBars) {
            for (const status of options.statusBars) {
                const bar = this.createStatusBar(status);
                hud.elements.push(bar);
                hud.container.appendChild(bar.container);
            }
        }
        
        this.hudElements.push(hud);
        return hud;
    }

    createStatusBar(options) {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.alignItems = 'center';
        container.style.gap = '10px';
        container.style.color = '#fff';
        container.style.marginBottom = '8px';
        
        const label = document.createElement('span');
        label.style.fontSize = '14px';
        label.style.color = '#b8c5d6';
        label.style.minWidth = '50px';
        label.textContent = options.label;
        
        const bar = document.createElement('div');
        bar.style.width = '100px';
        bar.style.height = '15px';
        bar.style.borderRadius = '8px';
        bar.style.background = 'rgba(255, 255, 255, 0.1)';
        bar.style.overflow = 'hidden';
        
        const fill = document.createElement('div');
        fill.style.height = '100%';
        fill.style.borderRadius = '8px';
        fill.style.background = options.color || '#4a69bd';
        fill.style.width = `${options.value || 0}%`;
        
        const value = document.createElement('span');
        value.style.fontSize = '14px';
        value.style.fontWeight = 'bold';
        value.style.minWidth = '35px';
        value.style.textAlign = 'right';
        value.textContent = Math.floor(options.value || 0);
        
        bar.appendChild(fill);
        container.appendChild(label);
        container.appendChild(bar);
        container.appendChild(value);
        
        return {
            container,
            fill,
            value,
            setValue: (newValue) => {
                fill.style.width = `${Math.min(100, Math.max(0, newValue))}%`;
                value.textContent = Math.floor(newValue);
            },
            setColor: (color) => {
                fill.style.background = color;
            }
        };
    }

    destroy() {
        this.styleSheet.remove();
        
        for (const element of this.elements.values()) {
            element.remove();
        }
        this.elements.clear();
        
        this.hideModal();
        
        for (const toast of this.toasts) {
            toast.remove();
        }
        this.toasts = [];
        
        for (const hud of this.hudElements) {
            hud.container.remove();
        }
        this.hudElements = [];
    }
}

export { UIManager };