class ResourceCache {
    constructor() {
        this.cache = new Map();
        this.metadata = new Map();
        this.cacheSize = 0;
        this.maxCacheSize = 100 * 1024 * 1024;
        this.hitCount = 0;
        this.missCount = 0;
    }

    set(key, data, options = {}) {
        const size = this.calculateSize(data);
        
        if (this.cacheSize + size > this.maxCacheSize) {
            this.evictOldest();
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            accessCount: 0,
            ttl: options.ttl || null,
            size
        });

        this.cacheSize += size;

        if (options.metadata) {
            this.metadata.set(key, options.metadata);
        }
    }

    get(key) {
        const item = this.cache.get(key);
        
        if (!item) {
            this.missCount++;
            return null;
        }

        if (item.ttl && Date.now() - item.timestamp > item.ttl) {
            this.delete(key);
            this.missCount++;
            return null;
        }

        item.accessCount++;
        item.timestamp = Date.now();
        this.hitCount++;

        return item.data;
    }

    delete(key) {
        const item = this.cache.get(key);
        if (item) {
            this.cacheSize -= item.size;
            this.cache.delete(key);
            this.metadata.delete(key);
            return true;
        }
        return false;
    }

    has(key) {
        const item = this.cache.get(key);
        if (!item) return false;
        if (item.ttl && Date.now() - item.timestamp > item.ttl) {
            this.delete(key);
            return false;
        }
        return true;
    }

    clear() {
        this.cache.clear();
        this.metadata.clear();
        this.cacheSize = 0;
        this.hitCount = 0;
        this.missCount = 0;
    }

    keys() {
        return Array.from(this.cache.keys());
    }

    evictOldest() {
        let oldestKey = null;
        let oldestTime = Infinity;

        for (const [key, item] of this.cache) {
            if (item.timestamp < oldestTime) {
                oldestTime = item.timestamp;
                oldestKey = key;
            }
        }

        if (oldestKey) {
            this.delete(oldestKey);
        }
    }

    evictByType(type) {
        const keysToDelete = [];
        
        for (const [key, item] of this.cache) {
            const meta = this.metadata.get(key);
            if (meta && meta.type === type) {
                keysToDelete.push(key);
            }
        }

        for (const key of keysToDelete) {
            this.delete(key);
        }
    }

    calculateSize(data) {
        if (typeof data === 'string') {
            return data.length * 2;
        } else if (data instanceof Image) {
            return data.width * data.height * 4;
        } else if (data instanceof ArrayBuffer) {
            return data.byteLength;
        } else if (typeof data === 'object') {
            return JSON.stringify(data).length * 2;
        }
        return 0;
    }

    getStats() {
        const hitRate = this.hitCount + this.missCount > 0 
            ? (this.hitCount / (this.hitCount + this.missCount) * 100).toFixed(2)
            : '0.00';
        
        return {
            cacheSize: this.formatSize(this.cacheSize),
            maxCacheSize: this.formatSize(this.maxCacheSize),
            itemCount: this.cache.size,
            hitCount: this.hitCount,
            missCount: this.missCount,
            hitRate: `${hitRate}%`
        };
    }

    formatSize(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    async loadAndCache(url, key, options = {}) {
        const cached = this.get(key);
        if (cached) return cached;

        try {
            const response = await fetch(url, options.fetchOptions);
            const data = await this.parseResponse(response, options.responseType);
            
            this.set(key, data, {
                ttl: options.ttl,
                metadata: { type: options.type || 'unknown', url }
            });

            return data;
        } catch (error) {
            console.error(`Failed to load ${url}:`, error);
            throw error;
        }
    }

    async parseResponse(response, responseType = 'json') {
        switch (responseType) {
            case 'json':
                return await response.json();
            case 'text':
                return await response.text();
            case 'blob':
                return await response.blob();
            case 'arraybuffer':
                return await response.arrayBuffer();
            case 'image':
                return await this.loadImage(await response.blob());
            default:
                return await response.json();
        }
    }

    async loadImage(blob) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = URL.createObjectURL(blob);
        });
    }
}

export { ResourceCache };