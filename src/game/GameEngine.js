import { ResourceCache } from '../core/ResourceCache.js';
import { RenderEngine } from '../core/RenderEngine.js';
import { InputController } from '../core/InputController.js';
import { UIManager } from '../core/UIManager.js';
import { SceneCache } from '../core/SceneCache.js';

class GameEngine {
    constructor(config = {}) {
        this.config = {
            canvasId: 'gameCanvas',
            debug: false,
            ...config
        };

        this.isInitialized = false;
        this.initializationPromise = null;

        this.gameState = {
            isRunning: false,
            isPaused: false,
            currentScene: null,
            time: {
                day: 1,
                hour: 6,
                minute: 0,
                tick: 0
            },
            player: null,
            world: null,
            entities: new Map()
        };

        this.scenes = new Map();
        this.systems = [];
        this._eventListeners = new Map();

        this.initializationPromise = this.initializeCore();
    }

    async initializeCore() {
        try {
            this.canvas = document.getElementById(this.config.canvasId);
            if (!this.canvas) {
                throw new Error(`Canvas element with id "${this.config.canvasId}" not found`);
            }

            this.resourceCache = new ResourceCache();
            this.sceneCache = new SceneCache();
            this.inputController = new InputController();
            this.uiManager = new UIManager();

            await this.initializeRenderEngine();

            this.setupEventListeners();
            this.setupDefaultBindings();

            this.isInitialized = true;
            this.emit('engineReady');
            
            return true;
        } catch (error) {
            console.error('GameEngine initialization failed:', error);
            throw error;
        }
    }

    async initializeRenderEngine() {
        return new Promise((resolve) => {
            this.renderEngine = new RenderEngine(this.canvas);
            this.handleResize();
            resolve();
        });
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
    }

    setupDefaultBindings() {
        this.inputController.bind('KeyW', () => this.onMove('up'), 'down');
        this.inputController.bind('KeyS', () => this.onMove('down'), 'down');
        this.inputController.bind('KeyA', () => this.onMove('left'), 'down');
        this.inputController.bind('KeyD', () => this.onMove('right'), 'down');
        this.inputController.bind('ArrowUp', () => this.onMove('up'), 'down');
        this.inputController.bind('ArrowDown', () => this.onMove('down'), 'down');
        this.inputController.bind('ArrowLeft', () => this.onMove('left'), 'down');
        this.inputController.bind('ArrowRight', () => this.onMove('right'), 'down');
        
        this.inputController.bind('Space', () => this.onInteract(), 'down');
        this.inputController.bind('KeyI', () => this.onOpenInventory(), 'down');
        this.inputController.bind('KeyC', () => this.onOpenCraft(), 'down');
        this.inputController.bind('KeyM', () => this.onOpenMap(), 'down');
        this.inputController.bind('KeyP', () => this.togglePause(), 'down');
    }

    handleResize() {
        const wrapper = this.canvas.parentElement;
        const rect = wrapper.getBoundingClientRect();
        const padding = 20;
        this.renderEngine.resize(rect.width - padding * 2, rect.height - padding * 2);
    }

    onMove(direction) {
        if (this.gameState.isPaused || !this.gameState.isRunning) return;
        this.emit('playerMove', { direction });
    }

    onInteract() {
        if (this.gameState.isPaused || !this.gameState.isRunning) return;
        this.emit('playerInteract');
    }

    onOpenInventory() {
        this.emit('openInventory');
    }

    onOpenCraft() {
        this.emit('openCraft');
    }

    onOpenMap() {
        this.emit('openMap');
    }

    togglePause() {
        this.gameState.isPaused = !this.gameState.isPaused;
        this.emit('pauseChanged', { isPaused: this.gameState.isPaused });
        
        if (this.gameState.isPaused) {
            this.renderEngine.pause();
        } else {
            this.renderEngine.resume();
        }
    }

    addScene(name, scene) {
        this.scenes.set(name, scene);
    }

