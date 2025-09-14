import Scene from "./scene";
import CanvasManager from "./canvas";

class Engine {
    static instance = null;

    constructor () {
        if (Engine.instance) {
            return Engine.instance;
        }

        Engine.instance = this;


        this.mapCanvas = CanvasManager.getInstance().getCanvas("map");
        this.sceneCanvas = CanvasManager.getInstance().getCanvas("scene");
        this.mapCtx = CanvasManager.getInstance().getContext("map");
        this.sceneCtx = CanvasManager.getInstance().getContext("scene");

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
        // Maybe I'll back to classic for loop
        for (const gameObject of this.gameObjects) {
            gameObject.update && gameObject.update(deltaTime);
        }
    }

    render() {
        // Maybe I'll back to classic for loop
        for (const gameObject of this.gameObjects) {
            gameObject.render && gameObject.render();
        }
    }

    addGameObject(gameObject) {
        this.gameObjects.push(gameObject);
    }
}

export default Engine;