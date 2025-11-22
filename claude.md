# Claude Memory: No Time to Discourse Novel Project

## Project Overview
Converting the interactive web-based "No Time to Discourse" climate disaster map into a print novel for NaNoGenMo (National Novel Generation Month). The goal is to generate 50,000+ words combining Stamen watercolor maps with procedurally-generated flash fiction stories.

## Original Web Project
- **Purpose**: Speculative atlas exploring climate disasters across North America through interactive mapping and generative flash fiction
- **Tech Stack**: Leaflet.js for maps, RiTa.js for text generation, Day.js for dates
- **Story Generation**: Grammar-based procedural generation using extensive rules in [grammar.js](assets/js/grammar.js)
- **Data**: [disasters.json](assets/js/disasters.json) contains 1,300 locations (337 with disaster notes)

## Geographic Distribution & Disaster Types
Based on the `note` property in disasters.json:

- **Note 1** (88 locations): West Coast - fires, drought, mud, heat, flood
- **Note 2** (1 location): Orlando - special Disney/theme park disasters
- **Note 3** (34 locations): Florida - sea level rise, hurricanes
- **Note 4** (26 locations): East Coast - hurricanes, storms, drought, fire, flood
- **Note 5** (29 locations): Gulf Coast - oil spills, red tides, hurricanes
- **Note 6** (153 locations): Far North/Alaska - ice/climate change (distant future dates)
- **Note 7** (6 locations): Hawaii - island-specific disasters

Grammar rules mapping:
```javascript
const ruleLookup = {
    1: "westCoast",
    2: "orlando",
    3: "florida",
    4: "eastCoast",
    5: "gulfCoast",
    6: "farNorth",
    7: "hawaii"
};
```

## Novel Structure (Agreed Upon)
**Total**: 50,000+ words, 4-5 stories per page (~40 words each)

**4 Chapters by Season** (NEW - November 2025):
1. **Winter** - Stories set in winter months (November-February)
2. **Spring** - Stories set in spring months (March-May)
3. **Summer** - Stories set in summer months (June-August)
4. **Fall** - Stories set in fall months (September-October)

All ~1350 stories are generated first, then organized by their generated season. This provides geographic variety throughout the book rather than grouping by region, which was becoming repetitive.

## Design Requirements
- **Format**: PDF (with LaTeX as intermediary for professional printing option)
- **Layout**: Stories overlaid directly on map tiles (like web version)
- **Story Count**: 4-5 stories per page
- **Variety Rule**: No more than 2 stories of the same disaster type per page (avoid repetition)
- **Map Tiles**: Programmatically capture from Stamen watercolor API: `https://watercolormaps.collection.cooperhewitt.org/tile/watercolor/{z}/{x}/{y}.jpg`

## Tools Created

### 1. analyze_disasters.js
Simple Node script to analyze the geographic distribution and disaster types in disasters.json. Outputs counts by note type and sample locations.

### 2. tools/map-capture.js
Map tile capture utility:
- Converts lat/lon to tile coordinates
- Downloads Stamen watercolor tiles for regions or points
- Includes rate limiting (100ms between downloads)
- Can download single tiles or entire regions
- CLI usage: `node map-capture.js <north> <south> <east> <west> <zoom> [outputDir]`

Functions:
- `latLonToTile(lat, lon, zoom)` - Convert coordinates to tile numbers
- `tileToBounds(x, y, zoom)` - Get lat/lon bounds for a tile
- `downloadTile(z, x, y, outputPath)` - Download single tile
- `downloadRegionTiles(bounds, zoom, outputDir)` - Download region
- `downloadPointTiles(lat, lon, zoom, radius, outputDir)` - Download tiles around a point

### 3. tools/story-generator.js
Story generation with diversity logic:
- **CRITICAL**: Replicates the COMPLETE RiTa.js context from main.js (lines 42-113)
- This context is essential for grammar expansion to work properly
- Includes all context functions: silent, pluralNoun, adjective, noun, date, time, timeOfDay, device, cityName, month, year, startYear, season, waterLevel, iceCondition, POI
- Generates stories using the same grammar rules as web version
- `generateStory(feature)` - Create single story for a location
- `identifyDisasterType(story)` - Classify disaster type from generated text
- `generateDiverseStories(features, count, maxSameType)` - Generate multiple stories with variety control

Disaster type classification: fire, drought, flood, hurricane, storm, heat, ice, oil, tide, theme-park, personal, general

