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
            smoothing: 0.1
        };

        this.layers = new Map();
        this.renderOrder = [];
        this.particles = [];
        this.animations = [];
        
        this.isPaused = false;
        this.lastRenderTime = 0;
        
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
            clear: options.clear !== undefined ? options.clear : false
        };
        
        this.layers.set(name, layer);
        this.renderOrder.push(name);
        this.renderOrder.sort((a, b) => 
            this.layers.get(a).zIndex - this.layers.get(b).zIndex
        );
    }

    removeLayer(name) {
        this.layers.delete(name);
        this.renderOrder = this.renderOrder.filter(n => n !== name);
    }

    setLayerVisibility(name, visible) {
        const layer = this.layers.get(name);
        if (layer) {
            layer.visible = visible;
        }
    }

    addToLayer(layerName, item) {
        const layer = this.layers.get(layerName);
        if (layer) {
            layer.items.push(item);
        }
    }

    removeFromLayer(layerName, itemId) {
        const layer = this.layers.get(layerName);
        if (layer) {
            layer.items = layer.items.filter(item => item.id !== itemId);
        }
    }

    clearLayer(layerName) {
        const layer = this.layers.get(layerName);
        if (layer) {
            layer.items = [];
        }
    }

    setCameraPosition(x, y, instant = false) {
        if (instant) {
            this.camera.x = x;
            this.camera.y = y;
        } else {
            this.camera.targetX = x;
            this.camera.targetY = y;
        }
    }

    setCameraZoom(zoom, instant = false) {
        if (instant) {
            this.camera.zoom = Math.max(0.1, Math.min(5, zoom));
        } else {
            this.camera.targetZoom = Math.max(0.1, Math.min(5, zoom));
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

    start() {
        this.lastRenderTime = performance.now();
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
    }

    renderLoop() {
        if (!this.isPaused) {
            const currentTime = performance.now();
            const deltaTime = (currentTime - this.lastRenderTime) / 1000;
            this.lastRenderTime = currentTime;

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

        for (const layerName of this.renderOrder) {
            const layer = this.layers.get(layerName);
            if (!layer || !layer.visible) continue;

            if (layer.clear) {
                this.ctx.clearRect(-this.width, -this.height, this.width * 2, this.height * 2);
            }

            for (const item of layer.items) {
                this.renderItem(item);
            }
        }

        this.renderParticles();

        this.ctx.restore();

        this.renderUI();
    }

    clear() {
        this.ctx.fillStyle = '#1a1a2e';
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
        if (item.image) {
            const w = item.width || item.image.width;
            const h = item.height || item.image.height;
            this.ctx.drawImage(item.image, w / -2, h / -2, w, h);
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
    }

    drawDebugGrid(cellSize = 40) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        const startX = Math.floor(this.camera.x / cellSize) * cellSize - this.camera.x;
        const startY = Math.floor(this.camera.y / cellSize) * cellSize - this.camera.y;

        for (let x = startX; x < this.width / this.camera.zoom; x += cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, -this.height);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }

        for (let y = startY; y < this.height / this.camera.zoom; y += cellSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(-this.width, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }
}

export { RenderEngine };