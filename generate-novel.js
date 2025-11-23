#!/usr/bin/env node
/**
 * No Time to Discourse - Novel Generator
 * Main orchestrator for generating the 50,000+ word novel
 *
 * Usage: node generate-novel.js [options]
 * Options:
 *   --zoom=N        Map zoom level (default: 8)
 *   --stories=N     Stories per page (default: 5)
 *   --max-same=N    Max stories of same type per page (default: 2)
 *   --skip-tiles    Skip downloading map tiles
 */

const fs = require('fs');
const path = require('path');
const mapCapture = require('./tools/map-capture');
const storyGen = require('./tools/story-generator');
const latexGen = require('./tools/latex-generator');
const geoClustering = require('./tools/geo-clustering');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
    zoom: 8,
    storiesPerPage: 3,  // Reduced from 5 to 3 for better spacing with geographic positioning
    maxSameType: 2,
    skipTiles: false
};

args.forEach(arg => {
    if (arg.startsWith('--zoom=')) options.zoom = parseInt(arg.split('=')[1]);
    if (arg.startsWith('--stories=')) options.storiesPerPage = parseInt(arg.split('=')[1]);
    if (arg.startsWith('--max-same=')) options.maxSameType = parseInt(arg.split('=')[1]);
    if (arg === '--skip-tiles') options.skipTiles = true;
});

console.log('=== No Time to Discourse - Novel Generator ===\n');
console.log('Options:', options);
console.log('');

// Output directories
const outputDir = './output';
const tilesDir = path.join(outputDir, 'tiles');
const texFile = path.join(outputDir, 'novel.tex');

// Ensure output directories exist
if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });
if (!fs.existsSync(tilesDir)) fs.mkdirSync(tilesDir, { recursive: true });

// Load disaster data
console.log('Loading disaster data...');
const disasterData = JSON.parse(fs.readFileSync('./assets/js/disasters.json', 'utf8'));
console.log(`Loaded ${disasterData.features.length} total locations`);

// Filter to only locations with notes (regions we care about)
const locationsWithNotes = disasterData.features.filter(f => f.properties.note !== null);
console.log(`Found ${locationsWithNotes.length} locations with disaster types\n`);

// Helper function to check if location is in US (excluding Canada/Mexico)
function isUSOrCanadaLocation(loc) {
    const state = loc.properties.adm1name;
    // Exclude only Mexican states
    const mexicanStates = ['Tamaulipas', 'Baja California', 'Baja California Sur',
                           'Chihuahua', 'Coahuila', 'Durango', 'Nuevo León',
                           'Sinaloa', 'Sonora'];
    return !mexicanStates.includes(state);
}

// Group locations by region
const regions = {
    westCoastHawaii: { note: [1, 7], title: 'West Coast & Hawaii', locations: [] },
    eastCoast: { note: [4], title: 'East Coast', locations: [] },
    floridaGulf: { note: [2, 3, 5], title: 'Florida & Gulf Coast', locations: [] },
    // New regions using "start" grammar rule (general disasters)
    southwest: { note: null, states: ['Arizona', 'New Mexico', 'Nevada', 'Utah', 'Colorado'],
                 title: 'Southwest', locations: [] },
    midwest: { note: null, states: ['Illinois', 'Indiana', 'Ohio', 'Michigan', 'Wisconsin', 'Minnesota', 'Iowa', 'Missouri'],
               title: 'Midwest', locations: [] },
    greatPlains: { note: null, states: ['North Dakota', 'South Dakota', 'Nebraska', 'Kansas', 'Oklahoma'],
                   title: 'Great Plains', locations: [] },
    mountainWest: { note: null, states: ['Montana', 'Wyoming', 'Idaho'],
                    title: 'Mountain West', locations: [] },
    southeastInterior: { note: null, states: ['Tennessee', 'Kentucky', 'Arkansas', 'West Virginia'],
                         title: 'Southeast Interior', locations: [] },
    northeast: { note: null, states: ['New York', 'Pennsylvania', 'Massachusetts', 'Connecticut',
                                       'Rhode Island', 'New Hampshire', 'Vermont', 'Maine'],
                 title: 'Northeast', locations: [] },
    farNorth: { note: [6], title: 'Far North', locations: [] }
};

