# No Time to Discourse - NaNoGenMo Novel

A procedurally-generated ~50K-word novel created for [NaNoGenMo](https://nanogenmo.github.io/) (National Novel Generation Month).

## What is this?

This project transforms the interactive web-based "[No Time to Discourse](https://notime.now/)" speculative climate disaster atlas into a print novel. The novel combines watercolor maps from Stamen Design with procedurally-generated flash fiction stories about climate disasters across North America. The flash fiction stories are not AI-written; rather, they are constructed from bespoke language models handcrafted by Mark Sample.

## Novel Statistics

- **Word Count**: ~50,000 words (varies per generation)
- **Pages**: ~400-450 pages (varies per generation based on story placement)
- **Stories**: ~1,200 unique procedurally-generated stories from ~920 distinct locations in the U.S. and Canada (some high-population cities get multiple stories)

## How It Works

The novel is generated using:

1. **RiTa.js (v2.8.31)** - Context-free grammar expansion for story generation
2. **Grammar Rules** - Extensive rules in [assets/js/grammar.js](assets/js/grammar.js) define story patterns
3. **Disaster Data** - hundreds of locations with disaster types from [assets/js/disasters.json](assets/js/disasters.json)
4. **LaTeX** - Professional typesetting system for PDF output

Each story is unique, generated on-the-fly using:
- Procedural date generation (near-future for most, distant-future for Arctic)
- Random character names and pronouns
- Context-aware seasonal and weather details
- Location-specific Points of Interest
- Disaster-type variety

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
```

See [SETUP.md](SETUP.md) for detailed installation instructions.

## Command Line Options

```bash
node generate-novel.js [options]

Options:
  --zoom=N        Map zoom level (default: 8)
  --stories=N     Stories per page (default: 3)
  --max-same=N    Max stories of same type per page (default: 2)
  --skip-tiles    Skip downloading map tiles (faster for testing)
```

## File Structure

```
no-time-to-discourse-novel/
├── generate-novel.js          # Main novel generator
├── assets/js/
│   ├── disasters.json         # ~1,300 locations (337 with disaster notes)
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
- Personal reflections and media consumption

### Layout

Each page features:
- Background: Watercolor map tile
- Foreground: 2-3 stories in white boxes with rounded corners
- Positions: Geographically accurate with collision avoidance (stories may be reduced from 3 to 2 if overlaps detected)

## About the Original Project

"No Time to Discourse" is a web-based speculative atlas by [Mark Sample](https://www.samplereality.com). It explores climate disasters through interactive mapping and generative flash fiction.

- **Original Web Project**: [https://notime.now/](https://notime.now/)
- **Source Code**: [GitHub](https://github.com/samplereality/no-time-to-discourse)
- **License**: GPLv3

## NaNoGenMo

[NaNoGenMo](https://nanogenmo.github.io/) (National Novel Generation Month) is an annual challenge to write code that generates a novel of 50,000+ words during November.

This project successfully generates **~50,000 words** of climate disaster flash fiction (exact count varies per generation).

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