**Context Functions (must match main.js exactly)**:
- `.date()` - Generates future dates (3-1460 days) or distant future (15-100 years for note=6)
- `.time()` - Current time formatted
- `.timeOfDay()` - morning/afternoon/evening/night based on current hour
- `.device()` - Randomly selects phone/tablet/computer
- `.cityName()` - Returns current feature's city name
- `.month()` - Returns month from generated date
- `.year()` - Returns year from generated date
- `.startYear()` - Calculates a year 10-30 years before current year (cached per story)
- `.season()` - Derives season from month (winter/spring/summer/fall)
- `.waterLevel()` - Random number 10-50
- `.iceCondition()` - Returns ice state based on season (for far north stories)
- `.POI()` - Point of Interest from feature properties, can be grammar rule itself

### 4. tools/latex-generator.js
LaTeX document generation for PDF output:
- Generates complete LaTeX documents with book class
- Custom `\storybox` command for positioning stories on pages
- `\backgroundimage` command for full-page map backgrounds
- Semi-transparent white boxes (85% opacity) for story text readability
- Functions:
  - `escapeLatex(text)` - Escape special LaTeX characters
  - `htmlToLatex(text)` - Convert HTML tags from RiTa to LaTeX formatting
  - `generatePreamble()` - Document setup with packages
  - `generateChapterHeader(num, title)` - Chapter formatting
  - `generatePage(mapPath, stories, pageNum)` - Page with map + stories
  - `createLatexDocument(chapters, outputPath)` - Complete document
  - `createCompileScript(texFile, outputDir)` - Helper bash script

**Story Positioning**: Uses 5 predefined positions per page:
- Top left, top right
- Middle left, middle right
- Bottom center

### 5. Testing Scripts
- **test-latex-generator.js**: Tests LaTeX generation with dummy data
- **SETUP.md**: Complete installation and usage instructions

## ✅ PROJECT COMPLETE!
1. ✅ Map tile capture utility created
2. ✅ Story generator with variety logic created
3. ✅ PDF generation system created (LaTeX-based)
4. ✅ Dependencies installed (dayjs, rita@2.8.31)
5. ✅ Main novel generation orchestrator created
6. ✅ **51,024-word novel generated!**

## Final Novel Statistics
- **Total Word Count**: 51,024 words (exceeds 50,000 NaNoGenMo requirement!)
- **Total Pages**: 255 pages
- **Total Stories**: 1,275 unique procedurally-generated stories
- **Chapters**: 5 (by geographic region)
  - West Coast & Hawaii: 61 pages, 305 stories
  - East Coast: 19 pages, 95 stories
  - Florida: 26 pages, 130 stories
  - Gulf Coast: 22 pages, 110 stories
  - Far North/Alaska: 115 pages, 575 stories

## Generated Files
- `output/novel.tex` - Complete LaTeX document (ready to compile)
- `output/compile.sh` - PDF compilation script
- `output/generation-log-final.txt` - Full generation log
- `generate-novel.js` - Main novel generator
- `test-story-generator.js` - Story generator tests
- `test-latex-generator.js` - LaTeX generator tests