// Add locations with specific disaster notes
locationsWithNotes.forEach(loc => {
    const note = loc.properties.note;
    if ([1, 7].includes(note)) regions.westCoastHawaii.locations.push(loc);
    else if (note === 4) regions.eastCoast.locations.push(loc);
    else if ([2, 3, 5].includes(note)) regions.floridaGulf.locations.push(loc);
    else if (note === 6) regions.farNorth.locations.push(loc);
});

// Add locations without notes to appropriate regions based on state
// Include US and Canada only (exclude Mexico)
disasterData.features.forEach(loc => {
    if (loc.properties.note === null && isUSOrCanadaLocation(loc)) {
        const state = loc.properties.adm1name;

        // Assign to regions based on state
        if (regions.southwest.states && regions.southwest.states.includes(state)) {
            regions.southwest.locations.push(loc);
        } else if (regions.midwest.states && regions.midwest.states.includes(state)) {
            regions.midwest.locations.push(loc);
        } else if (regions.greatPlains.states && regions.greatPlains.states.includes(state)) {
            regions.greatPlains.locations.push(loc);
        } else if (regions.mountainWest.states && regions.mountainWest.states.includes(state)) {
            regions.mountainWest.locations.push(loc);
        } else if (regions.southeastInterior.states && regions.southeastInterior.states.includes(state)) {
            regions.southeastInterior.locations.push(loc);
        } else if (regions.northeast.states && regions.northeast.states.includes(state)) {
            regions.northeast.locations.push(loc);
        }
        // For Canadian provinces not in defined regions, add to farNorth or eastCoast
        else {
            const lat = loc.geometry.coordinates[1];
            const canadianProvinces = ['Québec', 'Ontario', 'Manitoba', 'Saskatchewan', 'Alberta',
                                      'British Columbia', 'Yukon', 'Northwest Territories', 'Nunavut',
                                      'Newfoundland and Labrador', 'New Brunswick', 'Nova Scotia',
                                      'Prince Edward Island'];

            if (canadianProvinces.includes(state)) {
                // Western/Northern Canada goes to farNorth
                if (lat > 50 || state === 'British Columbia' || state === 'Alberta') {
                    regions.farNorth.locations.push(loc);
                }
                // Eastern Canada goes to eastCoast
                else {
                    regions.eastCoast.locations.push(loc);
                }
            }
        }
    }
});

console.log('Locations by region:');
Object.entries(regions).forEach(([key, region]) => {
    console.log(`  ${region.title}: ${region.locations.length} locations`);
});
console.log('');

/**
 * Calculate appropriate number of pages for a region
 * Targeting 50,000+ words total (each story ~100 words = 500 stories needed)
 */
function calculatePages(locationCount, storiesPerPage) {
    // Generate more stories to reach 50,000+ words
    // Allow each location to be used 3-4 times for variety
    const totalStories = locationCount * 3.75;
    return Math.ceil(totalStories / storiesPerPage);
}

/**
 * Get geographic bounds for a set of locations
 */
function getBounds(locations) {
    const lats = locations.map(l => l.geometry.coordinates[1]);
    const lons = locations.map(l => l.geometry.coordinates[0]);

    return {
        north: Math.max(...lats) + 1,
        south: Math.min(...lats) - 1,
        east: Math.max(...lons) + 1,
        west: Math.min(...lons) - 1
    };
}

/**
 * Get center point of a set of locations
 */
function getCenterPoint(locations) {
    const lats = locations.map(l => l.geometry.coordinates[1]);
    const lons = locations.map(l => l.geometry.coordinates[0]);

    return {
        lat: (Math.max(...lats) + Math.min(...lats)) / 2,
        lon: (Math.max(...lons) + Math.min(...lons)) / 2
    };
}

/**
 * Download map tiles for a region
 */
