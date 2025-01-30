export class Texture {
    constructor(imagePath) {
        this.image = new Image();
        this.image.src = imagePath;

        console.log(name, imagePath);

        this.buffer = null;
    }

    async load() {
        return new Promise((resolve, reject) => {
            this.image.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = this.image.width;
                canvas.height = this.image.height;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(this.image, 0, 0);
                this.buffer = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
                resolve();
            };
            
            this.image.onerror = () => {
                reject(new Error('Texture could not be loaded'));
            };
        });
    }

    getSliceBuffer(x, y, width, height) {
        const result = new Uint32Array(width * height);
        
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                const sourceIndex = ((y + i) * this.image.width + (x + j)) * 4;
                
                const r = this.buffer[sourceIndex];
                const g = this.buffer[sourceIndex + 1];
                const b = this.buffer[sourceIndex + 2];
                const a = this.buffer[sourceIndex + 3];
                
                result[i * width + j] = (a << 24) | (b << 16) | (g << 8) | r;
            }
        }
        
        return result;
    }
}


class TextureManager {
    constructor() {
        this.textures = [];
    }

    async addTexture(imagePath) {
        const texture = new Texture(imagePath);
        await texture.load();
        this.textures.push(texture);
    }
}

export default TextureManager;