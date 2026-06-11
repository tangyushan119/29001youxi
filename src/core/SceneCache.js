class SceneCache {
    constructor() {
        this.cache = new Map();
        this.version = '1.0.0';
        this.cacheKeyPrefix = 'survival_game_scene_';
        
        this.loadVersion();
    }

    loadVersion() {
        const savedVersion = localStorage.getItem('scene_cache_version');
        if (savedVersion && savedVersion !== this.version) {
            this.clearOldCache(savedVersion);
        }
        localStorage.setItem('scene_cache_version', this.version);
    }

    clearOldCache(oldVersion) {
        const keys = Object.keys(localStorage);
        for (const key of keys) {
            if (key.startsWith(this.cacheKeyPrefix)) {
                localStorage.removeItem(key);
            }
        }
    }

    set(key, data, options = {}) {
        const cacheKey = this.cacheKeyPrefix + key;
        
        const cacheItem = {
            data,
            timestamp: Date.now(),
            ttl: options.ttl || null,
            version: this.version
        };
        
        this.cache.set(key, cacheItem);
        
        try {
            localStorage.setItem(cacheKey, JSON.stringify(cacheItem));
        } catch (e) {
            console.warn('LocalStorage write failed:', e);
        }
    }

    get(key) {
        let item = this.cache.get(key);
        
        if (!item) {
            try {
                const cacheKey = this.cacheKeyPrefix + key;
                const stored = localStorage.getItem(cacheKey);
                if (stored) {
                    item = JSON.parse(stored);
                    
                    if (item.version === this.version) {
                        this.cache.set(key, item);
                    }
                }
            } catch (e) {
                console.warn('LocalStorage read failed:', e);
                return null;
            }
        }
        
        if (!item) return null;
        
        if (item.ttl && Date.now() - item.timestamp > item.ttl) {
            this.delete(key);
            return null;
        }
        
        return item.data;
    }

    delete(key) {
        this.cache.delete(key);
        try {
            localStorage.removeItem(this.cacheKeyPrefix + key);
        } catch (e) {
            console.warn('LocalStorage delete failed:', e);
        }
    }

    has(key) {
        const item = this.get(key);
        return item !== null;
    }

    clear() {
        this.cache.clear();
        const keys = Object.keys(localStorage);
        for (const key of keys) {
            if (key.startsWith(this.cacheKeyPrefix)) {
                localStorage.removeItem(key);
            }
        }
    }

    saveSceneState(sceneName, state) {
        this.set(`scene_${sceneName}`, {
            timestamp: Date.now(),
            state
        }, { ttl: 3600000 });
    }

    loadSceneState(sceneName) {
        const cached = this.get(`scene_${sceneName}`);
        if (cached) {
            return cached.state;
        }
        return null;
    }

    savePlayerState(state) {
        this.set('player_state', {
            timestamp: Date.now(),
            state
        }, { ttl: 86400000 });
    }

    loadPlayerState() {
        const cached = this.get('player_state');
        if (cached) {
            return cached.state;
        }
        return null;
    }

    invalidate(sceneName) {
        this.delete(`scene_${sceneName}`);
    }
}

export { SceneCache };