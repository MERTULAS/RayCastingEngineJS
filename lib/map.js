import CanvasManager from "./canvas";

class Map {

    constructor(layoutObject, wallMap) {
        if (layoutObject.length !== layoutObject[0].length) {
            throw Error("Map layout is must be square matrix. (n x n)");
        }

        this.wallMap = wallMap;

        this._mapCanvas = CanvasManager.getInstance().getCanvas("map");
        this._mapCtx = CanvasManager.getInstance().getContext("map");
        this.MAP_WIDTH = this._mapCanvas.width;
        this.MAP_HEIGHT = this._mapCanvas.height;

        this.layout = layoutObject;
        this.gridCellWidth = parseInt(this.MAP_WIDTH / this.layout[0].length);
        this.gridCellHeight = parseInt(this.MAP_HEIGHT / this.layout.length);

        this.mapFrame = this._mapCtx.createImageData(this.MAP_WIDTH, this.MAP_HEIGHT);
        this.mapBuffer = new Uint32Array(this.mapFrame.data.buffer);
        
        this.#createMapFrame();
    }

    render() {
        this._mapCtx.putImageData(this.mapFrame, 0, 0);
    }

    #clearMapFrame() {
        this.mapBuffer.fill(0x00000000);
    }

    #createMapFrame() {
        for (let row = 0; row < this.MAP_HEIGHT; row++) {
            for (let column = 0; column < this.MAP_WIDTH; column++) {
                const tileBlocked = this.isBlockedArea(Math.floor(column / this.gridCellWidth), Math.floor(row / this.gridCellHeight));
                this.mapBuffer[row * this.MAP_WIDTH + column] = tileBlocked ? 0xFF000000 : 0xFF333333;
            }
        }
    }

    getTileOnWallMap(x, y) {
        if (x < 0 || y < 0 || x >= this.wallMap[0].length || y >= this.wallMap.length) {
            return 1;
        }

        return this.wallMap[y][x];
    }

    getTile(x, y) {
        if (x < 0 || y < 0 || x >= this.layout[0].length || y >= this.layout.length) {
            return 1;
        }

        return this.layout[y][x];
    }

    getTileWall(x, y) {
        return this.getTile(x, y).wall;
    }

    getTileFloor(x, y) {
        return this.getTile(x, y).floor;
    }

    getTileCeiling(x, y) {
        return this.getTile(x, y)?.ceil;
    }

    getTileSprite(x, y) {
        return this.getTile(x, y)?.sprite;
    }

    isBlockedArea(x, y) {
        if (!(this.getTile(x, y) instanceof Object)) {
            return true;
        }

        return this.getTile(x, y).blocked;
    }
}

export default Map;