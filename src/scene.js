import { RADIUS } from "./utils";

class Scene {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.canvasCtx = this.canvas.getContext('2d');

        this.canvas.width = this.canvas.clientWidth;
        this.canvas.height = this.canvas.clientHeight;

        this.SCENE_WIDTH = this.canvas.clientWidth;
        this.SCENE_HEIGHT = this.canvas.clientHeight;

        this.WALL_HEIGHT = 1; // UNIT GRID SYSTEM

        this.observer = null;
        this.numeratorForWallHeightCalculation = null;

        this.sceneFrame = this.canvasCtx.createImageData(this.SCENE_WIDTH, this.SCENE_HEIGHT);
        this.sceneBuffer = new Uint32Array(this.sceneFrame.data.buffer);

        this.textureManager = null;
    }

    addObserver(observer) {
        this.observer = observer;
        this.#initializeProjectionValues();
    }

    addTextureManager(textureManager) {
        this.textureManager = textureManager;
    }

    update() {
        // TODO: Update the scene
    }

    #initializeProjectionValues() {
        /*
                projected wall height                    actual wall height
        ----------------------------------------- = ---------------------------
        distance from player to projection plane    distance from player to wall    
        */

        const distanceFromPlayerToProjectionPlane = (this.SCENE_WIDTH / 2) / Math.tan((this.observer.player.fieldOfViewDeg / 2) * RADIUS);
        this.numeratorForWallHeightCalculation = this.WALL_HEIGHT * distanceFromPlayerToProjectionPlane;
    }
 
    #drawWall(x, y, color, height, hitValue, slicer) {
        let startY = Math.floor((this.SCENE_HEIGHT - height) / 2);
        let endY = startY + height;
        
        startY = Math.max(0, startY);
        endY = Math.min(this.SCENE_HEIGHT, endY);
        
        const buffer = this.sceneBuffer;
        const width = this.SCENE_WIDTH;
        
        const textureX = Math.floor(slicer * 32);
        const wallTexture = this.textureManager.textures[0].getSliceBuffer(hitValue * 32 + textureX % 32, 0, 1, 32);

        for (let y = startY, texY = 0; y < endY; y++, texY++) {
            const textureY = Math.floor(((texY / height) * 32));
            buffer[y * width + x] = wallTexture[textureY];
        }
    }

    #clearPixelMap() {
        this.sceneBuffer.fill(0x33333333);
    }

    render(ctx) {
        this.#clearPixelMap();
    
        const walls = this.observer.raysHittingPoints.map((ray, index) => {
            const angleDiff = ray.angle - this.observer.player.rotate;
            const correctedRayDistance = (ray.distance * Math.cos(angleDiff * RADIUS));
            return {
                x: index,
                height: this.numeratorForWallHeightCalculation / correctedRayDistance,
                hitValue: ray.hitValue,
                slicer: ray.side === 0 ? ray.y : ray.x
            };
        });
        
        for (const wall of walls) {
            this.#drawWall(wall.x, 0, 0xFF000000, wall.height, wall.hitValue, wall.slicer);
        }
        
        ctx.putImageData(this.sceneFrame, 0, 0);
    }



}

export default Scene;