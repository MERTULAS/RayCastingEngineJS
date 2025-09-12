class CanvasManager {

    static instance = null;

    static getInstance () {
        if (!CanvasManager.instance) {
            CanvasManager.instance = new CanvasManager();
        }
        return CanvasManager.instance;
    }

    constructor () {
        this._canvases = new Map();
        this._contexts = new Map();
    }

    registerMapCanvas (canvasId) {
        this.#registerCanvas("map", canvasId);
    }

    registerSceneCanvas (canvasId) {
        this.#registerCanvas("scene", canvasId);
    }

    #registerCanvas (key, canvasId) {
        const canvas = document.getElementById(canvasId);
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
        this._canvases.set(key, canvas);
        this._contexts.set(key, canvas.getContext("2d"));
    }

    getCanvas (key) {
        return this._canvases.get(key);
    }

    getContext (key) {
        return this._contexts.get(key);
    }
}

export default CanvasManager;