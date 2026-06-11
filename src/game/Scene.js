class Scene {
    constructor(name) {
        this.name = name;
        this.entities = [];
        this.renderItems = [];
        this.isLoaded = false;
        this.game = null;
        this.renderContext = this;
    }

    init(game) {
        this.game = game;
    }

    load() {
        this.isLoaded = true;
        this.onLoad?.();
    }

    unload() {
        this.isLoaded = false;
        this.entities = [];
        this.renderItems = [];
        this.onUnload?.();
    }

    addEntity(entity) {
        this.entities.push(entity);
        entity.scene = this;
        entity.init?.(this.game);
        
        if (entity.renderItem) {
            this.addRenderItem(entity.renderItem);
        }
    }

    removeEntity(entityId) {
        this.entities = this.entities.filter(e => e.id !== entityId);
        this.renderItems = this.renderItems.filter(r => r.id !== entityId);
    }

    addRenderItem(item) {
        const layer = item.layer || 'objects';
        this.game.renderEngine.addToLayer(layer, item);
        this.renderItems.push(item);
    }

    removeRenderItem(itemId) {
        for (const item of this.renderItems) {
            if (item.id === itemId) {
                const layer = item.layer || 'objects';
                this.game.renderEngine.removeFromLayer(layer, itemId);
                break;
            }
        }
        this.renderItems = this.renderItems.filter(r => r.id !== itemId);
    }

    update(deltaTime) {
        for (const entity of this.entities) {
            entity.update?.(deltaTime);
        }
        this.onUpdate?.(deltaTime);
    }

    render() {
        this.onRender?.();
    }

    onLoad() {}
    onUnload() {}
    onUpdate(deltaTime) {}
    onRender() {}
}

class GameScene extends Scene {
    constructor(name) {
        super(name);
        this.player = null;
        this.world = null;
        this.hud = null;
        this.resourceRenderConfigs = null;
    }

    load() {
        super.load();
        this.setupWorld();
        this.setupPlayer();
        this.setupHUD();
        this.saveSceneToCache();
    }

    setupWorld() {
        const cachedWorld = this.loadWorldFromCache();
        
        if (cachedWorld) {
            this.world = cachedWorld;
            this.restoreRenderItemsFromCache();
        } else {
            this.world = {
                width: 2000,
                height: 2000,
                tiles: [],
                resources: [],
                structures: []
            };
            this.generateWorld();
        }
    }

    generateWorld() {
        const resourceTypes = [
            { type: 'tree', color: '#8B4513', drop: 'wood', dropAmount: 2 },
            { type: 'stone', color: '#708090', drop: 'stone', dropAmount: 1 },
            { type: 'grass', color: '#228B22', drop: 'grass', dropAmount: 1 }
        ];

        this.resourceRenderConfigs = [];

        for (let i = 0; i < 30; i++) {
            const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
            const x = Math.random() * (this.world.width - 100) + 50;
            const y = Math.random() * (this.world.height - 100) + 50;

            const resource = {
                id: `resource_${i}`,
                type: resourceType.type,
                x,
                y,
                color: resourceType.color,
                drop: resourceType.drop,
                dropAmount: resourceType.dropAmount,
                collected: false,
                respawnTimer: 0
            };

            this.world.resources.push(resource);

            this.resourceRenderConfigs.push({
                id: resource.id,
                x: resource.x,
                y: resource.y,
                type: resource.type,
                color: resource.color,
                collected: resource.collected
            });

            this.createResourceRenderItem(resource);
        }

        this.setupPlots();
    }

    createResourceRenderItem(resource) {
        const sceneRef = this;
        const renderItem = {
            id: resource.id,
            x: resource.x,
            y: resource.y,
            type: resource.type,
            color: resource.color,
            visible: !resource.collected,
            layer: 'objects',
            resourceData: resource,
            draw: function(ctx) {
                if (!this.resourceData.collected) {
                    sceneRef.drawResource(ctx, this.resourceData);
                }
            }
        };

        this.addRenderItem(renderItem);
        return renderItem;
    }

