class ResourceManager {
    constructor(basePath = 'assets') {
        this.basePath = basePath;
        this.cache = new Map();
        this.loadingPromises = new Map();
        this.terrainConfig = null;
        this.textures = {};
        this.isInitialized = false;
    }

    async initialize() {
        if (this.isInitialized) return;
        
        try {
            await this.loadTerrainConfig();
            await this.preloadTextures();
            this.isInitialized = true;
            console.log('ResourceManager initialized successfully');
        } catch (error) {
            console.error('Failed to initialize ResourceManager:', error);
            throw error;
        }
    }

    getFullPath(relativePath) {
        return `${this.basePath}/${relativePath}`;
    }

    async loadTerrainConfig() {
        const configPath = this.getFullPath('terrain/terrain-config.json');
        return this.loadJson(configPath, 'terrainConfig');
    }

    async loadJson(path, cacheKey) {
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        if (this.loadingPromises.has(cacheKey)) {
            return this.loadingPromises.get(cacheKey);
        }

        const promise = new Promise((resolve, reject) => {
            fetch(path)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`Failed to load ${path}: ${response.status}`);
                    }
                    return response.json();
                })
                .then(data => {
                    this.cache.set(cacheKey, data);
                    resolve(data);
                })
                .catch(error => {
                    console.error(`Error loading JSON from ${path}:`, error);
                    reject(error);
                });
        });

        this.loadingPromises.set(cacheKey, promise);
        return promise;
    }

    async loadImage(path, cacheKey) {
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        if (this.loadingPromises.has(cacheKey)) {
            return this.loadingPromises.get(cacheKey);
        }

        const fullPath = this.getFullPath(path);
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.cache.set(cacheKey, img);
                resolve(img);
            };
            img.onerror = (error) => {
                console.error(`Error loading image from ${fullPath}:`, error);
                reject(error);
            };
            img.src = fullPath;
        });

        this.loadingPromises.set(cacheKey, promise);
        return promise;
    }

    async preloadTextures() {
        const texturesToLoad = [
            { path: 'terrain/grass.png', key: 'grassTexture' },
            { path: 'terrain/water.png', key: 'waterTexture' },
            { path: 'terrain/mountain.png', key: 'mountainTexture' },
            { path: 'terrain/tree.png', key: 'treeTexture' },
            { path: 'terrain/rock.png', key: 'rockTexture' }
        ];

        for (const { path, key } of texturesToLoad) {
            try {
                const img = await this.loadImage(path, key);
                this.textures[key] = img;
            } catch (error) {
                console.warn(`Texture ${path} not found, using procedural rendering`);
                this.textures[key] = null;
            }
        }
    }

    getTerrainConfig() {
        return this.terrainConfig;
    }

    getTexture(key) {
        return this.textures[key] || null;
    }

    hasTexture(key) {
        return this.textures[key] !== undefined && this.textures[key] !== null;
    }

    clearCache() {
        this.cache.clear();
        this.loadingPromises.clear();
    }

    getStats() {
        return {
            cachedItems: this.cache.size,
            loadingItems: this.loadingPromises.size,
            loadedTextures: Object.keys(this.textures).filter(k => this.textures[k] !== null).length
        };
    }
}

export { ResourceManager };