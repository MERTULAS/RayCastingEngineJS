import Scene from "./scene";

class Engine {
    constructor({mapCanvasId, sceneCanvasId}) {
        if (Engine.instance) {
            return Engine.instance;
        }
        
        Engine.instance = this;

        if (!mapCanvasId && !sceneCanvasId) {
            throw Error("Map canvas and scene canvas are required");
        };

        this.mapCanvas = document.getElementById(mapCanvasId);
        this.mapCtx = this.mapCanvas.getContext('2d');

        this.sceneCanvas = document.getElementById(sceneCanvasId);
        this.sceneCtx = this.sceneCanvas.getContext('2d');

        this.gameObjects = [];
        this.running = false;

        this.fps = 0;
        this.frames = 0;
        this.lastFpsUpdate = 0;

        this.fpsDisplay = document.createElement('div');
        this.fpsDisplay.style.position = 'fixed';
        this.fpsDisplay.style.top = '10px';
        this.fpsDisplay.style.left = '10px';
        this.fpsDisplay.style.color = 'white';
        this.fpsDisplay.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        this.fpsDisplay.style.padding = '5px';
        document.body.appendChild(this.fpsDisplay);
    }

    start() {
        this.running = true;
        this.lastTime = 0;
        this.gameLoop(0);
    }

    gameLoop(time) {
        if (!this.running) {
            return;
        }

        const deltaTime = time - this.lastTime;
        this.lastTime = time;

        this.frames++;
        if (time - this.lastFpsUpdate >= 1000) {
            this.fps = this.frames;
            this.frames = 0;
            this.lastFpsUpdate = time;
            this.fpsDisplay.textContent = `FPS: ${this.fps}`;
        }

        this.clear();
        this.update(deltaTime);
        this.render();

        requestAnimationFrame((time) => this.gameLoop(time));
    }

    clear() {
        this.mapCtx.clearRect(0, 0, this.mapCanvas.width, this.mapCanvas.height);
        this.sceneCtx.clearRect(0, 0, this.sceneCanvas.width, this.sceneCanvas.height);
    }

    update(deltaTime) {
        for (let i = 0; i < this.gameObjects.length; i++) {
            const gameObject = this.gameObjects[i];
            gameObject.update && gameObject.update(deltaTime);
        }
    }

    render() {
        for (let i = 0; i < this.gameObjects.length; i++) {
            const gameObject = this.gameObjects[i];
            gameObject.render && gameObject.render(gameObject instanceof Scene ? this.sceneCtx : this.mapCtx);
        }
    }

    addGameObject(gameObject) {
        this.gameObjects.push(gameObject);
    }
}

export default Engine;