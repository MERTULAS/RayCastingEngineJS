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
        this.defaultColor = 0xFFFFFFFF;

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

    #drawWall(bufferX, startY, endY, height, hitValueWall, slicer, correctedRayDistance, hitValueHeight, hitValueFloorHeight, originalWallStartY, originalWallHeight) {

        if (height < 0) {
            return;
        }


        const textureX = Math.floor(slicer * 32) % 32;
        const brightness = this.#calculateBrightness(correctedRayDistance);
        let wallTexture = this.textureManager.textures.get(hitValueWall);

        if (Array.isArray(wallTexture)) {
            wallTexture = wallTexture?.[Math.floor(this.animationFrameCounter) % (wallTexture.length)];
        }

        let wallHeightOnLayout = hitValueHeight - hitValueFloorHeight;
        const textureYRatio = wallHeightOnLayout / originalWallHeight;

        const clippedFromTop = startY - originalWallStartY;
        const textureYSliceStart = Math.floor((hitValueHeight >= 1 ? 0 : (1 - hitValueHeight)) * 32);
        const textureYStart = Math.max(0, clippedFromTop);


        for (let y = startY, texY = textureYStart; y < endY; y++, texY++) {
            const textureY = Math.floor(((texY * textureYRatio)) * 32) % 32;
            let color = wallTexture?.getPixelData(textureX, textureYSliceStart + textureY, brightness);
            if (!color) {
                color = this.defaultColor;
            }
            this.sceneBuffer[y * this.SCENE_WIDTH + bufferX] = color;
        }

    }

    #drawFloor(bufferX, rayAngle, perpDistanceCorrector, scanRange) {
        for (let y = scanRange.min; y < scanRange.max; y++) {

            // For testing
            if (this.sceneBuffer[y * this.SCENE_WIDTH + bufferX] !== 0x00000000) {
                continue;
            }


            if (this.screenMiddleHeight > y) {
                continue;
            }

            const rowDistance = this.player.playerHeight * this.distanceFromPlayerToProjectionPlane / (y - this.screenMiddleHeight);
            const realDistance = rowDistance / perpDistanceCorrector;

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
            const floorColor = floorTexture.getPixelData(floorTextureX, floorTextureY, brightness);

            this.sceneBuffer[bufferPosition] = floorColor;

            if (spriteKey) {
                this.#drawSpriteOnCeilOrFloor(bufferPosition, floorTextureX, floorTextureY, spriteKey, brightness); // Will be deleted in future because not necessary (floor texture is already drawn)
            }
        }
    }

    #drawHorizontalSurface(bufferX, rayAngle, perpDistanceCorrector, scanRange, surfaceHeight, textureKey) {
        const heightDiff = this.player.playerHeight - surfaceHeight;

        if (heightDiff === 0) {
            return;
        }

        let surfaceTexture = this.textureManager.textures.get(textureKey);

        if (Array.isArray(surfaceTexture)) {
            surfaceTexture = surfaceTexture?.[Math.floor(this.animationFrameCounter) % (surfaceTexture.length)];
        }

        if (!surfaceTexture) {
            return;
        }

        const rayCos = Math.cos(rayAngle * RADIUS);
        const raySin = Math.sin(rayAngle * RADIUS);

        for (let y = scanRange.min; y < scanRange.max; y++) {
            const rowOffset = y - this.screenMiddleHeight;

            // A surface below eye level can only project under the horizon, one above it only over the horizon
            if (heightDiff > 0 ? rowOffset <= 0 : rowOffset >= 0) {
                continue;
            }

            const rowDistance = heightDiff * this.distanceFromPlayerToProjectionPlane / rowOffset;
            const realDistance = rowDistance / perpDistanceCorrector;

            const surfaceX = this.player.coordX + realDistance * rayCos;
            const surfaceY = this.player.coordY + realDistance * raySin;

            const brightness = this.#calculateBrightness(realDistance);
            const surfaceColor = surfaceTexture.getPixelData(Math.floor(surfaceX * 32) & 31, Math.floor(surfaceY * 32) & 31, brightness);

            this.sceneBuffer[y * this.SCENE_WIDTH + bufferX] = surfaceColor;
        }
    }

    #drawClippedSurface(bufferX, rayAngle, perpDistanceCorrector, clipAreas, bandTopY, bandBottomY, surfaceHeight, textureKey) {
        // Without a texture nothing gets painted, so the band must not consume the clip area either
        if (bandTopY >= bandBottomY || !this.textureManager.textures.has(textureKey)) {
            return clipAreas;
        }

        const { newAvailableClipAreas, newIntervalsForCastedTile } = clipIntervalCalculation(clipAreas, { startY: bandTopY, endY: bandBottomY });

        for (const interval of newIntervalsForCastedTile) {
            this.#drawHorizontalSurface(bufferX, rayAngle, perpDistanceCorrector, { min: Math.floor(interval[0]), max: Math.floor(interval[1]) }, surfaceHeight, textureKey);
        }

        return newAvailableClipAreas;
    }

    #drawCeil(bufferX, rayAngle, perpDistanceCorrector, scanRange) {
        for (let y = scanRange.min; y < scanRange.max; y++) {

            // For testing
            if (this.sceneBuffer[y * this.SCENE_WIDTH + bufferX] !== 0x00000000) {
                continue;
            }

            if (y >= this.screenMiddleHeight) {
                continue;
            }

            const rowDistance = (this.WALL_HEIGHT - this.player.playerHeight) * this.distanceFromPlayerToProjectionPlane / (this.screenMiddleHeight - y);
            const realDistance = rowDistance / perpDistanceCorrector;

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
            const color = ceilTexture.getPixelData(ceilTextureX, ceilTextureY, brightness);
            this.sceneBuffer[bufferPosition] = color;

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
            const spriteColor = spriteTexture.getPixelData(spriteX, spriteY, brightness);
            this.sceneBuffer[bufferPosition] |= spriteColor; // For transparent background of sprite
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

            const castedBlocksCount = ray.castedBlocks.length;

            let currentAvailableClipAreas = [[0, this.SCENE_HEIGHT]];

            for (let castedBlockIndex = 0; castedBlockIndex < castedBlocksCount; castedBlockIndex++) {
                const castedBlock = ray.castedBlocks[castedBlockIndex];
                const slicer = castedBlock.side === 0 ? castedBlock.wallY : castedBlock.wallX;
                const ratio = this.distanceFromPlayerToProjectionPlane / castedBlock.correctedRayDistance;
                const cellHeight = castedBlock.ceilHeight - castedBlock.floorHeight;
                const startY = Math.floor((ratio) * (this.player.playerHeight - castedBlock.ceilHeight) + this.screenMiddleHeight);
                const castedBlockHeight = ratio * cellHeight;
                const endY = startY + castedBlockHeight;

                const { newAvailableClipAreas, newIntervalsForCastedTile } = clipIntervalCalculation(currentAvailableClipAreas, { startY, endY });
                currentAvailableClipAreas = newAvailableClipAreas;

                for (const interval of newIntervalsForCastedTile) {
                    this.#drawWall(bufferX, Math.floor(interval[0]), Math.floor(interval[1]), castedBlockHeight, castedBlock.wall, slicer, castedBlock.correctedRayDistance, castedBlock.ceilHeight, castedBlock.floorHeight, startY, castedBlockHeight);
                }

                const oppositeRatio = this.distanceFromPlayerToProjectionPlane / castedBlock.correctedRayDistanceOpposite;

                if (castedBlock.ceilHeight < this.player.playerHeight) {
                    const roofFarY = Math.floor((oppositeRatio) * (this.player.playerHeight - castedBlock.ceilHeight) + this.screenMiddleHeight);

                    currentAvailableClipAreas = this.#drawClippedSurface(bufferX, rayAngle, ray.perpDistanceCorrector, currentAvailableClipAreas, roofFarY, startY, castedBlock.ceilHeight, castedBlock.floor);
                }

                if (castedBlock.floorHeight > this.player.playerHeight) {
                    const undersideNearY = Math.floor((ratio) * (this.player.playerHeight - castedBlock.floorHeight) + this.screenMiddleHeight);
                    const undersideFarY = Math.floor((oppositeRatio) * (this.player.playerHeight - castedBlock.floorHeight) + this.screenMiddleHeight);

                    currentAvailableClipAreas = this.#drawClippedSurface(bufferX, rayAngle, ray.perpDistanceCorrector, currentAvailableClipAreas, undersideNearY, undersideFarY, castedBlock.floorHeight, castedBlock.ceil);
                }

                if (currentAvailableClipAreas.length === 0) {
                    break;
                }
            }

            const horizonY = Math.floor(this.screenMiddleHeight);

            for (const clipArea of currentAvailableClipAreas) {
                const areaTop = Math.max(0, Math.floor(clipArea[0]));
                const areaBottom = Math.min(this.SCENE_HEIGHT, Math.floor(clipArea[1]));

                if (areaTop >= areaBottom) {
                    continue;
                }

                if (areaTop < horizonY) {
                    //this.#drawCeil(bufferX, rayAngle, ray.perpDistanceCorrector, { min: areaTop, max: Math.min(areaBottom, horizonY) });
                }

                if (areaBottom > horizonY) {
                    this.#drawFloor(bufferX, rayAngle, ray.perpDistanceCorrector, { min: Math.max(areaTop, horizonY), max: areaBottom });
                }
            }
        }

        this._sceneCtx.putImageData(this.sceneFrame, 0, 0);
    }


    #surfaceDistanceFromEye(ceilHeight, floorHeight) {
        if (floorHeight > this.player.playerHeight) {
            return floorHeight - this.player.playerHeight;
        }

        if (ceilHeight < this.player.playerHeight) {
            return this.player.playerHeight - ceilHeight;
        }

        return 0;
    }

    #expandTileToBlocks(tile, mapX, mapY, side, entryDist, exitDist) {
        if (!tile.slices) {
            return [{ ...tile, mapX, mapY, side, entryDist, exitDist }];
        }

        // Slabs nearer to eye level occlude the surfaces of the further ones, so they have to be drawn first
        return tile.slices
            .map(slice => ({ ...tile, mapX, mapY, side, entryDist, exitDist, ceilHeight: slice.zMax, floorHeight: slice.zMin }))
            .sort((a, b) => this.#surfaceDistanceFromEye(a.ceilHeight, a.floorHeight) - this.#surfaceDistanceFromEye(b.ceilHeight, b.floorHeight));
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
        let lastPushedBlocks = [];

        let maxAvailableClipArea = 2;
        let minAvailableClipArea = 0;
        let currentAvailableClipAreas = [[maxAvailableClipArea, minAvailableClipArea]]; // [[ceilHeight, floorHeight]] => [2, 0] is default value for vertical visible area in the game maybe can be changed in the future idk...
        // TODO: Read the all layout and get max/min values for ceilHeight and floorHeight.

        while (mapTraverse) {

            if (currentAvailableClipAreas.length === 0) {
                break;
            }

            let entryDist;

            if (sideDistX < sideDistY) {
                entryDist = sideDistX;
                sideDistX += deltaDistX;
                mapX += stepX;
                side = 0;
            } else {
                entryDist = sideDistY;
                sideDistY += deltaDistY;
                mapY += stepY;
                side = 1;
            }

            const exitDist = sideDistX < sideDistY ? sideDistX : sideDistY;

            mapTraverse = this.#isRayCanTraverse(mapX, mapY);

            if (!mapTraverse) {
                hitValue = this.#getHittedLimit(mapX, mapY);

                /*

                if (currentAvailableClipAreas.length > 0) {
                    const calculatedClipInterval = clipIntervalCalculation(currentAvailableClipAreas, hitValue, this.player.playerHeight);
                    currentAvailableClipAreas = calculatedClipInterval.newAvailableClipAreas;

                    for (const interval of calculatedClipInterval.newIntervalsForCastedTile) {
                        castedBlocks.push({ ...hitValue, mapX, mapY, side, ceilHeight: interval[0], floorHeight: interval[1] });
                    }
                }
                */
                castedBlocks.push(...this.#expandTileToBlocks(hitValue, mapX, mapY, side, entryDist, exitDist));


            } else {
                castedTile = this.#castedTile(mapX, mapY);

                if (castedTile.blocked) {
                    //const calculatedClipInterval = clipIntervalCalculation(currentAvailableClipAreas, castedTile, this.player.playerHeight);
                    //currentAvailableClipAreas = calculatedClipInterval.newAvailableClipAreas;

                    /*
                    for (const interval of calculatedClipInterval.newIntervalsForCastedTile) {
                        castedBlocks.push({ ...castedTile, mapX, mapY, side, ceilHeight: interval[0], floorHeight: interval[1] });
                    }

                    */


                    const continuesPreviousBlock = previousTile?.blocked
                        && !previousTile.slices
                        && !castedTile.slices
                        && previousTile.ceilHeight === castedTile.ceilHeight
                        && previousTile.floorHeight === castedTile.floorHeight;

                    if (continuesPreviousBlock) {
                        // Same block continues on the next tile, so its far side moves one tile further
                        for (const pushedBlock of lastPushedBlocks) {
                            pushedBlock.exitDist = exitDist;
                        }
                    } else {
                        lastPushedBlocks = this.#expandTileToBlocks(castedTile, mapX, mapY, side, entryDist, exitDist);
                        castedBlocks.push(...lastPushedBlocks);
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

        const perpDistanceCorrector = Math.cos((angle - this.player.rotateX) * RADIUS);

        for (const castedBlock of castedBlocks) {
            castedBlock.wallX = this.player.coordX + castedBlock.entryDist * rayDirX;
            castedBlock.wallY = this.player.coordY + castedBlock.entryDist * rayDirY;
            castedBlock.correctedRayDistance = castedBlock.entryDist * perpDistanceCorrector;
            castedBlock.correctedRayDistanceOpposite = castedBlock.exitDist * perpDistanceCorrector;
        }

        return {
            perpDistanceCorrector,
            rayAngle: angle,
            castedBlocks
        };
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
        // Border tiles are ordinary blocked tiles, so the ray keeps marching until it leaves the map.
        // Stopping on them would cut a block off at the first tile boundary instead of at the map edge.
        return this.map.getTile(mapX, mapY) instanceof Object;
    }

}

export default Scene;
