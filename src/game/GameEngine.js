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
        this._eventListeners = null;

        this.initializationPromise = this.initializeCore();
    }

    async initializeCore() {
        try {
            console.log('Initializing GameEngine...');
            
            this.canvas = document.getElementById(this.config.canvasId);
            if (!this.canvas) {
                throw new Error(`Canvas element with id "${this.config.canvasId}" not found`);
            }

            await this.initializeRenderEngine();

            this.resourceCache = new ResourceCache();
            this.sceneCache = new SceneCache();
            this.inputController = new InputController();
            this.uiManager = new UIManager();

            this.setupEventListeners();
            this.setupDefaultBindings();

            this.isInitialized = true;
            this.emit('engineReady');
            
            console.log('GameEngine initialized successfully');
            return true;
        } catch (error) {
            console.error('GameEngine initialization failed:', error);
            throw error;
        }
    }

    async initializeRenderEngine() {
        return new Promise((resolve, reject) => {
            try {
                if (!this.canvas) {
                    reject(new Error('Canvas not found, cannot initialize RenderEngine'));
                    return;
                }
                
                this.renderEngine = new RenderEngine(this.canvas);
                this.handleResize();
                console.log('RenderEngine initialized successfully');
                resolve();
            } catch (error) {
                console.error('Failed to initialize RenderEngine:', error);
                reject(error);
            }
        });
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.handleResize());
        this.handleResize();
    }

    setupDefaultBindings() {
        if (!this.inputController) {
            console.error('InputController not initialized, cannot setup bindings');
            return;
        }

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
        if (!this.renderEngine || !this.canvas) {
            console.error('RenderEngine or Canvas not initialized, cannot handle resize');
            return;
        }

        const wrapper = this.canvas.parentElement;
        if (!wrapper) {
            console.warn('Canvas has no parent element');
            return;
        }

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
        
        if (this.renderEngine) {
            if (this.gameState.isPaused) {
                this.renderEngine.pause();
            } else {
                this.renderEngine.resume();
            }
        }
    }

    addScene(name, scene) {
        if (!name || !scene) {
            console.error('Invalid scene name or scene object');
            return;
        }
        this.scenes.set(name, scene);
    }

    setScene(name) {
        if (!this.renderEngine) {
            console.error('RenderEngine not initialized, cannot set scene');
            throw new Error('RenderEngine not initialized');
        }
        
        if (!this.scenes.has(name)) {
            console.error(`Scene "${name}" not found`);
            throw new Error(`Scene "${name}" not found`);
        }
        
        if (this.gameState.currentScene) {
            try {
                this.gameState.currentScene.unload();
            } catch (error) {
                console.error('Error unloading current scene:', error);
            }
        }
        
        this.gameState.currentScene = this.scenes.get(name);
        
        try {
            this.gameState.currentScene.load();
        } catch (error) {
            console.error('Error loading scene:', error);
            throw error;
        }
        
        this.emit('sceneChanged', { scene: name });
    }

    addSystem(system) {
        if (!system) {
            console.error('Invalid system object');
            return;
        }
        this.systems.push(system);
        system.init(this);
    }

    addEntity(entity) {
        if (!entity || !entity.id) {
            console.error('Invalid entity object');
            return;
        }
        this.gameState.entities.set(entity.id, entity);
        this.emit('entityAdded', { entity });
    }

    removeEntity(entityId) {
        if (!entityId) {
            console.error('Invalid entity ID');
            return;
        }
        
        const entity = this.gameState.entities.get(entityId);
        if (entity) {
            this.gameState.entities.delete(entityId);
            this.emit('entityRemoved', { entity });
        }
    }

    getEntity(entityId) {
        if (!entityId) {
            console.error('Invalid entity ID');
            return null;
        }
        return this.gameState.entities.get(entityId);
    }

    start() {
        if (!this.isInitialized) {
            console.error('GameEngine not initialized, cannot start');
            throw new Error('GameEngine not initialized');
        }

        if (!this.renderEngine) {
            console.error('RenderEngine not initialized, cannot start');
            throw new Error('RenderEngine not initialized');
        }

        this.gameState.isRunning = true;
        this.renderEngine.start();
        this.gameLoop();
        
        this.emit('gameStarted');
    }

    stop() {
        this.gameState.isRunning = false;
        
        if (this.renderEngine) {
            this.renderEngine.stop();
        }
        
        this.emit('gameStopped');
    }

    gameLoop() {
        if (!this.gameState.isRunning) return;

        const deltaTime = 1 / 60;
        
        if (!this.gameState.isPaused) {
            this.update(deltaTime);
        }

        if (this.inputController) {
            this.inputController.update();
        }
        
        requestAnimationFrame(() => this.gameLoop());
    }

    update(deltaTime) {
        this.updateTime(deltaTime);
        
        for (const system of this.systems) {
            try {
                system.update(deltaTime);
            } catch (error) {
                console.error('Error updating system:', error);
            }
        }
        
        for (const entity of this.gameState.entities.values()) {
            if (entity.update) {
                try {
                    entity.update(deltaTime);
                } catch (error) {
                    console.error('Error updating entity:', error);
                }
            }
        }
        
        if (this.gameState.currentScene && this.gameState.currentScene.update) {
            try {
                this.gameState.currentScene.update(deltaTime);
            } catch (error) {
                console.error('Error updating scene:', error);
            }
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
        if (!event || typeof callback !== 'function') {
            console.error('Invalid event name or callback');
            return;
        }
        
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
        if (!this.resourceCache) {
            console.error('ResourceCache not initialized');
            throw new Error('ResourceCache not initialized');
        }
        return await this.resourceCache.loadAndCache(url, key, options);
    }

    getCachedResource(key) {
        if (!this.resourceCache) {
            console.error('ResourceCache not initialized');
            return null;
        }
        return this.resourceCache.get(key);
    }

    destroy() {
        this.stop();
        
        if (this.resourceCache) {
            this.resourceCache.clear();
        }
        if (this.sceneCache) {
            this.sceneCache.clear();
        }
        if (this.inputController) {
            this.inputController.destroy();
        }
        if (this.uiManager) {
            this.uiManager.destroy();
        }
        
        window.removeEventListener('resize', () => this.handleResize());
        
        if (this._eventListeners) {
            this._eventListeners.clear();
        }
    }

    clearSceneCache() {
        if (this.sceneCache) {
            this.sceneCache.clear();
        }
    }
}

export { GameEngine };