## Issues Fixed During Development
1. **Grammar syntax error**: Fixed `hawaiiFire` rule (line 248) - removed extra `|)`
2. **RiTa version compatibility**: Installed rita@2.8.31 (v2, not v3) for grammar compatibility
3. **Word count target**: Adjusted story multiplier to 3.75x locations to reach 50,000+ words
4. **LaTeX double-escaping**: Fixed order - escape special chars first, THEN convert HTML to LaTeX
5. **HTML quote tags**: Added `<q>` → LaTeX quote conversion
6. **Double line breaks**: Fixed consecutive `\\` causing LaTeX errors
7. **Hawaiian Unicode**: Added `newunicodechar` package for ʻokina character (U+02BB)
8. **BasicTeX compatibility**: Removed transparent package, disabled microtype expansion
9. **TikZ coordinate errors**: Switched from TikZ `remember picture` to `textpos` package for positioning
10. **Dead cycles error**: Added `~\vfill` to give LaTeX content to process on each page
11. **Background images**: Using `\AddToShipoutPictureBG*` directly instead of custom command
12. **Directory path mismatch**: Fixed tile directory naming to use hyphenated region names
13. **LaTeX ampersand escaping**: Added `&` → `\&` escaping for file paths in LaTeX
14. **Story box padding**: Added 0.1" padding inside story boxes for better readability
15. **Arrow visibility**: Increased arrow thickness to 1.5pt and arrowhead size for better visibility
16. **Arrow positioning**: Arrows now start from edge of story box closest to target location
17. **Map tile resolution**: Increased zoom level by +2 for 4x better resolution (capped at zoom 12)
18. **Rounded corners**: Switched from `\colorbox` to TikZ nodes with 3pt rounded corners
19. **Removed arrows**: Eliminated arrow annotations for cleaner design
20. **Geographic positioning**: Story boxes now positioned at their actual lat/lon coordinates on map
21. **Zoom adjustment**: Reduced zoom by -1 for better geographic context (min zoom 5)
22. **City diversity clustering**: Modified clustering algorithm to prefer different cities within each cluster
23. **Fixed zoom level**: Changed from adaptive zoom to consistent zoom 6 for multi-state context
24. **Dual-zoom resolution**: Download tiles at zoom 8 for detail, but position based on zoom 6 extent
25. **Predefined story positions**: Replaced geographic/spiral positioning with 5 fixed positions for better distribution
26. **Tile stitching with sharp**: Installed sharp library and implemented tile stitching for high-resolution maps
27. **Zoom level 4**: Reduced to zoom 4 for very wide regional view, download 5x5 grid at zoom 6 and stitch to 1280x1280px
28. **Alternating layouts**: Created 5 different story layout patterns that alternate each page like comic book panels
29. **Staggered positioning**: Added horizontal/vertical offsets to layouts to avoid straight rows/columns for more visual interest
30. **Zoom level 5**: Increased from zoom 4 to 5 (and download zoom 6→7) for better detail while maintaining regional context
31. **Layout 3 overlap fix**: Adjusted diagonal cascade layout to prevent story 2 and story 3 from overlapping
32. **Tile download retry**: Added 3-attempt retry logic with 500ms delays to prevent blank spots from network issues
33. **Seasonal organization**: Complete restructure - generate all stories first, then organize into 4 chapters by season (Winter/Spring/Summer/Fall) instead of by geographic region, eliminating repetitive regional grouping

## PDF Compilation Status
- ✅ **Geographic clustering implemented** - Stories grouped by proximity with city diversity
- ✅ **Tile stitching** - Downloads 5x5 grid (25 tiles) at zoom 6, stitches to 1280x1280px high-resolution image using sharp
- ✅ **Alternating story layouts** - 5 different layout patterns that cycle each page like comic book panels
- ✅ **Zoom level 4** - Very wide regional view showing multiple states/large regions
- ✅ **High resolution maps** - 1280x1280px stitched images provide crisp detail at wide zoom
- ✅ **Rounded corners** - Clean TikZ nodes with 3pt rounded corners
- ✅ **City diversity** - Clustering algorithm prevents duplicate cities on same page
- ✅ **Helvetica font** - Sans-serif font for better readability
- ⚠️ **Design Issue - Transparency**: Story boxes still solid white
  - Current: Map fills page, stories in white boxes with rounded corners at geographic locations
  - Desired: Semi-transparent stories overlaid on map (like web version)
  - **TODO**: Add transparency/opacity to TikZ nodes

## Current LaTeX Architecture
- **Packages**: inputenc, fontenc, newunicodechar, graphicx, geometry, textpos, eso-pic, xcolor, **tikz** (arrows.meta), microtype, hyperref
- **Positioning**: `textpos` package with absolute positioning (units in inches)
- **Story boxes**: White `\colorbox` with `minipage` (no transparency yet)
- **Backgrounds**: `eso-pic` package with `\AddToShipoutPictureBG*`
- **Arrows**: TikZ `\mappointer` command draws from story boxes to geographic locations on map
- **TikZ**: Now using TikZ `overlay` mode (not `remember picture`) which avoids `\pgfsyspdfmark` errors

## Technical Notes
- **RiTa version**: Must use rita@2.8.31 (v2.x), not v3.x - grammar syntax incompatible with v3
- **Dependencies installed**: dayjs, rita@2.8.31
- **LaTeX**: Full MacTeX recommended (BasicTeX has package limitations)
- **Compile command**: `pdflatex novel.tex` (single run sufficient - no TOC or cross-references)

## Dependencies Needed
```json
{
  "dayjs": "^1.x",
  "pdfkit": "^0.x" (alternative to LaTeX),
  "canvas": "^2.x" (for image manipulation),
  "sharp": "^0.x" (for image processing - alternative to canvas)
}
```

## Output Specification
- PDF format
- Each page: background map tile + 4-5 overlaid stories
- Stories positioned to not obscure map features
- Typography should be readable against watercolor backgrounds
- Consider semi-transparent text boxes or strategic placement