    setScene(name) {
        if (!this.scenes.has(name)) {
            throw new Error(`Scene "${name}" not found`);
        }
        
        if (this.gameState.currentScene) {
            this.gameState.currentScene.unload();
        }
        
        this.gameState.currentScene = this.scenes.get(name);
        this.gameState.currentScene.load();
        
        this.emit('sceneChanged', { scene: name });
    }

    addSystem(system) {
        this.systems.push(system);
        system.init(this);
    }

    addEntity(entity) {
        this.gameState.entities.set(entity.id, entity);
        this.emit('entityAdded', { entity });
    }

    removeEntity(entityId) {
        const entity = this.gameState.entities.get(entityId);
        if (entity) {
            this.gameState.entities.delete(entityId);
            this.emit('entityRemoved', { entity });
        }
    }

    getEntity(entityId) {
        return this.gameState.entities.get(entityId);
    }

    start() {
        this.gameState.isRunning = true;
        this.renderEngine.start();
        this.gameLoop();
        
        this.emit('gameStarted');
    }

    stop() {
        this.gameState.isRunning = false;
        this.renderEngine.stop();
        
        this.emit('gameStopped');
    }

    gameLoop() {
        if (!this.gameState.isRunning) return;

        const deltaTime = 1 / 60;
        
        if (!this.gameState.isPaused) {
            this.update(deltaTime);
        }

        this.inputController.update();
        
        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        this.updateTime(deltaTime);
        
        for (const system of this.systems) {
            system.update(deltaTime);
        }
        
        for (const entity of this.gameState.entities.values()) {
            if (entity.update) {
                entity.update(deltaTime);
            }
        }
        
        if (this.gameState.currentScene && this.gameState.currentScene.update) {
            this.gameState.currentScene.update(deltaTime);
        }
        
        this.emit('update', { deltaTime });
    }

    updateTime(deltaTime) {
        this.gameState.time.tick += deltaTime;
        
        if (this.gameState.time.tick >= 1) {
            this.gameState.time.tick = 0;
            this.gameState.time.minute++;
            
            if (this.gameState.time.minute >= 60) {
                this.gameState.time.minute = 0;
                this.gameState.time.hour++;
                
                if (this.gameState.time.hour >= 24) {
                    this.gameState.time.hour = 0;
                    this.gameState.time.day++;
                    
                    this.emit('dayChanged', { day: this.gameState.time.day });
                }
                
                this.emit('hourChanged', { hour: this.gameState.time.hour });
            }
            
            this.emit('minuteChanged', { minute: this.gameState.time.minute });
        }
    }

    on(event, callback) {
        if (!this._eventListeners) {
            this._eventListeners = new Map();
        }
        
        if (!this._eventListeners.has(event)) {
            this._eventListeners.set(event, []);
        }
        
        this._eventListeners.get(event).push(callback);
    }

    off(event, callback) {
        if (!this._eventListeners || !this._eventListeners.has(event)) return;
        
        const listeners = this._eventListeners.get(event);
        this._eventListeners.set(event, listeners.filter(cb => cb !== callback));
    }

    emit(event, data = {}) {
        if (!this._eventListeners || !this._eventListeners.has(event)) return;
        
        for (const callback of this._eventListeners.get(event)) {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event listener for "${event}":`, error);
            }
        }
    }

    async loadResource(url, key, options = {}) {
        return await this.resourceCache.loadAndCache(url, key, options);
    }

    getCachedResource(key) {
        return this.resourceCache.get(key);
    }

    destroy() {
        this.stop();
        
        this.resourceCache.clear();
        this.sceneCache.clear();
        this.inputController.destroy();
        this.uiManager.destroy();
        
        window.removeEventListener('resize', () => this.handleResize());
        
        if (this._eventListeners) {
            this._eventListeners.clear();
        }
    }

    clearSceneCache() {
        this.sceneCache.clear();
    }
}

export { GameEngine };