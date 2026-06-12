class PlayerRenderer {
    constructor() {
        this.bodyConfig = {
            head: { width: 22, height: 24, offsetY: -40 },
            torso: { width: 20, height: 28, offsetY: -16 },
            leftUpperArm: { length: 12, width: 7, offsetX: -11, offsetY: -20 },
            rightUpperArm: { length: 12, width: 7, offsetX: 11, offsetY: -20 },
            leftLowerArm: { length: 14, width: 6, offsetX: -11, offsetY: -8 },
            rightLowerArm: { length: 14, width: 6, offsetX: 11, offsetY: -8 },
            leftUpperLeg: { length: 16, width: 8, offsetX: -7, offsetY: 10 },
            rightUpperLeg: { length: 16, width: 8, offsetX: 7, offsetY: 10 },
            leftLowerLeg: { length: 16, width: 7, offsetX: -7, offsetY: 24 },
            rightLowerLeg: { length: 16, width: 7, offsetX: 7, offsetY: 24 },
            foot: { length: 10, width: 6 }
        };
        
        this.colors = {
            skin: '#FFDAB9',
            skinLight: '#FFF5EE',
            hair: '#5D4037',
            hairLight: '#8D6E63',
            eyes: '#4A4A4A',
            iris: '#2E7D32',
            shirt: '#E53935',
            shirtDark: '#B71C1C',
            pants: '#1565C0',
            pantsDark: '#0D47A1',
            shoes: '#212121',
            shoesLight: '#424242'
        };
    }

    draw(ctx, x, y, direction = 'down', isWalking = false, animationTime = 0) {
        ctx.save();
        ctx.translate(x, y);

        const angle = this.getDirectionAngle(direction);
        ctx.rotate(angle);

        this.drawShadow(ctx, isWalking, animationTime);
        this.drawBody(ctx, isWalking, animationTime);

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

    drawShadow(ctx, isWalking, animationTime) {
        const swingOffset = isWalking ? Math.sin(animationTime) * 3 : 0;
        const shadowScale = isWalking ? 0.85 + Math.sin(animationTime) * 0.08 : 0.92;
        
        ctx.save();
        ctx.translate(swingOffset, 35);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
        ctx.beginPath();
        ctx.ellipse(0, 0, 22 * shadowScale, 8 * shadowScale, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }

    drawBody(ctx, isWalking, animationTime) {
        this.drawLegs(ctx, isWalking, animationTime);
        this.drawTorso(ctx);
        this.drawArms(ctx, isWalking, animationTime);
        this.drawHead(ctx, isWalking, animationTime);
    }

    drawHead(ctx, isWalking, animationTime) {
        const head = this.bodyConfig.head;
        const bounce = isWalking ? Math.sin(animationTime) * 2.5 : 0;
        const headY = head.offsetY + bounce;

        ctx.save();
        ctx.translate(0, headY);

        ctx.fillStyle = this.colors.skin;
        ctx.beginPath();
        ctx.ellipse(0, 0, head.width / 2, head.height / 2, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.colors.hair;
        ctx.beginPath();
        ctx.ellipse(0, -head.height / 2 + 4, head.width / 2 + 2, 7, 0, Math.PI, 0);
        ctx.fill();

        ctx.fillStyle = this.colors.hairLight;
        ctx.beginPath();
        ctx.ellipse(-3, -head.height / 2 + 6, 4, 3, -0.3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.arc(-5, -2, 3, 0, Math.PI * 2);
        ctx.arc(5, -2, 3, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = this.colors.iris;
        ctx.beginPath();
        ctx.arc(-5, -2, 1.5, 0, Math.PI * 2);
        ctx.arc(5, -2, 1.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(-4, -3, 0.8, 0, Math.PI * 2);
        ctx.arc(6, -3, 0.8, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#FFB6C1';
        ctx.beginPath();
        ctx.ellipse(-7, 4, 3, 2, -0.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.ellipse(7, 4, 3, 2, 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#D4A5A5';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(0, 6, 4, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();

        ctx.fillStyle = '#FF69B4';
        ctx.beginPath();
        ctx.ellipse(0, 7, 2, 1.5, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
    }

    drawTorso(ctx) {
        const torso = this.bodyConfig.torso;

        ctx.fillStyle = this.colors.shirt;
        ctx.beginPath();
        ctx.roundRect(-torso.width / 2, torso.offsetY, torso.width, torso.height, 5);
        ctx.fill();

        ctx.fillStyle = this.colors.shirtDark;
        ctx.beginPath();
        ctx.roundRect(-torso.width / 2 + 3, torso.offsetY + 3, torso.width - 6, torso.height - 6, 3);
        ctx.fill();

        ctx.fillStyle = '#EF5350';
        ctx.beginPath();
        ctx.roundRect(-torso.width / 2 + 5, torso.offsetY + 5, torso.width - 10, torso.height / 2 - 3, 2);
        ctx.fill();

        ctx.fillStyle = '#FFCDD2';
        ctx.beginPath();
        ctx.roundRect(-torso.width / 2 + 2, torso.offsetY + torso.height - 3, torso.width - 4, 3, 1);
        ctx.fill();
    }

    drawArms(ctx, isWalking, animationTime) {
        const swing = isWalking ? Math.sin(animationTime) * 0.5 : 0;
        const elbowBend = isWalking ? Math.sin(animationTime + Math.PI / 2) * 0.3 : 0;

        this.drawArm(ctx, 'left', swing, elbowBend);
        this.drawArm(ctx, 'right', -swing, -elbowBend);
    }

    drawArm(ctx, side, shoulderAngle, elbowAngle) {
        const upperArm = this.bodyConfig[side + 'UpperArm'];
        const lowerArm = this.bodyConfig[side + 'LowerArm'];
        const sign = side === 'left' ? 1 : -1;

        ctx.save();
        ctx.translate(upperArm.offsetX * sign, upperArm.offsetY);
        ctx.rotate(shoulderAngle);

        ctx.fillStyle = this.colors.skin;
        ctx.beginPath();
        ctx.roundRect(-upperArm.width / 2, 0, upperArm.width, upperArm.length, 3);
        ctx.fill();

        ctx.save();
        ctx.translate(0, upperArm.length);
        ctx.rotate(elbowAngle * sign);

        ctx.fillStyle = this.colors.skin;
        ctx.beginPath();
        ctx.roundRect(-lowerArm.width / 2, 0, lowerArm.width, lowerArm.length, 3);
        ctx.fill();

        ctx.fillStyle = this.colors.shoes;
        ctx.beginPath();
        ctx.roundRect(-lowerArm.width / 2 + 1, lowerArm.length - 5, lowerArm.width - 2, 5, 2);
        ctx.fill();

        ctx.restore();
        ctx.restore();
    }

    drawLegs(ctx, isWalking, animationTime) {
        const swing = isWalking ? Math.sin(animationTime) * 0.55 : 0;
        const kneeBend = isWalking ? Math.abs(Math.sin(animationTime)) * 0.6 : 0;

        this.drawLeg(ctx, 'left', swing, kneeBend);
        this.drawLeg(ctx, 'right', -swing, kneeBend);
    }

    drawLeg(ctx, side, hipAngle, kneeBend) {
        const upperLeg = this.bodyConfig[side + 'UpperLeg'];
        const lowerLeg = this.bodyConfig[side + 'LowerLeg'];
        const foot = this.bodyConfig.foot;
        const sign = side === 'left' ? 1 : -1;

        ctx.save();
        ctx.translate(upperLeg.offsetX * sign, upperLeg.offsetY);
        ctx.rotate(hipAngle);

        ctx.fillStyle = this.colors.pants;
        ctx.beginPath();
        ctx.roundRect(-upperLeg.width / 2, 0, upperLeg.width, upperLeg.length, 4);
        ctx.fill();

        ctx.fillStyle = this.colors.pantsDark;
        ctx.beginPath();
        ctx.roundRect(-upperLeg.width / 2 + 2, 0, upperLeg.width - 4, upperLeg.length / 2, 2);
        ctx.fill();

        ctx.save();
        ctx.translate(0, upperLeg.length);
        ctx.rotate(-kneeBend * sign);

        ctx.fillStyle = this.colors.pants;
        ctx.beginPath();
        ctx.roundRect(-lowerLeg.width / 2, 0, lowerLeg.width, lowerLeg.length, 4);
        ctx.fill();

        ctx.fillStyle = this.colors.pantsDark;
        ctx.beginPath();
        ctx.roundRect(-lowerLeg.width / 2 + 1.5, 0, lowerLeg.width - 3, lowerLeg.length / 2, 2);
        ctx.fill();

        ctx.save();
        ctx.translate(0, lowerLeg.length);
        
        const footAngle = isWalking ? Math.sin(animationTime + (side === 'left' ? 0 : Math.PI)) * 0.3 : 0;
        ctx.rotate(footAngle);

        ctx.fillStyle = this.colors.shoes;
        ctx.beginPath();
        ctx.roundRect(-foot.width / 2, 0, foot.length, foot.width, 2);
        ctx.fill();

        ctx.fillStyle = this.colors.shoesLight;
        ctx.beginPath();
        ctx.roundRect(-foot.width / 2 + 1, 1, foot.length - 2, 2, 1);
        ctx.fill();

        ctx.restore();
        ctx.restore();
        ctx.restore();
    }
}

export { PlayerRenderer };