## Author Information
- **Author**: Mark Sample
- **Institution**: Davidson College, Film, Media, and Digital Studies
- **Project Philosophy**: "narrativizes data" - Rita Raley's call for electronic literature
- **License**: GPLv3 for code, MIT for package

## Version
Current web version: 1.7.2
Novel generator: v1.0 (PDF compiles successfully, needs design refinement)

## ✅ MAJOR UPDATE: Geographic Clustering & Arrow Annotations Implemented!

### New Implementation (November 2025)

Complete redesign of novel generation to match the web version's annotated map aesthetic:

**1. Geographic Clustering** ([tools/geo-clustering.js](tools/geo-clustering.js))
- `clusterLocationsByProximity()`: Groups nearby locations using greedy clustering algorithm
- `calculateZoomForCluster()`: Adaptive zoom levels (5-10) based on cluster geographic spread
- `getCenterOfCoordinates()`: Calculates center point of story clusters
- `haversineDistance()`: Accurate geographic distance calculation

**2. Matched Map Tiles** ([generate-novel.js](generate-novel.js))
```javascript
// NEW: Cluster locations geographically first
const clusters = geoClustering.clusterLocationsByProximity(region.locations, options.storiesPerPage);

// NEW: One page per cluster
for (const cluster of clusters) {
    const stories = cluster.map(location => storyGen.generateStory(location));
    const zoom = geoClustering.calculateZoomForCluster(cluster);
    const clusterCenter = geoClustering.getCenterOfCoordinates(stories.map(s => s.coordinates));

    // Download tile specific to THIS cluster
    const mapTile = await mapCapture.downloadPointTiles(clusterCenter.lat, clusterCenter.lon, zoom, 0, tilesDir);

    // Store tile bounds for arrow positioning
    tileInfo = {
        z: zoom,
        x: mapTile.x,
        y: mapTile.y,
        bounds: mapCapture.tileToBounds(mapTile.x, mapTile.y, zoom)
    };
}
```

**3. Arrow Annotations** ([tools/latex-generator.js](tools/latex-generator.js))
```javascript
// Convert lat/lon to position on map tile
function coordToTilePosition(lat, lon, tileBounds) {
    const x = (lon - tileBounds.west) / (tileBounds.east - tileBounds.west);
    const y = (tileBounds.north - lat) / (tileBounds.north - tileBounds.south);
    return { x: Math.max(0, Math.min(1, x)), y: Math.max(0, Math.min(1, y)) };
}

// Convert tile position to page coordinates
function tilePositionToPageCoords(normalizedPos) {
    return {
        x: 0.5 + (normalizedPos.x * 7.5),  // 8.5" page - 1" margins
        y: 0.5 + (normalizedPos.y * 10)    // 11" page - 1" margins
    };
}

// In generatePage():
const mapPos = tilePositionToPageCoords(coordToTilePosition(lat, lon, tileInfo.bounds));
latex += `\\mappointer{${storyStartX}}{${storyStartY}}{${mapPos.x}}{${mapPos.y}}\n\n`;
```

**4. LaTeX Arrow Command**:
```latex
\newcommand{\mappointer}[4]{%
  \begin{tikzpicture}[overlay]
    \draw[-{Stealth[length=2mm]}, line width=0.5pt, black!70]
      (#1in,#2in) -- (#3in,#4in);
  \end{tikzpicture}%
}
```

### Results
- **170 pages** (one per geographic cluster)
- **337 stories** (each location used once)
- **170 unique map tiles** (centered on each cluster)
- **338 TikZ arrows** pointing from stories to exact map locations
- **Adaptive zoom**: zoom 5-10 based on cluster spread

### Next Step: Transparency Effect
To achieve the desired semi-transparent overlay effect (like the web version):

**Option 1: TikZ with transparency (if we can fix the coordinate system)**
```latex
\usepackage{tikz}
\usetikzlibrary{calc}
% In storybox command:
\begin{tikzpicture}
  \node[fill=white, fill opacity=0.85, text opacity=1, ...] {...};
\end{tikzpicture}
```

**Option 2: Using transparent package**
```latex
\usepackage{transparent}
% In storybox command:
{\transparent{0.85}\colorbox{white}{...}}
```

**Option 3: xcolor with opacity (may require additional packages)**
```latex
\usepackage{xcolor}
\definecolor{transwhite}{rgb}{1,1,1}
% Then use \colorbox with alpha channel
```

**Current blocker**: TikZ `remember picture` causes `\pgfsyspdfmark` errors even with full MacTeX. The `textpos` + `\colorbox` solution works but doesn't support transparency.
