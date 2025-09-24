// PLAYER

import { RADIUS } from "./utils";
import CanvasManager from "./canvas";
import { CEIL_HEIGHT } from "./constants";

class Player {
    movementKeys = {
        w: false,
        a: false,
        s: false,
        d: false,
        q: false,
        e: false,
        u: false,
        j: false,
        " ": false,
        Control: false,
        Shift: false,
    };

    constructor(coordX, coordY) {
        this._mapCtx = CanvasManager.getInstance().getContext("map");

        this.observer = null;
        this.coordX = coordX;
        this.coordY = coordY;
        this.rotateX = 110;
        this.rotateY = 0;
        this.size = 5; // Maybe should be static for every player in the future
        this.speed = .05;
        this.playerHeight = .4; // UNIT GRID SYSTEM

        this.fieldOfViewDeg = 60;
        this.halfFieldOfViewDeg = this.fieldOfViewDeg / 2;

        this.raysHittingPoints = [];

        this.mouseSensitivity = 0.5;
        this.lastMouseX = 0;

        this.mouseSmoothness = 0.5;
        this.targetRotation = this.rotateX;

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

        document.addEventListener("mousemove", (e) => {
            if (document.pointerLockElement) {
                const mouseDeltaX = e.movementX || e.mozMovementX || e.webkitMovementX || 0;
                const mouseDeltaY = e.movementY || e.mozMovementY || e.webkitMovementY || 0;

                this.targetRotation += (mouseDeltaX * this.mouseSensitivity) / 10;

                this.rotateY -= (mouseDeltaY * this.mouseSensitivity);

                if (this.rotateY > 300) {
                    this.rotateY = 300;
                }
                if (this.rotateY < -300) {
                    this.rotateY = -300;
                }
            }
        });

        document.addEventListener("click", (e) => {
            if (e.target.tagName === 'CANVAS' || e.target === document.body) {
                document.body.requestPointerLock = document.body.requestPointerLock ||
                    document.body.mozRequestPointerLock ||
                    document.body.webkitRequestPointerLock;
                document.body.requestPointerLock();
            }
        });

    }

    update(deltaTime) {
        this.#move();
        this.rotateX += (this.targetRotation - this.rotateX) * this.mouseSmoothness;
    }

    render() {
        this._mapCtx.fillStyle = "red";
        this._mapCtx.beginPath();
        this._mapCtx.arc(this.observer.gridCellWidth * this.coordX, this.observer.gridCellHeight * this.coordY, this.size, 0, 2 * Math.PI);
        this._mapCtx.fill();

        // Direction line
        this._mapCtx.strokeStyle = "black";
        this._mapCtx.beginPath();
        this._mapCtx.moveTo(this.observer.gridCellWidth * this.coordX, this.observer.gridCellHeight * this.coordY);
        this._mapCtx.lineTo(this.observer.gridCellWidth * this.coordX + this.observer.gridCellWidth * Math.cos(this.rotateX * RADIUS), this.observer.gridCellHeight * this.coordY + this.observer.gridCellHeight * Math.sin(this.rotateX * RADIUS));
        this._mapCtx.stroke();
    }

    #isBlockedAreaForMovement(newLocation) {
        const coordXOnMap = Math.floor(newLocation.x);
        const coordYOnMap = Math.floor(newLocation.y);

        if (this.observer.isBlockedArea(coordXOnMap, coordYOnMap)) {
            return true;
        }

        return false;
    }

    #move() {

        const currentTileCeilHeight = this.getCurrentTileCeilHeight();
        console.log(currentTileCeilHeight);



        const cos = Math.cos(this.rotateX * RADIUS);
        const sin = Math.sin(this.rotateX * RADIUS);

        const minusCos = Math.cos(-this.rotateX * RADIUS);
        const minusSin = Math.sin(-this.rotateX * RADIUS);

        let newPosition;

        if (this.movementKeys.w) {
            newPosition = { x: this.coordX +  this.speed * cos, y: this.coordY + this.speed * sin };
            if (!this.#isBlockedAreaForMovement(newPosition)) {
                this.coordX = newPosition.x;
                this.coordY = newPosition.y;
            }
        }
        if (this.movementKeys.s) {
            newPosition = { x: this.coordX - this.speed * cos, y: this.coordY - this.speed * sin };
            if (!this.#isBlockedAreaForMovement(newPosition)) {
                this.coordX = newPosition.x;
                this.coordY = newPosition.y;
            }
        }
        if (this.movementKeys.a) {
            newPosition = { x: this.coordX - this.speed * minusSin, y: this.coordY - this.speed * minusCos };
            if (!this.#isBlockedAreaForMovement(newPosition)) {
                this.coordX = newPosition.x;
                this.coordY = newPosition.y;
            }
        };
        if (this.movementKeys.d) {
            newPosition = { x: this.coordX + this.speed * minusSin, y: this.coordY + this.speed * minusCos };
            if (!this.#isBlockedAreaForMovement(newPosition)) {
                this.coordX = newPosition.x;
                this.coordY = newPosition.y;
            }
        };

        if (this.movementKeys.u) {
            if (this.rotateY < 300) {
                this.rotateY += 10;
            }
        }

        if (this.movementKeys.j) {
            if (this.rotateY > -300) {
                this.rotateY -= 10;
            }
        }

        if (this.movementKeys.Control) {
            if (this.playerHeight > -.2) {
                this.playerHeight -= .1;
            }
        }

        if (this.movementKeys[" "]) {
            if (this.playerHeight < CEIL_HEIGHT - 0.2) {
                this.playerHeight += .1;
            }
        }

        if (this.movementKeys.Shift) {
            this.speed = .1;
        } else {
            this.speed = .05;
        }

        if (this.movementKeys.q) this.rotateX -= 1;
        if (this.movementKeys.e) this.rotateX += 1;

    }


    createFOV3D() {
        //
    }

    getCurrentTileCeilHeight() {
        return this.observer.getTileCeilHeight(Math.floor(this.coordX), Math.floor(this.coordY)) ?? 0.5;
    }

    addObserver(observer) {
        this.observer = observer;
        //this.playerHeight += this.getCurrentTileCeilHeight();
    }
};

export default Player;