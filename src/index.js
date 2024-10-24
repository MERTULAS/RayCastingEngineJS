/*
    Author H.Mert ULAS <h.mert.ulas@gmail.com>

    3D RayCasting demo on JavaScript

*/


// MAP
const mapCanvas = document.getElementById("map");
const mapCanvasBoundingRect = mapCanvas.getBoundingClientRect();
const MAP_WIDTH = mapCanvasBoundingRect.width;
const MAP_HEIGHT = mapCanvasBoundingRect.width;

mapCanvas.width = MAP_WIDTH;
mapCanvas.height = MAP_HEIGHT;

const mapCtx = mapCanvas.getContext("2d");

// SCENE
const sceneCanvas = document.getElementById("rendered-scene");
const sceneCanvasBoundingRect = sceneCanvas.getBoundingClientRect();
const SCENE_WIDTH = sceneCanvasBoundingRect.width;
const SCENE_HEIGHT = sceneCanvasBoundingRect.width;
const WALL_MAX_HEIGHT = 300;

sceneCanvas.width = SCENE_WIDTH;
sceneCanvas.height = SCENE_WIDTH;

const toRADIAN = Math.PI / 180;

const MOUSE_X_MOVE_QUEUE = [SCENE_WIDTH >> 1];
const MOUSE_Y_MOVE_QUEUE = [SCENE_HEIGHT >> 1];

const sceneCtx = sceneCanvas.getContext("2d");


let mouse = {
    x: null,
    y: null
}

let playerMove = {
    "LEFT_ROTATION": false,
    "RIGHT_ROTATION": false,
    "LEFT": false,
    "RIGHT": false,
    "FORWARD": false,
    "BACKWARD": false
}

