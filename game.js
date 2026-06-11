class SurvivalGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.TILE_SIZE = 40;
        this.gameState = {
            health: 100,
            hunger: 80,
            thirst: 90,
            stamina: 70,
            day: 1,
            isRunning: true,
            isPaused: false,
            player: {
                x: 200,
                y: 200,
                width: 32,
                height: 48,
                direction: 'down',
                speed: 4
            },
            inventory: {
                seeds: 5,
                food: 3,
                water: 2,
                wood: 0,
                stone: 0,
                grass: 0
            },
            plots: this.initPlots(),
            wildResources: this.generateWildResources()
        };
        this.lastUpdateTime = Date.now();
        this.statusDecayInterval = null;
        this.setupEventListeners();
        this.resizeCanvas();
        this.startGameLoop();
    }

    initPlots() {
        const plots = [];
        const startX = 400;
        const startY = 200;
        const rows = 3;
        const cols = 4;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                plots.push({
                    id: `${row}-${col}`,
                    x: startX + col * (this.TILE_SIZE + 10),
                    y: startY + row * (this.TILE_SIZE + 10),
                    width: this.TILE_SIZE,
                    height: this.TILE_SIZE,
                    planted: false,
                    seedType: null,
                    growthStage: 0,
                    watered: false,
                    harvestable: false,
                    owner: 'player'
                });
            }
        }
        return plots;
    }

    generateWildResources() {
        const resources = [];
        const resourceTypes = [
            { type: 'tree', color: '#8B4513', size: 35, drop: 'wood', dropAmount: 2 },
            { type: 'stone', color: '#708090', size: 25, drop: 'stone', dropAmount: 1 },
            { type: 'grass', color: '#228B22', size: 15, drop: 'grass', dropAmount: 1 }
        ];
        
        const existingPositions = new Set();
        
        const getRandomPosition = () => {
            let x, y;
            let attempts = 0;
            do {
                x = Math.random() * (this.canvas.width - 60) + 30;
                y = Math.random() * (this.canvas.height - 60) + 30;
                attempts++;
            } while (attempts < 50 && this.isPositionOccupied(x, y, existingPositions));
            return { x, y };
        };
        
        const numResources = 15;
        for (let i = 0; i < numResources; i++) {
            const typeIndex = i % resourceTypes.length;
            const resourceType = resourceTypes[typeIndex];
            const pos = getRandomPosition();
            existingPositions.add(`${Math.floor(pos.x / 40)}-${Math.floor(pos.y / 40)}`);
            
            resources.push({
                id: `${resourceType.type}-${i}`,
                type: resourceType.type,
                x: pos.x,
                y: pos.y,
                size: resourceType.size,
                color: resourceType.color,
                drop: resourceType.drop,
                dropAmount: resourceType.dropAmount,
                collected: false,
                respawnTimer: 0
            });
        }
        
        return resources;
    }

    isPositionOccupied(x, y, existingPositions) {
        const key = `${Math.floor(x / 40)}-${Math.floor(y / 40)}`;
        return existingPositions.has(key);
    }

    resizeCanvas() {
        const wrapper = document.querySelector('.game-canvas-wrapper');
        const rect = wrapper.getBoundingClientRect();
        const padding = 20;
        this.canvas.width = rect.width - padding * 2;
        this.canvas.height = rect.height - padding * 2;
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.resizeCanvas());
        document.getElementById('btnMoveUp').addEventListener('click', () => this.movePlayer('up'));
        document.getElementById('btnMoveDown').addEventListener('click', () => this.movePlayer('down'));
        document.getElementById('btnMoveLeft').addEventListener('click', () => this.movePlayer('left'));
        document.getElementById('btnMoveRight').addEventListener('click', () => this.movePlayer('right'));
        document.getElementById('btnInteract').addEventListener('click', () => this.interact());
        document.getElementById('btnInventory').addEventListener('click', () => this.openInventory());
        document.getElementById('btnCraft').addEventListener('click', () => this.openCraft());
        document.getElementById('btnMap').addEventListener('click', () => this.openMap());
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    }

    handleKeyDown(e) {
        if (this.gameState.isPaused) return;
        switch(e.key) {
            case 'ArrowUp': case 'w': case 'W':
                e.preventDefault();
                this.movePlayer('up');
                break;
            case 'ArrowDown': case 's': case 'S':
                e.preventDefault();
                this.movePlayer('down');
                break;
            case 'ArrowLeft': case 'a': case 'A':
                e.preventDefault();
                this.movePlayer('left');
                break;
            case 'ArrowRight': case 'd': case 'D':
                e.preventDefault();
                this.movePlayer('right');
                break;
            case ' ':
                e.preventDefault();
                this.interact();
                break;
            case 'i': case 'I':
                e.preventDefault();
                this.openInventory();
                break;
            case 'c': case 'C':
                e.preventDefault();
                this.openCraft();
                break;
            case 'm': case 'M':
                e.preventDefault();
                this.openMap();
                break;
            case 'p': case 'P':
                e.preventDefault();
                this.togglePause();
                break;
        }
    }

    handleCanvasClick(e) {
        if (this.gameState.isPaused || !this.gameState.isRunning) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;
        
        this.collectResource(clickX, clickY);
    }

    collectResource(x, y) {
        for (const resource of this.gameState.wildResources) {
            if (resource.collected) continue;
            
            const distX = Math.abs(x - resource.x);
            const distY = Math.abs(y - resource.y);
            
            if (distX <= resource.size && distY <= resource.size) {
                resource.collected = true;
                resource.respawnTimer = 5000;
                
                this.gameState.inventory[resource.drop] += resource.dropAmount;
                
                const resourceNames = { wood: '木材', stone: '石头', grass: '杂草' };
                console.log(`采集了${resourceNames[resource.drop]} x${resource.dropAmount}`);
                
                return;
            }
        }
    }

    updateWildResources() {
        for (const resource of this.gameState.wildResources) {
            if (resource.collected && resource.respawnTimer > 0) {
                resource.respawnTimer -= 16;
                if (resource.respawnTimer <= 0) {
                    resource.collected = false;
                    resource.respawnTimer = 0;
                }
            }
        }
    }

    movePlayer(direction) {
        if (this.gameState.isPaused || !this.gameState.isRunning) return;
        const { speed } = this.gameState.player;
        
        switch(direction) {
            case 'up':
                this.gameState.player.y -= speed;
                this.gameState.player.direction = 'up';
                break;
            case 'down':
                this.gameState.player.y += speed;
                this.gameState.player.direction = 'down';
                break;
            case 'left':
                this.gameState.player.x -= speed;
                this.gameState.player.direction = 'left';
                break;
            case 'right':
                this.gameState.player.x += speed;
                this.gameState.player.direction = 'right';
                break;
        }
        
        this.consumeStamina(0.5);
        this.gameState.player.x = Math.max(0, Math.min(this.canvas.width - this.gameState.player.width, this.gameState.player.x));
        this.gameState.player.y = Math.max(0, Math.min(this.canvas.height - this.gameState.player.height, this.gameState.player.y));
    }

    consumeStamina(amount) {
        this.gameState.stamina = Math.max(0, this.gameState.stamina - amount);
    }

    regenerateStamina() {
        if (this.gameState.stamina < 100) {
            this.gameState.stamina = Math.min(100, this.gameState.stamina + 0.1);
        }
    }

    interact() {
        const { player } = this.gameState;
        const playerCenterX = player.x + player.width / 2;
        const playerCenterY = player.y + player.height / 2;
        
        for (const plot of this.gameState.plots) {
            const distX = Math.abs(playerCenterX - (plot.x + plot.width / 2));
            const distY = Math.abs(playerCenterY - (plot.y + plot.height / 2));
            
            if (distX < 60 && distY < 60) {
                this.interactWithPlot(plot);
                return;
            }
        }
        console.log('附近没有可交互的地块');
    }

    interactWithPlot(plot) {
        if (!plot.planted) {
            if (this.gameState.inventory.seeds > 0) {
                plot.planted = true;
                plot.seedType = 'corn';
                plot.growthStage = 0;
                plot.watered = true;
                this.gameState.inventory.seeds--;
                console.log('种下了一颗种子');
            } else {
                console.log('没有种子了');
            }
        } else if (!plot.harvestable) {
            if (!plot.watered) {
                if (this.gameState.inventory.water > 0) {
                    plot.watered = true;
                    this.gameState.inventory.water--;
                    console.log('给作物浇水');
                } else {
                    console.log('没有水了');
                }
            } else {
                console.log('作物正在生长中...');
            }
        } else {
            this.gameState.inventory.food += 3;
            plot.planted = false;
            plot.seedType = null;
            plot.growthStage = 0;
            plot.watered = false;
            plot.harvestable = false;
            console.log('收获了作物！获得3份食物');
        }
    }

    updatePlots() {
        for (const plot of this.gameState.plots) {
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

    openInventory() {
        console.log('背包:', this.gameState.inventory);
        alert(`背包内容:\n种子: ${this.gameState.inventory.seeds}\n食物: ${this.gameState.inventory.food}\n水: ${this.gameState.inventory.water}`);
    }

    openCraft() {
        console.log('打开制作界面');
    }

    openMap() {
        console.log('打开地图');
    }

    togglePause() {
        this.gameState.isPaused = !this.gameState.isPaused;
        console.log(this.gameState.isPaused ? '游戏暂停' : '游戏继续');
    }

    startStatusDecay() {
        this.statusDecayInterval = setInterval(() => {
            if (!this.gameState.isPaused && this.gameState.isRunning) {
                this.gameState.hunger = Math.max(0, this.gameState.hunger - 0.1);
                this.gameState.thirst = Math.max(0, this.gameState.thirst - 0.15);
                this.regenerateStamina();
                
                if (this.gameState.hunger <= 0 || this.gameState.thirst <= 0) {
                    this.gameState.health = Math.max(0, this.gameState.health - 0.5);
                }
                
                this.updateStatusBars();
                
                if (this.gameState.health <= 0) {
                    this.gameOver();
                }
            }
        }, 1000);
    }

    stopStatusDecay() {
        if (this.statusDecayInterval) {
            clearInterval(this.statusDecayInterval);
        }
    }

    gameOver() {
        this.gameState.isRunning = false;
        this.stopStatusDecay();
        console.log('游戏结束');
        alert('游戏结束！');
    }

    updateStatusBars() {
        document.querySelector('.health-fill').style.width = `${this.gameState.health}%`;
        document.querySelector('.hunger-fill').style.width = `${this.gameState.hunger}%`;
        document.querySelector('.thirst-fill').style.width = `${this.gameState.thirst}%`;
        document.querySelector('.stamina-fill').style.width = `${this.gameState.stamina}%`;
        
        document.querySelector('.health-fill').parentElement.nextElementSibling.textContent = Math.floor(this.gameState.health);
        document.querySelector('.hunger-fill').parentElement.nextElementSibling.textContent = Math.floor(this.gameState.hunger);
        document.querySelector('.thirst-fill').parentElement.nextElementSibling.textContent = Math.floor(this.gameState.thirst);
        document.querySelector('.stamina-fill').parentElement.nextElementSibling.textContent = Math.floor(this.gameState.stamina);
    }

    drawBackground() {
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#1a1a2e');
        gradient.addColorStop(1, '#16213e');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#1e3a5f';
        for (let x = 0; x < this.canvas.width; x += this.TILE_SIZE) {
            for (let y = 0; y < this.canvas.height; y += this.TILE_SIZE) {
                if ((Math.floor(x / this.TILE_SIZE) + Math.floor(y / this.TILE_SIZE)) % 2 === 0) {
                    this.ctx.fillRect(x, y, this.TILE_SIZE, this.TILE_SIZE);
                }
            }
        }
    }

    drawPlayer() {
        const { x, y, width, height, direction } = this.gameState.player;
        
        this.ctx.save();
        this.ctx.translate(x + width / 2, y + height / 2);
        
        let angle = 0;
        switch(direction) {
            case 'up': angle = 0; break;
            case 'down': angle = Math.PI; break;
            case 'left': angle = -Math.PI / 2; break;
            case 'right': angle = Math.PI / 2; break;
        }
        this.ctx.rotate(angle);
        
        this.ctx.fillStyle = '#2c3e50';
        this.ctx.fillRect(-width / 2, -height / 2, width, height);
        
        this.ctx.fillStyle = '#34495e';
        this.ctx.fillRect(-width / 2, -height / 2, width, height / 3);
        
        this.ctx.fillStyle = '#e74c3c';
        this.ctx.beginPath();
        this.ctx.arc(0, -height / 2 + 8, 8, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#fff';
        this.ctx.beginPath();
        this.ctx.arc(-3, -height / 2 + 10, 2, 0, Math.PI * 2);
        this.ctx.arc(3, -height / 2 + 10, 2, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.restore();
    }

    drawPlots() {
        for (const plot of this.gameState.plots) {
            this.ctx.save();
            
            if (plot.owner === 'player') {
                this.ctx.strokeStyle = '#4a69bd';
                this.ctx.lineWidth = 3;
            } else {
                this.ctx.strokeStyle = '#7f8c8d';
                this.ctx.lineWidth = 2;
            }
            
            this.ctx.fillStyle = '#8b4513';
            this.ctx.fillRect(plot.x, plot.y, plot.width, plot.height);
            this.ctx.strokeRect(plot.x, plot.y, plot.width, plot.height);
            
            if (plot.planted) {
                this.drawCrop(plot);
            }
            
            if (plot.owner === 'player') {
                this.ctx.fillStyle = '#4a69bd';
                this.ctx.font = '10px Arial';
                this.ctx.fillText('我的地', plot.x + 2, plot.y + 12);
            }
            
            this.ctx.restore();
        }
    }

    drawCrop(plot) {
        const centerX = plot.x + plot.width / 2;
        const centerY = plot.y + plot.height / 2;
        
        if (plot.harvestable) {
            this.ctx.fillStyle = '#f1c40f';
            for (let i = 0; i < 3; i++) {
                this.ctx.beginPath();
                this.ctx.arc(centerX - 8 + i * 8, centerY - 5 - i * 3, 6, 0, Math.PI * 2);
                this.ctx.fill();
            }
            this.ctx.strokeStyle = '#27ae60';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(plot.x + 2, plot.y + 2, plot.width - 4, plot.height - 4);
        } else {
            const stemHeight = 10 + plot.growthStage * 20;
            
            this.ctx.strokeStyle = '#27ae60';
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, plot.y + plot.height);
            this.ctx.lineTo(centerX, plot.y + plot.height - stemHeight);
            this.ctx.stroke();
            
            const leafSize = 5 + plot.growthStage * 10;
            this.ctx.fillStyle = '#2ecc71';
            this.ctx.beginPath();
            this.ctx.ellipse(centerX - 8, plot.y + plot.height - stemHeight / 2, leafSize, 4, -0.5, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.beginPath();
            this.ctx.ellipse(centerX + 8, plot.y + plot.height - stemHeight / 2, leafSize, 4, 0.5, 0, Math.PI * 2);
            this.ctx.fill();
        }
        
        if (!plot.watered && plot.planted) {
            this.ctx.fillStyle = '#e74c3c';
            this.ctx.font = '12px Arial';
            this.ctx.fillText('!', centerX - 4, centerY + 4);
        }
    }

    drawWildResources() {
        for (const resource of this.gameState.wildResources) {
            if (resource.collected) continue;
            
            this.ctx.save();
            
            switch(resource.type) {
                case 'tree':
                    this.drawTree(resource);
                    break;
                case 'stone':
                    this.drawStone(resource);
                    break;
                case 'grass':
                    this.drawGrass(resource);
                    break;
            }
            
            this.ctx.restore();
        }
    }

    drawTree(resource) {
        const { x, y, size } = resource;
        
        this.ctx.fillStyle = '#8B4513';
        this.ctx.fillRect(x - size / 3, y, size * 2 / 3, size * 1.2);
        
        this.ctx.fillStyle = '#228B22';
        this.ctx.beginPath();
        this.ctx.arc(x, y - size * 0.3, size * 0.6, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.fillStyle = '#32CD32';
        this.ctx.beginPath();
        this.ctx.arc(x - size * 0.3, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(x + size * 0.3, y - size * 0.1, size * 0.4, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawStone(resource) {
        const { x, y, size } = resource;
        
        this.ctx.fillStyle = '#708090';
        this.ctx.beginPath();
        this.ctx.moveTo(x, y - size / 2);
        this.ctx.lineTo(x + size / 2, y - size / 4);
        this.ctx.lineTo(x + size / 2.5, y + size / 2);
        this.ctx.lineTo(x - size / 2.5, y + size / 2);
        this.ctx.lineTo(x - size / 2, y - size / 4);
        this.ctx.closePath();
        this.ctx.fill();
        
        this.ctx.fillStyle = '#A9A9A9';
        this.ctx.beginPath();
        this.ctx.ellipse(x - size / 6, y - size / 6, size / 6, size / 8, -0.3, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawGrass(resource) {
        const { x, y, size } = resource;
        
        this.ctx.strokeStyle = '#228B22';
        this.ctx.lineWidth = 2;
        
        for (let i = -2; i <= 2; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x + i * 3, y);
            this.ctx.quadraticCurveTo(x + i * 3 + i, y - size, x + i * 3, y - size * 1.5);
            this.ctx.stroke();
        }
        
        this.ctx.fillStyle = '#32CD32';
        for (let i = -1; i <= 1; i++) {
            this.ctx.beginPath();
            this.ctx.arc(x + i * 4, y - size, 2, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    draw() {
        this.drawBackground();
        this.drawWildResources();
        this.drawPlots();
        this.drawPlayer();
    }

    startGameLoop() {
        this.startStatusDecay();
        const gameLoop = () => {
            if (!this.gameState.isRunning) return;
            
            if (!this.gameState.isPaused) {
                this.updatePlots();
                this.updateWildResources();
                this.draw();
            }
            
            requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }

    start() {
        console.log('游戏开始');
    }

    stop() {
        this.gameState.isRunning = false;
        this.stopStatusDecay();
    }
}

const game = new SurvivalGame();
game.start();
window.game = game;