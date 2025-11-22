# No Time to Discourse - NaNoGenMo Novel

A procedurally-generated 51,024-word novel created for [NaNoGenMo](https://nanogenmo.github.io/) (National Novel Generation Month).

## What is this?

This project transforms the interactive web-based "[No Time to Discourse](https://notime.now/)" climate disaster atlas into a print novel. The novel combines watercolor maps from Stamen Design with procedurally-generated flash fiction stories about climate disasters across North America.

## Novel Statistics

- **Word Count**: 51,024 words (exceeds the 50,000 NaNoGenMo requirement!)
- **Pages**: 255 pages
- **Stories**: 1,275 unique procedurally-generated stories
- **Chapters**: 5 geographic regions

### Chapter Breakdown

1. **West Coast & Hawaii** - 61 pages, 305 stories
2. **East Coast** - 19 pages, 95 stories
3. **Florida** - 26 pages, 130 stories
4. **Gulf Coast** - 22 pages, 110 stories
5. **Far North/Alaska** - 115 pages, 575 stories

## How It Works

The novel is generated using:

1. **RiTa.js (v2.8.31)** - Context-free grammar expansion for story generation
2. **Grammar Rules** - Extensive rules in [assets/js/grammar.js](assets/js/grammar.js) define story patterns
3. **Disaster Data** - 337 locations with disaster types from [assets/js/disasters.json](assets/js/disasters.json)
4. **LaTeX** - Professional typesetting system for PDF output

Each story is unique, generated on-the-fly using:
- Procedural date generation (near-future for most, distant-future for Arctic)
- Random character names and pronouns
- Context-aware seasonal and weather details
- Location-specific Points of Interest
- Disaster-type variety (max 2 of same type per page)

## Quick Start

### Generate the Novel

```bash
# Install dependencies
npm install

# Generate the novel (LaTeX file)
node generate-novel.js --skip-tiles

# Output: output/novel.tex
```

### Compile to PDF

```bash
# Install LaTeX (macOS)
brew install --cask mactex

# Compile
cd output
pdflatex novel.tex
pdflatex novel.tex  # Run twice for proper references
```

See [SETUP.md](SETUP.md) for detailed installation instructions.

## Command Line Options

```bash
node generate-novel.js [options]

Options:
  --zoom=N        Map zoom level (default: 8)
  --stories=N     Stories per page (default: 5)
  --max-same=N    Max stories of same type per page (default: 2)
  --skip-tiles    Skip downloading map tiles (faster for testing)
```

## File Structure

```
no-time-to-discourse-novel/
├── generate-novel.js          # Main novel generator
├── assets/js/
│   ├── disasters.json         # 337 disaster locations
│   ├── grammar.js             # Story generation rules
│   └── rita.js                # RiTa library (browser version)
├── tools/
│   ├── map-capture.js         # Download Stamen watercolor tiles
│   ├── story-generator.js     # Generate diverse stories
│   └── latex-generator.js     # Create LaTeX documents
├── output/
│   ├── novel.tex              # Generated LaTeX novel
│   ├── compile.sh             # Compilation script
│   └── tiles/                 # Downloaded map tiles
└── tests/
    ├── test-story-generator.js
    └── test-latex-generator.js
```

## Technical Details

### Story Generation

Stories are generated using a context object that provides:
- `.date()` - Future dates (3-1460 days ahead, or 15-100 years for Arctic)
- `.cityName()` - Current location name
- `.season()` - Season derived from generated date
- `.POI()` - Point of Interest from location data
- Plus many more context functions (see [claude.md](claude.md))

### Disaster Types

The grammar includes rules for:
- Wildfires and droughts (West Coast)
- Hurricanes and flooding (East Coast, Gulf Coast, Florida)
- Sea level rise (Florida)
- Oil spills and red tides (Gulf Coast)
- Ice melt and Arctic change (Far North)
- Theme park disasters (Orlando)
- Personal reflections and media consumption

### Layout

Each page features:
- Background: Watercolor map tile
- Foreground: 5 stories in semi-transparent white boxes
- Positions: Top-left, top-right, middle-left, middle-right, bottom-center

## About the Original Project

"No Time to Discourse" is a web-based speculative atlas by [Mark Sample](https://samplereality.itch.io/), professor at Davidson College. It explores climate disasters through interactive mapping and generative flash fiction.

- **Original Web Project**: [https://notime.now/](https://notime.now/)
- **Source Code**: [GitHub](https://github.com/samplereality/no-time-to-discourse)
- **License**: GPLv3

## NaNoGenMo

[NaNoGenMo](https://nanogenmo.github.io/) (National Novel Generation Month) is an annual challenge to write code that generates a novel of 50,000+ words during November.

This project successfully generates **51,024 words** of climate disaster flash fiction.

## Credits

- **Author**: Mark Sample
- **Maps**: Stamen Design watercolor tiles
- **Text Generation**: RiTa.js v2.8.31
- **Novel Generation Code**: Created for NaNoGenMo 2025

## License

Code: GPLv3
Original Content: Mark Sample

---

*"The day is hot, and the weather, and the wars, and the King, and the Dukes; it is no time to discourse."* - Henry V
