import { RADIUS } from "./utils";
import CanvasManager from "./canvas";

class Scene {

    constructor() {

        this._sceneCanvas = CanvasManager.getInstance().getCanvas("scene");
        this._sceneCtx = CanvasManager.getInstance().getContext("scene");

        if (!this._sceneCtx) {
            throw new Error("Scene context not found! Make sure CanvasManager is initialized.");
        }

        this.SCENE_WIDTH = this._sceneCanvas.width;
        this.SCENE_HEIGHT = this._sceneCanvas.height;

        this.screenMiddleHeight = this.SCENE_HEIGHT / 2;

        this.WALL_HEIGHT = 1; // UNIT GRID SYSTEM

        this.observer = null;
        this.numeratorForWallHeightCalculation = null;
        this.distanceFromPlayerToProjectionPlane = null;

        this.sceneFrame = this._sceneCtx.createImageData(this.SCENE_WIDTH, this.SCENE_HEIGHT);
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

        this.distanceFromPlayerToProjectionPlane = (this.SCENE_WIDTH / 2) / Math.tan((this.observer.player.fieldOfViewDeg / 2) * RADIUS);
        this.numeratorForWallHeightCalculation = this.WALL_HEIGHT * this.distanceFromPlayerToProjectionPlane;
    }

    #drawWall(x, y, color, height, hitValue, slicer) {
        let startY = Math.floor((this.SCENE_HEIGHT - height) / 2);
        let endY = startY + height;

        startY = Math.max(-this.SCENE_HEIGHT * 5, startY);
        endY = Math.min(this.SCENE_HEIGHT * 5, endY);

        const buffer = this.sceneBuffer;
        const width = this.SCENE_WIDTH;

        const textureX = Math.floor(slicer * 32);
        const wallTexture = this.textureManager.textures.get(hitValue).getSliceBuffer(textureX % 32, 0, 1, 32);

        for (let y = startY, texY = 0; y < endY; y++, texY++) {
            const textureY = Math.floor(((texY / height) * 32));
            buffer[y * width + x] = wallTexture[textureY];
        }
    }

    #drawFloor(wall, scanRange) {
        for (let y = scanRange.min; y < scanRange.max; y++) {
            const betaAngle = wall.rayAngle;
            const rowDistance = this.observer.player.playerHeight * this.distanceFromPlayerToProjectionPlane / (y - this.screenMiddleHeight);
            const realDistance = rowDistance / Math.cos((betaAngle - this.observer.player.rotate) * RADIUS);

            const floorX = this.observer.player.coordX + realDistance * Math.cos(betaAngle * RADIUS);
            const floorY = this.observer.player.coordY + realDistance * Math.sin(betaAngle * RADIUS);

            const floorTile = this.observer.map.getTileFloor(Math.floor(floorX), Math.floor(floorY));
            const floorTexture = this.textureManager.textures.get(floorTile);

            const textureX = Math.floor(floorX * 32) & 31;
            const textureY = Math.floor(floorY * 32) & 31;

            if (!floorTexture) {
                // TODO: Handle floor texture not found error when tile wall is null case
                continue;
            }

            const color = floorTexture.getSliceBuffer(textureX, textureY, 1, 1);
            this.sceneBuffer[y * this.SCENE_WIDTH + wall.x] = color[0];
        }
        //throw new Error("Floor draw error");
    }

    #drawCeil(wall, scanRange) {
        for (let y = scanRange.min; y < scanRange.max; y++) {
            const betaAngle = wall.rayAngle;
            const rowDistance = this.observer.player.playerHeight * this.distanceFromPlayerToProjectionPlane / (this.screenMiddleHeight - y);
            const realDistance = rowDistance / Math.cos((betaAngle - this.observer.player.rotate) * RADIUS);

            const ceilX = this.observer.player.coordX + realDistance * Math.cos(betaAngle * RADIUS);
            const ceilY = this.observer.player.coordY + realDistance * Math.sin(betaAngle * RADIUS);

            const ceilTile = this.observer.map.getTileCeiling(Math.floor(ceilX), Math.floor(ceilY));
            const ceilTexture = this.textureManager.textures.get(ceilTile);

            const textureX = Math.floor(ceilX * 32) & 31;
            const textureY = Math.floor(ceilY * 32) & 31;

            const color = ceilTexture.getSliceBuffer(textureX, textureY, 1, 1);
            this.sceneBuffer[y * this.SCENE_WIDTH + wall.x] = color[0];
        }
    }

    #clearPixelMap() {
        this.sceneBuffer.fill(0x33333333);
    }

    render() {
        this.#clearPixelMap();

        const walls = this.observer.raysHittingPoints.map((ray, index) => {
            const angleDiff = ray.angle - this.observer.player.rotate;
            const correctedRayDistance = (ray.distance * Math.cos(angleDiff * RADIUS));
            return {
                x: index,
                height: this.numeratorForWallHeightCalculation * (this.observer.player.playerHeight * 2) / correctedRayDistance,
                hitValue: ray.hitValue,
                slicer: ray.side === 0 ? ray.y : ray.x,
                rayAngle: ray.angle
            };
        });

        for (const wall of walls) {
            this.#drawCeil(wall, { min: 0, max: this.screenMiddleHeight - (wall.height >> 1) });
            this.#drawWall(wall.x, 0, 0xFF000000, wall.height, wall.hitValue, wall.slicer);
            this.#drawFloor(wall, { min: this.screenMiddleHeight + (wall.height >> 1), max: this.SCENE_HEIGHT });
        }

        this._sceneCtx.putImageData(this.sceneFrame, 0, 0);
    }

}

export default Scene;
