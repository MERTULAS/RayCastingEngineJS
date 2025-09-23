import { RADIUS } from "./utils";
import CanvasManager from "./canvas";
import { CEIL_HEIGHT } from "./constants";

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
        this.defaultColor = 0xFF000000;

        this.sceneFrame = this._sceneCtx.createImageData(this.SCENE_WIDTH, this.SCENE_HEIGHT);
        this.sceneBuffer = new Uint32Array(this.sceneFrame.data.buffer);

        this.textureManager = null;

        this.animationFrameCounter = 0;
    }

    addObserver(observer) {
        this.observer = observer;
        this.#initializeProjectionValues();
    }

    addTextureManager(textureManager) {
        this.textureManager = textureManager;
    }

    update() {
        this.screenMiddleHeight = this.SCENE_HEIGHT / 2 + this.observer.player.rotateY;
        this.animationFrameCounter += 0.1;

        if (this.animationFrameCounter > 60) { // 60 fps
            this.animationFrameCounter = 0;
        }
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

    #drawWall(x, height, hitValueWall, slicer, startY, correctedRayDistance, hitValueHeight, hitValueFloorHeight) {

        if (height < 0) {
            return;
        }
        
        let endY = startY + height;

        startY = Math.max(-this.SCENE_HEIGHT * 5, startY);
        endY = Math.min(this.SCENE_HEIGHT * 5, endY);

        const textureX = Math.floor(slicer * 32);
        const brightness = this.#calculateBrightness(correctedRayDistance);
        let wallTexture = this.textureManager.textures.get(hitValueWall);

        if (Array.isArray(wallTexture)) {
            wallTexture = wallTexture?.[Math.floor(this.animationFrameCounter) % (wallTexture.length)];
        }

        let color;

        //wallTexture = wallTexture.getSliceBuffer(textureX % 32, (1 - hitValueHeight) * 32, 1, 32, brightness);
        if (!wallTexture) {
            color = [this.defaultColor];
        }
        else {
            color = wallTexture.getSliceBuffer(textureX % 32, Math.floor((hitValueHeight >= 1 ? 0 : (1 - hitValueHeight)) * 32), 1, 32, brightness);
        }

        let wallHeightOnLayout = hitValueHeight - hitValueFloorHeight;


        for (let y = startY, texY = 0; y < endY; y++, texY++) {
            const textureY = Math.floor(((texY * wallHeightOnLayout / height) * 32)) % 32;
            // TODO: Find a better way maybe with some kind of z-buffer idk...
            if (this.sceneBuffer[y * this.SCENE_WIDTH + x] !== 0x00000000) {
                continue;
            }
            this.sceneBuffer[y * this.SCENE_WIDTH + x] = color[textureY];
        }

    }

    #drawFloor(bufferX, rayAngle, scanRange) {
        for (let y = scanRange.min; y < scanRange.max; y++) {
            

            /*
            // For testing
            if (this.sceneBuffer[y * this.SCENE_WIDTH + wall.x] !== 0x00000000) {
                continue;
            }
            */

            if (this.screenMiddleHeight > y) {
                continue;
            }

            const rowDistance = this.observer.player.playerHeight * this.distanceFromPlayerToProjectionPlane / (y - this.screenMiddleHeight);
            const realDistance = rowDistance / Math.cos((rayAngle - this.observer.player.rotateX) * RADIUS);

            const floorX = this.observer.player.coordX + realDistance * Math.cos(rayAngle * RADIUS);
            const floorY = this.observer.player.coordY + realDistance * Math.sin(rayAngle * RADIUS);

            const floorXFloor = Math.floor(floorX);
            const floorYFloor = Math.floor(floorY);

            const floorTile = this.observer.map.getTileFloor(floorXFloor, floorYFloor);

            let floorTexture = this.textureManager.textures.get(floorTile);

            if (!floorTexture) {
                // TODO: Handle floor texture not found error when tile wall is null case
                continue;
            }

            const floorTextureX = Math.floor(floorX * 32) & 31;
            const floorTextureY = Math.floor(floorY * 32) & 31;

            if (Array.isArray(floorTexture)) {
                floorTexture = floorTexture?.[Math.floor(this.animationFrameCounter) % (floorTexture.length)];
            }

            const bufferPosition = y * this.SCENE_WIDTH + bufferX;
            const spriteKey = this.observer.map.getTileSprite(floorXFloor, floorYFloor);

            const brightness = this.#calculateBrightness(realDistance);
            const floorColor = floorTexture.getSliceBuffer(floorTextureX, floorTextureY, 1, 1, brightness);

            this.sceneBuffer[bufferPosition] = floorColor[0];

            if (spriteKey) {
                this.#drawSpriteOnCeilOrFloor(bufferPosition, floorTextureX, floorTextureY, spriteKey, brightness); // Will be deleted in future because not necessary (floor texture is already drawn)
            }
        }
    }

    #drawCeil(bufferX, rayAngle, scanRange) {
        for (let y = scanRange.min; y < scanRange.max; y++) {

            const rowDistance = (CEIL_HEIGHT - this.observer.player.playerHeight) * this.distanceFromPlayerToProjectionPlane / (this.screenMiddleHeight - y);
            const realDistance = rowDistance / Math.cos((rayAngle - this.observer.player.rotateX) * RADIUS);

            const ceilX = this.observer.player.coordX + realDistance * Math.cos(rayAngle * RADIUS);
            const ceilY = this.observer.player.coordY + realDistance * Math.sin(rayAngle * RADIUS);

            const ceilXFloor = Math.floor(ceilX);
            const ceilYFloor = Math.floor(ceilY);

            const ceilTile = this.observer.map.getTileCeiling(ceilXFloor, ceilYFloor);
            let ceilTexture = this.textureManager.textures.get(ceilTile);

            if (!ceilTexture) {
                // TODO: Handle ceiling texture not found error when tile wall is null case
                continue;
            }

            const ceilTextureX = Math.floor(ceilX * 32) & 31;
            const ceilTextureY = Math.floor(ceilY * 32) & 31;

            if (Array.isArray(ceilTexture)) {
                ceilTexture = ceilTexture?.[Math.floor(this.animationFrameCounter) % (ceilTexture.length)];
            }

            const spriteKey = this.observer.map.getTileSprite(ceilXFloor, ceilYFloor);

            const bufferPosition = y * this.SCENE_WIDTH + bufferX;



            const brightness = this.#calculateBrightness(realDistance);
            const color = ceilTexture.getSliceBuffer(ceilTextureX, ceilTextureY, 1, 1, brightness);
            this.sceneBuffer[bufferPosition] = color[0];

            if (spriteKey) {
                this.#drawSpriteOnCeilOrFloor(bufferPosition, ceilTextureX, ceilTextureY, spriteKey, brightness); // Will be deleted in future because not necessary (ceil texture is already drawn)
            }
        }
    }

    #drawSpriteOnCeilOrFloor(bufferPosition, spriteX, spriteY, spriteKey, brightness) {
        let spriteTexture = this.textureManager.textures.get(spriteKey);

        if (Array.isArray(spriteTexture)) {
            spriteTexture = spriteTexture?.[Math.floor(this.animationFrameCounter) % (spriteTexture.length)];
        }

        if (spriteTexture) {
            const spriteColor = spriteTexture.getSliceBuffer(spriteX, spriteY, 1, 1, brightness);
            this.sceneBuffer[bufferPosition] |= spriteColor[0]; // For transparent background of sprite
        }
    }

    #calculateBrightness(realDistance) {
        if (realDistance >= this.observer.map.layout.length) {
            return 0.01;
        }
        return 1 - (realDistance / this.observer.map.layout.length);
    }

    #clearPixelMap() {
        this.sceneBuffer.fill(0x00000000);
    }

    render() {
        this.#clearPixelMap();

        const walls = this.observer.raysHittingPoints.map((ray, index) => {
            const wallSlices = [];
            let endYValueForBottomOfWall = 0; // For floor drawing
            let startY, castedBlockHeight, endY;

            const castedBlocksCount = ray.castedBlocks.length;

            for (let castedBlockIndex = 0; castedBlockIndex < castedBlocksCount; castedBlockIndex++) {
                const castedBlock = ray.castedBlocks[castedBlockIndex];
                const ratio = this.distanceFromPlayerToProjectionPlane / castedBlock.correctedRayDistance;
                const cellHeight = castedBlock.ceilHeight - castedBlock.floorHeight;
                startY = Math.floor((ratio) * (this.observer.player.playerHeight - castedBlock.ceilHeight) + this.screenMiddleHeight);
                castedBlockHeight = ratio * cellHeight;
                endY = startY + castedBlockHeight; // For floor drawing
                if (endYValueForBottomOfWall < endY) { // For floor drawing
                    endYValueForBottomOfWall = endY; // For floor drawing
                } // For floor drawing
                const slicer = castedBlock.side === 0 ? castedBlock.wallY : castedBlock.wallX;


                this.#drawWall(index, endY - startY, castedBlock.wall, slicer, startY, castedBlock.correctedRayDistance, castedBlock.ceilHeight, castedBlock.floorHeight);
                wallSlices.push({startY, endY});
            }

            //throw new Error('test');

            // startY is the last casted block's startY and castedBlockHeight is the last casted block's height so we can draw the floor from the last casted block's endY THATS OKEY NOW!!!!
            //this.#drawFloor({...ray, x: index, wallSlicesYValues}, { min: Math.floor(startY + castedBlockHeight), max: this.SCENE_HEIGHT });
            return {x: index, rayAngle: ray.rayAngle, wallSlices};
        });

        //throw new Error("Stop");

        //console.log(walls);

        for (const wall of walls) {
            //this.#drawCeil(wall, { min: 0, max: wall.startY });
            let nextWallSlice = wall.wallSlices[1];
            
            //console.log(wall.wallSlices);
            //console.log(nextWallSlice);
            const wallSlicesCount = wall.wallSlices.length;
            for (let wallSliceIndex = 0; wallSliceIndex < wallSlicesCount; wallSliceIndex++) {
                const wallSlice = wall.wallSlices[wallSliceIndex];
                if (nextWallSlice) {
                    //this.#drawFloor(wall.x, wall.rayAngle, { min: Math.floor(wallSlice.endY), max: Math.floor(nextWallSlice.startY) });
                } else {
                    //this.#drawFloor(wall.x, wall.rayAngle, { min: Math.floor(wallSlice.endY), max: this.SCENE_HEIGHT });
                }
                nextWallSlice = wall.wallSlices[wallSliceIndex + 1];
            }
            //throw new Error("Stop");

        }

        this._sceneCtx.putImageData(this.sceneFrame, 0, 0);
    }

}

export default Scene;