async function downloadRegionTiles(regionName, locations, zoom) {
    console.log(`\nDownloading map tiles for ${regionName}...`);

    const center = getCenterPoint(locations);
    const regionDir = path.join(tilesDir, regionName.replace(/\s+/g, '-').toLowerCase());

    if (!fs.existsSync(regionDir)) {
        fs.mkdirSync(regionDir, { recursive: true });
    }

    // Download a 3x3 grid of tiles around the center point
    const tiles = await mapCapture.downloadPointTiles(
        center.lat,
        center.lon,
        zoom,
        1, // radius = 1 means 3x3 grid
        regionDir
    );

    console.log(`Downloaded ${tiles.length} tiles for ${regionName}`);

    // Return the center tile for this region
    return tiles.find(t =>
        t.x === mapCapture.latLonToTile(center.lat, center.lon, zoom).x &&
        t.y === mapCapture.latLonToTile(center.lat, center.lon, zoom).y
    ) || tiles[0];
}

/**
 * Generate stories for a page
 */
function generatePageStories(locations, count, maxSameType) {
    return storyGen.generateDiverseStories(locations, count, maxSameType);
}

/**
 * Main generation function - organized by seasons
 */
async function generateNovel() {
    console.log('\n=== PHASE 1: Generating all stories ===\n');

    // Collect all locations from all regions
    const allLocations = [];
    Object.values(regions).forEach(region => {
        allLocations.push(...region.locations);
    });

    console.log(`Total unique locations: ${allLocations.length}`);

    // Expand locations to reach 50,000+ words
    // Target ~1350 stories total (at ~40 words each = 54,000 words)
    const targetTotalStories = 1350;
    const timesToUse = Math.ceil(targetTotalStories / allLocations.length);

    console.log(`Expanding each location ${timesToUse}x to reach ${targetTotalStories} stories`);

    const expandedLocations = [];
    for (let i = 0; i < timesToUse; i++) {
        expandedLocations.push(...allLocations);
    }

    // Shuffle for variety
    for (let i = expandedLocations.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [expandedLocations[i], expandedLocations[j]] = [expandedLocations[j], expandedLocations[i]];
    }

    console.log(`Generating ${expandedLocations.length} stories...`);

    // Generate ALL stories first (with their seasons captured)
    const allStories = [];
    for (let i = 0; i < expandedLocations.length; i++) {
        const location = expandedLocations[i];
        const story = storyGen.generateStory(location);
        allStories.push(story);

        if ((i + 1) % 100 === 0) {
            console.log(`  Generated ${i + 1}/${expandedLocations.length} stories...`);
        }
    }

    console.log(`Generated ${allStories.length} total stories`);

    // Skip seasonal organization - cluster all stories geographically
    console.log('\n=== PHASE 2: Geographic clustering (all stories) ===\n');

    // Shuffle all stories for variety before clustering
    for (let i = allStories.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allStories[i], allStories[j]] = [allStories[j], allStories[i]];
    }

    // Extract the location features from stories for clustering
    // We need to reconstruct a minimal feature object for clustering
    const storyFeatures = allStories.map(story => ({
        story: story,
        properties: {
            name: story.city,
            adm1name: story.state
        },
        geometry: {
            coordinates: story.coordinates
        }
    }));

    // Cluster stories geographically across ALL stories (not by season)
    console.log(`Clustering ${storyFeatures.length} stories into groups of ${options.storiesPerPage}...`);
    const clusters = geoClustering.clusterLocationsByProximity(storyFeatures, options.storiesPerPage);
    console.log(`Created ${clusters.length} geographic clusters (pages)`);

    // Generate pages - no chapters, just one continuous sequence
    console.log('\n=== PHASE 3: Creating pages ===\n');

    const chapters = [];
    let totalWords = 0;
    let pageCounter = 0;

    // Single chapter with all pages
    const allPages = [];
    const tileDir = path.join(tilesDir, 'all');

    for (let i = 0; i < clusters.length; i++) {
        const cluster = clusters[i];
        pageCounter++;
        console.log(`  Processing page ${pageCounter} (cluster ${i + 1}/${clusters.length}, ${cluster.length} stories)...`);

        // Extract the stories from the cluster
        const stories = cluster.map(item => item.story);

        // Use zoom 5 for multi-state/regional view
        // Download a 5x5 grid at zoom 7 for high resolution, then stitch
        const zoom = 5;  // Geographic extent (regional)
        const downloadZoom = 7;  // Higher detail for stitching
        const radius = 2;  // 5x5 grid = 25 tiles = 1280x1280 pixels stitched

        // Get coordinates from the stories
        const storyCoords = stories.map(s => s.coordinates);
        const clusterCenter = geoClustering.getCenterOfCoordinates(storyCoords);
        const clusterBounds = geoClustering.getBoundsForCoordinates(storyCoords);

        // Download and stitch map tiles for this specific cluster
        let mapImagePath = 'placeholder.jpg';
        let tileInfo = null;
        if (!options.skipTiles) {
            try {
                console.log(`    Downloading ${downloadZoom} tiles for cluster center (${clusterCenter.lat.toFixed(4)}, ${clusterCenter.lon.toFixed(4)})...`);

                // Download tiles at higher zoom for resolution
                const tiles = await mapCapture.downloadPointTiles(
                    clusterCenter.lat,
                    clusterCenter.lon,
                    downloadZoom,
                    radius,
                    tileDir
                );

                // Stitch tiles into a single high-resolution image
                const stitchedFilename = `stitched_page_${pageCounter}.jpg`;
                const stitchedPath = path.join(tileDir, stitchedFilename);
                const stitchedImage = await mapCapture.stitchTiles(tiles, stitchedPath);

                mapImagePath = path.relative(outputDir, stitchedImage.filepath);

                // Calculate tile info for the target zoom level (5)
                const displayTile = mapCapture.latLonToTile(clusterCenter.lat, clusterCenter.lon, zoom);
                tileInfo = {
                    z: zoom,
                    x: displayTile.x,
                    y: displayTile.y,
                    bounds: mapCapture.tileToBounds(displayTile.x, displayTile.y, zoom)
                };
            } catch (err) {
                console.error(`    Error processing tiles:`, err.message);
                console.log('    Continuing with placeholder...');
            }
        }

        // Count words in stories
        stories.forEach(story => {
            const words = story.story.replace(/<[^>]*>/g, '').split(/\s+/).length;
            totalWords += words;
        });

        allPages.push({
            mapImagePath: mapImagePath,
            stories: stories,
            tileInfo: tileInfo,
            clusterBounds: clusterBounds
        });
    }

    // Create a single chapter with all pages
    chapters.push({
        title: 'No Time to Discourse',
        pages: allPages
    });

    console.log(`  Generated ${allPages.length} total pages`);


    const totalStories = allStories.length;

    console.log(`\n=== Generation Summary ===`);
    console.log(`Total chapters: ${chapters.length}`);
    console.log(`Total pages: ${chapters.reduce((sum, ch) => sum + ch.pages.length, 0)}`);
    console.log(`Total stories: ${totalStories}`);
    console.log(`Estimated word count: ${totalWords.toLocaleString()} words`);
    console.log('');

    // Generate LaTeX document
    console.log('Generating LaTeX document...');
    latexGen.createLatexDocument(chapters, texFile);
    latexGen.createCompileScript('novel.tex', outputDir);

    console.log(`\n=== Novel Generation Complete! ===`);
    console.log(`LaTeX file: ${texFile}`);
    console.log(`Map tiles: ${tilesDir}`);
    console.log('');
    console.log('Next steps:');
    console.log('1. Install LaTeX if not already installed (see SETUP.md)');
    console.log('2. Compile to PDF:');
    console.log('   cd output && ./compile.sh');
    console.log('   or: cd output && pdflatex novel.tex');
}

// Run the generator
generateNovel().catch(err => {
    console.error('Error generating novel:', err);
    process.exit(1);
});
