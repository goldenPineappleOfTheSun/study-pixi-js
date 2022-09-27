/*
caches all info about statics in a scene with given resolution (STATIC_VISION_CELL_SIZE)
*/

const STATIC_VISION_CELL_SIZE = 8;

/*
cellSize - width and height of a single cell
width - width in pixels to check 
height - height in pixels to check 
*/
function LowPolyStaticVision(cellSize, width, height, tag) {
    this.cells = [[]];
    
    this.update = function() {
        this.cells = [[]];
        const w = Math.ceil(width / cellSize);
        const h = Math.ceil(height / cellSize);
        for (let x=0; x<w; x++) {
            this.cells[x] = [];
            for (let y=0; y<h; y++) {
                this.cells[x][y] = checkStaticsInArea({
                    x: x * cellSize,
                    y: y * cellSize,
                    width: cellSize, 
                    height: cellSize
                }, tag);
            }
        } 
    }

    this.check = function(rect) {
        if (this.cells.length == 0) {
            return false;
        }
        const start = {
            x: Math.floor(rect.x / cellSize),
            y: Math.floor(rect.y / cellSize)};
        const end = {
            x: Math.ceil(rect.x / cellSize + rect.width / cellSize),
            y: Math.ceil(rect.y / cellSize + rect.height / cellSize)};
        if (start.x < 0) {
            start.x = 0;
        }
        if (start.y < 0) {
            start.y = 0;
        }
        if (end.x >= this.cells.length) {
            end.x = this.cells.length-1;
        }
        if (end.y >= this.cells[0].length) {
            end.y = this.cells[0].length-1;
        }
        for (let x=start.x; x<end.x; x++) {
            for (let y=start.y; y<end.y; y++) {
                if (this.cells[x][y]) {
                    return true;
                }
            }
        }
        return false;
    }
}

const svision = new LowPolyStaticVision(STATIC_VISION_CELL_SIZE, app.screen.width, app.screen.height, 'block');
const pvision = new LowPolyStaticVision(STATIC_VISION_CELL_SIZE, app.screen.width, app.screen.height, 'platform');

onTexturesLoaded.push(() => {
    svision.update();
    pvision.update();
})