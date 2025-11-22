/**
 * Map Tile Capture Utility
 * Downloads Stamen Watercolor map tiles for specific geographic regions
 */

const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Stamen watercolor tile URL pattern
// https://watercolormaps.collection.cooperhewitt.org/tile/watercolor/{z}/{x}/{y}.jpg

/**
 * Convert lat/lon to tile coordinates at given zoom level
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} zoom - Zoom level
 * @returns {Object} Tile x, y coordinates
 */
function latLonToTile(lat, lon, zoom) {
    const n = Math.pow(2, zoom);
    const x = Math.floor((lon + 180) / 360 * n);
    const y = Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * n);
    return { x, y };
}

/**
 * Convert tile coordinates to lat/lon bounds
 * @param {number} x - Tile x coordinate
 * @param {number} y - Tile y coordinate
 * @param {number} zoom - Zoom level
 * @returns {Object} Bounds with north, south, east, west
 */
function tileToBounds(x, y, zoom) {
    const n = Math.pow(2, zoom);
    const west = x / n * 360 - 180;
    const east = (x + 1) / n * 360 - 180;
    const north = Math.atan(Math.sinh(Math.PI * (1 - 2 * y / n))) * 180 / Math.PI;
    const south = Math.atan(Math.sinh(Math.PI * (1 - 2 * (y + 1) / n))) * 180 / Math.PI;
    return { north, south, east, west };
}

/**
 * Download a single map tile with retry logic
 * @param {number} z - Zoom level
 * @param {number} x - Tile x coordinate
 * @param {number} y - Tile y coordinate
 * @param {string} outputPath - Where to save the tile
 * @param {number} retries - Number of retry attempts (default 3)
 * @returns {Promise}
 */
function downloadTile(z, x, y, outputPath, retries = 3) {
    return new Promise((resolve, reject) => {
        const url = `https://watercolormaps.collection.cooperhewitt.org/tile/watercolor/${z}/${x}/${y}.jpg`;

        const attempt = (attemptsLeft) => {
            const file = fs.createWriteStream(outputPath);

            https.get(url, (response) => {
                if (response.statusCode !== 200) {
                    file.close();
                    fs.unlink(outputPath, () => {});

                    if (attemptsLeft > 0) {
                        console.log(`    Retry ${retries - attemptsLeft + 1}/${retries} for tile z${z}_x${x}_y${y}...`);
                        setTimeout(() => attempt(attemptsLeft - 1), 500);
                    } else {
                        reject(new Error(`Failed to download tile: ${response.statusCode}`));
                    }
                    return;
                }

                response.pipe(file);

                file.on('finish', () => {
                    file.close();
                    resolve();
                });

                file.on('error', (err) => {
                    file.close();
                    fs.unlink(outputPath, () => {});

                    if (attemptsLeft > 0) {
                        console.log(`    Retry ${retries - attemptsLeft + 1}/${retries} for tile z${z}_x${x}_y${y}...`);
                        setTimeout(() => attempt(attemptsLeft - 1), 500);
                    } else {
                        reject(err);
                    }
                });
            }).on('error', (err) => {
                file.close();
                fs.unlink(outputPath, () => {});

                if (attemptsLeft > 0) {
                    console.log(`    Retry ${retries - attemptsLeft + 1}/${retries} for tile z${z}_x${x}_y${y}...`);
                    setTimeout(() => attempt(attemptsLeft - 1), 500);
                } else {
                    reject(err);
                }
            });
        };

        attempt(retries);
    });
}

/**
 * Download tiles for a geographic region
 * @param {Object} bounds - Geographic bounds {north, south, east, west}
 * @param {number} zoom - Zoom level
 * @param {string} outputDir - Directory to save tiles
 * @returns {Promise<Array>} Array of downloaded tile info
 */
