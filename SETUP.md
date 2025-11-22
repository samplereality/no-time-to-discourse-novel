# Setup Instructions for Novel Generation

## Prerequisites

### 1. Node.js Dependencies

Install the required npm packages:

```bash
npm install dayjs
```

### 2. LaTeX Installation (for PDF generation)

#### macOS
Install MacTeX (full distribution, ~4GB):
```bash
brew install --cask mactex
```

Or install BasicTeX (minimal, ~100MB) and add packages as needed:
```bash
brew install --cask basictex
sudo tlmgr update --self
sudo tlmgr install collection-fontsrecommended
sudo tlmgr install avant
sudo tlmgr install microtype
sudo tlmgr install eso-pic
sudo tlmgr install tikz
```

After installation, add LaTeX to your PATH:
```bash
export PATH="/Library/TeX/texbin:$PATH"
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install texlive-latex-extra texlive-fonts-recommended
```

#### Windows
Download and install MiKTeX from: https://miktex.org/download

### 3. Verify Installation

Check that everything is installed:

```bash
# Check Node and npm
node --version
npm --version

# Check LaTeX
pdflatex --version

# Check dayjs
npm list dayjs
```

## Directory Structure

The project will create the following structure:

```
no-time-to-discourse-novel/
├── assets/
│   └── js/
│       ├── disasters.json (disaster locations)
│       ├── grammar.js (story grammar rules)
│       ├── rita.js (RiTa.js library)
│       └── main.js (context setup)
├── tools/
│   ├── analyze_disasters.js
│   ├── map-capture.js (download map tiles)
│   ├── story-generator.js (generate stories)
│   └── latex-generator.js (create LaTeX documents)
├── output/
│   ├── tiles/ (downloaded map tiles)
│   ├── novel.tex (generated LaTeX)
│   ├── novel.pdf (compiled PDF)
│   └── compile.sh (compilation script)
└── claude.md (project memory)
```

## Usage

### Step 1: Download Map Tiles

```bash
# Download tiles for a specific region
node tools/map-capture.js <north> <south> <east> <west> <zoom> output/tiles
```

### Step 2: Generate the Novel

```bash
# Run the main generation script (to be created)
node generate-novel.js
```

### Step 3: Compile to PDF

```bash
cd output
./compile.sh
# Or manually:
pdflatex novel.tex
pdflatex novel.tex  # Run twice for proper references
```

## Testing Components

### Test Map Tile Download

```bash
# Download a small test region (e.g., San Francisco Bay Area)
node tools/map-capture.js 38 37 -121 -123 8 output/test-tiles
```

### Test Story Generation

```bash
# Test story generation (script to be created)
node test-story-generator.js
```

### Test LaTeX Generation

```bash
# Test LaTeX generation (script to be created)
node test-latex-generator.js
```

## Troubleshooting

### "pdflatex: command not found"
- Make sure LaTeX is installed
- Add LaTeX to your PATH (see installation instructions above)
- Restart your terminal after installation

### "Cannot find module 'dayjs'"
```bash
npm install dayjs
```

### LaTeX compilation errors
- Check that all required packages are installed
- Run `sudo tlmgr update --all` to update packages
- Check the `.log` file in the output directory for details

### Map tile download failures
- Check your internet connection
- The tile server may have rate limits - the script includes 100ms delays
- Some tiles may not exist at certain zoom levels

## Notes

- Map tile downloads are cached - re-running won't re-download existing tiles
- The first LaTeX compilation may take longer as fonts are cached
- Generated PDFs will be letter size (8.5" x 11")
- Story generation is random - run multiple times for different results
