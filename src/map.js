import CanvasManager from "./canvas";

class Map {

    constructor(layoutObject) {
        if (layoutObject.length !== layoutObject[0].length) {
            throw Error("Map layout is must be square matrix. (n x n)");
        }

        this._mapCanvas = CanvasManager.getInstance().getCanvas("map");
        this._mapCtx = CanvasManager.getInstance().getContext("map");
        this.MAP_WIDTH = this._mapCanvas.width;
        this.MAP_HEIGHT = this._mapCanvas.height;

        this.layout = layoutObject;
        this.gridCellWidth = parseInt(this.MAP_WIDTH / this.layout[0].length);
        this.gridCellHeight = parseInt(this.MAP_HEIGHT / this.layout.length);
    }

    render() {
        this._mapCtx.strokeStyle = "black";
        this._mapCtx.fillStyle = "black";

        const height = this.layout.length;
        const width = this.layout[0].length;

        for (let column = 0; column < width; column++) {
            for (let row = 0; row < height; row++) {

                const x = column * this.gridCellWidth;
                const y = row * this.gridCellHeight;

                this._mapCtx.strokeRect(x, y, this.gridCellWidth, this.gridCellHeight);

                if (this.layout[row][column]) {
                    this._mapCtx.fillRect(x, y, this.gridCellWidth, this.gridCellHeight);
                }
            };
        };
    }

    getTile(x, y) {
        if (x < 0 || y < 0 || x >= this.layout[0].length || y >= this.layout.length) {
            return 1;
        }

        return this.layout[y][x];
    }

    
    
}

export default Map;