let layout =   [[2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2],
                [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
                [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
                [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
                [2, 0, 0, 3, 1, 3, 3, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2],
                [2, 0, 0, 3, 0, 0, 3, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2],
                [1, 0, 3, 3, 0, 0, 3, 0, 0, 0, 2, 2, 2, 2, 2, 0, 0, 0, 0, 2],
                [2, 0, 0, 0, 0, 3, 3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 8, 0, 0, 0, 0, 0, 0, 2],
                [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 2],
                [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 8, 8, 0, 0, 0, 0, 0, 0, 2],
                [2, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 2],
                [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 2],
                [2, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 2],
                [1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [2, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
                [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
                [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 2],
                [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 2],
                [2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2]]


const GRID_WIDTH = MAP_WIDTH / layout[0].length;
const GRID_HEIGHT = MAP_HEIGHT / layout.length;

class Map {
    constructor (layoutMatrix) {
        this.row = layoutMatrix.length;
        this.column = layoutMatrix[0].length;
        this.layoutMatrix = layoutMatrix;
    }

    create () {
        mapCtx.lineWidth = 1;
        // x, y => i, j
        mapCtx.strokeStyle = "#333";
        mapCtx.fillStyle = "black";
        for (let j = 0; j < this.row; j++) {
            for (let i = 0; i < this.column; i++) {
                if (this.layoutMatrix[j][i] !== 0) mapCtx.fillRect(i * GRID_WIDTH, j * GRID_HEIGHT, GRID_WIDTH, GRID_HEIGHT);
                else mapCtx.strokeRect(i * GRID_WIDTH, j * GRID_HEIGHT, GRID_WIDTH, GRID_HEIGHT);
            }
        }
    }
}


class Player {
    constructor(position) {
        this.x = position[0] * GRID_WIDTH + (GRID_WIDTH / 2);
        this.y = position[1] * GRID_HEIGHT + (GRID_WIDTH / 2);
        this.directionAngle = 90;
        this.fieldOfView = 60;
        this.fovAngleStep = this.fieldOfView / SCENE_WIDTH;
        this.projectionHeight = (SCENE_WIDTH / 2) / Math.tan((this.fieldOfView / 2) * toRADIAN);
        this.nominatorForWallHeight = this.projectionHeight * GRID_HEIGHT;
    }

    create () {
        mapCtx.fillStyle = "red";
        mapCtx.strokeStyle = "gray";
        mapCtx.beginPath();
        mapCtx.fillRect(this.x - 5, this.y - 5, 10, 10);
        mapCtx.lineWidth = 0.5;
        this.createFOV();
        mapCtx.stroke();
        mapCtx.fill();
    }

    update () {
        this.create();
        this.move();
    }

    move () {
            if (playerMove["LEFT_ROTATION"]) {
                this.directionAngle = this.directionAngle === 0 ? 360 : this.directionAngle - 2;
            }

            if (playerMove["RIGHT_ROTATION"]) {
                this.directionAngle = this.directionAngle === 360 ? 0 : this.directionAngle + 2;
            }
            
            if (playerMove["FORWARD"]) {
                let nextPointX = this.x + 2 * Math.cos(this.directionAngle * Math.PI / 180);
                if (layout[Math.floor(this.y / GRID_HEIGHT)][Math.floor(nextPointX / GRID_HEIGHT)]) nextPointX = this.x;
                let nextPointY = this.y + 2 * Math.sin(this.directionAngle * Math.PI / 180);
                if (layout[Math.floor(nextPointY / GRID_HEIGHT)][Math.floor(this.x / GRID_HEIGHT)]) nextPointY = this.y;
                [this.x, this.y] = [nextPointX, nextPointY]
             }
    
            if (playerMove["BACKWARD"]) {
                let nextPointX = this.x - 2 * Math.cos(this.directionAngle * Math.PI / 180);
                if (layout[Math.floor(this.y / GRID_HEIGHT)][Math.floor(nextPointX / GRID_HEIGHT)]) nextPointX = this.x;
                let nextPointY = this.y - 2 * Math.sin(this.directionAngle * Math.PI / 180);
                if (layout[Math.floor(nextPointY / GRID_HEIGHT)][Math.floor(this.x / GRID_HEIGHT)]) nextPointY = this.y;
                [this.x, this.y] = [nextPointX, nextPointY]
            }
    
            if (playerMove["LEFT"]) {
                let nextPointX = this.x - 2 * Math.cos((this.directionAngle + 90) * Math.PI / 180);
                if (layout[Math.floor(this.y / GRID_HEIGHT)][Math.floor(nextPointX / GRID_HEIGHT)]) nextPointX = this.x;
                let nextPointY = this.y - 2 * Math.sin((this.directionAngle + 90) * Math.PI / 180);
                if (layout[Math.floor(nextPointY / GRID_HEIGHT)][Math.floor(this.x / GRID_HEIGHT)]) nextPointY = this.y;
                [this.x, this.y] = [nextPointX, nextPointY]
            }
    
            if (playerMove["RIGHT"]) {
                let nextPointX = this.x - 2 * Math.cos((this.directionAngle - 90) * Math.PI / 180);
                if (layout[Math.floor(this.y / GRID_HEIGHT)][Math.floor(nextPointX / GRID_HEIGHT)]) nextPointX = this.x;
                let nextPointY = this.y - 2 * Math.sin((this.directionAngle - 90) * Math.PI / 180);
                if (layout[Math.floor(nextPointY / GRID_HEIGHT)][Math.floor(this.x / GRID_HEIGHT)]) nextPointY = this.y;
                [this.x, this.y] = [nextPointX, nextPointY]
            }

            playerMove.RIGHT_ROTATION = false;
            playerMove.LEFT_ROTATION = false;
    }

    createFOV () {

        background.slider();

        for (let currentStepAngle = -this.fieldOfView / 2, wallStep = 0; currentStepAngle <= this.fieldOfView / 2; currentStepAngle += this.fovAngleStep, wallStep += this.fovAngleStep) {
            mapCtx.moveTo(this.x, this.y);
            let castingPoints = [...this.ray(this.x + Math.cos((this.directionAngle + currentStepAngle) * toRADIAN),
                this.y + Math.sin((this.directionAngle + currentStepAngle) * toRADIAN))];
                mapCtx.lineTo(castingPoints[0], castingPoints[1]);


                // 3D RENDERING

                // const rayDistance = (castingPoints[1] - this.y) / Math.sin((this.directionAngle + currentStepAngle) * toRADIAN) * Math.cos(currentStepAngle * toRADIAN);
                const rayDistance = Math.sqrt(((castingPoints[0] - this.x) * (castingPoints[0] - this.x)) + ((castingPoints[1] - this.y) * (castingPoints[1] - this.y))) * Math.cos(currentStepAngle * toRADIAN);
                const wallHeight = this.nominatorForWallHeight / rayDistance;

                let castingDirection = castingPoints[3] === "VERTICAL" ? castingPoints[1] : castingPoints[0];

                // WALLS TEXTURES
                sceneCtx.drawImage(
                    textures.image,
                    textures.texturesList[castingPoints[2] - 1].textureSliceStartX + (castingDirection % 32),
                    0,
                    1,
                    32,
                    (wallStep * SCENE_WIDTH / this.fieldOfView),
                    (SCENE_HEIGHT + wallHeight) >> 1,  // (SCENE_HEIGHT - wallHeight) / 2 + wallHeight
                    1,
                    -wallHeight
                );

                // WALLS REFLECTIONS
                sceneCtx.drawImage(
                    reflectedTextures.image,
                    reflectedTextures.texturesList[castingPoints[2] - 1].textureSliceStartX + (castingDirection % 32),
                    0,
                    1,
                    32,
                    (wallStep * SCENE_WIDTH / this.fieldOfView),
                    ((SCENE_HEIGHT + wallHeight) >> 1) + wallHeight,  // (SCENE_HEIGHT - wallHeight) / 2 + wallHeight
                    1,
                    -wallHeight
                );

                sceneCtx.strokeStyle = `rgba(189, 187, 189, ${1.5 - ((1 / rayDistance ) * 75)})`;
                sceneCtx.beginPath();
                sceneCtx.moveTo(wallStep * SCENE_WIDTH / this.fieldOfView, (SCENE_HEIGHT + wallHeight) / 2);
                sceneCtx.lineTo(wallStep * SCENE_WIDTH / this.fieldOfView, (SCENE_HEIGHT + (3 * wallHeight)) / 2);
                sceneCtx.stroke();

                // FLOOR TEXTURES
                    // Coming soon... I hope...

                // SHADER EFFECT
                sceneCtx.strokeStyle = `rgba(0, 0, 0, ${1 - ((1 / rayDistance ) * 75)})`;
                sceneCtx.beginPath();
                sceneCtx.moveTo(wallStep * SCENE_WIDTH / this.fieldOfView, (SCENE_HEIGHT - wallHeight) / 2);
                sceneCtx.lineTo(wallStep * SCENE_WIDTH / this.fieldOfView, (SCENE_HEIGHT + wallHeight) / 2);
                sceneCtx.stroke();

        }
    }
    
    ray (...targetPoint) {
        let startPosX = this.x;
        let startPosY = this.y;
        let dx = targetPoint[0] - startPosX;
        let dy = targetPoint[1] - startPosY;
        let step = Math.abs(Math.abs(dx) > Math.abs(dy) ? dx : dy);
        let incX = dx / step
        let incY = dy / step;
        let castingPointType = null;
        while (1) {
            startPosX += incX;
            if (this.isCast(startPosX, startPosY))
            {
                castingPointType = "VERTICAL";
                break;
            }
            startPosY += incY;
            if (this.isCast(startPosX, startPosY))
            {
                castingPointType = "HORIZONTAL";
                break;
            }
        }
    return [startPosX, startPosY, this.isCast(startPosX, startPosY), castingPointType];
    }

    isCast (...point) {
        let position = layout[Math.floor(point[1] / GRID_HEIGHT)][Math.floor(point[0] / GRID_WIDTH)]
        if (position) return position;
        return 0;
    }
}


class Textures {
    constructor (imageName, width, height, slice) {
        this.sliceCounter = slice;
        this.texturesList = [];

        this.image = new Image();
        this.image.src = imageName;
        this.width = width;
        this.height = height;

        for (let i = 0; i < this.sliceCounter; i++) {
            let textureObj = {
                textureSliceStartX: i * this.width / this.sliceCounter - 1
            };
            this.texturesList.push(textureObj);
        }  
    }
}

class Parallax {
    constructor () {
        this.layers = [];
        this.bgSliders = [];
    }

    addLayer (layerObj) {
        // layerObj = {
        //     image: image_path,
        //     layerSlideSpeed: slide_speed
        // }
        let image = new Image();
        image.src = layerObj.image;
        layerObj.image = image;
        this.layers.push(layerObj);
        this.bgSliders.push(SCENE_WIDTH);
    }

    slider () {

        this.layers.forEach((imgObject, index) => {

            this.mover(index, imgObject.layerSlideSpeed);
            if (this.bgSliders[index] < 0 ) this.bgSliders[index] = SCENE_WIDTH;
            else if(this.bgSliders[index] > SCENE_WIDTH) this.bgSliders[index] = 0;
            
            sceneCtx.drawImage(
                imgObject.image, 
                0 - this.bgSliders[index],
                0,
                SCENE_WIDTH,
                SCENE_HEIGHT >> 1
            )

            sceneCtx.drawImage(
                imgObject.image, 
                SCENE_WIDTH - this.bgSliders[index],
                0,
                SCENE_WIDTH,
                SCENE_HEIGHT >> 1
            )
        });
    }

    mover (index, layerSlideSpeed) {

        if (playerMove["LEFT_ROTATION"]) {
            this.bgSliders[index] -= layerSlideSpeed;
        }

        if (playerMove["RIGHT_ROTATION"]) {
            this.bgSliders[index] += layerSlideSpeed;
        }

    }
}

class SingleTexture {
    constructor (image, width, height) {
        this.image = new Image();
        this.image.src = image;
        this.image.onload = () => {
            this.#loader(width, height);
            this.convert2D();
        }
        this.imageData = [];
    }

    #loader (width, height) {
        let imageBuffer = document.createElement("canvas");
        imageBuffer.width = this.image.width;
        imageBuffer.height = this.image.height;
        imageBuffer = imageBuffer.getContext("2d");
        imageBuffer.drawImage(this.image, 0, 0);
        this.imageData = imageBuffer.getImageData(0, 0, this.image.width, this.image.height).data;
        sceneCtx.putImageData(imageBuffer.getImageData(0, 0, this.image.width, this.image.height), 0, 100);
    }
}

function FPS (deltaT) {
    sceneCtx.fillStyle = "white";
    sceneCtx.font = "30px Arial";
    let FPS = Math.round(1000 / deltaT)
    // if (FPS > fpsMax) {
    //     fpsMax = FPS;
    //     console.log("Max: ", fpsMax);
    // }
    // if (FPS < fpsMin) {
    //     fpsMin = FPS;
    //     console.log("Min: ", fpsMin);
    // }
    sceneCtx.fillText(`${ FPS} FPS`, 10, 30);
}


// Use classes and functions from this point forward.

let map = new Map(layout);
let textures = new Textures("./sprites/textures/wolftextures32.png", 256, 32, 8); 
let reflectedTextures = new Textures("./sprites/textures/wolftexturesflopped32.png", 256, 32, 8); 
let background = new Parallax();

// let floorTexture = new SingleTexture("/sprites/textures/floor_texture.png", 32, 32);

background.addLayer({
    image: "./sprites/backgrounds/1.png",
    layerSlideSpeed: 9
});

background.addLayer({
    image: "./sprites/backgrounds/2.png",
    layerSlideSpeed: 12
});

background.addLayer({
    image: "./sprites/backgrounds/3.png",
    layerSlideSpeed: 15
});

background.addLayer({
    image: "./sprites/backgrounds/4.png",
    layerSlideSpeed: 18
});

let char = new Player([10, 10]);

function characterInfo () {
    sceneCtx.font = "25px Roboto";
    sceneCtx.fillStyle = "red";
    sceneCtx.fillText(`x: ${ Math.floor(char.x / GRID_WIDTH)}`, 200, 30);
    sceneCtx.fillText(`y: ${ Math.floor(char.y / GRID_HEIGHT)}`, 280, 30);
    sceneCtx.fillText(`deg: ${ char.directionAngle}`, 360, 30);
}

function loop () {
    mapCtx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    sceneCtx.clearRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
    // sceneCtx.fillStyle = "#333";
    // sceneCtx.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT / 2);
    sceneCtx.fillStyle = "#9a9a9a";
    sceneCtx.fillRect(0, 320, SCENE_WIDTH, SCENE_HEIGHT / 2);
    char.update();
    map.create();
    characterInfo();

}
let fpsMax = 0;
let fpsMin = Infinity;
function game () {
    const startTime = Date.now();

    loop();

    const endTime = Date.now(); 

    FPS(endTime - startTime);

    requestAnimationFrame(game);
}

window.onload = () => {
   game();
}



mapCanvas.addEventListener("mousemove", (e) => {
    mouse.x = e.x - mapCanvasBoundingRect.left;
    mouse.y = e.y - mapCanvasBoundingRect.top;
});

window.addEventListener("keydown", (e) => {
    if (e.keyCode === 87) playerMove.FORWARD = true;
    if (e.keyCode === 83) playerMove.BACKWARD = true;
    if (e.keyCode === 68) playerMove.RIGHT = true;
    if (e.keyCode === 65) playerMove.LEFT = true;
});

window.addEventListener("keyup", (e) => {
    if (e.keyCode === 87) playerMove.FORWARD = false;
    if (e.keyCode === 83) playerMove.BACKWARD = false;
    if (e.keyCode === 68) playerMove.RIGHT = false;
    if (e.keyCode === 65) playerMove.LEFT = false;
});


sceneCanvas.requestPointerLock = sceneCanvas.requestPointerLock || 
                        sceneCanvas.mozRequestPointerLock;

document.exitPointerLock = document.exitPointerLock || 
                        document.mozExitPointerLock;

sceneCanvas.onclick = () => {
    sceneCanvas.requestPointerLock();
}      

document.addEventListener('pointerlockchange', lockChangeAlert, false);
document.addEventListener('mozpointerlockchange', lockChangeAlert, false);

function lockChangeAlert() {
    if (document.pointerLockElement === sceneCanvas || document.mozPointerLockElement === sceneCanvas) {
        document.addEventListener("mousemove", updatePosition, false);
    } 
    
    else {
        document.removeEventListener("mousemove", updatePosition, false);
    }
}

function updatePosition(e) {
    MOUSE_X_MOVE_QUEUE.push(e.movementX);

    playerMove.RIGHT_ROTATION = e.movementX > 0 ? true : false;
    playerMove.LEFT_ROTATION = e.movementX < 0 ? true : false;

    MOUSE_X_MOVE_QUEUE.shift();
  }
