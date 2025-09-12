// PLAYER

import { RADIUS } from "./utils";
import CanvasManager from "./canvas";

class Player {
    movementKeys = {
        w: false,
        a: false,
        s: false,
        d: false,
        q: false,
        e: false,
        u: false,
        j: false
    };

    constructor (coordX, coordY) {

        this._mapCanvas = CanvasManager.getInstance().getCanvas("map");
        this._mapCtx = CanvasManager.getInstance().getContext("map");

        this.observer = null;
        this.coordX = coordX;
        this.coordY = coordY;
        this.rotate = 45;
        this.size = 10;
        this.speed = .05;
        this.playerHeight = .5;

        this.fieldOfViewDeg = 60;

        this.raysHittingPoints = [];

        this.mouseSensitivity = 1;
        this.lastMouseX = 0;

        this.mouseSmoothness = 0.5;
        this.targetRotation = this.rotate;

        addEventListener("keydown", (e) => {
            if (this.movementKeys.hasOwnProperty(e.key)) {
                this.movementKeys[e.key] = true;
            }
        });

        addEventListener("keyup", (e) => {
            if (this.movementKeys.hasOwnProperty(e.key)) {
                this.movementKeys[e.key] = false;
            }
        });

        /*
        document.addEventListener("mousemove", (e) => {
            const mouseDeltaX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
            this.targetRotation += (mouseDeltaX * this.mouseSensitivity) / 100;
        });
        */

        /*

        document.addEventListener("click", () => {
            document.body.requestPointerLock = document.body.requestPointerLock ||
                                             document.body.mozRequestPointerLock ||
                                             document.body.webkitRequestPointerLock;
            document.body.requestPointerLock();
        });
        */
    }

    update (deltaTime) {
        this.#move();
        // Smooth rotation
        // this.rotate += (this.targetRotation - this.rotate) * this.mouseSmoothness;
    }

    render () {
        this._mapCtx.beginPath();
        this._mapCtx.arc(this.observer.gridCellWidth * this.coordX, this.observer.gridCellHeight * this.coordY, this.size, 0, 2 * Math.PI);
        this._mapCtx.fill();

        // Direction line
        this._mapCtx.strokeStyle = "black";
        this._mapCtx.beginPath();
        this._mapCtx.moveTo(this.observer.gridCellWidth * this.coordX, this.observer.gridCellHeight * this.coordY);
        this._mapCtx.lineTo(this.observer.gridCellWidth * this.coordX + this.observer.gridCellWidth * Math.cos(this.rotate * RADIUS), this.observer.gridCellHeight * this.coordY + this.observer.gridCellHeight * Math.sin(this.rotate * RADIUS));
        this._mapCtx.stroke();
    }

    #blockedAreaControlForMovement(newLocation) {
        const coordXOnMap = Math.floor(newLocation.x);
        const coordYOnMap = Math.floor(newLocation.y);

        if (this.observer.getTile(coordXOnMap, coordYOnMap) === 0) {
            return true;
        }

        return false;
    }

    #move () {
        const cos = Math.cos(this.rotate * RADIUS);
        const sin = Math.sin(this.rotate * RADIUS);

        const minusCos = Math.cos(-this.rotate * RADIUS);
        const minusSin = Math.sin(-this.rotate * RADIUS);

        let newPosition;

        if (this.movementKeys.w) {
            newPosition = {x: this.coordX + this.speed * cos, y: this.coordY + this.speed * sin};
            if (this.#blockedAreaControlForMovement(newPosition)) {
                this.coordX = newPosition.x;
                this.coordY = newPosition.y;
            }
        }
        if (this.movementKeys.s){
            newPosition = {x: this.coordX - this.speed * cos, y: this.coordY - this.speed * sin};
            if (this.#blockedAreaControlForMovement(newPosition)) {
                this.coordX = newPosition.x;
                this.coordY = newPosition.y;
            }
        }
        if (this.movementKeys.a) {
            newPosition = {x: this.coordX - this.speed * minusSin, y: this.coordY - this.speed * minusCos};
            if (this.#blockedAreaControlForMovement(newPosition)) {
                this.coordX = newPosition.x;
                this.coordY = newPosition.y;
            }
        };
        if (this.movementKeys.d) {
            newPosition = {x: this.coordX + this.speed * minusSin, y: this.coordY + this.speed * minusCos};
            if (this.#blockedAreaControlForMovement(newPosition)) {
                this.coordX = newPosition.x;
                this.coordY = newPosition.y;
            }
        };

        if (this.movementKeys.u) {
            this.playerHeight += 0.01;
        }
        
        if (this.movementKeys.j) {
            this.playerHeight -= 0.01;
        }

        if (this.movementKeys.q) this.rotate -= 1;
        if (this.movementKeys.e) this.rotate += 1;

    }


    createFOV3D () {
        //
    }


    addObserver (observer) {
        this.observer = observer;
    }
};

export default Player;