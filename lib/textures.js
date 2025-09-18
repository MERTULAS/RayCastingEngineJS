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

    getSliceBuffer(x, y, width, height, brightness = 1.0) {
        const result = new Uint32Array(width * height);
        
        for (let i = 0; i < height; i++) {
            for (let j = 0; j < width; j++) {
                const sourceIndex = ((y + i) * this.image.width + (x + j)) * 4;
                
                let r = this.buffer[sourceIndex];
                let g = this.buffer[sourceIndex + 1];
                let b = this.buffer[sourceIndex + 2];
                const a = this.buffer[sourceIndex + 3];
                
                if (brightness !== 1.0) {
                    r = Math.floor(r * brightness);
                    g = Math.floor(g * brightness);
                    b = Math.floor(b * brightness);
                }
                
                result[i * width + j] = (a << 24) | (b << 16) | (g << 8) | r;
            }
        }
        
        return result;
    }
}


class TextureManager {
    constructor() {
        this.isDevelopment = __DEV__;
        this.isProduction = __PROD__;
        this.nodeEnv = process.env.NODE_ENV;
        this.assetsPath = process.env.ASSETS_PATH;
        this.debugMode = process.env.DEBUG === 'true';
        
        this.textures = new Map();
        
        if (this.debugMode) {
            console.log('🔧 TextureManager Environment:', {
                isDevelopment: this.isDevelopment,
                isProduction: this.isProduction,
                nodeEnv: this.nodeEnv,
                assetsPath: this.assetsPath,
                debugMode: this.debugMode
            });
        }
    }

    async addTexture(imagePath, mapKey) {
        if (this.textures.has(mapKey)) {
            if (!Array.isArray(this.textures.get(mapKey))) {
                this.textures.set(mapKey, [this.textures.get(mapKey)]);
            }
        }

        const cleanPath = imagePath.startsWith('/') ? imagePath.substring(1) : imagePath;
        const fullPath = `${this.assetsPath}/${cleanPath}`;
        
        if (this.debugMode) {
            console.log(`🖼️ Loading texture: ${fullPath}`);
        }
        
        try {
            const texture = new Texture(fullPath);
            await texture.load();
            if (Array.isArray(this.textures.get(mapKey))) {
                this.textures.get(mapKey).push(texture);
            } else {
                this.textures.set(mapKey, texture);
            }
            
            if (this.debugMode) {
                console.log(`Texture loaded successfully: ${cleanPath} -> key: ${mapKey}`);
            }

            return texture;
        } catch (error) {
            console.error(`Failed to load texture: ${cleanPath}`, error);
            throw error;
        }
    }
}

export default TextureManager;