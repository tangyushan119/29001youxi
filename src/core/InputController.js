class InputController {
    constructor() {
        this.keys = new Set();
        this.pressedKeys = new Set();
        this.releasedKeys = new Set();
        
        this.mouse = {
            x: 0,
            y: 0,
            down: false,
            pressed: false,
            released: false,
            wheel: 0
        };

        this.gamepads = [];
        
        this.bindings = new Map();
        
        this.callbacks = {
            keydown: [],
            keyup: [],
            mousedown: [],
            mouseup: [],
            mousemove: [],
            click: [],
            wheel: [],
            gamepadconnected: [],
            gamepaddisconnected: []
        };

        this.setupEventListeners();
        this.startGamepadPolling();
    }

    setupEventListeners() {
        window.addEventListener('keydown', (e) => this.handleKeyDown(e));
        window.addEventListener('keyup', (e) => this.handleKeyUp(e));
        window.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        window.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        window.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.addEventListener('wheel', (e) => this.handleWheel(e));
        window.addEventListener('gamepadconnected', (e) => this.handleGamepadConnected(e));
        window.addEventListener('gamepaddisconnected', (e) => this.handleGamepadDisconnected(e));
    }

    handleKeyDown(e) {
        if (!this.keys.has(e.code)) {
            this.pressedKeys.add(e.code);
        }
        this.keys.add(e.code);
        
        this.triggerCallbacks('keydown', e);
        this.triggerBinding(e.code, 'down');
    }

    handleKeyUp(e) {
        this.keys.delete(e.code);
        this.releasedKeys.add(e.code);
        
        this.triggerCallbacks('keyup', e);
        this.triggerBinding(e.code, 'up');
    }

    handleMouseDown(e) {
        this.mouse.down = true;
        this.mouse.pressed = true;
        this.updateMousePosition(e);
        
        this.triggerCallbacks('mousedown', e);
    }

    handleMouseUp(e) {
        this.mouse.down = false;
        this.mouse.released = true;
        this.updateMousePosition(e);
        
        this.triggerCallbacks('mouseup', e);
        this.triggerCallbacks('click', e);
    }

    handleMouseMove(e) {
        this.updateMousePosition(e);
        this.triggerCallbacks('mousemove', e);
    }

    handleWheel(e) {
        this.mouse.wheel = e.deltaY;
        this.triggerCallbacks('wheel', e);
    }

    handleGamepadConnected(e) {
        this.gamepads[e.gamepad.index] = e.gamepad;
        this.triggerCallbacks('gamepadconnected', e);
    }

    handleGamepadDisconnected(e) {
        delete this.gamepads[e.gamepad.index];
        this.triggerCallbacks('gamepaddisconnected', e);
    }

    updateMousePosition(e) {
        this.mouse.x = e.clientX;
        this.mouse.y = e.clientY;
    }

    startGamepadPolling() {
        const poll = () => {
            this.pollGamepads();
            requestAnimationFrame(poll);
        };
        poll();
    }

    pollGamepads() {
        const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
        
        for (let i = 0; i < gamepads.length; i++) {
            if (gamepads[i]) {
                this.gamepads[i] = gamepads[i];
                this.processGamepadInput(gamepads[i]);
            }
        }
    }

    processGamepadInput(gamepad) {
        const buttons = gamepad.buttons;
        const axes = gamepad.axes;

        for (let i = 0; i < buttons.length; i++) {
            const button = buttons[i];
            if (button.pressed) {
                this.triggerBinding(`gamepad_button_${i}`, 'down');
            }
        }

        if (Math.abs(axes[0]) > 0.2) {
            this.triggerBinding('gamepad_left_stick_x', 'axis', axes[0]);
        }
        if (Math.abs(axes[1]) > 0.2) {
            this.triggerBinding('gamepad_left_stick_y', 'axis', axes[1]);
        }
    }

    bind(key, callback, eventType = 'down') {
        if (!this.bindings.has(key)) {
            this.bindings.set(key, []);
        }
        this.bindings.get(key).push({ callback, eventType });
    }

    unbind(key, callback) {
        const bindings = this.bindings.get(key);
        if (bindings) {
            this.bindings.set(key, bindings.filter(b => b.callback !== callback));
        }
    }

    triggerBinding(key, eventType, value) {
        const bindings = this.bindings.get(key);
        if (!bindings) return;

        for (const binding of bindings) {
            if (binding.eventType === eventType || binding.eventType === 'any') {
                binding.callback(value);
            }
        }
    }

    on(eventType, callback) {
        if (this.callbacks[eventType]) {
            this.callbacks[eventType].push(callback);
        }
    }

    off(eventType, callback) {
        if (this.callbacks[eventType]) {
            this.callbacks[eventType] = this.callbacks[eventType].filter(cb => cb !== callback);
        }
    }

    triggerCallbacks(eventType, event) {
        for (const callback of this.callbacks[eventType]) {
            callback(event);
        }
    }

    isKeyDown(key) {
        return this.keys.has(key);
    }

    isKeyPressed(key) {
        return this.pressedKeys.has(key);
    }

    isKeyReleased(key) {
        return this.releasedKeys.has(key);
    }

    update() {
        this.pressedKeys.clear();
        this.releasedKeys.clear();
        this.mouse.pressed = false;
        this.mouse.released = false;
        this.mouse.wheel = 0;
    }

    destroy() {
        window.removeEventListener('keydown', (e) => this.handleKeyDown(e));
        window.removeEventListener('keyup', (e) => this.handleKeyUp(e));
        window.removeEventListener('mousedown', (e) => this.handleMouseDown(e));
        window.removeEventListener('mouseup', (e) => this.handleMouseUp(e));
        window.removeEventListener('mousemove', (e) => this.handleMouseMove(e));
        window.removeEventListener('wheel', (e) => this.handleWheel(e));
        window.removeEventListener('gamepadconnected', (e) => this.handleGamepadConnected(e));
        window.removeEventListener('gamepaddisconnected', (e) => this.handleGamepadDisconnected(e));
        
        this.keys.clear();
        this.pressedKeys.clear();
        this.releasedKeys.clear();
        this.bindings.clear();
        
        for (const key of Object.keys(this.callbacks)) {
            this.callbacks[key] = [];
        }
    }
}

export { InputController };