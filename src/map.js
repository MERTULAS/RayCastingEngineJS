// MAP
const mapCanvas = document.getElementById("map");
const mapCanvasBoundingRect = mapCanvas.getBoundingClientRect();
const MAP_WIDTH = mapCanvasBoundingRect.width;
const MAP_HEIGHT = mapCanvasBoundingRect.height;

mapCanvas.width = MAP_WIDTH;
mapCanvas.height = MAP_HEIGHT;


class Map {
    constructor(layoutObject) {
        if (layoutObject.length !== layoutObject[0].length) {
            throw Error("Map layout is must be square matrix. (n x n)");
        }
        this.layout = layoutObject;
        this.gridCellWidth = parseInt(MAP_WIDTH / this.layout[0].length);
        this.gridCellHeight = parseInt(MAP_HEIGHT / this.layout.length);
    }

    render(ctx) {
        ctx.strokeStyle = "black";
        ctx.fillStyle = "black";

        const height = this.layout.length;
        const width = this.layout[0].length;

        for (let column = 0; column < width; column++) {
            for (let row = 0; row < height; row++) {

                const x = column * this.gridCellWidth;
                const y = row * this.gridCellHeight;

                ctx.strokeRect(x, y, this.gridCellWidth, this.gridCellHeight);

                if (this.layout[row][column]) {
                    ctx.fillRect(x, y, this.gridCellWidth, this.gridCellHeight);
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