class ResourceManager {
    constructor(basePath = 'assets') {
        this.basePath = basePath;
        this.cache = new Map();
        this.loadingPromises = new Map();
        this.terrainConfig = null;
        this.textures = {};
        this.isInitialized = false;
        this.loadingStats = {
            total: 0,
            loaded: 0,
            failed: 0,
            startTime: 0,
            endTime: 0
        };
        this.errorLog = [];
        this.performanceLog = [];
    }

    log(level, message, data = {}) {
        const timestamp = new Date().toISOString();
        const logEntry = { timestamp, level, message, data };
        
        if (level === 'error') {
            this.errorLog.push(logEntry);
            console.error(`[RESOURCE] ${message}`, data);
        } else if (level === 'warn') {
            console.warn(`[RESOURCE] ${message}`, data);
        } else {
            console.log(`[RESOURCE] ${message}`, data);
        }
    }

    logPerformance(operation, duration, details = {}) {
        const entry = {
            operation,
            duration: `${duration.toFixed(2)}ms`,
            durationMs: duration,
            ...details
        };
        this.performanceLog.push(entry);
        this.log('info', `Performance: ${operation} completed in ${duration.toFixed(2)}ms`, details);
    }

    async initialize() {
        if (this.isInitialized) {
            this.log('info', 'ResourceManager already initialized, skipping');
            return;
        }
        
        this.loadingStats.startTime = Date.now();
        
        try {
            this.log('info', 'Starting ResourceManager initialization');
            
            await this.loadTerrainConfig();
            await this.preloadTextures();
            
            this.isInitialized = true;
            this.loadingStats.endTime = Date.now();
            
            const totalTime = this.loadingStats.endTime - this.loadingStats.startTime;
            this.log('info', `ResourceManager initialized successfully`, {
                totalTime: `${totalTime.toFixed(2)}ms`,
                ...this.getStats()
            });
            
        } catch (error) {
            this.loadingStats.endTime = Date.now();
            this.log('error', 'Failed to initialize ResourceManager', { error: error.message, stack: error.stack });
            throw error;
        }
    }

    getFullPath(relativePath) {
        const fullPath = `${this.basePath}/${relativePath}`;
        return fullPath.replace(/\/\//g, '/');
    }

    async loadTerrainConfig() {
        const startTime = Date.now();
        const configPath = this.getFullPath('terrain/terrain-config.json');
        
        try {
            this.log('info', `Loading terrain config from: ${configPath}`);
            const config = await this.loadJson(configPath, 'terrainConfig');
            this.terrainConfig = config;
            
            this.logPerformance('loadTerrainConfig', Date.now() - startTime, { path: configPath });
            this.log('info', 'Terrain config loaded successfully', { biomes: Object.keys(config.biomes || {}).length });
            
            return config;
        } catch (error) {
            this.log('error', `Failed to load terrain config from ${configPath}`, { error: error.message });
            throw error;
        }
    }

    async loadJson(path, cacheKey) {
        if (this.cache.has(cacheKey)) {
            this.log('debug', `Cache hit for JSON: ${cacheKey}`);
            return this.cache.get(cacheKey);
        }

        if (this.loadingPromises.has(cacheKey)) {
            this.log('debug', `Waiting for loading JSON: ${cacheKey}`);
            return this.loadingPromises.get(cacheKey);
        }

        const startTime = Date.now();
        
        const promise = new Promise((resolve, reject) => {
            fetch(path)
                .then(response => {
                    if (!response.ok) {
                        const error = new Error(`HTTP error ${response.status}: ${response.statusText}`);
                        this.log('error', `Failed to load JSON from ${path}`, { status: response.status, statusText: response.statusText });
                        reject(error);
                        return;
                    }
                    return response.json();
                })
                .then(data => {
                    this.cache.set(cacheKey, data);
                    this.loadingStats.loaded++;
                    this.logPerformance('loadJson', Date.now() - startTime, { path, cacheKey, size: JSON.stringify(data).length });
                    resolve(data);
                })
                .catch(error => {
                    this.loadingStats.failed++;
                    this.log('error', `Error loading JSON from ${path}`, { error: error.message, stack: error.stack });
                    reject(error);
                });
        });

        this.loadingPromises.set(cacheKey, promise);
        return promise;
    }

    async loadImage(path, cacheKey) {
        if (this.cache.has(cacheKey)) {
            this.log('debug', `Cache hit for image: ${cacheKey}`);
            return this.cache.get(cacheKey);
        }

        if (this.loadingPromises.has(cacheKey)) {
            this.log('debug', `Waiting for loading image: ${cacheKey}`);
            return this.loadingPromises.get(cacheKey);
        }

        const fullPath = this.getFullPath(path);
        const startTime = Date.now();

        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            
            img.onload = () => {
                this.cache.set(cacheKey, img);
                this.textures[cacheKey] = img;
                this.loadingStats.loaded++;
                this.logPerformance('loadImage', Date.now() - startTime, { 
                    path: fullPath, 
                    cacheKey, 
                    width: img.width, 
                    height: img.height 
                });
                this.log('info', `Image loaded successfully: ${fullPath}`, { width: img.width, height: img.height });
                resolve(img);
            };
            
            img.onerror = (event) => {
                this.loadingStats.failed++;
                const errorMessage = event?.message || `Failed to load image: ${fullPath}`;
                this.log('error', errorMessage, { path: fullPath, cacheKey });
                reject(new Error(errorMessage));
            };
            
            img.src = fullPath;
            this.log('debug', `Starting image load: ${fullPath}`);
        });

