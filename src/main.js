import { GameEngine } from './game/GameEngine.js';
import { GameScene } from './game/Scene.js';

class SurvivalGame {
    constructor() {
        this.engine = null;
        this.gameScene = null;
        
        this.init();
    }

    async init() {
        this.engine = new GameEngine({
            canvasId: 'gameCanvas',
            debug: false
        });

        try {
            await this.engine.initializationPromise;
            
            this.gameScene = new GameScene('main');
            this.engine.addScene('main', this.gameScene);

            this.setupEventListeners();
            this.setupUIButtons();
            
            this.engine.setScene('main');
            this.engine.start();
            
            this.startStatusDecay();
            
            console.log('Game initialized successfully');
        } catch (error) {
            console.error('Failed to initialize game:', error);
        }
    }

    setupEventListeners() {
        this.engine.on('playerMove', (data) => {
            this.gameScene.movePlayer(data.direction);
        });

        this.engine.on('playerInteract', () => {
            this.gameScene.interact();
        });

        this.engine.on('openInventory', () => {
            this.gameScene.openInventory();
        });

        this.engine.on('openCraft', () => {
            this.gameScene.openCraft();
        });

        this.engine.on('openMap', () => {
            this.gameScene.openMap();
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

        btnMoveUp?.addEventListener('click', () => this.gameScene.movePlayer('up'));
        btnMoveDown?.addEventListener('click', () => this.gameScene.movePlayer('down'));
        btnMoveLeft?.addEventListener('click', () => this.gameScene.movePlayer('left'));
        btnMoveRight?.addEventListener('click', () => this.gameScene.movePlayer('right'));
        btnInteract?.addEventListener('click', () => this.gameScene.interact());
        btnInventory?.addEventListener('click', () => this.gameScene.openInventory());
        btnCraft?.addEventListener('click', () => this.gameScene.openCraft());
        btnMap?.addEventListener('click', () => this.gameScene.openMap());

        const canvas = document.getElementById('gameCanvas');
        canvas?.addEventListener('click', (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            const worldPos = this.engine.renderEngine.screenToWorld(x, y);
            this.gameScene.collectResource(worldPos.x, worldPos.y);
        });
    }

    startStatusDecay() {
        setInterval(() => {
            if (!this.engine.gameState.isPaused && this.engine.gameState.isRunning) {
                const player = this.gameScene.player;
                
                if (player) {
                    player.hunger = Math.max(0, player.hunger - 0.2);
                    player.thirst = Math.max(0, player.thirst - 0.3);
                    
                    if (player.hunger <= 0 || player.thirst <= 0) {
                        player.health = Math.max(0, player.health - 1.0);
                    }
                    
                    this.updateStatusBars();
                }
            }
        }, 1000);
    }

    updateStatusBars() {
        const player = this.gameScene.player;
        if (!player) return;
        
        document.querySelector('.health-fill')?.style.setProperty('width', `${player.health}%`);
        document.querySelector('.hunger-fill')?.style.setProperty('width', `${player.hunger}%`);
        document.querySelector('.thirst-fill')?.style.setProperty('width', `${player.thirst}%`);
        document.querySelector('.stamina-fill')?.style.setProperty('width', `${player.stamina}%`);
        
        const healthValue = document.querySelector('.health-fill')?.parentElement?.nextElementSibling;
        const hungerValue = document.querySelector('.hunger-fill')?.parentElement?.nextElementSibling;
        const thirstValue = document.querySelector('.thirst-fill')?.parentElement?.nextElementSibling;
        const staminaValue = document.querySelector('.stamina-fill')?.parentElement?.nextElementSibling;
        
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

    destroy() {
        this.engine?.destroy();
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.game = new SurvivalGame();
});