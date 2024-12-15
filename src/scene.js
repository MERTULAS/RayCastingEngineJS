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


    }

    addObserver(observer) {
        this.observer = observer;
        this.#initializeProjectionValues();
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

    render(ctx) {
        this.observer.raysHittingPoints.forEach((ray, index) => {
            const angleDiff = ray.angle - this.observer.player.rotate;
            const correctedRayDistance = (ray.distance * Math.cos(angleDiff * RADIUS));
            const projectedWallHeight = this.numeratorForWallHeightCalculation / correctedRayDistance;

            ctx.beginPath();
            ctx.moveTo(index, (this.SCENE_HEIGHT - projectedWallHeight) / 2);
            ctx.lineTo(index, (this.SCENE_HEIGHT + projectedWallHeight) / 2);
            ctx.stroke();
        });

    }



}

export default Scene;