    setupPlots() {
        const startX = 400;
        const startY = 200;
        const rows = 3;
        const cols = 4;
        const tileSize = 40;

        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const plot = {
                    id: `plot_${row}_${col}`,
                    x: startX + col * (tileSize + 10),
                    y: startY + row * (tileSize + 10),
                    width: tileSize,
                    height: tileSize,
                    planted: false,
                    seedType: null,
                    growthStage: 0,
                    watered: false,
                    harvestable: false
                };

                this.world.structures.push(plot);

                this.createPlotRenderItem(plot);
            }
        }
    }

    createPlotRenderItem(plot) {
        const sceneRef = this;
        const renderItem = {
            id: plot.id,
            x: plot.x + plot.width / 2,
            y: plot.y + plot.height / 2,
            width: plot.width,
            height: plot.height,
            plotData: plot,
            layer: 'terrain',
            draw: function(ctx) {
                sceneRef.drawPlot(ctx, this.plotData);
            }
        };

        this.addRenderItem(renderItem);
        return renderItem;
    }

    setupPlayer() {
        const cachedPlayer = this.loadPlayerFromCache();
        
        if (cachedPlayer) {
            this.player = cachedPlayer;
        } else {
            this.player = {
                id: 'player',
                x: 200,
                y: 200,
                width: 32,
                height: 48,
                direction: 'down',
                speed: 4,
                health: 200,
                hunger: 200,
                thirst: 200,
                stamina: 200,
                inventory: {
                    seeds: 5,
                    food: 3,
                    water: 2,
                    wood: 0,
                    stone: 0,
                    grass: 0
                }
            };
        }

        this.player.update = (deltaTime) => {
            if (this.player.stamina < 200) {
                this.player.stamina = Math.min(200, this.player.stamina + 0.2);
            }
        };

        this.createPlayerRenderItem();
        this.game.gameState.player = this.player;
    }

    createPlayerRenderItem() {
        const sceneRef = this;
        const renderItem = {
            id: 'player',
            x: this.player.x + this.player.width / 2,
            y: this.player.y + this.player.height / 2,
            width: this.player.width,
            height: this.player.height,
            direction: this.player.direction,
            layer: 'player',
            draw: function(ctx) {
                sceneRef.drawPlayer(ctx);
            }
        };

        this.addRenderItem(renderItem);
        return renderItem;
    }

    setupHUD() {
        if (!this.player) return;
        
        this.hud = this.game.uiManager.createHUD({
            statusBars: [
                { label: '生命值', value: this.player.health, color: 'linear-gradient(90deg, #e74c3c, #c0392b)' },
                { label: '饥饿度', value: this.player.hunger, color: 'linear-gradient(90deg, #f1c40f, #f39c12)' },
                { label: '口渴度', value: this.player.thirst, color: 'linear-gradient(90deg, #3498db, #2980b9)' },
                { label: '体力值', value: this.player.stamina, color: 'linear-gradient(90deg, #2ecc71, #27ae60)' }
            ]
        });
    }

    updateHUD() {
        if (this.hud && this.hud.elements && this.player) {
            this.hud.elements[0]?.setValue(this.player.health);
            this.hud.elements[1]?.setValue(this.player.hunger);
            this.hud.elements[2]?.setValue(this.player.thirst);
            this.hud.elements[3]?.setValue(this.player.stamina);
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        if (this.player) {
            this.player.update?.(deltaTime);
            this.updatePlayerPosition();
        }
        this.updateResources();
        this.updatePlots();
        this.updateHUD();
        this.checkGameOver();
    }

    updatePlayerPosition() {
        const renderItem = this.renderItems.find(r => r.id === 'player');
        if (renderItem && this.player) {
            renderItem.x = this.player.x + this.player.width / 2;
            renderItem.y = this.player.y + this.player.height / 2;
            renderItem.direction = this.player.direction;
        }
    }

    updateResources() {
        if (!this.world?.resources) return;
        
        for (const resource of this.world.resources) {
            if (resource.collected && resource.respawnTimer > 0) {
                resource.respawnTimer -= 16;
                if (resource.respawnTimer <= 0) {
                    resource.collected = false;
                    resource.respawnTimer = 0;
                    
                    const renderItem = this.renderItems.find(r => r.id === resource.id);
                    if (renderItem) {
                        renderItem.visible = true;
                        if (renderItem.resourceData) {
                            renderItem.resourceData.collected = false;
                        }
                    }
                }
            }
        }
    }

    updatePlots() {
        if (!this.world?.structures) return;
        
        for (const plot of this.world.structures) {
            if (plot.planted && plot.watered) {
                plot.growthStage += 0.005;
                if (plot.growthStage >= 1) {
                    plot.harvestable = true;
                }
            }
            if (plot.planted && !plot.watered) {
                plot.growthStage = Math.max(0, plot.growthStage - 0.002);
            }
        }
    }

    checkGameOver() {
        if (this.player && this.player.health <= 0) {
            this.game.stop();
            this.game.uiManager.showModal({
                title: '游戏结束',
                content: `你存活了 ${this.game.gameState.time.day} 天`,
                buttons: [
                    { text: '重新开始', click: () => {
                        this.clearSceneCache();
                        window.location.reload();
                    }}
                ]
            });
        }
    }

    drawPlayer(ctx) {
        if (!this.player) return;
        
        const { x, y, width, height, direction } = this.player;
        
        ctx.save();
        ctx.translate(x, y);
        
        let angle = 0;
        switch(direction) {
            case 'up': angle = 0; break;
            case 'down': angle = Math.PI; break;
            case 'left': angle = -Math.PI / 2; break;
            case 'right': angle = Math.PI / 2; break;
        }
        ctx.rotate(angle);
        
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(-width / 2, -height / 2, width, height);
        
        ctx.fillStyle = '#34495e';
        ctx.fillRect(-width / 2, -height / 2, width, height / 3);
        
        ctx.fillStyle = '#e74c3c';
        ctx.beginPath();
        ctx.arc(0, -height / 2 + 8, 8, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-3, -height / 2 + 10, 2, 0, Math.PI * 2);
        ctx.arc(3, -height / 2 + 10, 2, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    drawPlot(ctx, plot) {
        ctx.fillStyle = '#8b4513';
        ctx.fillRect(plot.x, plot.y, plot.width, plot.height);
        
        ctx.strokeStyle = '#4a69bd';
        ctx.lineWidth = 3;
        ctx.strokeRect(plot.x, plot.y, plot.width, plot.height);
        
        ctx.fillStyle = '#4a69bd';
        ctx.font = '10px Arial';
        ctx.fillText('我的地', plot.x + 2, plot.y + 12);
        
        if (plot.planted) {
            this.drawCrop(ctx, plot);
        }
    }

    drawCrop(ctx, plot) {
        const centerX = plot.x + plot.width / 2;
        const centerY = plot.y + plot.height / 2;
        
        if (plot.harvestable) {
            ctx.fillStyle = '#f1c40f';
            for (let i = 0; i < 3; i++) {
                ctx.beginPath();
                ctx.arc(centerX - 8 + i * 8, centerY - 5 - i * 3, 6, 0, Math.PI * 2);
                ctx.fill();
            }
            ctx.strokeStyle = '#27ae60';
            ctx.lineWidth = 2;
            ctx.strokeRect(plot.x + 2, plot.y + 2, plot.width - 4, plot.height - 4);
        } else {
            const stemHeight = 10 + plot.growthStage * 20;
            
            ctx.strokeStyle = '#27ae60';
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.moveTo(centerX, plot.y + plot.height);
            ctx.lineTo(centerX, plot.y + plot.height - stemHeight);
            ctx.stroke();
            
            const leafSize = 5 + plot.growthStage * 10;
            ctx.fillStyle = '#2ecc71';
            ctx.beginPath();
            ctx.ellipse(centerX - 8, plot.y + plot.height - stemHeight / 2, leafSize, 4, -0.5, 0, Math.PI * 2);
            ctx.fill();
            ctx.beginPath();
            ctx.ellipse(centerX + 8, plot.y + plot.height - stemHeight / 2, leafSize, 4, 0.5, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (!plot.watered && plot.planted) {
            ctx.fillStyle = '#e74c3c';
            ctx.font = '12px Arial';
            ctx.fillText('!', centerX - 4, centerY + 4);
        }
    }

    drawResource(ctx, resource) {
        const { x, y, type, color } = resource;
        
        ctx.save();
        ctx.translate(x, y);
        
        switch(type) {
            case 'tree':
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(-12, 0, 24, 48);
                
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(0, -15, 24, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#32CD32';
                ctx.beginPath();
                ctx.arc(-10, -8, 16, 0, Math.PI * 2);
                ctx.fill();
                ctx.beginPath();
                ctx.arc(10, -8, 16, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'stone':
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(0, -15);
                ctx.lineTo(15, -8);
                ctx.lineTo(12, 15);
                ctx.lineTo(-12, 15);
                ctx.lineTo(-15, -8);
                ctx.closePath();
                ctx.fill();
                
                ctx.fillStyle = '#A9A9A9';
                ctx.beginPath();
                ctx.ellipse(-5, -8, 6, 4, -0.3, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'grass':
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                for (let i = -2; i <= 2; i++) {
                    ctx.beginPath();
                    ctx.moveTo(i * 5, 0);
                    ctx.quadraticCurveTo(i * 5 + i * 3, -20, i * 5, -30);
                    ctx.stroke();
                }
                
                ctx.fillStyle = '#32CD32';
                for (let i = -1; i <= 1; i++) {
                    ctx.beginPath();
                    ctx.arc(i * 6, -15, 3, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
        }
        
        ctx.restore();
    }

    movePlayer(direction) {
        if (!this.player || !this.world) return;
        
        const { speed, width, height } = this.player;
        
        switch(direction) {
            case 'up':
                this.player.y -= speed;
                this.player.direction = 'up';
                break;
            case 'down':
                this.player.y += speed;
                this.player.direction = 'down';
                break;
            case 'left':
                this.player.x -= speed;
                this.player.direction = 'left';
                break;
            case 'right':
                this.player.x += speed;
                this.player.direction = 'right';
                break;
        }
        
        this.player.stamina = Math.max(0, this.player.stamina - 0.5);
        this.player.x = Math.max(0, Math.min(this.world.width - width, this.player.x));
        this.player.y = Math.max(0, Math.min(this.world.height - height, this.player.y));
        
        this.game.renderEngine.setCameraPosition(this.player.x, this.player.y);
        this.savePlayerToCache();
    }

    collectResource(x, y) {
        if (!this.world?.resources || !this.player) return;
        
        for (const resource of this.world.resources) {
            if (resource.collected) continue;
            
            const distX = Math.abs(x - resource.x);
            const distY = Math.abs(y - resource.y);
            
            if (distX <= 40 && distY <= 40) {
                if (this.player.stamina < 5) {
                    this.game.uiManager.showWarning('体力不足，无法采集');
                    return;
                }
                
                this.player.stamina -= 5;
                resource.collected = true;
                resource.respawnTimer = 5000;
                
                this.player.inventory[resource.drop] += resource.dropAmount;
                
                const resourceNames = { wood: '木材', stone: '石头', grass: '杂草' };
                this.game.uiManager.showSuccess(`采集了${resourceNames[resource.drop]} x${resource.dropAmount}`);
                
                const renderItem = this.renderItems.find(r => r.id === resource.id);
                if (renderItem) {
                    renderItem.visible = false;
                    if (renderItem.resourceData) {
                        renderItem.resourceData.collected = true;
                    }
                }
                
                this.savePlayerToCache();
                return;
            }
        }
    }

    interact() {
        if (!this.player || !this.world?.structures) return;
        
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        
        for (const plot of this.world.structures) {
            const distX = Math.abs(playerCenterX - (plot.x + plot.width / 2));
            const distY = Math.abs(playerCenterY - (plot.y + plot.height / 2));
            
            if (distX < 60 && distY < 60) {
                this.interactWithPlot(plot);
                return;
            }
        }
    }

    interactWithPlot(plot) {
        if (!this.player) return;
        
        if (!plot.planted) {
            if (this.player.inventory.seeds > 0) {
                plot.planted = true;
                plot.seedType = 'corn';
                plot.growthStage = 0;
                plot.watered = true;
                this.player.inventory.seeds--;
                this.game.uiManager.showSuccess('种下了一颗种子');
            } else {
                this.game.uiManager.showWarning('没有种子了');
            }
        } else if (!plot.harvestable) {
            if (!plot.watered) {
                if (this.player.inventory.water > 0) {
                    plot.watered = true;
                    this.player.inventory.water--;
                    this.game.uiManager.showSuccess('给作物浇水');
                } else {
                    this.game.uiManager.showWarning('没有水了');
                }
            }
        } else {
            this.player.inventory.food += 3;
            plot.planted = false;
            plot.seedType = null;
            plot.growthStage = 0;
            plot.watered = false;
            plot.harvestable = false;
            this.game.uiManager.showSuccess('收获了作物！获得3份食物');
        }
        
        this.saveSceneToCache();
        this.savePlayerToCache();
    }

    openInventory() {
        if (!this.player) return;
        
        const inventory = this.player.inventory;
        let content = `
            <div style="color: #fff; font-size: 14px; line-height: 1.8;">
                <p><strong>种子:</strong> ${inventory.seeds}</p>
                <p><strong>食物:</strong> ${inventory.food}</p>
                <p><strong>水:</strong> ${inventory.water}</p>
                <p><strong>木材:</strong> ${inventory.wood}</p>
                <p><strong>石头:</strong> ${inventory.stone}</p>
                <p><strong>杂草:</strong> ${inventory.grass}</p>
            </div>
        `;
        
        this.game.uiManager.showModal({
            title: '背包',
            content,
            buttons: [{ text: '关闭' }]
        });
    }

    openCraft() {
        this.game.uiManager.showModal({
            title: '制作',
            content: '<div style="color: #b8c5d6;">制作系统开发中...</div>',
            buttons: [{ text: '关闭' }]
        });
    }

    openMap() {
        this.game.uiManager.showModal({
            title: '地图',
            content: '<div style="color: #b8c5d6;">地图系统开发中...</div>',
            buttons: [{ text: '关闭' }]
        });
    }

    saveSceneToCache() {
        if (!this.game?.sceneCache || !this.world) return;
        
        this.game.sceneCache.saveSceneState(this.name, {
            world: {
                width: this.world.width,
                height: this.world.height,
                resources: this.world.resources.map(r => ({
                    id: r.id,
                    type: r.type,
                    x: r.x,
                    y: r.y,
                    color: r.color,
                    drop: r.drop,
                    dropAmount: r.dropAmount,
                    collected: r.collected,
                    respawnTimer: r.respawnTimer
                })),
                structures: this.world.structures.map(s => ({
                    id: s.id,
                    x: s.x,
                    y: s.y,
                    width: s.width,
                    height: s.height,
                    planted: s.planted,
                    seedType: s.seedType,
                    growthStage: s.growthStage,
                    watered: s.watered,
                    harvestable: s.harvestable
                }))
            }
        });
    }

    loadWorldFromCache() {
        if (!this.game?.sceneCache) return null;
        
        const cached = this.game.sceneCache.loadSceneState(this.name);
        if (cached) {
            return cached.world;
        }
        return null;
    }

    restoreRenderItemsFromCache() {
        if (!this.world?.resources) return;
        
        for (const resource of this.world.resources) {
            this.createResourceRenderItem(resource);
        }
        
        for (const plot of this.world.structures) {
            this.createPlotRenderItem(plot);
        }
    }

    savePlayerToCache() {
        if (!this.game?.sceneCache || !this.player) return;
        
        this.game.sceneCache.savePlayerState({
            x: this.player.x,
            y: this.player.y,
            direction: this.player.direction,
            health: this.player.health,
            hunger: this.player.hunger,
            thirst: this.player.thirst,
            stamina: this.player.stamina,
            inventory: { ...this.player.inventory }
        });
    }

    loadPlayerFromCache() {
        if (!this.game?.sceneCache) return null;
        
        return this.game.sceneCache.loadPlayerState();
    }

    clearSceneCache() {
        if (!this.game?.sceneCache) return;
        this.game.sceneCache.clear();
    }
}

export { Scene, GameScene };