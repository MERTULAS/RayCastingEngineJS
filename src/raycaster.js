import { RADIUS } from "./utils";

class RayCaster {
    constructor(player, map) {
        this.player = player;
        this.map = map;
    }

    update(deltaTime) {
        this.raysHittingPoints = this.#castRays();
    }

    render(ctx) {
        this.raysHittingPoints.forEach(ray => {
            ctx.strokeStyle = ray.side === 0 ? 'rgba(255,0,0,0.8)' : 'rgba(200,0,0,0.8)';
            
            ctx.beginPath();
            ctx.moveTo(
                this.player.coordX * this.map.gridCellWidth, 
                this.player.coordY * this.map.gridCellHeight
            );
            ctx.lineTo(
                ray.x * this.map.gridCellWidth, 
                ray.y * this.map.gridCellHeight
            );
            ctx.stroke();
        });
    }

    #castRays() {
        const rays = [];
        const FOV = this.player.fieldOfViewDeg;
        const rayCount = this.map.MAP_WIDTH;
        const rayStep = FOV / rayCount;

        const firstRayAngle = this.player.rotate - (FOV / 2);
        
        for(let i = 0; i < FOV; i += rayStep) {
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
            
            if (this.#isRayCast(mapX, mapY)) {
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
            angle: angle,
            side: side
        };
    }

    #isRayCast (pointX, pointY) {
        const position = this.map.getTile(pointX, pointY);
        if (position) {
            return position;
        }

        return 0;
    }
};

export default RayCaster;