async function downloadRegionTiles(bounds, zoom, outputDir) {
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    // Calculate tile range
    const nw = latLonToTile(bounds.north, bounds.west, zoom);
    const se = latLonToTile(bounds.south, bounds.east, zoom);

    const minX = Math.min(nw.x, se.x);
    const maxX = Math.max(nw.x, se.x);
    const minY = Math.min(nw.y, se.y);
    const maxY = Math.max(nw.y, se.y);

    console.log(`Downloading tiles for zoom ${zoom}, X: ${minX}-${maxX}, Y: ${minY}-${maxY}`);
    console.log(`Total tiles: ${(maxX - minX + 1) * (maxY - minY + 1)}`);

    const tiles = [];

    for (let x = minX; x <= maxX; x++) {
        for (let y = minY; y <= maxY; y++) {
            const filename = `tile_z${zoom}_x${x}_y${y}.jpg`;
            const filepath = path.join(outputDir, filename);

            // Skip if already downloaded
            if (fs.existsSync(filepath)) {
                console.log(`Skipping existing tile: ${filename}`);
                tiles.push({ z: zoom, x, y, filepath, bounds: tileToBounds(x, y, zoom) });
                continue;
            }

            try {
                await downloadTile(zoom, x, y, filepath);
                console.log(`Downloaded: ${filename}`);

                tiles.push({ z: zoom, x, y, filepath, bounds: tileToBounds(x, y, zoom) });

                // Rate limiting - wait 100ms between downloads to be respectful
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (err) {
                console.error(`Error downloading tile ${filename}:`, err.message);
            }
        }
    }

    return tiles;
}

/**
 * Get tiles for a point location with surrounding context
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @param {number} zoom - Zoom level
 * @param {number} radius - Number of tiles in each direction (default 1 = 3x3 grid)
 * @param {string} outputDir - Directory to save tiles
 * @returns {Promise<Array>} Array of downloaded tile info
 */
async function downloadPointTiles(lat, lon, zoom, radius = 1, outputDir) {
    const center = latLonToTile(lat, lon, zoom);

    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const tiles = [];

    for (let dx = -radius; dx <= radius; dx++) {
        for (let dy = -radius; dy <= radius; dy++) {
            const x = center.x + dx;
            const y = center.y + dy;

            const filename = `tile_z${zoom}_x${x}_y${y}.jpg`;
            const filepath = path.join(outputDir, filename);

            // Skip if already downloaded
            if (fs.existsSync(filepath)) {
                console.log(`Skipping existing tile: ${filename}`);
                tiles.push({ z: zoom, x, y, filepath, bounds: tileToBounds(x, y, zoom) });
                continue;
            }

            try {
                await downloadTile(zoom, x, y, filepath);
                console.log(`Downloaded: ${filename}`);

                tiles.push({ z: zoom, x, y, filepath, bounds: tileToBounds(x, y, zoom) });

                // Rate limiting
                await new Promise(resolve => setTimeout(resolve, 100));
            } catch (err) {
                console.error(`Error downloading tile ${filename}:`, err.message);
            }
        }
    }

    return tiles;
}

/**
 * Stitch downloaded tiles into a single high-resolution image
 * @param {Array} tiles - Array of tile objects with x, y, filepath
 * @param {string} outputPath - Where to save the stitched image
 * @returns {Promise<Object>} Info about the stitched image
 */
async function stitchTiles(tiles, outputPath) {
    if (tiles.length === 0) {
        throw new Error('No tiles to stitch');
    }

    // Find the grid dimensions
    const xs = tiles.map(t => t.x);
    const ys = tiles.map(t => t.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const gridWidth = maxX - minX + 1;
    const gridHeight = maxY - minY + 1;

    // Tiles are 256x256 pixels
    const tileSize = 256;
    const outputWidth = gridWidth * tileSize;
    const outputHeight = gridHeight * tileSize;

    console.log(`    Stitching ${tiles.length} tiles into ${outputWidth}x${outputHeight} image...`);

    // Create a blank canvas
    const canvas = sharp({
        create: {
            width: outputWidth,
            height: outputHeight,
            channels: 3,
            background: { r: 255, g: 255, b: 255 }
        }
    });

    // Build composite array for sharp
    const compositeInputs = [];

    for (const tile of tiles) {
        // Calculate position in the stitched image
        const left = (tile.x - minX) * tileSize;
        const top = (tile.y - minY) * tileSize;

        // Only add tiles that exist
        if (fs.existsSync(tile.filepath)) {
            compositeInputs.push({
                input: tile.filepath,
                left: left,
                top: top
            });
        }
    }

    // Composite all tiles onto the canvas
    await canvas
        .composite(compositeInputs)
        .jpeg({ quality: 90 })
        .toFile(outputPath);

    console.log(`    Stitched image saved to: ${outputPath}`);

    // Calculate bounds for the stitched image
    const z = tiles[0].z;
    const bounds = {
        north: Math.atan(Math.sinh(Math.PI * (1 - 2 * minY / Math.pow(2, z)))) * 180 / Math.PI,
        south: Math.atan(Math.sinh(Math.PI * (1 - 2 * (maxY + 1) / Math.pow(2, z)))) * 180 / Math.PI,
        west: minX / Math.pow(2, z) * 360 - 180,
        east: (maxX + 1) / Math.pow(2, z) * 360 - 180
    };

    return {
        filepath: outputPath,
        width: outputWidth,
        height: outputHeight,
        bounds: bounds,
        z: z
    };
}

module.exports = {
    latLonToTile,
    tileToBounds,
    downloadTile,
    downloadRegionTiles,
    downloadPointTiles,
    stitchTiles
};

// CLI usage
if (require.main === module) {
    const args = process.argv.slice(2);

    if (args.length < 5) {
        console.log('Usage: node map-capture.js <north> <south> <east> <west> <zoom> [outputDir]');
        console.log('Example: node map-capture.js 49 45 -122 -125 8 ./tiles');
        process.exit(1);
    }

    const bounds = {
        north: parseFloat(args[0]),
        south: parseFloat(args[1]),
        east: parseFloat(args[2]),
        west: parseFloat(args[3])
    };
    const zoom = parseInt(args[4]);
    const outputDir = args[5] || './tiles';

    downloadRegionTiles(bounds, zoom, outputDir)
        .then(tiles => {
            console.log(`\nDownloaded ${tiles.length} tiles to ${outputDir}`);
        })
        .catch(err => {
            console.error('Error:', err);
            process.exit(1);
        });
}