        this.loadingPromises.set(cacheKey, promise);
        return promise;
    }

    async preloadTextures() {
        const startTime = Date.now();
        const texturesToLoad = [
            { path: 'terrain/grass.png', key: 'grassTexture' },
            { path: 'terrain/water.png', key: 'waterTexture' },
            { path: 'terrain/mountain.png', key: 'mountainTexture' },
            { path: 'terrain/tree.png', key: 'treeTexture' },
            { path: 'terrain/rock.png', key: 'rockTexture' },
            { path: 'terrain/snow.png', key: 'snowTexture' },
            { path: 'terrain/sand.png', key: 'sandTexture' },
            { path: 'terrain/desert.png', key: 'desertTexture' },
            { path: 'terrain/beach.png', key: 'beachTexture' },
            { path: 'terrain/forest.png', key: 'forestTexture' },
            { path: 'terrain/ocean.png', key: 'oceanTexture' },
            { path: 'terrain/river.png', key: 'riverTexture' }
        ];

        this.loadingStats.total += texturesToLoad.length;
        
        const loadPromises = texturesToLoad.map(async ({ path, key }) => {
            try {
                const img = await this.loadImage(path, key);
                return { key, success: true, img };
            } catch (error) {
                this.log('warn', `Texture ${path} not found, using procedural rendering as fallback`, { error: error.message });
                this.textures[key] = null;
                return { key, success: false, error: error.message };
            }
        });

        const results = await Promise.all(loadPromises);
        
        const successCount = results.filter(r => r.success).length;
        const failCount = results.filter(r => !r.success).length;
        
        this.logPerformance('preloadTextures', Date.now() - startTime, { 
            total: texturesToLoad.length, 
            success: successCount, 
            failed: failCount 
        });
        this.log('info', `Texture preloading completed`, { success: successCount, failed: failCount });
        
        return results;
    }

    async loadTextureWithFallback(path, cacheKey, fallbackColor = '#888888') {
        try {
            return await this.loadImage(path, cacheKey);
        } catch (error) {
            this.log('warn', `Using fallback for missing texture: ${cacheKey}`, { fallbackColor });
            return this.createProceduralTexture(cacheKey, fallbackColor);
        }
    }

    createProceduralTexture(name, color, size = 40) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, size, size);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 0; i < size; i += 5) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, size);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(size, i);
            ctx.stroke();
        }
        
        this.cache.set(name, canvas);
        this.textures[name] = canvas;
        
        return canvas;
    }

    getTerrainConfig() {
        return this.terrainConfig;
    }

    getTexture(key) {
        const texture = this.textures[key];
        if (!texture) {
            this.log('warn', `Texture not found: ${key}`);
        }
        return texture || null;
    }

    hasTexture(key) {
        return this.textures[key] !== undefined && this.textures[key] !== null;
    }

    clearCache() {
        this.log('info', 'Clearing resource cache');
        this.cache.clear();
        this.loadingPromises.clear();
        this.textures = {};
        this.errorLog = [];
        this.performanceLog = [];
        this.loadingStats = {
            total: 0,
            loaded: 0,
            failed: 0,
            startTime: 0,
            endTime: 0
        };
    }

    getStats() {
        return {
            cachedItems: this.cache.size,
            loadingItems: this.loadingPromises.size,
            loadedTextures: Object.keys(this.textures).filter(k => this.textures[k] !== null).length,
            totalTextures: Object.keys(this.textures).length,
            hasTerrainConfig: this.terrainConfig !== null,
            basePath: this.basePath,
            loadingStats: { ...this.loadingStats },
            errorCount: this.errorLog.length
        };
    }

    getErrorReport() {
        return {
            errors: this.errorLog,
            summary: {
                totalErrors: this.errorLog.length,
                lastError: this.errorLog[this.errorLog.length - 1] || null,
                timestamp: new Date().toISOString()
            }
        };
    }

    getPerformanceReport() {
        return {
            operations: this.performanceLog,
            summary: {
                totalOperations: this.performanceLog.length,
                totalDuration: this.performanceLog.reduce((sum, op) => sum + op.durationMs, 0),
                averageDuration: this.performanceLog.length > 0 
                    ? (this.performanceLog.reduce((sum, op) => sum + op.durationMs, 0) / this.performanceLog.length).toFixed(2)
                    : '0',
                timestamp: new Date().toISOString()
            }
        };
    }

    async loadAllResources() {
        this.log('info', 'Loading all game resources...');
        
        const startTime = Date.now();
        this.loadingStats.startTime = startTime;
        
        try {
            await this.loadTerrainConfig();
            this.log('info', '✓ Terrain config loaded');
            
            await this.preloadTextures();
            this.log('info', '✓ Textures preloaded');
            
            const stats = this.getStats();
            const endTime = Date.now();
            
            this.log('info', `Resource loading completed in ${endTime - startTime}ms`, {
                loadedTextures: stats.loadedTextures,
                totalTextures: stats.totalTextures,
                cachedItems: stats.cachedItems,
                errors: stats.errorCount
            });
            
            return {
                ...stats,
                totalLoadTime: endTime - startTime
            };
        } catch (error) {
            this.log('error', 'Failed to load all resources', { error: error.message, stack: error.stack });
            throw error;
        }
    }

    async warmUpCache() {
        this.log('info', 'Warming up resource cache');
        
        if (!this.terrainConfig) {
            await this.loadTerrainConfig();
        }
        
        const biomeTextures = [];
        if (this.terrainConfig?.biomes) {
            for (const [biomeName, biomeConfig] of Object.entries(this.terrainConfig.biomes)) {
                if (biomeConfig.textureKey) {
                    biomeTextures.push({
                        path: `terrain/${biomeConfig.textureKey}.png`,
                        key: `${biomeName}Texture`
                    });
                }
            }
        }
        
        if (biomeTextures.length > 0) {
            this.log('info', `Preloading ${biomeTextures.length} biome textures`);
            const promises = biomeTextures.map(({ path, key }) => 
                this.loadTextureWithFallback(path, key)
            );
            await Promise.all(promises);
        }
        
        this.log('info', 'Cache warm-up completed');
    }
}

export { ResourceManager };