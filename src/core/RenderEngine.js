class RenderEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.width = canvas.width;
        this.height = canvas.height;
        
        this.camera = {
            x: 0,
            y: 0,
            zoom: 1,
            targetX: 0,
            targetY: 0,
            targetZoom: 1,
            smoothing: 0.15,
            minZoom: 0.25,
            maxZoom: 3
        };

        this.layers = new Map();
        this.renderOrder = [];
        this.particles = [];
        this.animations = [];
        
        this.isPaused = false;
        this.lastRenderTime = 0;
        this.frameCount = 0;
        this.fps = 0;
        this.lastFpsUpdate = 0;
        
        this.textureCache = new Map();
        this.renderStats = {
            framesRendered: 0,
            itemsRendered: 0,
            particlesRendered: 0,
            totalDrawCalls: 0
        };
        
        this.debugMode = false;
        this.showGrid = false;
        
        this.initLayers();
    }

    initLayers() {
        this.addLayer('background', { zIndex: 0 });
        this.addLayer('terrain', { zIndex: 1 });
        this.addLayer('structures', { zIndex: 1.5 });
        this.addLayer('objects', { zIndex: 2 });
        this.addLayer('player', { zIndex: 3 });
        this.addLayer('ui', { zIndex: 10 });
    }

    addLayer(name, options = {}) {
        const layer = {
            name,
            zIndex: options.zIndex || this.renderOrder.length,
            items: [],
            visible: options.visible !== undefined ? options.visible : true,
            clear: options.clear !== undefined ? options.clear : false,
            useBatchRendering: options.useBatchRendering || false,
            batchCanvas: null,
            batchDirty: true
        };
        
        this.layers.set(name, layer);
        this.renderOrder.push(name);
        this.renderOrder.sort((a, b) => 
            this.layers.get(a).zIndex - this.layers.get(b).zIndex
        );
        
        if (layer.useBatchRendering) {
            layer.batchCanvas = document.createElement('canvas');
            layer.batchCanvas.width = this.width;
            layer.batchCanvas.height = this.height;
        }
    }

    removeLayer(name) {
        this.layers.delete(name);
        this.renderOrder = this.renderOrder.filter(n => n !== name);
    }

    setLayerVisibility(name, visible) {
        const layer = this.layers.get(name);
        if (layer) {
            layer.visible = visible;
            if (layer.useBatchRendering) {
                layer.batchDirty = true;
            }
        }
    }

    addToLayer(layerName, item) {
        const layer = this.layers.get(layerName);
        if (layer) {
            if (!item.visible) item.visible = true;
            layer.items.push(item);
            if (layer.useBatchRendering) {
                layer.batchDirty = true;
            }
        }
    }

    removeFromLayer(layerName, itemId) {
        const layer = this.layers.get(layerName);
        if (layer) {
            layer.items = layer.items.filter(item => item.id !== itemId);
            if (layer.useBatchRendering) {
                layer.batchDirty = true;
            }
        }
    }

    clearLayer(layerName) {
        const layer = this.layers.get(layerName);
        if (layer) {
            layer.items = [];
            if (layer.useBatchRendering) {
                layer.batchDirty = true;
            }
        }
    }

    setCameraPosition(x, y, instant = false) {
        if (instant) {
            this.camera.x = x;
            this.camera.y = y;
            this.camera.targetX = x;
            this.camera.targetY = y;
        } else {
            this.camera.targetX = x;
            this.camera.targetY = y;
        }
    }

    setCameraZoom(zoom, instant = false) {
        const clampedZoom = Math.max(this.camera.minZoom, Math.min(this.camera.maxZoom, zoom));
        if (instant) {
            this.camera.zoom = clampedZoom;
            this.camera.targetZoom = clampedZoom;
        } else {
            this.camera.targetZoom = clampedZoom;
        }
    }

    screenToWorld(screenX, screenY) {
        return {
            x: (screenX - this.width / 2) / this.camera.zoom + this.camera.x,
            y: (screenY - this.height / 2) / this.camera.zoom + this.camera.y
        };
    }

    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.camera.x) * this.camera.zoom + this.width / 2,
            y: (worldY - this.camera.y) * this.camera.zoom + this.height / 2
        };
    }

    isInView(item) {
        if (item.x === undefined || item.y === undefined) return true;
        
        const screenPos = this.worldToScreen(item.x, item.y);
        const margin = 100;
        
        return screenPos.x > -margin && 
               screenPos.x < this.width + margin && 
               screenPos.y > -margin && 
               screenPos.y < this.height + margin;
    }

    start() {
        this.lastRenderTime = performance.now();
        this.lastFpsUpdate = this.lastRenderTime;
        this.renderLoop();
    }

    stop() {
        this.isPaused = true;
    }

    pause() {
        this.isPaused = true;
    }

    resume() {
        this.isPaused = false;
        this.lastRenderTime = performance.now();
        this.lastFpsUpdate = this.lastRenderTime;
    }

    renderLoop() {
        const currentTime = performance.now();
        
        if (!this.isPaused) {
            const deltaTime = (currentTime - this.lastRenderTime) / 1000;
            this.lastRenderTime = currentTime;
            
            this.frameCount++;
            if (currentTime - this.lastFpsUpdate >= 1000) {
                this.fps = this.frameCount;
                this.frameCount = 0;
                this.lastFpsUpdate = currentTime;
            }
            
            this.update(deltaTime);
            this.render();
        }

        requestAnimationFrame(() => this.renderLoop());
    }

    update(deltaTime) {
        this.camera.x += (this.camera.targetX - this.camera.x) * this.camera.smoothing;
        this.camera.y += (this.camera.targetY - this.camera.y) * this.camera.smoothing;
        this.camera.zoom += (this.camera.targetZoom - this.camera.zoom) * this.camera.smoothing;

        this.updateAnimations(deltaTime);
        this.updateParticles(deltaTime);
    }

    updateAnimations(deltaTime) {
        this.animations = this.animations.filter(anim => {
            anim.update(deltaTime);
            return !anim.isComplete;
        });
    }

    updateParticles(deltaTime) {
        this.particles = this.particles.filter(particle => {
            particle.update(deltaTime);
            return particle.life > 0;
        });
    }

    render() {
        this.clear();
        
        this.ctx.save();
        this.ctx.translate(this.width / 2, this.height / 2);
        this.ctx.scale(this.camera.zoom, this.camera.zoom);
        this.ctx.translate(-this.camera.x, -this.camera.y);

        this.renderStats.itemsRendered = 0;
        this.renderStats.particlesRendered = 0;

        for (const layerName of this.renderOrder) {
            const layer = this.layers.get(layerName);
            if (!layer || !layer.visible) continue;

            if (layer.clear) {
                this.ctx.clearRect(-this.width, -this.height, this.width * 2, this.height * 2);
            }

            if (layer.useBatchRendering) {
                this.renderBatchLayer(layer);
            } else {
                this.renderLayer(layer);
            }
        }

        this.renderParticles();

        if (this.showGrid) {
            this.drawDebugGrid();
        }

        this.ctx.restore();

        this.renderUI();
        
        if (this.debugMode) {
            this.renderDebugInfo();
        }
        
        this.renderStats.framesRendered++;
    }

    renderLayer(layer) {
        for (const item of layer.items) {
            if (!item.visible) continue;
            if (!this.isInView(item)) continue;
            
            this.renderItem(item);
            this.renderStats.itemsRendered++;
        }
    }

    renderBatchLayer(layer) {
        if (!layer.batchCanvas) return;
        
        if (layer.batchDirty) {
            const batchCtx = layer.batchCanvas.getContext('2d');
            batchCtx.clearRect(0, 0, layer.batchCanvas.width, layer.batchCanvas.height);
            
            batchCtx.save();
            batchCtx.translate(layer.batchCanvas.width / 2, layer.batchCanvas.height / 2);
            batchCtx.scale(this.camera.zoom, this.camera.zoom);
            batchCtx.translate(-this.camera.x, -this.camera.y);
            
            for (const item of layer.items) {
                if (!item.visible) continue;
                if (!this.isInView(item)) continue;
                
                this.renderItemToContext(batchCtx, item);
                this.renderStats.itemsRendered++;
            }
            
            batchCtx.restore();
            layer.batchDirty = false;
        }
        
        this.ctx.drawImage(layer.batchCanvas, -this.width / 2, -this.height / 2);
    }

    clear() {
        this.ctx.fillStyle = '#0f0f1a';
        this.ctx.fillRect(0, 0, this.width, this.height);
    }

    renderItem(item) {
        if (!item.visible) return;

        this.ctx.save();

        if (item.x !== undefined && item.y !== undefined) {
            this.ctx.translate(item.x, item.y);
        }

        if (item.rotation) {
            this.ctx.rotate(item.rotation);
        }

        if (item.scale !== undefined) {
            this.ctx.scale(item.scale, item.scale);
        }

        if (item.opacity !== undefined) {
            this.ctx.globalAlpha = item.opacity;
        }

        if (item.draw) {
            item.draw(this.ctx);
        } else if (item.type === 'rect') {
            this.renderRect(item);
        } else if (item.type === 'circle') {
            this.renderCircle(item);
        } else if (item.type === 'text') {
            this.renderText(item);
        } else if (item.type === 'sprite') {
            this.renderSprite(item);
        }

        this.ctx.restore();
    }

    renderItemToContext(ctx, item) {
        if (!item.visible) return;

        ctx.save();

        if (item.x !== undefined && item.y !== undefined) {
            ctx.translate(item.x, item.y);
        }

        if (item.draw) {
            item.draw(ctx);
        } else if (item.type === 'rect') {
            this.renderRectToContext(ctx, item);
        } else if (item.type === 'circle') {
            this.renderCircleToContext(ctx, item);
        }

        ctx.restore();
    }

    renderRect(item) {
        if (item.fill) {
            this.ctx.fillStyle = item.fill;
            this.ctx.fillRect(item.width / -2, item.height / -2, item.width, item.height);
        }
        if (item.stroke) {
            this.ctx.strokeStyle = item.stroke;
            this.ctx.lineWidth = item.lineWidth || 1;
            this.ctx.strokeRect(item.width / -2, item.height / -2, item.width, item.height);
        }
    }

    renderRectToContext(ctx, item) {
        if (item.fill) {
            ctx.fillStyle = item.fill;
            ctx.fillRect(item.width / -2, item.height / -2, item.width, item.height);
        }
        if (item.stroke) {
            ctx.strokeStyle = item.stroke;
            ctx.lineWidth = item.lineWidth || 1;
            ctx.strokeRect(item.width / -2, item.height / -2, item.width, item.height);
        }
    }

    renderCircle(item) {
        this.ctx.beginPath();
        this.ctx.arc(0, 0, item.radius, 0, Math.PI * 2);
        if (item.fill) {
            this.ctx.fillStyle = item.fill;
            this.ctx.fill();
        }
        if (item.stroke) {
            this.ctx.strokeStyle = item.stroke;
            this.ctx.lineWidth = item.lineWidth || 1;
            this.ctx.stroke();
        }
    }

    renderCircleToContext(ctx, item) {
        ctx.beginPath();
        ctx.arc(0, 0, item.radius, 0, Math.PI * 2);
        if (item.fill) {
            ctx.fillStyle = item.fill;
            ctx.fill();
        }
        if (item.stroke) {
            ctx.strokeStyle = item.stroke;
            ctx.lineWidth = item.lineWidth || 1;
            ctx.stroke();
        }
    }

    renderText(item) {
        this.ctx.font = item.font || '12px Arial';
        this.ctx.fillStyle = item.fill || '#ffffff';
        this.ctx.textAlign = item.textAlign || 'center';
        this.ctx.textBaseline = item.textBaseline || 'middle';
        
        if (item.stroke) {
            this.ctx.strokeStyle = item.stroke;
            this.ctx.lineWidth = item.strokeWidth || 2;
            this.ctx.strokeText(item.text, 0, 0);
        }
        
        this.ctx.fillText(item.text, 0, 0);
    }

    renderSprite(item) {
        if (!item.image) {
            console.warn('Sprite item has no image:', item);
            return;
        }
        
        try {
            const w = item.width || item.image.width;
            const h = item.height || item.image.height;
            
            if (w === 0 || h === 0) {
                console.warn('Sprite has zero dimensions:', item);
                return;
            }
            
            if (item.sourceRect) {
                this.ctx.drawImage(
                    item.image,
                    item.sourceRect.x,
                    item.sourceRect.y,
                    item.sourceRect.width,
                    item.sourceRect.height,
                    w / -2,
                    h / -2,
                    w,
                    h
                );
            } else {
                this.ctx.drawImage(item.image, w / -2, h / -2, w, h);
            }
        } catch (error) {
            console.error('Error rendering sprite:', error, item);
        }
    }

    renderParticles() {
        for (const particle of this.particles) {
            this.ctx.save();
            this.ctx.translate(particle.x, particle.y);
            this.ctx.globalAlpha = particle.life / particle.maxLife;
            
            this.ctx.beginPath();
            this.ctx.arc(0, 0, particle.size * (particle.life / particle.maxLife), 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color;
            this.ctx.fill();
            
            this.ctx.restore();
            this.renderStats.particlesRendered++;
        }
    }

    renderUI() {
        const uiLayer = this.layers.get('ui');
        if (!uiLayer || !uiLayer.visible) return;

        this.ctx.save();
        
        for (const item of uiLayer.items) {
            if (!item.visible) continue;
            
            this.ctx.save();
            
            if (item.x !== undefined && item.y !== undefined) {
                this.ctx.translate(item.x, item.y);
            }
            
            if (item.opacity !== undefined) {
                this.ctx.globalAlpha = item.opacity;
            }

            if (item.draw) {
                item.draw(this.ctx);
            } else if (item.type === 'rect') {
                this.renderRect(item);
            } else if (item.type === 'text') {
                this.renderText(item);
            }
            
            this.ctx.restore();
        }
        
        this.ctx.restore();
    }

    renderDebugInfo() {
        this.ctx.save();
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.ctx.fillRect(10, 10, 200, 120);
        
        this.ctx.fillStyle = '#ffffff';
        this.ctx.font = '12px monospace';
        
        let y = 30;
        this.ctx.fillText(`FPS: ${this.fps}`, 20, y); y += 16;
        this.ctx.fillText(`Camera: (${Math.floor(this.camera.x)}, ${Math.floor(this.camera.y)})`, 20, y); y += 16;
        this.ctx.fillText(`Zoom: ${this.camera.zoom.toFixed(2)}`, 20, y); y += 16;
        this.ctx.fillText(`Items: ${this.renderStats.itemsRendered}`, 20, y); y += 16;
        this.ctx.fillText(`Particles: ${this.renderStats.particlesRendered}`, 20, y); y += 16;
        this.ctx.fillText(`Frames: ${this.renderStats.framesRendered}`, 20, y);
        
        this.ctx.restore();
    }

    addParticle(x, y, options = {}) {
        this.particles.push({
            x,
            y,
            vx: options.vx || (Math.random() - 0.5) * 100,
            vy: options.vy || (Math.random() - 0.5) * 100,
            size: options.size || 5,
            color: options.color || '#ffffff',
            life: options.life || 1,
            maxLife: options.life || 1,
            decay: options.decay || 2,
            update(dt) {
                this.x += this.vx * dt;
                this.y += this.vy * dt;
                this.life -= this.decay * dt;
            }
        });
    }

    addAnimation(animation) {
        this.animations.push(animation);
    }

    resize(width, height) {
        this.width = width;
        this.height = height;
        this.canvas.width = width;
        this.canvas.height = height;
        
        for (const layer of this.layers.values()) {
            if (layer.batchCanvas) {
                layer.batchCanvas.width = width;
                layer.batchCanvas.height = height;
                layer.batchDirty = true;
            }
        }
    }

    drawDebugGrid(cellSize = 40) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        const startX = Math.floor(this.camera.x / cellSize) * cellSize - this.camera.x;
        const startY = Math.floor(this.camera.y / cellSize) * cellSize - this.camera.y;

        for (let x = startX; x < this.width / this.camera.zoom + cellSize; x += cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, -this.height);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }

        for (let y = startY; y < this.height / this.camera.zoom + cellSize; y += cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(-this.width, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
        
        this.ctx.strokeStyle = 'rgba(255, 100, 100, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.moveTo(0, -this.height);
        this.ctx.lineTo(0, this.height);
        this.ctx.stroke();
        this.ctx.beginPath();
        this.ctx.moveTo(-this.width, 0);
        this.ctx.lineTo(this.width, 0);
        this.ctx.stroke();
    }

    toggleDebug() {
        this.debugMode = !this.debugMode;
        return this.debugMode;
    }

    toggleGrid() {
        this.showGrid = !this.showGrid;
        return this.showGrid;
    }

    getStats() {
        return {
            fps: this.fps,
            camera: { ...this.camera },
            layers: Array.from(this.layers.keys()),
            renderStats: { ...this.renderStats },
            particleCount: this.particles.length,
            animationCount: this.animations.length
        };
    }

    preloadTexture(image, key) {
        this.textureCache.set(key, image);
    }

    getCachedTexture(key) {
        return this.textureCache.get(key);
    }
}

export { RenderEngine };