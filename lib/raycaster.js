import { RADIUS } from "./utils";
import CanvasManager from "./canvas";
import { clipIntervalCalculation } from "./utils";

class RayCaster {
    constructor(player, map) {
        this._mapCtx = CanvasManager.getInstance().getContext("map");
        this._sceneCanvas = CanvasManager.getInstance().getCanvas("scene");

        this.player = player;
        this.map = map;

        const rayCount = this._sceneCanvas.width;

        this.rayStep = this.player.fieldOfViewDeg / rayCount;
    }

    update(deltaTime) {
        this.raysHittingPoints = this.#castRays();
    }

    render() {
        for (let i = 0; i < this.raysHittingPoints.length; i++) {
            const ray = this.raysHittingPoints[i].castedBlocks[0];
            this._mapCtx.strokeStyle = ray.side === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(200,200,200,0.2)';
            this._mapCtx.beginPath();
            this._mapCtx.moveTo(this.player.coordX * this.map.gridCellWidth, this.player.coordY * this.map.gridCellHeight);
            this._mapCtx.lineTo(ray.wallX * this.map.gridCellWidth, ray.wallY * this.map.gridCellHeight);
            this._mapCtx.stroke();
        }
    }

    #castRays() {
        const rays = [];

        const firstRayAngle = this.player.rotateX - (this.player.fieldOfViewDeg / 2);

        for (let i = 0; i < this.player.fieldOfViewDeg; i += this.rayStep) {
            const rayAngle = firstRayAngle + i;
            rays.push(this.#castSingleRay(rayAngle));
        }

        return rays;
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

    #isSpriteHit(mapX, mapY) {
        return this.map.getTileSprite(mapX, mapY);
    }

    #calculateNewAvailableClipArea(previousAvailableClipArea, castedTileClipArea) {
        //
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
};

export default RayCaster;