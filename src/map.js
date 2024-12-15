class Map {
    constructor(layoutObject, canvasId) {
        if (layoutObject.length !== layoutObject[0].length) {
            throw Error("Map layout is must be square matrix. (n x n)");
        }

        this.canvas = document.getElementById(canvasId);
        this.canvasBoundingRect = this.canvas.getBoundingClientRect();
        this.MAP_WIDTH = this.canvasBoundingRect.width;
        this.MAP_HEIGHT = this.canvasBoundingRect.height;

        this.canvas.width = this.MAP_WIDTH;
        this.canvas.height = this.MAP_HEIGHT;

        this.layout = layoutObject;
        this.gridCellWidth = parseInt(this.MAP_WIDTH / this.layout[0].length);
        this.gridCellHeight = parseInt(this.MAP_HEIGHT / this.layout.length);
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