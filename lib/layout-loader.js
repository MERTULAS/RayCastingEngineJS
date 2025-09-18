export class LayoutLoader {
    constructor() {
        this.dataPath = process.env.DATA_PATH;
        this.filePath = null;
    }

    /**
     * Load layout JSON file
     * @param {string} mapPath - Layout JSON file path
     * @returns {Promise<Object>} - Loaded layout object
     */
    async loadMap(mapPath) {
        try {

            this.debugMode = process.env.DEBUG === 'true';

            const cleanMapPath = mapPath.startsWith('/') ? mapPath.substring(1) : mapPath;
            this.filePath = this.dataPath + '/' + cleanMapPath;
            const response = await fetch(this.filePath);
            if (!response.ok) {
                throw new Error(`Failed to load map: ${response.status}`);
            }
            
            const mapData = await response.json();
            
            // Validation
            this.validateMapData(mapData);
            
            if (this.debugMode) {
                console.log(`Map loaded successfully: ${mapData.metadata.name}`);
            }

            return mapData;
            
        } catch (error) {
            console.error(`Map loading error for ${mapPath}:`, error);
            throw error;
        }
    }

    /**
     * Validate map data
     * @private
     */
    validateMapData(mapData) {
        if (!mapData.metadata) {
            throw new Error("Map metadata is missing");
        }
        
        if (!mapData.layout || !Array.isArray(mapData.layout)) {
            throw new Error("Map layout is missing or invalid");
        }
        
        if (!mapData.metadata.size) {
            throw new Error("Map size metadata is missing");
        }
        
        const { width, height } = mapData.metadata.size;
        
        if (mapData.layout.length !== height) {
            throw new Error(`Map height mismatch: expected ${height}, got ${mapData.layout.length}`);
        }
        
        for (let row = 0; row < mapData.layout.length; row++) {
            if (mapData.layout[row].length !== width) {
                throw new Error(`Map width mismatch at row ${row}: expected ${width}, got ${mapData.layout[row].length}`);
            }
        }
    }


    /**
     * Convert to map layout format
     * @param {Object} layoutData - JSON layout data
     * @returns {Array<Array<number>>} - Map layout format array
     */
    toMapLayoutFormat(layoutData) {
        return layoutData.layout.map(row => 
            row.map(tile => {
                if (tile.wall !== null) {
                    return tile.wall;
                }

                return 0;
            })
        );
    }

    /**
     * Check tile properties
     * @param {Object} layoutData - Layout data
     * @param {number} x - X coordinate
     * @param {number} y - Y coordinate
     * @returns {Object} - Tile properties
     */
    getTileProperties(layoutData, x, y) {
        const tile = layoutData.layout[y][x];
        if (!tile) {
            return {
                blocked: true,
                transparent: false,
                hasWall: true,
                hasFloor: false,
                hasCeiling: false
            };
        }

        return {
            blocked: tile.blocked,
            transparent: tile.transparent,
            hasWall: tile.wall !== null,
            hasFloor: tile.floor !== null,
            hasCeiling: tile.ceil !== null,
            wallTexture: tile.wall,
            floorTexture: tile.floor,
            ceilingTexture: tile.ceil
        };
    }

    /**
     * Layout statistics
     * @param {Object} layoutData - Layout data
     * @returns {Object} - Layout statistics
     */
    getLayoutStatistics(layoutData) {
        let totalTiles = 0;
        let walls = 0;
        let floors = 0;
        let ceilings = 0;
        let blockedTiles = 0;
        let transparentTiles = 0;
        let sprites = 0;

        const textureUsage = {
            walls: new Map(),
            floors: new Map(),
            ceilings: new Map(),
            sprites: new Map()
        };

        layoutData.layout.forEach(row => {
            row.forEach(tile => {
                totalTiles++;
                
                if (tile.wall !== null) {
                    walls++;
                    const wallId = tile.wall;
                    textureUsage.walls.set(wallId, (textureUsage.walls.get(wallId) || 0) + 1);
                }
                
                if (tile.floor !== null) {
                    floors++;
                    const floorId = tile.floor;
                    textureUsage.floors.set(floorId, (textureUsage.floors.get(floorId) || 0) + 1);
                }
                
                if (tile.ceil !== null) {
                    ceilings++;
                    const ceilId = tile.ceil;
                    textureUsage.ceilings.set(ceilId, (textureUsage.ceilings.get(ceilId) || 0) + 1);
                }
                
                if (tile.blocked) blockedTiles++;
                if (tile.transparent) transparentTiles++;
                if (tile.sprite && tile.sprite !== null) {
                    sprites++;
                    const spriteId = tile.sprite;
                    textureUsage.sprites.set(spriteId, (textureUsage.sprites.get(spriteId) || 0) + 1);
                }
            });
        });

        return {
            totalTiles,
            walls,
            floors,
            ceilings,
            sprites,
            blockedTiles,
            transparentTiles,
            passableTiles: totalTiles - blockedTiles,
            textureUsage: {
                walls: Object.fromEntries(textureUsage.walls),
                floors: Object.fromEntries(textureUsage.floors),
                ceilings: Object.fromEntries(textureUsage.ceilings),
                sprites: Object.fromEntries(textureUsage.sprites)
            }
        };
    }

    #addNewAttributeToLayout(layoutData, attributeName, attributeValue) {
        layoutData.layout.forEach(row => {
            row.forEach(tile => {
                if (!tile[attributeName]) {
                    tile[attributeName] = attributeValue;
                }
            });
        });


    }

    addSpriteToLayout(layoutData, spriteKey) {
        this.#addNewAttributeToLayout(layoutData, "sprite", spriteKey);
    }
}

export default LayoutLoader;
