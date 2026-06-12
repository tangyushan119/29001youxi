class Player {
    constructor(options = {}) {
        this.id = 'player';
        this.x = options.x || 200;
        this.y = options.y || 200;
        this.width = options.width || 32;
        this.height = options.height || 48;
        this.direction = options.direction || 'down';
        this.speed = options.speed || 4;
        
        this.isWalking = false;
        this.animationTime = 0;
        
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
        this.isWalking = true;
        
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
        
        this.stats.stamina = Math.max(0, this.stats.stamina - 0.15);
    }

    stopWalking() {
        this.isWalking = false;
    }

    consumeStamina(amount) {
        this.stats.stamina = Math.max(0, this.stats.stamina - amount);
    }

    regenerateStamina() {
        if (this.stats.stamina < 200) {
            this.stats.stamina = Math.min(200, this.stats.stamina + 0.5);
        }
    }

    update(deltaTime) {
        this.regenerateStamina();
        
        if (this.isWalking) {
            this.animationTime += deltaTime * 15;
        } else {
            this.animationTime *= 0.95;
        }
    }

    getCenterX() {
        return this.x + this.width / 2;
    }

    getCenterY() {
        return this.y + this.height / 2;
    }

    clampPosition(maxWidth, maxHeight) {
        this.x = Math.max(0, Math.min(maxWidth - this.width, this.x));
        this.y = Math.max(0, Math.min(maxHeight - this.height, this.y));
    }

    serialize() {
        return {
            x: this.x,
            y: this.y,
            direction: this.direction,
            health: this.stats.health,
            hunger: this.stats.hunger,
            thirst: this.stats.thirst,
            stamina: this.stats.stamina,
            inventory: { ...this.inventory }
        };
    }

    static deserialize(data) {
        return new Player({
            x: data.x,
            y: data.y,
            direction: data.direction,
            health: data.health,
            hunger: data.hunger,
            thirst: data.thirst,
            stamina: data.stamina,
            inventory: data.inventory
        });
    }
}

export { Player };