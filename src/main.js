import { GameEngine } from './game/GameEngine.js';
import { GameScene } from './game/Scene.js';

class SurvivalGame {
    constructor() {
        this.engine = null;
        this.gameScene = null;
        this.statusDecayInterval = null;
        
        this.init();
    }

    async init() {
        try {
            console.log('Initializing Survival Game...');
            
            this.engine = new GameEngine({
                canvasId: 'gameCanvas',
                debug: false
            });

            await this.engine.initializationPromise;
            
            if (!this.engine.renderEngine) {
                throw new Error('RenderEngine initialization failed');
            }
            
            console.log('RenderEngine initialized successfully');
            
            await this.loadGameResources();
            
            this.gameScene = new GameScene('main');
            this.gameScene.init(this.engine);
            this.engine.addScene('main', this.gameScene);

            this.setupEventListeners();
            this.setupUIButtons();
            
            this.engine.setScene('main');
            this.engine.start();
            
            this.startStatusDecay();
            
            console.log('Game initialized successfully');
        } catch (error) {
            console.error('Failed to initialize game:', error);
            this.showErrorModal(error);
        }
    }

    async loadGameResources() {
        if (!this.engine?.resourceManager) {
            console.warn('ResourceManager not initialized, skipping resource preloading');
            return;
        }
        
        console.log('Loading game resources...');
        
        try {
            const stats = await this.engine.resourceManager.loadAllResources();
            
            const terrainConfig = this.engine.resourceManager.getTerrainConfig();
            if (terrainConfig) {
                console.log('Terrain config loaded successfully');
            }
            
            console.log(`Resources loaded: ${stats.loadedTextures}/${stats.totalTextures} textures, ${stats.cachedItems} cached items`);
            
        } catch (error) {
            console.error('Error loading game resources:', error);
        }
    }

    setupEventListeners() {
        if (!this.engine) {
            console.error('Engine not initialized, cannot setup event listeners');
            return;
        }

        this.engine.on('playerMove', (data) => {
            if (this.gameScene) {
                this.gameScene.movePlayer(data.direction);
            }
        });

        this.engine.on('playerInteract', () => {
            if (this.gameScene) {
                this.gameScene.interact();
            }
        });

        this.engine.on('openInventory', () => {
            if (this.gameScene) {
                this.gameScene.openInventory();
            }
        });

        this.engine.on('openCraft', () => {
            if (this.gameScene) {
                this.gameScene.openCraft();
            }
        });

        this.engine.on('openMap', () => {
            if (this.gameScene) {
                this.gameScene.openMap();
            }
        });

        this.engine.on('pauseChanged', (data) => {
            console.log(data.isPaused ? '游戏暂停' : '游戏继续');
        });

        this.engine.on('dayChanged', (data) => {
            this.updateDayDisplay(data.day);
        });

        this.engine.on('gameStarted', () => {
            console.log('游戏开始');
        });

        this.engine.on('gameStopped', () => {
            console.log('游戏停止');
        });

        this.engine.on('engineReady', () => {
            console.log('Engine ready');
        });
    }

    setupUIButtons() {
        const btnMoveUp = document.getElementById('btnMoveUp');
        const btnMoveDown = document.getElementById('btnMoveDown');
        const btnMoveLeft = document.getElementById('btnMoveLeft');
        const btnMoveRight = document.getElementById('btnMoveRight');
        const btnInteract = document.getElementById('btnInteract');
        const btnInventory = document.getElementById('btnInventory');
        const btnCraft = document.getElementById('btnCraft');
        const btnMap = document.getElementById('btnMap');

        const safeBind = (element, event, handler) => {
            if (element) {
                element.addEventListener(event, handler);
            } else {
                console.warn(`Button element not found for binding: ${event}`);
            }
        };

        safeBind(btnMoveUp, 'click', () => this.gameScene?.movePlayer('up'));
        safeBind(btnMoveDown, 'click', () => this.gameScene?.movePlayer('down'));
        safeBind(btnMoveLeft, 'click', () => this.gameScene?.movePlayer('left'));
        safeBind(btnMoveRight, 'click', () => this.gameScene?.movePlayer('right'));
        safeBind(btnInteract, 'click', () => this.gameScene?.interact());
        safeBind(btnInventory, 'click', () => this.gameScene?.openInventory());
        safeBind(btnCraft, 'click', () => this.gameScene?.openCraft());
        safeBind(btnMap, 'click', () => this.gameScene?.openMap());

        const canvas = document.getElementById('gameCanvas');
        safeBind(canvas, 'click', (e) => {
            if (!this.gameScene) return;
            
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            this.gameScene.collectResource(x, y);
        });
    }

