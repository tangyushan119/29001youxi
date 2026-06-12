class PlayerRenderer {
    constructor() {
        this.animationTime = 0;
        this.isWalking = false;
        this.direction = 'down';
        this.bodyParts = {
            head: { width: 20, height: 20, offsetY: -35 },
            torso: { width: 16, height: 24, offsetY: -15 },
            leftArm: { length: 18, width: 6, offsetX: -10, offsetY: -18 },
            rightArm: { length: 18, width: 6, offsetX: 10, offsetY: -18 },
            leftLeg: { length: 22, width: 7, offsetX: -6, offsetY: 8 },
            rightLeg: { length: 22, width: 7, offsetX: 6, offsetY: 8 }
        };
    }

    setDirection(direction) {
        this.direction = direction;
    }

    setWalking(isWalking) {
        this.isWalking = isWalking;
    }

    update(deltaTime) {
        if (this.isWalking) {
            this.animationTime += deltaTime * 12;
        } else {
            this.animationTime *= 0.9;
        }
    }

    draw(ctx, x, y, direction = this.direction) {
        ctx.save();
        ctx.translate(x, y);

        const angle = this.getDirectionAngle(direction);
        ctx.rotate(angle);

        this.drawBody(ctx);

        ctx.restore();
    }

    getDirectionAngle(direction) {
        switch(direction) {
            case 'up': return 0;
            case 'down': return Math.PI;
            case 'left': return -Math.PI / 2;
            case 'right': return Math.PI / 2;
            default: return 0;
        }
    }

    drawBody(ctx) {
        this.drawHead(ctx);
        this.drawTorso(ctx);
        this.drawArms(ctx);
        this.drawLegs(ctx);
    }

    drawHead(ctx) {
        const head = this.bodyParts.head;
        
        const bounce = this.isWalking ? Math.sin(this.animationTime) * 2 : 0;
        const headY = head.offsetY + bounce;

        ctx.save();
        ctx.translate(0, headY);

        ctx.fillStyle = '#FFDAB9';
        ctx.beginPath();
        ctx.ellipse(0, 0, head.width / 2, head.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#8B4513';
        ctx.beginPath();
        ctx.ellipse(0, -head.height / 2 + 2, head.width / 2, 5, 0, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(-4, -2, 2.5, 0, Math.PI * 2);
        ctx.arc(4, -2, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.arc(-6, 3, 2, 0, Math.PI * 2);
        ctx.arc(6, 3, 2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.arc(0, 5, 3, 0, Math.PI);
        ctx.fill();

        ctx.restore();
    }

    drawTorso(ctx) {
        const torso = this.bodyParts.torso;

        ctx.fillStyle = '#4a69bd';
        ctx.beginPath();
        ctx.roundRect(-torso.width / 2, torso.offsetY, torso.width, torso.height, 4);
        ctx.fill();

        ctx.fillStyle = '#3a5a9d';
        ctx.beginPath();
        ctx.roundRect(-torso.width / 2 + 2, torso.offsetY + 2, torso.width - 4, torso.height - 4, 2);
        ctx.fill();

        ctx.fillStyle = '#5a79cd';
        ctx.beginPath();
        ctx.roundRect(-torso.width / 2 + 4, torso.offsetY + 4, torso.width - 8, torso.height / 2 - 2, 2);
        ctx.fill();
    }

    drawArms(ctx) {
        const leftArm = this.bodyParts.leftArm;
        const rightArm = this.bodyParts.rightArm;

        const armSwing = this.isWalking ? Math.sin(this.animationTime) * 0.4 : 0;

        this.drawArm(ctx, leftArm.offsetX, leftArm.offsetY, leftArm.length, leftArm.width, -armSwing);
        this.drawArm(ctx, rightArm.offsetX, rightArm.offsetY, rightArm.length, rightArm.width, armSwing);
    }

    drawArm(ctx, baseX, baseY, length, width, angle) {
        ctx.save();
        ctx.translate(baseX, baseY);
        ctx.rotate(angle);

        ctx.fillStyle = '#FFDAB9';
        ctx.beginPath();
        ctx.roundRect(-width / 2, 0, width, length, 3);
        ctx.fill();

        ctx.fillStyle = '#CD853F';
        ctx.beginPath();
        ctx.roundRect(-width / 2 + 1, length - 6, width - 2, 6, 2);
        ctx.fill();

        ctx.restore();
    }

    drawLegs(ctx) {
        const leftLeg = this.bodyParts.leftLeg;
        const rightLeg = this.bodyParts.rightLeg;

        const legSwing = this.isWalking ? Math.sin(this.animationTime) * 0.5 : 0;

        this.drawLeg(ctx, leftLeg.offsetX, leftLeg.offsetY, leftLeg.length, leftLeg.width, legSwing);
        this.drawLeg(ctx, rightLeg.offsetX, rightLeg.offsetY, rightLeg.length, rightLeg.width, -legSwing);
    }

    drawLeg(ctx, baseX, baseY, length, width, angle) {
        ctx.save();
        ctx.translate(baseX, baseY);
        ctx.rotate(angle);

        ctx.fillStyle = '#2c3e50';
        ctx.beginPath();
        ctx.roundRect(-width / 2, 0, width, length, 3);
        ctx.fill();

        ctx.fillStyle = '#34495e';
        ctx.beginPath();
        ctx.roundRect(-width / 2 + 1, 0, width - 2, length / 2, 2);
        ctx.fill();

        ctx.fillStyle = '#7f8c8d';
        ctx.beginPath();
        ctx.roundRect(-width / 2 + 1, length - 8, width - 2, 8, 2);
        ctx.fill();

        ctx.restore();
    }

    drawShadow(ctx, x, y) {
        ctx.save();
        ctx.translate(x, y + 25);
        
        const shadowScale = this.isWalking ? 0.8 + Math.sin(this.animationTime) * 0.1 : 0.9;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 18 * shadowScale, 6 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
}

export { PlayerRenderer };