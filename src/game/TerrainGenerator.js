class TerrainGenerator {
    constructor(width, height, seed = Math.random()) {
        this.width = width;
        this.height = height;
        this.seed = seed;
        this.tiles = [];
        this.regions = [];
        this.features = [];
        this.noise = this.createNoiseGenerator(seed);
        this.tileSize = 40;
        this.columns = Math.ceil(width / this.tileSize);
        this.rows = Math.ceil(height / this.tileSize);
        this.terrainConfig = null;
        this.biomeMap = new Map();
    }

    setTerrainConfig(config) {
        this.terrainConfig = config;
        if (config?.biomes) {
            for (const [name, biome] of Object.entries(config.biomes)) {
                this.biomeMap.set(name, biome);
            }
        }
    }

    createNoiseGenerator(seed) {
        const mask = 0xffffffff;
        const m_w = (123456789 + seed) & mask;
        const m_z = (987654321 - seed) & mask;

        return function(x, y) {
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
        const baseScale = 200;
        
        for (let row = 0; row < this.rows; row++) {
            const rowData = [];
            for (let col = 0; col < this.columns; col++) {
                let height = 0;
                let scale = baseScale;
                let amplitude = 1;
                
                for (let i = 0; i < octaves; i++) {
                    const x = col * this.tileSize;
                    const y = row * this.tileSize;
                    height += this.smoothNoise(x, y, scale) * amplitude;
                    scale /= 2;
                    amplitude *= persistence;
                }
                
                height = Math.max(0, Math.min(1, (height - 0.3) * 1.5));
                rowData.push(height);
            }
            heightMap.push(rowData);
        }
        
        return heightMap;
    }

    generateTemperatureMap() {
        const tempMap = [];
        const equatorY = this.rows / 2;
        
        for (let row = 0; row < this.rows; row++) {
            const rowData = [];
            for (let col = 0; col < this.columns; col++) {
                const distFromEquator = Math.abs(row - equatorY) / equatorY;
                let temperature = 1 - distFromEquator * 0.7;
                
                temperature += (this.noise(col * 50, row * 50) - 0.5) * 0.2;
                temperature = Math.max(0.1, Math.min(1, temperature));
                rowData.push(temperature);
            }
            tempMap.push(rowData);
        }
        
        return tempMap;
    }

    generateMoistureMap() {
        const moistureMap = [];
        
        for (let row = 0; row < this.rows; row++) {
            const rowData = [];
            for (let col = 0; col < this.columns; col++) {
                let moisture = 0.5;
                
                moisture += this.smoothNoise(col * 150, row * 150, 100) * 0.4;
                moisture += this.smoothNoise(col * 50, row * 50, 50) * 0.2;
                
                moisture = Math.max(0.1, Math.min(1, moisture));
                rowData.push(moisture);
            }
            moistureMap.push(rowData);
        }
        
        return moistureMap;
    }

    determineBiome(height, temperature, moisture) {
        if (this.terrainConfig?.biomes) {
            for (const [biomeName, biome] of Object.entries(this.terrainConfig.biomes)) {
                if (biome.minHeight !== undefined && biome.maxHeight !== undefined) {
                    if (height >= biome.minHeight && height < biome.maxHeight) {
                        if (biome.minTemperature !== undefined && temperature < biome.minTemperature) continue;
                        if (biome.maxTemperature !== undefined && temperature > biome.maxTemperature) continue;
                        if (biome.minMoisture !== undefined && moisture < biome.minMoisture) continue;
                        if (biome.maxMoisture !== undefined && moisture > biome.maxMoisture) continue;
                        return biomeName;
                    }
                }
            }
        }
        
        return this.determineBiomeFallback(height, temperature, moisture);
    }

    determineBiomeFallback(height, temperature, moisture) {
        if (height < 0.35) return 'deep_water';
        if (height < 0.42) return 'water';
        if (height < 0.48) return 'beach';
        
        if (temperature < 0.3) {
            if (height > 0.85) return 'snow_peak';
            if (height > 0.75) return 'tundra';
            return 'snow';
        }
        
        if (temperature > 0.85) {
            if (moisture < 0.25) return 'desert';
            if (moisture < 0.5) return 'savanna';
            return 'tropical_forest';
        }
        
        if (height > 0.88) return 'peak';
        if (height > 0.78) return 'mountain';
        if (height > 0.65) {
            if (moisture > 0.6) return 'forest';
            return 'forest';
        }
        
        if (moisture < 0.35) return 'grassland';
        if (moisture > 0.7) return 'forest';
        
        return 'grass';
    }

    isPassable(terrainType) {
        const biome = this.biomeMap.get(terrainType);
        if (biome !== undefined) {
            return biome.passable !== false;
        }
        
        return ['grass', 'forest', 'beach', 'grassland', 'snow', 'savanna', 'tropical_forest'].includes(terrainType);
    }

    getTileIndex(col, row) {
        if (col < 0 || col >= this.columns || row < 0 || row >= this.rows) {
            return -1;
        }
        return row * this.columns + col;
    }

    getTileAtWorldCoord(x, y) {
        const col = Math.floor(x / this.tileSize);
        const row = Math.floor(y / this.tileSize);
        return this.getTileByGrid(col, row);
    }

    getTileByGrid(col, row) {
        const index = this.getTileIndex(col, row);
        if (index >= 0 && index < this.tiles.length) {
            return this.tiles[index];
        }
        return null;
    }

    worldToGrid(x, y) {
        return {
            col: Math.floor(x / this.tileSize),
            row: Math.floor(y / this.tileSize)
        };
    }

    gridToWorld(col, row) {
        return {
            x: col * this.tileSize,
            y: row * this.tileSize
        };
    }

    generateTerrain() {
        console.time('TerrainGenerator.generateTerrain');
        
        const heightMap = this.generateHeightMap();
        const temperatureMap = this.generateTemperatureMap();
        const moistureMap = this.generateMoistureMap();
        
        this.tiles = [];
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.columns; col++) {
                const height = heightMap[row][col];
                const temperature = temperatureMap[row][col];
                const moisture = moistureMap[row][col];
                
                const terrainType = this.determineBiome(height, temperature, moisture);
                const worldPos = this.gridToWorld(col, row);
                
                const tile = {
                    id: `tile_${row}_${col}`,
                    x: worldPos.x,
                    y: worldPos.y,
                    width: this.tileSize,
                    height: this.tileSize,
                    col,
                    row,
                    heightValue: height,
                    temperature,
                    moisture,
                    terrainType,
                    passable: this.isPassable(terrainType),
                    resources: [],
                    elevation: Math.floor(height * 100)
                };
                
                this.tiles.push(tile);
            }
        }
        
        this.generateRivers();
        this.generateLakes();
        this.generateMountains();
        this.generateForestClusters();
        this.generateDesertFeatures();
        this.generateSnowFeatures();
        this.generateResources();
        
        console.timeEnd('TerrainGenerator.generateTerrain');
        console.log(`Generated ${this.tiles.length} tiles with ${this.features.length} features`);
        
        return this.tiles;
    }

    generateRivers() {
        const riverCount = this.terrainConfig?.features?.rivers?.count || 3;
        const minLength = this.terrainConfig?.features?.rivers?.minLength || 5;
        
        for (let i = 0; i < riverCount; i++) {
            const startCol = Math.floor(Math.random() * (this.columns - 20)) + 10;
            const startRow = Math.floor(Math.random() * 10);
            
            let currentCol = startCol;
            let currentRow = startRow;
            const riverTiles = [];
            
            while (currentRow < this.rows - 2 && currentCol > 1 && currentCol < this.columns - 2) {
                const tile = this.getTileByGrid(currentCol, currentRow);
                if (tile && tile.terrainType !== 'deep_water') {
                    tile.terrainType = 'river';
                    tile.passable = false;
                    riverTiles.push(tile);
                }
                
                const direction = Math.random();
                if (direction < 0.6) {
                    currentRow++;
                } else if (direction < 0.8) {
                    currentCol += Math.random() > 0.5 ? 1 : -1;
                } else {
                    currentRow++;
                    currentCol += Math.random() > 0.5 ? 1 : -1;
                }
            }
            
            if (riverTiles.length > minLength) {
                this.features.push({
                    type: 'river',
                    tiles: riverTiles
                });
            }
        }
    }

    generateLakes() {
        const lakeCount = this.terrainConfig?.features?.lakes?.count || 2;
        
        for (let i = 0; i < lakeCount; i++) {
            const centerCol = Math.floor(Math.random() * (this.columns - 20)) + 10;
            const centerRow = Math.floor(Math.random() * (this.rows - 20)) + 10;
            const radius = Math.floor(Math.random() * 3) + 2;
            
            const lakeTiles = [];
            
            for (let dr = -radius; dr <= radius; dr++) {
                for (let dc = -radius; dc <= radius; dc++) {
                    const dist = Math.sqrt(dr * dr + dc * dc);
                    if (dist <= radius) {
                        const tile = this.getTileByGrid(centerCol + dc, centerRow + dr);
                        if (tile) {
                            tile.terrainType = 'lake';
                            tile.passable = false;
                            lakeTiles.push(tile);
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
        const mountainCount = this.terrainConfig?.features?.mountains?.count || 4;
        
        for (let i = 0; i < mountainCount; i++) {
            const centerCol = Math.floor(Math.random() * (this.columns - 20)) + 10;
            const centerRow = Math.floor(Math.random() * (this.rows - 30)) + 15;
            const radius = Math.floor(Math.random() * 2) + 2;
            
            for (let dr = -radius; dr <= radius; dr++) {
                for (let dc = -radius; dc <= radius; dc++) {
                    const dist = Math.sqrt(dr * dr + dc * dc);
                    if (dist <= radius) {
                        const tile = this.getTileByGrid(centerCol + dc, centerRow + dr);
                        if (tile) {
                            tile.terrainType = dist < radius * 0.5 ? 'peak' : 'mountain';
                            tile.passable = false;
                        }
                    }
                }
            }
        }
    }

    generateForestClusters() {
        const clusterCount = 6;
        
        for (let i = 0; i < clusterCount; i++) {
            const centerCol = Math.floor(Math.random() * (this.columns - 30)) + 15;
            const centerRow = Math.floor(Math.random() * (this.rows - 30)) + 15;
            const radius = Math.floor(Math.random() * 4) + 3;
            
            for (let dr = -radius; dr <= radius; dr++) {
                for (let dc = -radius; dc <= radius; dc++) {
                    const dist = Math.sqrt(dr * dr + dc * dc);
                    if (dist <= radius && Math.random() < 0.6) {
                        const tile = this.getTileByGrid(centerCol + dc, centerRow + dr);
                        if (tile && tile.passable && tile.terrainType === 'grass') {
                            tile.terrainType = 'forest';
                        }
                    }
                }
            }
        }
    }

    generateDesertFeatures() {
        for (const tile of this.tiles) {
            if (tile.terrainType === 'desert' && Math.random() < 0.05) {
                tile.resources.push({ type: 'cactus', collected: false });
            }
        }
    }

    generateSnowFeatures() {
        for (const tile of this.tiles) {
            if (tile.terrainType === 'snow' && Math.random() < 0.03) {
                tile.resources.push({ type: 'ice', collected: false });
            }
        }
    }

    generateResources() {
        const forestDensity = 0.08;
        const rockDensity = 0.05;
        
        for (const tile of this.tiles) {
            if (tile.terrainType === 'forest' && Math.random() < forestDensity) {
                tile.resources.push({ type: 'wood', collected: false });
            }
            
            if ((tile.terrainType === 'grass' || tile.terrainType === 'grassland') && Math.random() < rockDensity) {
                tile.resources.push({ type: 'stone', collected: false });
            }
            
            if (tile.terrainType === 'water' && Math.random() < 0.02) {
                tile.resources.push({ type: 'fish', collected: false });
            }
        }
    }

    getTerrainColors() {
        const defaultColors = {
            deep_water: '#3d7a3d',
            water: '#3d7a3d',
            beach: '#3d7a3d',
            grass: '#3d7a3d',
            forest: '#3d7a3d',
            mountain: '#3d7a3d',
            peak: '#3d7a3d',
            river: '#3d7a3d',
            lake: '#3d7a3d',
            snow: '#3d7a3d',
            snow_peak: '#3d7a3d',
            tundra: '#3d7a3d',
            desert: '#3d7a3d',
            savanna: '#3d7a3d',
            tropical_forest: '#3d7a3d',
            grassland: '#3d7a3d'
        };
        
        if (this.terrainConfig?.biomes) {
            for (const [biomeName, biome] of Object.entries(this.terrainConfig.biomes)) {
                if (biome.color) {
                    defaultColors[biomeName] = biome.color;
                }
            }
        }
        
        return defaultColors;
    }

    getTerrainTexture(terrainType) {
        const textures = {
            deep_water: { pattern: 'waves', color: '#0a192f' },
            water: { pattern: 'waves', color: '#1e3a5f' },
            beach: { pattern: 'sand', color: '#f4d03f' },
            grass: { pattern: 'grass', color: '#2d5a27' },
            forest: { pattern: 'trees', color: '#1e4d2b' },
            mountain: { pattern: 'rocks', color: '#6b7b8a' },
            peak: { pattern: 'snow', color: '#a0a0a0' },
            river: { pattern: 'waves', color: '#3d7cb5' },
            lake: { pattern: 'waves', color: '#2d6a9a' },
            snow: { pattern: 'snow', color: '#e8f4f8' },
            snow_peak: { pattern: 'snow', color: '#ffffff' },
            tundra: { pattern: 'snow', color: '#b8c5d6' },
            desert: { pattern: 'sand', color: '#f4a460' },
            savanna: { pattern: 'grass', color: '#daa520' },
            tropical_forest: { pattern: 'trees', color: '#0d4f3c' },
            grassland: { pattern: 'grass', color: '#4a7c3a' }
        };
        
        if (this.terrainConfig?.biomes?.[terrainType]) {
            const biome = this.terrainConfig.biomes[terrainType];
            return {
                pattern: biome.texture || textures[terrainType]?.pattern || 'solid',
                color: biome.color || textures[terrainType]?.color || '#888888'
            };
        }
        
        return textures[terrainType] || textures.grass;
    }

    getStats() {
        const terrainCounts = {};
        for (const tile of this.tiles) {
            terrainCounts[tile.terrainType] = (terrainCounts[tile.terrainType] || 0) + 1;
        }
        
        return {
            totalTiles: this.tiles.length,
            columns: this.columns,
            rows: this.rows,
            worldWidth: this.width,
            worldHeight: this.height,
            tileSize: this.tileSize,
            featureCount: this.features.length,
            terrainDistribution: terrainCounts,
            seed: this.seed
        };
    }
}

export { TerrainGenerator };