import { RADIUS } from "./utils";
import CanvasManager from "./canvas";
import { clipIntervalCalculation } from "./utils";

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
        this.defaultColor = 0xFF000000;

        this.sceneFrame = this._sceneCtx.createImageData(this.SCENE_WIDTH, this.SCENE_HEIGHT);
        this.sceneBuffer = new Uint32Array(this.sceneFrame.data.buffer);

        this.textureManager = null;

        this.rayStep = 0; // Will be set in addPlayer

        this.animationFrameCounter = 0;
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
        this.distanceFromPlayerToProjectionPlane = (this.SCENE_WIDTH / 2) / Math.tan((this.player.fieldOfViewDeg / 2) * RADIUS);
        this.numeratorForWallHeightCalculation = this.WALL_HEIGHT * this.distanceFromPlayerToProjectionPlane;
    }

    #drawRay(ray) {
        this._mapCtx.strokeStyle = ray.side === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(200,200,200,0.2)';
        this._mapCtx.beginPath();
        this._mapCtx.moveTo(this.player.coordX * this.map.gridCellWidth, this.player.coordY * this.map.gridCellHeight);
        this._mapCtx.lineTo(ray.wallX * this.map.gridCellWidth, ray.wallY * this.map.gridCellHeight);
        this._mapCtx.stroke();
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
            
            const rowDistance = this.player.playerHeight * this.distanceFromPlayerToProjectionPlane / (y - this.screenMiddleHeight);
            const realDistance = rowDistance / Math.cos((rayAngle - this.player.rotateX) * RADIUS);

            const floorX = this.player.coordX + realDistance * Math.cos(rayAngle * RADIUS);
            const floorY = this.player.coordY + realDistance * Math.sin(rayAngle * RADIUS);
            const floorXFloor = Math.floor(floorX);
            const floorYFloor = Math.floor(floorY);

            const floorTile = this.map.getTileFloor(floorXFloor, floorYFloor);
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
            const spriteKey = this.map.getTileSprite(floorXFloor, floorYFloor);

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

            const rowDistance = (this.WALL_HEIGHT - this.player.playerHeight) * this.distanceFromPlayerToProjectionPlane / (this.screenMiddleHeight - y);
            const realDistance = rowDistance / Math.cos((rayAngle - this.player.rotateX) * RADIUS);

            const ceilX = this.player.coordX + realDistance * Math.cos(rayAngle * RADIUS);
            const ceilY = this.player.coordY + realDistance * Math.sin(rayAngle * RADIUS);

            const ceilXFloor = Math.floor(ceilX);
            const ceilYFloor = Math.floor(ceilY);

            const ceilTile = this.map.getTileCeiling(ceilXFloor, ceilYFloor);
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

            const spriteKey = this.map.getTileSprite(ceilXFloor, ceilYFloor);

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
        if (realDistance >= this.map.layout.length) {
            return 0.01;
        }
        return 1 - (realDistance / this.map.layout.length);
    }

    #clearPixelMap() {
        this.sceneBuffer.fill(0x00000000);
    }

    render() {
        this.#clearPixelMap();

        const firstRayAngle = this.player.rotateX - this.player.halfFieldOfViewDeg;

        for (let i = 0, bufferX = 0; i < this.player.fieldOfViewDeg; i += this.rayStep, bufferX++) {
            const rayAngle = firstRayAngle + i;


            const ray = this.#castSingleRay(rayAngle);

            this.#drawRay(ray.castedBlocks[0]);

            let endYValueForBottomOfWall = 0; // For floor drawing
            let startY, castedBlockHeight, endY;

            const castedBlocksCount = ray.castedBlocks.length;

            for (let castedBlockIndex = 0; castedBlockIndex < castedBlocksCount; castedBlockIndex++) {
                const castedBlock = ray.castedBlocks[castedBlockIndex];
                const ratio = this.distanceFromPlayerToProjectionPlane / castedBlock.correctedRayDistance;
                const cellHeight = castedBlock.ceilHeight - castedBlock.floorHeight;
                startY = Math.floor((ratio) * (this.player.playerHeight - castedBlock.ceilHeight) + this.screenMiddleHeight);
                castedBlockHeight = ratio * cellHeight;
                endY = startY + castedBlockHeight; // For floor drawing
                if (endYValueForBottomOfWall < endY) { // For floor drawing
                    endYValueForBottomOfWall = endY; // For floor drawing
                } // For floor drawing
                const slicer = castedBlock.side === 0 ? castedBlock.wallY : castedBlock.wallX;


                this.#drawWall(bufferX, endY - startY, castedBlock.wall, slicer, startY, castedBlock.correctedRayDistance, castedBlock.ceilHeight, castedBlock.floorHeight);
                //wallSlices.push({startY, endY});
            }


            


            
            
            

            
            
            //this.#drawCeil(bufferX, rayAngle, { min: 0, max: startY });
            //this.#drawWall(bufferX, startY, 0xFF000000, height, ray.hitValue, slicer, startY, correctedRayDistance);
            //this.#drawFloor(bufferX, rayAngle, { min: Math.floor(startY + height), max: this.SCENE_HEIGHT });
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
        let hitValue = { wall: 1, ceilHeight: 1, floorHeight: 0 };

        let mapTraverse = true;

        const castedBlocks = [];
        let castedTile;

        let previousTile = null;

        let maxAvailableClipArea = 2;
        let minAvailableClipArea = 0;
        let currentAvailableClipAreas = [[maxAvailableClipArea, minAvailableClipArea]]; // [[ceilHeight, floorHeight]] => [2, 0] is default value for vertical visible area in the game maybe can be changed in the future idk...
        // TODO: Read the all layout and get max/min values for ceilHeight and floorHeight.

        while (mapTraverse) {

            if (currentAvailableClipAreas.length === 0) {
                break;
            }
            
            if (sideDistX < sideDistY) {
                sideDistX += deltaDistX;
                mapX += stepX;
                side = 0;
            } else {
                sideDistY += deltaDistY;
                mapY += stepY;
                side = 1;
            }

            mapTraverse = this.#isRayCanTraverse(mapX, mapY);

            if (!mapTraverse) {
                hitValue = this.#getHittedLimit(mapX, mapY);

                if (currentAvailableClipAreas.length > 0) {
                    const calculatedClipInterval = clipIntervalCalculation(currentAvailableClipAreas, hitValue, this.player.playerHeight);
                    currentAvailableClipAreas = calculatedClipInterval.newAvailableClipAreas;

                    for (const interval of calculatedClipInterval.newIntervalsForCastedTile) {
                        castedBlocks.push({ ...hitValue, mapX, mapY, side, ceilHeight: interval[0], floorHeight: interval[1] });
                    }
                }
            } else {
                castedTile = this.#castedTile(mapX, mapY);

                if (castedTile.blocked) {
                    const calculatedClipInterval = clipIntervalCalculation(currentAvailableClipAreas, castedTile, this.player.playerHeight);
                    currentAvailableClipAreas = calculatedClipInterval.newAvailableClipAreas;

                    for (const interval of calculatedClipInterval.newIntervalsForCastedTile) {
                        castedBlocks.push({ ...castedTile, mapX, mapY, side, ceilHeight: interval[0], floorHeight: interval[1] });
                    }

                    /*
                    let intervals = null;

                    if (previousTile) {
                        intervals = clipIntervalCalculation(currentAvailableClipAreas, castedTile, this.player.playerHeight);
                    } 
                    
                    if (!previousTile?.blocked || (previousTile?.floorHeight !== 0 && previousTile?.ceilHeight !== 1)) {
                        castedBlocks.push({...castedTile, mapX, mapY, side}); 
                    }
                    */

                }

                previousTile = castedTile;
            }


        }

        //console.log(castedBlocks);

        //throw new Error('test');

        let wallX, wallY;

        for (const castedBlock of castedBlocks) {
            if (castedBlock.side === 0) {
                const intersectX = castedBlock.mapX + (stepX < 0 ? 1 : 0);
                const perpWallDist = (intersectX - this.player.coordX) / rayDirX;
                wallX = intersectX;
                wallY = this.player.coordY + perpWallDist * rayDirY;
            } else {
                const intersectY = castedBlock.mapY + (stepY < 0 ? 1 : 0);
                const perpWallDist = (intersectY - this.player.coordY) / rayDirY;
                wallY = intersectY;
                wallX = this.player.coordX + perpWallDist * rayDirX;
            }

            const angleDiff = angle - this.player.rotateX;
            const distance = Math.sqrt(
                Math.pow(wallX - this.player.coordX, 2) +
                Math.pow(wallY - this.player.coordY, 2)
            );

            castedBlock.correctedRayDistance = (distance * Math.cos(angleDiff * RADIUS));
            castedBlock.wallX = wallX;
            castedBlock.wallY = wallY;
        }

        return {
            rayAngle: angle,
            castedBlocks
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

    #castedTile(pointX, pointY) {
        return this.map.getTile(pointX, pointY);

        /*
        // Outside of the map
        if (!(position instanceof Object)) {
            return {wall: 1, ceilHeight: 1, floorHeight: 0};
        }
        */
    }

    #getHittedLimit(mapX, mapY) {
        const position = this.map.getTile(mapX, mapY);

        if (!(position instanceof Object)) {
            return { wall: 1, ceilHeight: 1, floorHeight: 0 };
        }

        return position;
    }

    #isRayCanTraverse(mapX, mapY) {
        const position = this.map.getTile(mapX, mapY);

        if (mapX === 0 || mapY === 0 || mapX === this.map.layout.length - 1 || mapY === this.map.layout[0].length - 1) {
            if (position.wall !== null) {
                return false;
            }
        }

        if (!(position instanceof Object)) {
            return false;
        }

        return true;
    }

}

export default Scene;
