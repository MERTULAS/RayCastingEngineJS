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


const sceneCtx = sceneCanvas.getContext("2d");


let mouse = {
    x: null,
    y: null
}

let playerMove = {
    "LEFT": false,
    "RIGHT": false,
    "FORWARD": false,
    "BACKWARD": false
}

let layout =   [[2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2],
                [2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
                [2, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
                [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
                [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2],
                [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 2],
                [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 2, 2, 2, 0, 0, 0, 0, 2],
                [2, 0, 0, 7, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [2, 0, 0, 7, 0, 0, 0, 0, 0, 0, 0, 8, 8, 0, 0, 0, 0, 0, 0, 2],
                [2, 0, 0, 7, 0, 0, 0, 0, 0, 0, 0, 0, 8, 0, 0, 0, 0, 0, 0, 2],
                [2, 0, 0, 7, 0, 0, 0, 0, 0, 0, 0, 8, 8, 0, 0, 0, 0, 0, 0, 2],
                [2, 0, 0, 7, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 2, 2, 2, 0, 0, 2],
                [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 2],
                [2, 0, 0, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 2, 0, 0, 2],
                [1, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
                [2, 0, 0, 0, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
                [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
                [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 2],
                [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0, 0, 0, 0, 2],
                [2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 2, 2, 2, 2, 1, 2, 2, 2, 2]]


const GRID_WIDTH = MAP_WIDTH / layout[0].length;
const GRID_HEIGHT = MAP_HEIGHT / layout.length;
console.log(GRID_HEIGHT, GRID_WIDTH);

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
        this.directionAngle = -90;
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
        Object.keys(playerMove).forEach(_ => {
            if (playerMove["LEFT"]) {
                this.directionAngle--;
            }

            if (playerMove["RIGHT"]) {
                this.directionAngle++;
            }

            if (playerMove["FORWARD"]) {
                [this.x, this.y] = [...this.availableWay("FORWARD")];

            }

            if (playerMove["BACKWARD"]) {
                [this.x, this.y] = [...this.availableWay("BACKWARD")];
            }
        });
    }

    createFOV () {
        background.slider(this.directionAngle);
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

                // FLOOR TEXTURES
                // sceneCtx.drawImage(
                //     textures.image,
                //     textures.texturesList[3].textureSliceStartX + (castingDirection % 32),
                //     (castingDirection % 32),
                //     32,
                //     32,
                //     wallStep,
                //     (wallStep * SCENE_WIDTH / this.fieldOfView),
                //     SCENE_WIDTH,
                //     320
                // );

                // WALLS TEXTURES
                sceneCtx.drawImage(
                    textures.image,
                    textures.texturesList[castingPoints[2] - 1].textureSliceStartX + (castingDirection % 32),
                    0,
                    1,
                    32,
                    (wallStep * SCENE_WIDTH / this.fieldOfView),
                    (SCENE_HEIGHT + wallHeight) / 2,  // (SCENE_HEIGHT - wallHeight) / 2 + wallHeight
                    1,
                    -wallHeight
                );

                // SHADER EFFECT
                sceneCtx.strokeStyle = `rgba(0, 0, 0, ${1 - ((1 / rayDistance ) * 75)})`;
                sceneCtx.beginPath();
                sceneCtx.moveTo(wallStep * SCENE_WIDTH / this.fieldOfView, (SCENE_HEIGHT - wallHeight) / 2);
                sceneCtx.lineTo(wallStep * SCENE_WIDTH / this.fieldOfView, (SCENE_HEIGHT + wallHeight) / 2);
                sceneCtx.stroke();

            }
        }

        colorByAngle (angle) {
            // `hsl(${180 - angle}, 50%, 75%)`;
            if (5 < angle && angle > -5) return `hsl(350, 50%, 75%)`;
            else return `hsl(100, 50%, 75%)`;
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

    availableWay (movingType) {
        if (movingType === "FORWARD") {
            let nextPointX = this.x + 0.5 * Math.cos(this.directionAngle * Math.PI / 180);
            if (layout[Math.floor(this.y / GRID_HEIGHT)][Math.floor(nextPointX / GRID_HEIGHT)]) nextPointX = this.x;
            let nextPointY = this.y + 0.5 * Math.sin(this.directionAngle * Math.PI / 180);
            if (layout[Math.floor(nextPointY / GRID_HEIGHT)][Math.floor(this.x / GRID_HEIGHT)]) nextPointY = this.y;
            return [nextPointX, nextPointY];
        }

        else if (movingType === "BACKWARD") {
            let nextPointX = this.x - 0.5 * Math.cos(this.directionAngle * Math.PI / 180);
            if (layout[Math.floor(this.y / GRID_HEIGHT)][Math.floor(nextPointX / GRID_HEIGHT)]) nextPointX = this.x;
            let nextPointY = this.y - 0.5 * Math.sin(this.directionAngle * Math.PI / 180);
            if (layout[Math.floor(nextPointY / GRID_HEIGHT)][Math.floor(this.x / GRID_HEIGHT)]) nextPointY = this.y;
            return [nextPointX, nextPointY];
        }
    }
}


class Textures {
    constructor (imageName, width, height, slice) {
        this.image = new Image();
        this.image.src = imageName;
        this.width = width;
        this.height = height;
        this.sliceCounter = slice;
        this.texturesList = [];
        for (let i = 0; i < this.sliceCounter; i++) {
            let textureObj = {
                textureSliceStartX: i * this.width / this.sliceCounter
            }
            this.texturesList.push(textureObj);
        }
    }
}

class Parallax {
    constructor() {
        this.layers = []
    }

    addLayer (layerObj) {
        // layerObj = {
        //     img: image_path,
        //     layerSlideSpeed: slide_speed
        // }
        let image = new Image();
        image.src = layerObj.image;
        layerObj.image = image;
        this.layers.push(layerObj);
    }

    slider (directionAngle) {
        this.layers.forEach(imgObject => {
            sceneCtx.drawImage(
                imgObject.image, 
                SCENE_WIDTH - directionAngle * imgObject.layerSlideSpeed,
                0,
                SCENE_WIDTH,
                SCENE_HEIGHT,
                0,
                0,
                directionAngle * imgObject.layerSlideSpeed,
                SCENE_HEIGHT
            )
            sceneCtx.drawImage(
                imgObject.image, 
                directionAngle * imgObject.layerSlideSpeed,
                0,
                SCENE_WIDTH - directionAngle * imgObject.layerSlideSpeed,
                SCENE_HEIGHT,
                directionAngle * imgObject.layerSlideSpeed,
                0,
                SCENE_WIDTH - directionAngle * imgObject.layerSlideSpeed,
                SCENE_HEIGHT
            )

            // sceneCtx.drawImage(imgObject.image, -directionAngle * imgObject.layerSlideSpeed % SCENE_WIDTH, 0, SCENE_WIDTH, SCENE_HEIGHT / 2);
            // sceneCtx.drawImage(imgObject.image, (-directionAngle * imgObject.layerSlideSpeed - SCENE_WIDTH) % SCENE_WIDTH, 0, SCENE_WIDTH, SCENE_HEIGHT / 2);
        })
    }
}

function FPS (deltaT) {
    sceneCtx.fillStyle = "white";
    sceneCtx.font = "30px Arial";
    sceneCtx.fillText(`${ Math.round(1000 / deltaT)} FPS`, 10, 30);
}

let map = new Map(layout);
let textures = new Textures("/sprites/textures/wolftextures32.png", 256, 32, 8);  
let background = new Parallax();
background.addLayer({
    image: "/sprites/backgrounds/1.png",
    layerSlideSpeed: 1
});

background.addLayer({
    image: "/sprites/backgrounds/2.png",
    layerSlideSpeed: 3
});

background.addLayer({
    image: "/sprites/backgrounds/3.png",
    layerSlideSpeed: 5
});

background.addLayer({
    image: "/sprites/backgrounds/4.png",
    layerSlideSpeed: 7 
});
let char = new Player([10, 10]);


function loop () {
    mapCtx.clearRect(0, 0, MAP_WIDTH, MAP_HEIGHT);
    sceneCtx.clearRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT);
    // sceneCtx.fillStyle = "#333";
    // sceneCtx.fillRect(0, 0, SCENE_WIDTH, SCENE_HEIGHT / 2);
    // sceneCtx.fillStyle = "green";
    // sceneCtx.fillRect(0, 320, SCENE_WIDTH, SCENE_HEIGHT / 2);
    char.update();
    map.create();
}

function game () {
    const startTime = Date.now();

    loop();

    const endTime = Date.now();

    FPS(endTime - startTime);

    requestAnimationFrame(game);
}

game();

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