    startStatusDecay() {
        if (this.statusDecayInterval) {
            clearInterval(this.statusDecayInterval);
        }

        this.statusDecayInterval = setInterval(() => {
            if (!this.engine?.gameState || this.engine.gameState.isPaused || !this.engine.gameState.isRunning) {
                return;
            }

            const player = this.gameScene?.player;
            
            if (!player) return;

            player.hunger = Math.max(0, player.hunger - 0.2);
            player.thirst = Math.max(0, player.thirst - 0.3);
            
            if (player.hunger <= 0 || player.thirst <= 0) {
                player.health = Math.max(0, player.health - 1.0);
            }
            
            this.updateStatusBars();
        }, 1000);
    }

    updateStatusBars() {
        const player = this.gameScene?.player;
        if (!player) return;
        
        const healthFill = document.querySelector('.health-fill');
        const hungerFill = document.querySelector('.hunger-fill');
        const thirstFill = document.querySelector('.thirst-fill');
        const staminaFill = document.querySelector('.stamina-fill');
        
        const updateWidth = (element, value) => {
            if (element) {
                element.style.setProperty('width', `${value}%`);
            }
        };

        updateWidth(healthFill, player.health);
        updateWidth(hungerFill, player.hunger);
        updateWidth(thirstFill, player.thirst);
        updateWidth(staminaFill, player.stamina);
        
        const healthValue = healthFill?.parentElement?.nextElementSibling;
        const hungerValue = hungerFill?.parentElement?.nextElementSibling;
        const thirstValue = thirstFill?.parentElement?.nextElementSibling;
        const staminaValue = staminaFill?.parentElement?.nextElementSibling;
        
        if (healthValue) healthValue.textContent = Math.floor(player.health);
        if (hungerValue) hungerValue.textContent = Math.floor(player.hunger);
        if (thirstValue) thirstValue.textContent = Math.floor(player.thirst);
        if (staminaValue) staminaValue.textContent = Math.floor(player.stamina);
    }

    updateDayDisplay(day) {
        const dayValue = document.querySelector('.day-value');
        if (dayValue) {
            dayValue.textContent = `第 ${day} 天`;
        }
    }

    showErrorModal(error) {
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 9999;
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
            background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
            border: 2px solid #e74c3c;
            border-radius: 15px;
            padding: 30px;
            max-width: 400px;
            text-align: center;
            color: #fff;
        `;

        const title = document.createElement('h2');
        title.textContent = '游戏初始化失败';
        title.style.color = '#e74c3c';
        title.style.marginBottom = '15px';

        const message = document.createElement('p');
        message.textContent = error.message || '未知错误';
        message.style.color = '#b8c5d6';
        message.style.marginBottom = '20px';

        const button = document.createElement('button');
        button.textContent = '重新加载';
        button.style.cssText = `
            padding: 10px 30px;
            background: linear-gradient(145deg, #4a69bd, #3a5a9d);
            color: #fff;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-size: 16px;
        `;
        button.addEventListener('click', () => window.location.reload());

        modal.appendChild(title);
        modal.appendChild(message);
        modal.appendChild(button);
        overlay.appendChild(modal);
        document.body.appendChild(overlay);
    }

    destroy() {
        if (this.statusDecayInterval) {
            clearInterval(this.statusDecayInterval);
        }
        this.engine?.destroy();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new SurvivalGame();
});

window.addEventListener('beforeunload', () => {
    window.game?.destroy();
});