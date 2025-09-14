import { RADIUS } from "./utils";
import CanvasManager from "./canvas";

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
        
        for(let i = 0; i < this.raysHittingPoints.length; i++) {
            const ray = this.raysHittingPoints[i];
            this._mapCtx.strokeStyle = ray.side === 0 ? 'rgba(255,255,255,0.2)' : 'rgba(200,200,200,0.2)';
            this._mapCtx.beginPath();
            this._mapCtx.moveTo(this.player.coordX * this.map.gridCellWidth, this.player.coordY * this.map.gridCellHeight);
            this._mapCtx.lineTo(ray.x * this.map.gridCellWidth, ray.y * this.map.gridCellHeight);
            this._mapCtx.stroke();
        }
    }

    #castRays() {
        const rays = [];

        const firstRayAngle = this.player.rotate - (this.player.fieldOfViewDeg / 2);
        
        for(let i = 0; i < this.player.fieldOfViewDeg; i += this.rayStep) {
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
        
        let wallX, wallY;
        
        if (side === 0) {
            const intersectX = mapX + (stepX < 0 ? 1 : 0);
            const perpWallDist = (intersectX - this.player.coordX) / rayDirX;
            wallX = intersectX;
            wallY = this.player.coordY + perpWallDist * rayDirY;
        } else {
            const intersectY = mapY + (stepY < 0 ? 1 : 0);
            const perpWallDist = (intersectY - this.player.coordY) / rayDirY;
            wallY = intersectY;
            wallX = this.player.coordX + perpWallDist * rayDirX;
        }
        
        return {
            x: wallX,
            y: wallY,
            distance: Math.sqrt(
                Math.pow(wallX - this.player.coordX, 2) + 
                Math.pow(wallY - this.player.coordY, 2)
            ),
            hitValue: hitValue,
            angle: angle,
            side: side
        };
    }

    #isRayCast (pointX, pointY) {
        const position = this.map.getTile(pointX, pointY);
        if (position && position !== 5) {
            return position;
        }

        return 0;
    }
};

export default RayCaster;