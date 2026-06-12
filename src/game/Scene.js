import { PlayerRenderer } from './PlayerRenderer.js';
import { Player } from './Player.js';
import { InventoryModal } from '../ui/inventory/inventory-modal.js';
import { TerrainGenerator } from './TerrainGenerator.js';

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
        if (!game) {
            console.error('Invalid game object passed to Scene.init()');
            return;
        }
        this.game = game;
    }

    load() {
        this.isLoaded = true;
        try {
            this.onLoad?.();
        } catch (error) {
            console.error('Error in onLoad callback:', error);
        }
    }

    unload() {
        this.isLoaded = false;
        this.entities = [];
        this.renderItems = [];
        try {
            this.onUnload?.();
        } catch (error) {
            console.error('Error in onUnload callback:', error);
        }
    }

    addEntity(entity) {
        if (!entity) {
            console.error('Invalid entity object');
            return;
        }
        
        this.entities.push(entity);
        entity.scene = this;
        
        try {
            entity.init?.(this.game);
        } catch (error) {
            console.error('Error initializing entity:', error);
        }
        
        if (entity.renderItem) {
            this.addRenderItem(entity.renderItem);
        }
    }

    removeEntity(entityId) {
        if (!entityId) {
            console.error('Invalid entity ID');
            return;
        }
        
        this.entities = this.entities.filter(e => e.id !== entityId);
        this.renderItems = this.renderItems.filter(r => r.id !== entityId);
    }

    addRenderItem(item) {
        if (!item) {
            console.error('Invalid render item');
            return;
        }
        
        if (!this.game || !this.game.renderEngine) {
            console.error('Cannot add render item: Game or RenderEngine not initialized');
            return;
        }
        
        const layer = item.layer || 'objects';
        this.game.renderEngine.addToLayer(layer, item);
        this.renderItems.push(item);
    }

    removeRenderItem(itemId) {
        if (!itemId) {
            console.error('Invalid render item ID');
            return;
        }
        
        if (!this.game || !this.game.renderEngine) {
            console.error('Cannot remove render item: Game or RenderEngine not initialized');
            this.renderItems = this.renderItems.filter(r => r.id !== itemId);
            return;
        }
        
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
            try {
                entity.update?.(deltaTime);
            } catch (error) {
                console.error('Error updating entity:', error);
            }
        }
        
        try {
            this.onUpdate?.(deltaTime);
        } catch (error) {
            console.error('Error in onUpdate callback:', error);
        }
    }

    render() {
        try {
            this.onRender?.();
        } catch (error) {
            console.error('Error in onRender callback:', error);
        }
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
        this.playerRenderer = new PlayerRenderer();
        this.isPlayerWalking = false;
        this.walkAnimationFrame = null;
        this.inventoryModal = null;
        this.terrainGenerator = null;
        this.terrainTiles = [];
        this.layeredElements = [];
        this.terrainColors = {};
        this.renderFrame = 0;
    }

    load() {
        if (!this.game || !this.game.renderEngine) {
            console.error('Game or RenderEngine not initialized, cannot load scene');
            return;
        }
        
        super.load();
        
        try {
            this.setupWorld();
            this.setupPlayer();
            this.setupHUD();
            this.saveSceneToCache();
            console.log(`Scene "${this.name}" loaded successfully`);
        } catch (error) {
            console.error(`Failed to load scene "${this.name}":`, error);
            throw error;
        }
    }

    setupWorld() {
        try {
            const cachedWorld = this.loadWorldFromCache();
            
            if (cachedWorld) {
                console.log('Loading world from cache');
                this.world = cachedWorld;
                this.restoreRenderItemsFromCache();
            } else {
                console.log('Generating new world with terrain');
                
                const terrainConfig = this.game?.resourceManager?.getTerrainConfig();
                let seed = 12345;
                let width = 2000;
                let height = 2000;
                
                if (terrainConfig) {
                    seed = terrainConfig.seed || seed;
                    width = terrainConfig.worldWidth || width;
                    height = terrainConfig.worldHeight || height;
                    console.log('Using terrain config:', terrainConfig);
                }
                
                this.terrainGenerator = new TerrainGenerator(width, height, seed);
                this.terrainGenerator.setTerrainConfig(terrainConfig);
                this.terrainTiles = this.terrainGenerator.generateTerrain();
                this.terrainColors = this.terrainGenerator.getTerrainColors();
                
                this.world = {
                    width: width,
                    height: height,
                    tiles: this.terrainTiles,
                    resources: [],
                    structures: [],
                    terrainConfig: terrainConfig
                };
                
                this.generateWorld();
            }
            
            this.createTerrainRenderItems();
            this.createLayeredElements();
            
            console.log(`World setup complete: ${this.world.tiles?.length || 0} tiles, ${this.layeredElements.length} elements`);
            
        } catch (error) {
            console.error('Error setting up world:', error);
            throw error;
        }
    }

    createTerrainRenderItems() {
        if (!this.terrainTiles || !this.game?.renderEngine) {
            console.error('Cannot create terrain render items: terrainTiles or renderEngine not initialized');
            return;
        }

        console.log(`Creating terrain render items for ${this.terrainTiles.length} tiles`);
        
        const sceneRef = this;
        const colors = this.terrainColors;
        
        for (const tile of this.terrainTiles) {
            const color = colors[tile.terrainType] || '#888888';
            
            const renderItem = {
                id: tile.id,
                x: tile.x + tile.width / 2,
                y: tile.y + tile.height / 2,
                width: tile.width,
                height: tile.height,
                terrainType: tile.terrainType,
                heightValue: tile.heightValue,
                layer: 'terrain',
                visible: true,
                draw: function(ctx) {
                    sceneRef.drawTerrainTile(ctx, tile, color);
                }
            };
            
            this.addRenderItem(renderItem);
        }
        
        console.log('Terrain render items created');
    }

    drawTerrainTile(ctx, tile, baseColor) {
        const x = tile.x;
        const y = tile.y;
        const w = tile.width;
        const h = tile.height;
        
        ctx.fillStyle = baseColor;
        ctx.fillRect(x, y, w, h);
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(x, y, w, h);
        
        this.drawTerrainPattern(ctx, tile, baseColor);
    }

    drawTerrainPattern(ctx, tile, baseColor) {
        const x = tile.x;
        const y = tile.y;
        const w = tile.width;
        const h = tile.height;
        
        switch(tile.terrainType) {
            case 'grass':
                this.drawGrassPattern(ctx, x, y, w, h);
                break;
                
            case 'forest':
                this.drawForestPattern(ctx, x, y, w, h);
                break;
                
            case 'water':
            case 'river':
            case 'lake':
                this.drawWaterPattern(ctx, x, y, w, h);
                break;
                
            case 'deep_water':
                this.drawDeepWaterPattern(ctx, x, y, w, h);
                break;
                
            case 'beach':
                this.drawBeachPattern(ctx, x, y, w, h);
                break;
                
            case 'mountain':
                this.drawMountainPattern(ctx, x, y, w, h);
                break;
                
            case 'peak':
                this.drawPeakPattern(ctx, x, y, w, h);
                break;
                
            case 'snow':
            case 'snow_peak':
                this.drawSnowPattern(ctx, x, y, w, h);
                break;
                
            case 'tundra':
                this.drawTundraPattern(ctx, x, y, w, h);
                break;
                
            case 'desert':
                this.drawDesertPattern(ctx, x, y, w, h);
                break;
                
            case 'savanna':
                this.drawSavannaPattern(ctx, x, y, w, h);
                break;
                
            case 'tropical_forest':
                this.drawTropicalForestPattern(ctx, x, y, w, h);
                break;
                
            case 'grassland':
                this.drawGrasslandPattern(ctx, x, y, w, h);
                break;
        }
    }

    drawGrassPattern(ctx, x, y, w, h) {
        ctx.fillStyle = '#3d7a3d';
        for (let i = 0; i < 8; i++) {
            const gx = x + (i % 4) * 10 + 2;
            const gy = y + Math.floor(i / 4) * 20 + 15;
            ctx.beginPath();
            ctx.moveTo(gx, gy + 10);
            ctx.quadraticCurveTo(gx + 2, gy, gx, gy - 5);
            ctx.quadraticCurveTo(gx - 2, gy, gx, gy + 10);
            ctx.fill();
        }
    }

    drawForestPattern(ctx, x, y, w, h) {
        ctx.fillStyle = '#1a3a1a';
        for (let i = 0; i < 4; i++) {
            const tx = x + (i % 2) * 20 + 10;
            const ty = y + Math.floor(i / 2) * 20 + 10;
            ctx.fillStyle = '#2d5a27';
            ctx.beginPath();
            ctx.moveTo(tx, ty + 20);
            ctx.lineTo(tx + 8, ty);
            ctx.lineTo(tx - 8, ty);
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#5d4037';
            ctx.fillRect(tx - 2, ty + 15, 4, 8);
        }
    }

    drawWaterPattern(ctx, x, y, w, h) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
        const time = Date.now() * 0.002;
        for (let i = 0; i < 3; i++) {
            ctx.beginPath();
            ctx.arc(x + 10 + i * 15, y + 20 + Math.sin(time + i) * 5, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawDeepWaterPattern(ctx, x, y, w, h) {
        ctx.fillStyle = 'rgba(100, 150, 200, 0.2)';
        const time = Date.now() * 0.0015;
        for (let i = 0; i < 4; i++) {
            const waveX = x + 5 + i * 10 + Math.sin(time + i) * 3;
            const waveY = y + h / 2 + Math.cos(time * 0.7 + i) * 8;
            ctx.beginPath();
            ctx.ellipse(waveX, waveY, 8, 2, 0, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawBeachPattern(ctx, x, y, w, h) {
        ctx.fillStyle = '#d4a574';
        for (let i = 0; i < 12; i++) {
            const sx = x + (i % 4) * 10 + 5;
            const sy = y + Math.floor(i / 4) * 15 + 5;
            ctx.beginPath();
            ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawMountainPattern(ctx, x, y, w, h) {
        ctx.fillStyle = '#5a6a7a';
        for (let i = 0; i < 5; i++) {
            const mx = x + Math.random() * w;
            const my = y + Math.random() * h;
            ctx.beginPath();
            ctx.moveTo(mx, my + 5);
            ctx.lineTo(mx + 3, my);
            ctx.lineTo(mx - 3, my);
            ctx.closePath();
            ctx.fill();
        }
    }

    drawPeakPattern(ctx, x, y, w, h) {
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.6;
        for (let i = 0; i < 6; i++) {
            const px = x + Math.random() * w;
            const py = y + Math.random() * h;
            ctx.beginPath();
            ctx.arc(px, py, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    drawSnowPattern(ctx, x, y, w, h) {
        ctx.fillStyle = '#ffffff';
        ctx.globalAlpha = 0.5;
        const time = Date.now() * 0.002;
        for (let i = 0; i < 8; i++) {
            const sx = x + ((i * 7 + Math.sin(time + i)) % w);
            const sy = y + ((i * 11 + Math.cos(time + i * 0.5)) % h);
            ctx.beginPath();
            ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
            ctx.fill();
        }
        ctx.globalAlpha = 1;
    }

    drawTundraPattern(ctx, x, y, w, h) {
        ctx.fillStyle = '#c8d5e0';
        for (let i = 0; i < 4; i++) {
            const tx = x + (i % 2) * 20 + 10;
            const ty = y + Math.floor(i / 2) * 20 + 10;
            ctx.beginPath();
            ctx.arc(tx, ty, 3, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    drawDesertPattern(ctx, x, y, w, h) {
        ctx.fillStyle = '#e0c080';
        for (let i = 0; i < 6; i++) {
            const dx = x + (i % 3) * 13 + 4;
            const dy = y + Math.floor(i / 3) * 15 + 7;
            ctx.beginPath();
            ctx.arc(dx, dy, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        if (Math.random() < 0.3) {
            ctx.fillStyle = '#c0a060';
            ctx.beginPath();
            ctx.moveTo(x + w / 2, y + 5);
            ctx.lineTo(x + w / 2 + 8, y + h - 5);
            ctx.lineTo(x + w / 2 - 8, y + h - 5);
            ctx.closePath();
            ctx.fill();
        }
    }

    drawSavannaPattern(ctx, x, y, w, h) {
        ctx.fillStyle = '#c9a83b';
        for (let i = 0; i < 5; i++) {
            const gx = x + (i % 5) * 8 + 4;
            const gy = y + 25 + (i % 2) * 10;
            ctx.beginPath();
            ctx.moveTo(gx, gy + 8);
            ctx.quadraticCurveTo(gx + 1, gy, gx, gy - 4);
            ctx.quadraticCurveTo(gx - 1, gy, gx, gy + 8);
            ctx.fill();
        }
    }

    drawTropicalForestPattern(ctx, x, y, w, h) {
        ctx.fillStyle = '#0a6030';
        for (let i = 0; i < 3; i++) {
            const tx = x + (i % 3) * 14 + 7;
            const ty = y + Math.floor(i / 3) * 20 + 10;
            
            ctx.fillStyle = '#1a8040';
            ctx.beginPath();
            ctx.arc(tx, ty - 5, 10, 0, Math.PI * 2);
            ctx.fill();
            
            ctx.fillStyle = '#8b4513';
            ctx.fillRect(tx - 2, ty + 5, 4, 10);
        }
    }

    drawGrasslandPattern(ctx, x, y, w, h) {
        ctx.fillStyle = '#5a9a4a';
        for (let i = 0; i < 10; i++) {
            const gx = x + (i % 5) * 8 + 4;
            const gy = y + Math.floor(i / 5) * 20 + 12;
            ctx.beginPath();
            ctx.moveTo(gx, gy + 8);
            ctx.quadraticCurveTo(gx + 1.5, gy + 2, gx, gy - 3);
            ctx.quadraticCurveTo(gx - 1.5, gy + 2, gx, gy + 8);
            ctx.fill();
        }
    }

    createLayeredElements() {
        this.layeredElements = [];
        const config = this.game?.resourceManager?.getTerrainConfig();
        const treeCount = config?.layeredElements?.trees?.count || 15;
        const rockCount = config?.layeredElements?.rocks?.count || 8;
        const bushCount = config?.layeredElements?.bushes?.count || 20;
        const flowerCount = config?.layeredElements?.flowers?.count || 3;

        for (let i = 0; i < treeCount; i++) {
            const tree = {
                id: `tree_${i}`,
                x: Math.random() * (this.world.width - 100) + 50,
                y: Math.random() * (this.world.height - 100) + 50,
                type: 'tree',
                layer: 'objects',
                size: 30 + Math.random() * 15,
                sway: Math.random() * Math.PI * 2,
                swaySpeed: 0.5 + Math.random() * 0.5
            };
            this.layeredElements.push(tree);
            this.createTreeRenderItem(tree);
        }

        for (let i = 0; i < rockCount; i++) {
            const rock = {
                id: `rock_${i}`,
                x: Math.random() * (this.world.width - 100) + 50,
                y: Math.random() * (this.world.height - 100) + 50,
                type: 'rock',
                layer: 'objects',
                size: 15 + Math.random() * 10
            };
            this.layeredElements.push(rock);
            this.createRockRenderItem(rock);
        }

        for (let i = 0; i < bushCount; i++) {
            const bush = {
                id: `bush_${i}`,
                x: Math.random() * (this.world.width - 100) + 50,
                y: Math.random() * (this.world.height - 100) + 50,
                type: 'bush',
                layer: 'objects',
                size: 10 + Math.random() * 8
            };
            this.layeredElements.push(bush);
            this.createBushRenderItem(bush);
        }

        const flowerColors = config?.layeredElements?.flowers?.colors || ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6b9d'];
        for (let i = 0; i < flowerCount; i++) {
            const flower = {
                id: `flower_${i}`,
                x: Math.random() * (this.world.width - 100) + 50,
                y: Math.random() * (this.world.height - 100) + 50,
                type: 'flower',
                layer: 'objects',
                color: flowerColors[i % flowerColors.length]
            };
            this.layeredElements.push(flower);
            this.createFlowerRenderItem(flower);
        }
    }

    createTreeRenderItem(tree) {
        const sceneRef = this;
        const renderItem = {
            id: tree.id,
            x: tree.x,
            y: tree.y,
            type: tree.type,
            size: tree.size,
            sway: tree.sway,
            swaySpeed: tree.swaySpeed,
            layer: tree.layer,
            visible: true,
            draw: function(ctx) {
                sceneRef.drawTree(ctx, this.x, this.y, this.size, this.sway);
            }
        };
        this.addRenderItem(renderItem);
    }

    createRockRenderItem(rock) {
        const sceneRef = this;
        const renderItem = {
            id: rock.id,
            x: rock.x,
            y: rock.y,
            type: rock.type,
            size: rock.size,
            layer: rock.layer,
            visible: true,
            draw: function(ctx) {
                sceneRef.drawRock(ctx, this.x, this.y, this.size);
            }
        };
        this.addRenderItem(renderItem);
    }

    createBushRenderItem(bush) {
        const sceneRef = this;
        const renderItem = {
            id: bush.id,
            x: bush.x,
            y: bush.y,
            type: bush.type,
            size: bush.size,
            layer: bush.layer,
            visible: true,
            draw: function(ctx) {
                sceneRef.drawBush(ctx, this.x, this.y, this.size);
            }
        };
        this.addRenderItem(renderItem);
    }

    createFlowerRenderItem(flower) {
        const sceneRef = this;
        const renderItem = {
            id: flower.id,
            x: flower.x,
            y: flower.y,
            type: flower.type,
            color: flower.color,
            layer: flower.layer,
            visible: true,
            draw: function(ctx) {
                sceneRef.drawFlower(ctx, this.x, this.y, this.color);
            }
        };
        this.addRenderItem(renderItem);
    }

    generateWorld() {
        const resourceTypes = [
            { type: 'tree', color: '#8B4513', size: 35, drop: 'wood', dropAmount: 2 },
            { type: 'stone', color: '#708090', size: 25, drop: 'stone', dropAmount: 1 },
            { type: 'grass', color: '#228B22', size: 15, drop: 'grass', dropAmount: 1 }
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
                size: resourceType.size,
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
                size: resource.size,
                collected: resource.collected
            });

            this.createResourceRenderItem(resource);
        }

        this.setupPlots();
    }

    createResourceRenderItem(resource) {
        if (!resource) {
            console.error('Invalid resource object');
            return null;
        }

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
                if (!this.resourceData?.collected) {
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
        if (!plot) {
            console.error('Invalid plot object');
            return null;
        }

        const sceneRef = this;
        const renderItem = {
            id: plot.id,
            x: plot.x + plot.width / 2,
            y: plot.y + plot.height / 2,
            width: plot.width,
            height: plot.height,
            plotData: plot,
            layer: 'structures',
            visible: true,
            draw: function(ctx) {
                sceneRef.drawPlot(ctx, this.plotData);
            }
        };

        this.addRenderItem(renderItem);
        return renderItem;
    }

    setupPlayer() {
        try {
            const cachedPlayer = this.loadPlayerFromCache();
            
            if (cachedPlayer) {
                console.log('Loading player from cache');
                this.player = Player.deserialize(cachedPlayer);
            } else {
                console.log('Creating new player');
                this.player = new Player({
                    x: 200,
                    y: 200
                });
            }

            this.createPlayerRenderItem();
            
            if (this.game) {
                this.game.gameState.player = this.player;
            }
        } catch (error) {
            console.error('Error setting up player:', error);
            throw error;
        }
    }

    createPlayerRenderItem() {
        if (!this.player) {
            console.error('Player not initialized');
            return null;
        }

        const sceneRef = this;
        const renderItem = {
            id: 'player',
            x: this.player.getCenterX(),
            y: this.player.getCenterY(),
            width: this.player.width,
            height: this.player.height,
            direction: this.player.direction,
            layer: 'player',
            visible: true,
            draw: function(ctx) {
                sceneRef.drawPlayer(ctx, this.x, this.y, this.width, this.height, this.direction);
            }
        };

        this.addRenderItem(renderItem);
        return renderItem;
    }

    setupHUD() {
        if (!this.player || !this.game || !this.game.uiManager) {
            console.warn('Cannot setup HUD: Player, Game or UIManager not initialized');
            return;
        }
        
        this.hud = this.game.uiManager.createHUD({
            statusBars: [
                { label: '生命值', value: this.player.stats.health, color: 'linear-gradient(90deg, #e74c3c, #c0392b)' },
                { label: '饥饿度', value: this.player.stats.hunger, color: 'linear-gradient(90deg, #f1c40f, #f39c12)' },
                { label: '口渴度', value: this.player.stats.thirst, color: 'linear-gradient(90deg, #3498db, #2980b9)' },
                { label: '体力值', value: this.player.stats.stamina, color: 'linear-gradient(90deg, #2ecc71, #27ae60)' }
            ]
        });
    }

    updateHUD() {
        if (!this.hud?.elements || !this.player) {
            return;
        }
        
        this.hud.elements[0]?.setValue(this.player.stats.health);
        this.hud.elements[1]?.setValue(this.player.stats.hunger);
        this.hud.elements[2]?.setValue(this.player.stats.thirst);
        this.hud.elements[3]?.setValue(this.player.stats.stamina);
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        if (this.player) {
            this.player.update(deltaTime);
            this.updatePlayerPosition();
        }
        this.updateResources();
        this.updatePlots();
        this.updateHUD();
        this.checkGameOver();
        this.updateLayeredElements(deltaTime);
        this.renderFrame++;
    }

    updateLayeredElements(deltaTime) {
        for (const element of this.layeredElements) {
            if (element.sway !== undefined) {
                element.sway += element.swaySpeed * deltaTime;
            }
        }
    }

    updatePlayerPosition() {
        const renderItem = this.renderItems.find(r => r.id === 'player');
        if (renderItem && this.player) {
            renderItem.x = this.player.getCenterX();
            renderItem.y = this.player.getCenterY();
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
        if (!this.player || !this.game) return;
        
        if (this.player.stats.health <= 0) {
            this.game.stop();
            
            if (this.game.uiManager) {
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
    }

    drawPlayer(ctx, x, y, width, height, direction) {
        if (!this.player) return;
        this.playerRenderer.draw(ctx, x, y, direction, this.player.isWalking, this.player.animationTime);
    }

    drawTree(ctx, x, y, size, sway) {
        const swayOffset = Math.sin(sway) * 2;
        
        ctx.save();
        ctx.translate(x, y);
        
        ctx.fillStyle = '#5d4037';
        ctx.fillRect(-size / 5, 0, size * 2 / 5, size * 0.8);
        
        const gradient = ctx.createRadialGradient(0, -size * 0.3, 0, 0, -size * 0.3, size * 0.7);
        gradient.addColorStop(0, '#4a7c23');
        gradient.addColorStop(1, '#2d5a1a');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(swayOffset, -size * 1.2);
        ctx.lineTo(swayOffset + size * 0.6, size * 0.1);
        ctx.lineTo(swayOffset - size * 0.6, size * 0.1);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(swayOffset, -size * 0.8);
        ctx.lineTo(swayOffset + size * 0.5, -size * 0.2);
        ctx.lineTo(swayOffset - size * 0.5, -size * 0.2);
        ctx.closePath();
        ctx.fill();
        
        ctx.restore();
    }

    drawRock(ctx, x, y, size) {
        ctx.save();
        ctx.translate(x, y);
        
        const gradient = ctx.createRadialGradient(-size / 4, -size / 4, 0, 0, 0, size);
        gradient.addColorStop(0, '#8a8a8a');
        gradient.addColorStop(0.5, '#6a6a6a');
        gradient.addColorStop(1, '#4a4a4a');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(0, -size / 2);
        ctx.lineTo(size / 2, -size / 4);
        ctx.lineTo(size / 3, size / 2);
        ctx.lineTo(-size / 3, size / 2);
        ctx.lineTo(-size / 2, -size / 4);
        ctx.closePath();
        ctx.fill();
        
        ctx.fillStyle = '#9a9a9a';
        ctx.beginPath();
        ctx.ellipse(-size / 6, -size / 6, size / 6, size / 8, -0.3, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    drawBush(ctx, x, y, size) {
        ctx.save();
        ctx.translate(x, y);
        
        const gradient = ctx.createRadialGradient(0, -size / 4, 0, 0, 0, size);
        gradient.addColorStop(0, '#5a8a3a');
        gradient.addColorStop(1, '#3a6a2a');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(0, 0, size, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = '#4a7a2a';
        ctx.beginPath();
        ctx.arc(-size / 3, -size / 4, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.arc(size / 3, -size / 4, size * 0.6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    drawFlower(ctx, x, y, color) {
        ctx.save();
        ctx.translate(x, y);
        
        ctx.strokeStyle = '#2d5a27';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 8);
        ctx.lineTo(0, -5);
        ctx.stroke();
        
        ctx.fillStyle = color;
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const px = Math.cos(angle) * 4;
            const py = Math.sin(angle) * 4 - 8;
            ctx.beginPath();
            ctx.ellipse(px, py, 3, 5, angle, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.fillStyle = '#ffd700';
        ctx.beginPath();
        ctx.arc(0, -8, 2, 0, Math.PI * 2);
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
        if (!resource) {
            console.error('Invalid resource object for drawing');
            return;
        }

        const { x, y, type, color, size = 25 } = resource;
        
        ctx.save();
        ctx.translate(x, y);
        
        switch(type) {
            case 'tree':
                ctx.fillStyle = '#8B4513';
                ctx.fillRect(-size / 3, 0, size * 2 / 3, size * 1.2);
                
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.arc(0, -size * 0.3, size * 0.6, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.fillStyle = '#32CD32';
                ctx.beginPath();
                ctx.arc(-size * 0.3, -size * 0.1, size * 0.4, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(size * 0.3, -size * 0.1, size * 0.4, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'stone':
                ctx.fillStyle = color;
                ctx.beginPath();
                ctx.moveTo(0, -size / 2);
                ctx.lineTo(size / 2, -size / 4);
                ctx.lineTo(size / 2.5, size / 2);
                ctx.lineTo(-size / 2.5, size / 2);
                ctx.lineTo(-size / 2, -size / 4);
                ctx.closePath();
                ctx.fill();
                
                ctx.fillStyle = '#A9A9A9';
                ctx.beginPath();
                ctx.ellipse(-size / 6, -size / 6, size / 6, size / 8, -0.3, 0, Math.PI * 2);
                ctx.fill();
                break;
                
            case 'grass':
                ctx.strokeStyle = color;
                ctx.lineWidth = 2;
                
                for (let i = -2; i <= 2; i++) {
                    ctx.beginPath();
                    ctx.moveTo(i * 3, 0);
                    ctx.quadraticCurveTo(i * 3 + i, -size, i * 3, -size * 1.5);
                    ctx.stroke();
                }
                
                ctx.fillStyle = '#32CD32';
                for (let i = -1; i <= 1; i++) {
                    ctx.beginPath();
                    ctx.arc(i * 4, -size, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
        }
        
        ctx.restore();
    }

    movePlayer(direction) {
        if (!this.player || !this.world || !this.game || !this.game.renderEngine) {
            console.error('Cannot move player: Player, World, Game or RenderEngine not initialized');
            return;
        }
        
        this.player.move(direction);
        this.player.clampPosition(this.world.width, this.world.height);
        
        this.game.renderEngine.setCameraPosition(this.player.x, this.player.y);
        this.savePlayerToCache();
        
        if (this.walkAnimationFrame) {
            clearTimeout(this.walkAnimationFrame);
        }
        
        this.walkAnimationFrame = setTimeout(() => {
            this.player.stopWalking();
        }, 200);
    }

    collectResource(x, y) {
        if (!this.world?.resources || !this.player || !this.game?.uiManager) return;
        
        const INTERACTION_RANGE = 80;
        const playerCenterX = this.player.x + this.player.width / 2;
        const playerCenterY = this.player.y + this.player.height / 2;
        
        for (const resource of this.world.resources) {
            if (resource.collected) continue;
            
            const playerDistX = Math.abs(playerCenterX - resource.x);
            const playerDistY = Math.abs(playerCenterY - resource.y);
            
            if (playerDistX > INTERACTION_RANGE || playerDistY > INTERACTION_RANGE) {
                continue;
            }
            
            const distX = Math.abs(x - resource.x);
            const distY = Math.abs(y - resource.y);
            const interactionRadius = resource.size || 35;
            
            if (distX <= interactionRadius && distY <= interactionRadius) {
                if (this.player.stats.stamina < 2) {
                    this.game.uiManager.showWarning('体力不足，无法采集');
                    return;
                }
                
                this.player.consumeStamina(2);
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
        if (!this.player || !this.game?.uiManager) return;
        
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
        
        const inventoryData = { ...this.player.inventory };
        
        if (!this.inventoryModal) {
            this.inventoryModal = new InventoryModal();
        }
        
        this.inventoryModal.setOnCloseCallback((updatedInventory) => {
            Object.assign(this.player.inventory, updatedInventory);
            this.savePlayerToCache();
        });
        
        this.inventoryModal.setOnItemUseCallback((itemType, itemCount) => {
            if (this.game?.uiManager) {
                const itemNames = {
                    seeds: '种子',
                    food: '食物',
                    water: '水',
                    wood: '木材',
                    stone: '石头',
                    grass: '杂草',
                    equipment: '装备',
                    medicine: '药品',
                    iron: '铁矿石',
                    leather: '皮革',
                    cloth: '布料',
                    gold: '金币'
                };
                this.game.uiManager.showSuccess(`使用了 ${itemNames[itemType] || itemType} x${itemCount}`);
            }
        });
        
        this.inventoryModal.open(inventoryData);
    }

    openCraft() {
        if (!this.game?.uiManager) return;
        
        this.game.uiManager.showModal({
            title: '制作',
            content: '<div style="color: #b8c5d6;">制作系统开发中...</div>',
            buttons: [{ text: '关闭' }]
        });
    }

    openMap() {
        if (!this.game?.uiManager) return;
        
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
        
        this.game.sceneCache.savePlayerState(this.player.serialize());
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