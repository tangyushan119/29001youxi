class TerrainGenerator {
    constructor(width, height, seed = Math.random()) {
        this.width = width;
        this.height = height;
        this.seed = seed;
        this.tiles = [];
        this.regions = [];
        this.features = [];
        this.noise = this.createNoiseGenerator(seed);
    }

    createNoiseGenerator(seed) {
        const mask = 0xffffffff;
        const m_w = (123456789 + seed) & mask;
        const m_z = (987654321 - seed) & mask;

        return function() {
            m_z = (36969 * (m_z & 65535) + (m_z >> 16)) & mask;
            m_w = (18000 * (m_w & 65535) + (m_w >> 16)) & mask;
            let result = ((m_z << 16) | (m_w & 65535)) & mask;
            result /= 4294967296;
            return result + 0.5;
        };
    }

    smoothNoise(x, y, scale = 100) {
        const corners = (this.noise(x - scale, y - scale) + this.noise(x + scale, y - scale) +
                        this.noise(x - scale, y + scale) + this.noise(x + scale, y + scale)) / 16;
        const sides = (this.noise(x - scale, y) + this.noise(x + scale, y) +
                      this.noise(x, y - scale) + this.noise(x, y + scale)) / 8;
        const center = this.noise(x, y) / 4;
        return corners + sides + center;
    }

    generateHeightMap() {
        const heightMap = [];
        const octaves = 4;
        const persistence = 0.5;
        
        for (let y = 0; y < this.height; y += 40) {
            const row = [];
            for (let x = 0; x < this.width; x += 40) {
                let height = 0;
                let scale = 200;
                let amplitude = 1;
                
                for (let i = 0; i < octaves; i++) {
                    height += this.smoothNoise(x, y, scale) * amplitude;
                    scale /= 2;
                    amplitude *= persistence;
                }
                
                row.push(height);
            }
            heightMap.push(row);
        }
        
        return heightMap;
    }

    generateTerrain() {
        const heightMap = this.generateHeightMap();
        this.tiles = [];
        
        for (let row = 0; row < heightMap.length; row++) {
            for (let col = 0; col < heightMap[row].length; col++) {
                const height = heightMap[row][col];
                const x = col * 40;
                const y = row * 40;
                
                let terrainType = this.determineTerrainType(height);
                
                const tile = {
                    id: `tile_${row}_${col}`,
                    x,
                    y,
                    width: 40,
                    height: 40,
                    heightValue: height,
                    terrainType,
                    passable: this.isPassable(terrainType),
                    resources: []
                };
                
                this.tiles.push(tile);
            }
        }
        
        this.generateRivers();
        this.generateLakes();
        this.generateMountains();
        this.generateForests();
        this.generateRocks();
        
        return this.tiles;
    }

    determineTerrainType(height) {
        if (height < 0.35) return 'deep_water';
        if (height < 0.42) return 'water';
        if (height < 0.48) return 'beach';
        if (height < 0.65) return 'grass';
        if (height < 0.78) return 'forest';
        if (height < 0.88) return 'mountain';
        return 'peak';
    }

    isPassable(terrainType) {
        return ['grass', 'forest', 'beach'].includes(terrainType);
    }

    generateRivers() {
        const riverCount = 3;
        
        for (let i = 0; i < riverCount; i++) {
            const startCol = Math.floor(Math.random() * 10) + 5;
            const startRow = Math.floor(Math.random() * 5);
            
            let currentCol = startCol;
            let currentRow = startRow;
            const riverTiles = [];
            
            while (currentRow < this.tiles.length / 50 - 1 && currentCol > 0 && currentCol < 50) {
                const tileIndex = currentRow * 50 + currentCol;
                if (tileIndex >= 0 && tileIndex < this.tiles.length) {
                    const tile = this.tiles[tileIndex];
                    if (tile) {
                        tile.terrainType = 'river';
                        tile.passable = false;
                        riverTiles.push(tile);
                    }
                }
                
                const direction = Math.random();
                if (direction < 0.5) {
                    currentRow++;
                } else if (direction < 0.75) {
                    currentCol++;
                } else {
                    currentCol--;
                }
            }
            
            if (riverTiles.length > 5) {
                this.features.push({
                    type: 'river',
                    tiles: riverTiles
                });
            }
        }
    }

    generateLakes() {
        const lakeCount = 2;
        
        for (let i = 0; i < lakeCount; i++) {
            const centerCol = Math.floor(Math.random() * 40) + 5;
            const centerRow = Math.floor(Math.random() * 30) + 10;
            const radius = Math.floor(Math.random() * 3) + 2;
            
            const lakeTiles = [];
            
            for (let dr = -radius; dr <= radius; dr++) {
                for (let dc = -radius; dc <= radius; dc++) {
                    const dist = Math.sqrt(dr * dr + dc * dc);
                    if (dist <= radius) {
                        const row = centerRow + dr;
                        const col = centerCol + dc;
                        const tileIndex = row * 50 + col;
                        
                        if (tileIndex >= 0 && tileIndex < this.tiles.length) {
                            const tile = this.tiles[tileIndex];
                            if (tile) {
                                tile.terrainType = 'lake';
                                tile.passable = false;
                                lakeTiles.push(tile);
                            }
                        }
                    }
                }
            }
            
            if (lakeTiles.length > 3) {
                this.features.push({
                    type: 'lake',
                    tiles: lakeTiles
                });
            }
        }
    }

    generateMountains() {
        const mountainCount = 4;
        
        for (let i = 0; i < mountainCount; i++) {
            const centerCol = Math.floor(Math.random() * 30) + 10;
            const centerRow = Math.floor(Math.random() * 25) + 15;
            const radius = Math.floor(Math.random() * 2) + 2;
            
            for (let dr = -radius; dr <= radius; dr++) {
                for (let dc = -radius; dc <= radius; dc++) {
                    const dist = Math.sqrt(dr * dr + dc * dc);
                    if (dist <= radius) {
                        const row = centerRow + dr;
                        const col = centerCol + dc;
                        const tileIndex = row * 50 + col;
                        
                        if (tileIndex >= 0 && tileIndex < this.tiles.length) {
                            const tile = this.tiles[tileIndex];
                            if (tile) {
                                if (dist < radius * 0.5) {
                                    tile.terrainType = 'peak';
                                } else {
                                    tile.terrainType = 'mountain';
                                }
                                tile.passable = false;
                            }
                        }
                    }
                }
            }
        }
    }

    generateForests() {
        const forestDensity = 0.15;
        
        for (const tile of this.tiles) {
            if (tile.terrainType === 'grass' && Math.random() < forestDensity) {
                tile.terrainType = 'forest';
            }
        }
    }

    generateRocks() {
        const rockDensity = 0.08;
        
        for (const tile of this.tiles) {
            if (tile.terrainType === 'grass' && Math.random() < rockDensity) {
                tile.resources.push({ type: 'stone', collected: false });
            }
        }
    }

    getTileAt(x, y) {
        const col = Math.floor(x / 40);
        const row = Math.floor(y / 40);
        const tileIndex = row * 50 + col;
        
        if (tileIndex >= 0 && tileIndex < this.tiles.length) {
            return this.tiles[tileIndex];
        }
        return null;
    }

    getTerrainColors() {
        return {
            deep_water: '#1e3a5f',
            water: '#2d5a87',
            beach: '#f4d03f',
            grass: '#2d5a27',
            forest: '#1e4d2b',
            mountain: '#6b7b8a',
            peak: '#a0a0a0',
            river: '#3d7cb5',
            lake: '#2d6a9a'
        };
    }

    getTerrainTexture(terrainType) {
        const textures = {
            deep_water: { pattern: 'waves', color: '#1e3a5f' },
            water: { pattern: 'waves', color: '#2d5a87' },
            beach: { pattern: 'sand', color: '#f4d03f' },
            grass: { pattern: 'grass', color: '#2d5a27' },
            forest: { pattern: 'trees', color: '#1e4d2b' },
            mountain: { pattern: 'rocks', color: '#6b7b8a' },
            peak: { pattern: 'snow', color: '#e8e8e8' },
            river: { pattern: 'waves', color: '#3d7cb5' },
            lake: { pattern: 'waves', color: '#2d6a9a' }
        };
        return textures[terrainType] || textures.grass;
    }
}

export { TerrainGenerator };