class Entity {
    constructor(id, options = {}) {
        this.id = id;
        this.x = options.x || 0;
        this.y = options.y || 0;
        this.width = options.width || 32;
        this.height = options.height || 32;
        this.visible = options.visible !== undefined ? options.visible : true;
        this.active = options.active !== undefined ? options.active : true;
        this.scene = null;
        this.game = null;
        
        this.components = new Map();
        
        if (options.components) {
            for (const [name, component] of Object.entries(options.components)) {
                this.addComponent(name, component);
            }
        }
    }

    init(game) {
        this.game = game;
        for (const component of this.components.values()) {
            component.init?.(this);
        }
    }

    addComponent(name, component) {
        component.entity = this;
        this.components.set(name, component);
    }

    getComponent(name) {
        return this.components.get(name);
    }

    removeComponent(name) {
        const component = this.components.get(name);
        if (component) {
            component.destroy?.();
            this.components.delete(name);
        }
    }

    update(deltaTime) {
        if (!this.active) return;
        
        for (const component of this.components.values()) {
            component.update?.(deltaTime);
        }
        
        this.onUpdate?.(deltaTime);
    }

    render(ctx) {
        if (!this.visible) return;
        
        this.onRender?.(ctx);
    }

    destroy() {
        for (const component of this.components.values()) {
            component.destroy?.();
        }
        this.components.clear();
        
        if (this.scene) {
            this.scene.removeEntity(this.id);
        }
    }

    onUpdate(deltaTime) {}
    onRender(ctx) {}
}

class PlayerEntity extends Entity {
    constructor(options = {}) {
        super('player', {
            x: options.x || 200,
            y: options.y || 200,
            width: 32,
            height: 48,
            ...options
        });
        
        this.direction = options.direction || 'down';
        this.speed = options.speed || 4;
        
        this.stats = {
            health: options.health || 200,
            hunger: options.hunger || 200,
            thirst: options.thirst || 200,
            stamina: options.stamina || 200
        };
        
        this.inventory = options.inventory || {
            seeds: 5,
            food: 3,
            water: 2,
            wood: 0,
            stone: 0,
            grass: 0
        };
    }

    move(direction) {
        this.direction = direction;
        
        switch(direction) {
            case 'up':
                this.y -= this.speed;
                break;
            case 'down':
                this.y += this.speed;
                break;
            case 'left':
                this.x -= this.speed;
                break;
            case 'right':
                this.x += this.speed;
                break;
        }
        
        this.stats.stamina = Math.max(0, this.stats.stamina - 0.5);
    }

    consumeStamina(amount) {
        this.stats.stamina = Math.max(0, this.stats.stamina - amount);
    }

    regenerateStamina() {
        if (this.stats.stamina < 200) {
            this.stats.stamina = Math.min(200, this.stats.stamina + 0.2);
        }
    }

    update(deltaTime) {
        super.update(deltaTime);
        this.regenerateStamina();
    }
}

class ResourceEntity extends Entity {
    constructor(id, options = {}) {
        super(id, {
            x: options.x || 0,
            y: options.y || 0,
            width: options.size || 30,
            height: options.size || 30,
            ...options
        });
        
        this.type = options.type || 'resource';
        this.color = options.color || '#8B4513';
        this.drop = options.drop || 'wood';
        this.dropAmount = options.dropAmount || 1;
        this.collected = options.collected || false;
        this.respawnTimer = options.respawnTimer || 0;
    }

    collect() {
        if (this.collected) return false;
        
        this.collected = true;
        this.respawnTimer = 5000;
        this.visible = false;
        
        return { drop: this.drop, amount: this.dropAmount };
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        if (this.collected && this.respawnTimer > 0) {
            this.respawnTimer -= deltaTime * 1000;
            if (this.respawnTimer <= 0) {
                this.collected = false;
                this.respawnTimer = 0;
                this.visible = true;
            }
        }
    }
}

class PlotEntity extends Entity {
    constructor(id, options = {}) {
        super(id, {
            x: options.x || 0,
            y: options.y || 0,
            width: options.width || 40,
            height: options.height || 40,
            ...options
        });
        
        this.planted = options.planted || false;
        this.seedType = options.seedType || null;
        this.growthStage = options.growthStage || 0;
        this.watered = options.watered || false;
        this.harvestable = options.harvestable || false;
    }

    plant(seedType = 'corn') {
        if (this.planted) return false;
        
        this.planted = true;
        this.seedType = seedType;
        this.growthStage = 0;
        this.watered = true;
        
        return true;
    }

    water() {
        if (!this.planted) return false;
        
        this.watered = true;
        return true;
    }

    harvest() {
        if (!this.harvestable) return false;
        
        const yieldAmount = 3;
        
        this.planted = false;
        this.seedType = null;
        this.growthStage = 0;
        this.watered = false;
        this.harvestable = false;
        
        return yieldAmount;
    }

    update(deltaTime) {
        super.update(deltaTime);
        
        if (this.planted && this.watered) {
            this.growthStage += 0.005;
            if (this.growthStage >= 1) {
                this.harvestable = true;
            }
        }
        
        if (this.planted && !this.watered) {
            this.growthStage = Math.max(0, this.growthStage - 0.002);
        }
    }
}

export { Entity, PlayerEntity, ResourceEntity, PlotEntity };