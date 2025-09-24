import { RADIUS } from "./utils";
import CanvasManager from "./canvas";

class Scene {

    constructor() {

        this._sceneCanvas = CanvasManager.getInstance().getCanvas("scene");
        this._sceneCtx = CanvasManager.getInstance().getContext("scene");
        this._mapCtx = CanvasManager.getInstance().getContext("map");

        if (!this._sceneCtx) {
            throw new Error("Scene context not found! Make sure CanvasManager is initialized.");
        }

        this.SCENE_WIDTH = this._sceneCanvas.width;
        this.SCENE_HEIGHT = this._sceneCanvas.height;

        this.screenMiddleHeight = this.SCENE_HEIGHT / 2;

        this.WALL_HEIGHT = 1; // UNIT GRID SYSTEM

        this.player = null;
        this.map = null;
        this.numeratorForWallHeightCalculation = null;
        this.distanceFromPlayerToProjectionPlane = null;

        this.sceneFrame = this._sceneCtx.createImageData(this.SCENE_WIDTH, this.SCENE_HEIGHT);
        this.sceneBuffer = new Uint32Array(this.sceneFrame.data.buffer);

        this.textureManager = null;

        this.rayStep = 0; // Will be set in addPlayer
    }

    addPlayer(player) {
        this.player = player;
        this.#initializeProjectionValues();
        this.rayStep = this.player.fieldOfViewDeg / this._sceneCanvas.width;
    }

    addMap(map) {
        this.map = map;
    }

    addTextureManager(textureManager) {
        this.textureManager = textureManager;
    }

    update() {
        this.screenMiddleHeight = this.SCENE_HEIGHT / 2 + this.player.rotateY;
    }

