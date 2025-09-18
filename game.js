/*
const WALL_MAP_LAYOUT = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 5, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 1, 1, 1, 1, 1, 2, 1, 2, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];
*/

import Engine from "./lib/engine";
import Map from "./lib/map";
import Player from "./lib/player";
import RayCaster from "./lib/raycaster";
import Scene from "./lib/scene";
import TextureManager from "./lib/textures";
import CanvasManager from "./lib/canvas";
import LayoutLoader from "./lib/layout-loader";

const canvasManager = CanvasManager.getInstance();

canvasManager.registerMapCanvas("map");
canvasManager.registerSceneCanvas("scene");

const layoutLoader = new LayoutLoader();    
const GAME_LAYOUT = await layoutLoader.loadMap('layout.json');
layoutLoader.addSpriteToLayout(GAME_LAYOUT, null);

console.log(layoutLoader.getLayoutStatistics(GAME_LAYOUT));

const map = new Map(GAME_LAYOUT.layout, layoutLoader.toMapLayoutFormat(GAME_LAYOUT));
const player = new Player(2.5, 9.5);
player.addObserver(map);
const raycaster = new RayCaster(player, map);

const textureManager = new TextureManager();

await textureManager.addTexture("textures/texture_10.png", 0); // floor
await textureManager.addTexture("textures/texture_3.png", 5); // special floor
await textureManager.addTexture("textures/texture_2.png", 1); // wall
await textureManager.addTexture("textures/texture_1.png", 2); // wall
await textureManager.addTexture("textures/texture_9.png", 3); // ceiling


await textureManager.addTexture("sprites/torch_1.png", 6); // torch1
await textureManager.addTexture("sprites/torch_2.png", 6); // torch2
await textureManager.addTexture("sprites/torch_3.png", 6); // torch3
await textureManager.addTexture("sprites/torch_4.png", 6); // torch4
await textureManager.addTexture("sprites/torch_5.png", 6); // torch5

const scene = new Scene();
scene.addObserver(raycaster);
scene.addTextureManager(textureManager);


const engine = new Engine();

engine.addGameObject(map); // Should be first to render, because it's the background (maybe this mandatory rule will be removed in future)
engine.addGameObject(player);
engine.addGameObject(raycaster);
engine.addGameObject(scene);


export function game () {
    engine.start();
};