    #initializeProjectionValues() {
        /*
                projected wall height                    actual wall height
        ----------------------------------------- = ---------------------------
        distance from player to projection plane    distance from player to wall    
        */
        this.distanceFromPlayerToProjectionPlane = (this.SCENE_WIDTH / 2) / Math.tan((this.player.fieldOfViewDeg / 2) * RADIUS);
        this.numeratorForWallHeightCalculation = this.WALL_HEIGHT * this.distanceFromPlayerToProjectionPlane;
    }

    #drawRay(ray) {
        this._mapCtx.strokeStyle = ray.side === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(200,200,200,0.2)';
        this._mapCtx.beginPath();
        this._mapCtx.moveTo(this.player.coordX * this.map.gridCellWidth, this.player.coordY * this.map.gridCellHeight);
        this._mapCtx.lineTo(ray.x * this.map.gridCellWidth, ray.y * this.map.gridCellHeight);
        this._mapCtx.stroke();
    }

    #drawWall(x, y, color, height, hitValue, slicer, startY, correctedRayDistance) {
        let endY = startY + height + this.player.playerHeight;

        startY = Math.max(-this.SCENE_HEIGHT * 5, startY);
        endY = Math.min(this.SCENE_HEIGHT * 5, endY);

        const textureX = Math.floor(slicer * 32);
        const brightness = this.#calculateBrightness(correctedRayDistance);
        const wallTexture = this.textureManager.textures.get(hitValue).getSliceBuffer(textureX % 32, 0, 1, 32, brightness);

        for (let y = startY, texY = 0; y < endY; y++, texY++) {
            const textureY = Math.floor(((texY / height) * 32));
            this.sceneBuffer[y * this.SCENE_WIDTH + x] = wallTexture[textureY];
        }
    }

    #drawFloor(bufferX, rayAngle, scanRange) {
        for (let y = scanRange.min; y < scanRange.max; y++) {
            const rowDistance = this.player.playerHeight * this.distanceFromPlayerToProjectionPlane / (y - this.screenMiddleHeight);
            const realDistance = rowDistance / Math.cos((rayAngle - this.player.rotateX) * RADIUS);

            const floorX = this.player.coordX + realDistance * Math.cos(rayAngle * RADIUS);
            const floorY = this.player.coordY + realDistance * Math.sin(rayAngle * RADIUS);

            const floorTile = this.map.getTileFloor(Math.floor(floorX), Math.floor(floorY));
            const floorTexture = this.textureManager.textures.get(floorTile);

            const textureX = Math.floor(floorX * 32) & 31;
            const textureY = Math.floor(floorY * 32) & 31;

            if (!floorTexture) {
                // TODO: Handle floor texture not found error when tile wall is null case
                continue;
            }

            const brightness = this.#calculateBrightness(realDistance);
            const color = floorTexture.getSliceBuffer(textureX, textureY, 1, 1, brightness);
            this.sceneBuffer[y * this.SCENE_WIDTH + bufferX] = color[0];
        }
    }

    #drawCeil(bufferX, rayAngle, scanRange) {
        for (let y = scanRange.min; y < scanRange.max; y++) {
            const rowDistance = (this.WALL_HEIGHT - this.player.playerHeight) * this.distanceFromPlayerToProjectionPlane / (this.screenMiddleHeight - y);
            const realDistance = rowDistance / Math.cos((rayAngle - this.player.rotateX) * RADIUS);

            const ceilX = this.player.coordX + realDistance * Math.cos(rayAngle * RADIUS);
            const ceilY = this.player.coordY + realDistance * Math.sin(rayAngle * RADIUS);

            const ceilTile = this.map.getTileCeiling(Math.floor(ceilX), Math.floor(ceilY));
            const ceilTexture = this.textureManager.textures.get(ceilTile);

            if (!ceilTexture) {
                // TODO: Handle ceiling texture not found error when tile wall is null case
                continue;
            }

            const textureX = Math.floor(ceilX * 32) & 31;
            const textureY = Math.floor(ceilY * 32) & 31;

            const brightness = this.#calculateBrightness(realDistance);
            const color = ceilTexture.getSliceBuffer(textureX, textureY, 1, 1, brightness);
            this.sceneBuffer[y * this.SCENE_WIDTH + bufferX] = color[0];
        }
    }
    
    #calculateBrightness(realDistance) {
        if (realDistance >= this.map.layout.length) {
            return 0.01;
        }
        return 1 - (realDistance / this.map.layout.length);
    }

    #clearPixelMap() {
        this.sceneBuffer.fill(0x33333333);
    }

    render() {
        this.#clearPixelMap();

        const firstRayAngle = this.player.rotateX - this.player.halfFieldOfViewDeg;

        for (let i = 0, bufferX = 0; i < this.player.fieldOfViewDeg; i += this.rayStep, bufferX++) {
            const rayAngle = firstRayAngle + i;


            const ray = this.#castSingleRay(rayAngle);

            this.#drawRay(ray);

            const angleDiff = rayAngle - this.player.rotateX;
            const correctedRayDistance = (ray.distance * Math.cos(angleDiff * RADIUS));
            const startY = Math.floor((this.distanceFromPlayerToProjectionPlane / correctedRayDistance) * (this.player.playerHeight - this.WALL_HEIGHT) + this.screenMiddleHeight);

            const height = this.numeratorForWallHeightCalculation / correctedRayDistance;
            const slicer = ray.side === 0 ? ray.y : ray.x;
            this.#drawCeil(bufferX, rayAngle, { min: 0, max: startY });
            this.#drawWall(bufferX, startY, 0xFF000000, height, ray.hitValue, slicer, startY, correctedRayDistance);
            this.#drawFloor(bufferX, rayAngle, { min: Math.floor(startY + height), max: this.SCENE_HEIGHT });
        }

        this._sceneCtx.putImageData(this.sceneFrame, 0, 0);
    }


    #castSingleRay(angle) {
        const rayDirX = Math.cos(angle * RADIUS);
        const rayDirY = Math.sin(angle * RADIUS);
        
        let mapX = Math.floor(this.player.coordX);
        let mapY = Math.floor(this.player.coordY);
        
        const deltaDistX = Math.abs(1 / rayDirX);
        const deltaDistY = Math.abs(1 / rayDirY);
        
        let stepX, stepY, sideDistX, sideDistY;
        
        if (rayDirX < 0) {
            stepX = -1;
            sideDistX = (this.player.coordX - mapX) * deltaDistX;
        } else {
            stepX = 1;
            sideDistX = (mapX + 1.0 - this.player.coordX) * deltaDistX;
        }
        
        if (rayDirY < 0) {
            stepY = -1;
            sideDistY = (this.player.coordY - mapY) * deltaDistY;
        } else {
            stepY = 1;
            sideDistY = (mapY + 1.0 - this.player.coordY) * deltaDistY;
        }
        
        let hit = false;
        let side; // X=0, Y=1
        let hitValue = 0;
        
        while (!hit) {
            if (sideDistX < sideDistY) {
                sideDistX += deltaDistX;
                mapX += stepX;
                side = 0;
            } else {
                sideDistY += deltaDistY;
                mapY += stepY;
                side = 1;
            }

            hitValue = this.#isRayCast(mapX, mapY);
            
            if (hitValue) {
                hit = true;
            }
        }
        
        let wallX, wallY, perpWallDist;
        
        if (side === 0) {
            const intersectX = mapX + (stepX < 0 ? 1 : 0);
            perpWallDist = (intersectX - this.player.coordX) / rayDirX;
            wallX = intersectX;
            wallY = this.player.coordY + perpWallDist * rayDirY;
        } else {
            const intersectY = mapY + (stepY < 0 ? 1 : 0);
            perpWallDist = (intersectY - this.player.coordY) / rayDirY;
            wallY = intersectY;
            wallX = this.player.coordX + perpWallDist * rayDirX;
        }
        
        return {
            x: wallX,
            y: wallY,
            distance: perpWallDist,
            hitValue: hitValue,
            angle: angle,
            side: side
        };
    }

    #isRayCast (pointX, pointY) {
        const position = this.map.getTile(pointX, pointY);
        
        // Outside of the map
        if (!(position instanceof Object)) {
            return 1;
        }

        else if (position.blocked) {
            return position.wall;
        }

        return 0;
    }

}

export default Scene;
