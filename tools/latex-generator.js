/**
 * LaTeX Generator for No Time to Discourse Novel
 * Creates LaTeX document with map images and overlaid stories
 */

const fs = require('fs');
const path = require('path');

/**
 * Remove or transliterate non-ASCII characters that cause LaTeX errors
 */
function sanitizeUnicode(text) {
    if (!text) return '';

    // Replace common Unicode characters with ASCII equivalents
    return text
        // Remove Cyrillic and other non-Latin characters entirely
        .replace(/[\u0400-\u04FF]/g, '')  // Cyrillic
        .replace(/[\u4E00-\u9FFF]/g, '')  // CJK
        .replace(/[\u3040-\u309F]/g, '')  // Hiragana
        .replace(/[\u30A0-\u30FF]/g, '')  // Katakana
        // Smart quotes to regular quotes
        .replace(/[\u2018\u2019]/g, "'")  // Single quotes
        .replace(/[\u201C\u201D]/g, '"')  // Double quotes
        // Em/en dashes to hyphens
        .replace(/[\u2013\u2014]/g, '-')
        // Other punctuation
        .replace(/\u2026/g, '...')        // Ellipsis
        // Keep only ASCII printable characters plus newlines/tabs
        .replace(/[^\x20-\x7E\n\r\t]/g, '');
}

/**
 * Escape special LaTeX characters in text
 */
function escapeLatex(text) {
    if (!text) return '';

    // First sanitize Unicode
    text = sanitizeUnicode(text);

    return text
        .replace(/\\/g, '\\textbackslash{}')
        .replace(/&/g, '\\&')
        .replace(/%/g, '\\%')
        .replace(/\$/g, '\\$')
        .replace(/#/g, '\\#')
        .replace(/_/g, '\\_')
        .replace(/\{/g, '\\{')
        .replace(/\}/g, '\\}')
        .replace(/~/g, '\\textasciitilde{}')
        .replace(/\^/g, '\\textasciicircum{}');
}

/**
 * Convert HTML tags from RiTa output to LaTeX
 */
function htmlToLatex(text) {
    if (!text) return '';

    return text
        .replace(/<strong>(.*?)<\/strong>/g, '\\textbf{$1}')
        .replace(/<em>(.*?)<\/em>/g, '\\textit{$1}')
        .replace(/<q>/gi, '``')           // Opening quote
        .replace(/<\/q>/gi, "''")         // Closing quote (LaTeX style)
        .replace(/<br\s*\/?>/gi, '\\\\\n')
        .replace(/<br>/gi, '\\\\\n')
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<p>/gi, '')
        .replace(/\\\\\n\\\\\n/g, '\\\\\n'); // Fix double line breaks that cause LaTeX errors
}


/**
 * Generate LaTeX preamble with packages and settings
 */
function generatePreamble() {
    return `\\documentclass[11pt,letterpaper]{book}

% Packages
\\usepackage[utf8]{inputenc}
\\usepackage[T1]{fontenc}
\\usepackage{newunicodechar}
\\usepackage{graphicx}
\\usepackage[margin=0.5in,top=0.75in,bottom=0.75in]{geometry}
\\usepackage[absolute,overlay]{textpos}
\\usepackage{eso-pic}
\\usepackage{xcolor}
\\usepackage{tikz}
\\usetikzlibrary{arrows.meta}
\\usepackage{microtype}
\\usepackage[hidelinks]{hyperref}

% Use Helvetica (sans-serif) as the main font for better readability
\\usepackage{helvet}
\\renewcommand{\\familydefault}{\\sfdefault}

% Define Hawaiian 'okina character (U+02BB)
\\newunicodechar{ʻ}{\\textquotesingle}

% Page style
\\pagestyle{empty}

% Set textpos units to inches
\\setlength{\\TPHorizModule}{1in}
\\setlength{\\TPVertModule}{1in}

% Custom commands for story placement using TikZ for rounded corners
\\newcommand{\\storybox}[3]{% #1=x, #2=y, #3=text
  \\begin{textblock}{3}(#1,#2)
    \\noindent%
    \\begin{tikzpicture}
      \\node[rectangle, rounded corners=3pt, fill=white, inner sep=0.1in, text width=2.55in, align=left] {%
        \\small\\sffamily #3%
      };
    \\end{tikzpicture}%
  \\end{textblock}%
}

\\begin{document}

% Title page
\\begin{titlepage}
\\centering
\\vspace*{2in}

{\\Huge\\sffamily\\bfseries No Time to Discourse}

\\vspace{0.5in}

{\\Large\\sffamily A Speculative Atlas of Climate Disaster}

\\vspace{0.5in}

{\\large\\sffamily A Procedurally Generated Novel}

\\vspace{1in}

{\\large\\sffamily by Mark Sample}

\\vfill

{\\normalsize\\sffamily Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}}

\\end{titlepage}

% About page
\\newpage
\\section*{About This Novel}

\\noindent\\textit{No Time to Discourse} is a speculative atlas that explores climate disaster across North America through interactive mapping and generative flash fiction.

\\vspace{0.3in}

This novel was generated for NaNoGenMo (National Novel Generation Month), transforming the web-based interactive experience into a print format. Each page combines watercolor maps from Stamen Design with procedurally-generated stories created through RiTa.js grammars.

\\vspace{0.3in}

Each of the stories in this novel is a work of fiction, yet each also attempts to capture at a human level the realities of climate disaster.

\\vspace{0.3in}

\\textbf{Original Web Project:} \\url{https://notime.now/}

\\textbf{Code Repository:} \\url{https://github.com/samplereality/no-time-to-discourse-novel}

\\clearpage

% Henry V quote on its own page
\\vspace*{\\fill}
\\begin{center}
  {\\Large\\textit{"The day is hot, and the weather, and the wars, and the King,\\\\
  and the Dukes; it is no time to discourse."}}

  \\vspace{0.3in}

  --- Henry V
\\end{center}
\\vspace*{\\fill}
\\clearpage

`;
}

/**
 * Generate a chapter header on its own page
 * For single-chapter books, just show the title without "Chapter 1"
 */
function generateChapterHeader(chapterNumber, chapterTitle) {
    const escapedTitle = escapeLatex(chapterTitle);
    return `
% Title page
\\clearpage
\\vspace*{\\fill}
\\begin{center}
  {\\Huge\\sffamily\\bfseries ${escapedTitle}}
\\end{center}
\\vspace*{\\fill}
\\clearpage

`;
}

/**
 * Convert lat/lon coordinates to position on the page with overlap prevention
 * based on the map tile bounds
 *
 * @param {Number} lat - Latitude
 * @param {Number} lon - Longitude
 * @param {Object} tileBounds - { north, south, east, west }
 * @param {Array} usedPositions - Array of already used {x, y} positions
 * @param {Number} minDistance - Minimum distance between story boxes (in inches)
 * @returns {Object} { x, y } position in inches on the page
 */
function coordToPagePosition(lat, lon, tileBounds, usedPositions = []) {
    // Story box dimensions (from LaTeX definition)
    const BOX_WIDTH = 3.0;   // textblock width in inches
    const BOX_HEIGHT = 2.0;  // estimated height for typical story
    const MARGIN = 0.2;      // minimum gap between boxes

    // Calculate normalized position (0-1) within tile bounds
    const normalizedX = (lon - tileBounds.west) / (tileBounds.east - tileBounds.west);
    const normalizedY = (tileBounds.north - lat) / (tileBounds.north - tileBounds.south);

    // Convert to page coordinates (8.5" x 11" page with 0.5" margins)
    // Page content area: 7.5" wide x 10" tall
    const originalX = 0.5 + (normalizedX * 7.5);
    const originalY = 0.5 + (normalizedY * 10);

    /**
     * Check if two bounding boxes overlap
     */
    function boxesOverlap(x1, y1, x2, y2) {
        // Box 1 bounds (with margin)
        const box1Left = x1 - MARGIN;
        const box1Right = x1 + BOX_WIDTH + MARGIN;
        const box1Top = y1 - MARGIN;
        const box1Bottom = y1 + BOX_HEIGHT + MARGIN;

        // Box 2 bounds (with margin)
        const box2Left = x2 - MARGIN;
        const box2Right = x2 + BOX_WIDTH + MARGIN;
        const box2Top = y2 - MARGIN;
        const box2Bottom = y2 + BOX_HEIGHT + MARGIN;

        // Check for overlap (if boxes DON'T overlap, one of these will be true)
        const noOverlap = (
            box1Right < box2Left ||   // box1 is completely to the left of box2
            box1Left > box2Right ||   // box1 is completely to the right of box2
            box1Bottom < box2Top ||   // box1 is completely above box2
            box1Top > box2Bottom      // box1 is completely below box2
        );

        return !noOverlap;
    }

    // Try positions in a spiral pattern starting from the original position
    const spiralPositions = [];

    // Add the original position first
    spiralPositions.push({ x: originalX, y: originalY });

    // Generate spiral positions radiating outward
    // With 3 stories per page, we need fewer but better-spaced positions
    const angleSteps = 16; // Try 16 angles per ring for comprehensive coverage
    const maxRings = 10;   // Try up to 10 rings outward (covers ~7.5" radius)

    for (let ring = 1; ring <= maxRings; ring++) {
        const radius = ring * 0.75; // Each ring is 0.75" further out
        for (let i = 0; i < angleSteps; i++) {
            const angle = (i / angleSteps) * Math.PI * 2;
            spiralPositions.push({
                x: originalX + Math.cos(angle) * radius,
                y: originalY + Math.sin(angle) * radius
            });
        }
    }

    // Try each position until we find one that doesn't overlap
    let testedCount = 0;
    let rejectedBoundary = 0;
    let rejectedOverlap = 0;

    for (const testPos of spiralPositions) {
        testedCount++;

        // Check if box would fit within page boundaries (accounting for box size)
        // Page is 8.5" × 11" with 0.5" margins, so content area is 7.5" × 10"
        // Left edge must be >= 0.5, right edge (x + width) must be <= 8.0
        // Top edge must be >= 0.5, bottom edge (y + height) must be <= 10.5
        if (testPos.x < 0.5 || testPos.x + BOX_WIDTH > 8.0 ||
            testPos.y < 0.5 || testPos.y + BOX_HEIGHT > 10.5) {
            rejectedBoundary++;
            continue;
        }

        // Check for overlap with all existing boxes
        let hasOverlap = false;
        for (const used of usedPositions) {
            if (boxesOverlap(testPos.x, testPos.y, used.x, used.y)) {
                hasOverlap = true;
                break;
            }
        }

        if (!hasOverlap) {
            // Found a good position!
            if (testedCount > 10) {
                console.log(`  Found position after ${testedCount} attempts (${rejectedBoundary} boundary, ${rejectedOverlap} overlap)`);
            }
            return testPos;
        } else {
            rejectedOverlap++;
        }
    }

    // If all positions failed, log warning and return the original position
    console.warn(`  WARNING: Could not find non-overlapping position after ${testedCount} attempts! Using original position.`);
    return {
        x: Math.max(0.5, Math.min(originalX, 8.0 - BOX_WIDTH)),
        y: Math.max(0.5, Math.min(originalY, 10.5 - BOX_HEIGHT))
    };
}

/**
 * Generate a single page with map background and stories
 *
 * @param {String} mapImagePath - Path to the map tile image
 * @param {Array} stories - Array of story objects with coordinates
 * @param {Number} pageNumber - Page number for reference
 * @param {Object} tileInfo - Tile information including bounds
 */
function generatePage(mapImagePath, stories, pageNumber, tileInfo) {
    // Escape ampersands in file paths for LaTeX
    const escapedMapPath = mapImagePath.replace(/&/g, '\\&');

    let latex = `
% Page ${pageNumber}
\\AddToShipoutPictureBG*{%
  \\includegraphics[width=\\paperwidth,height=\\paperheight,keepaspectratio=false]{${escapedMapPath}}%
}%
~\\vfill

`;

    // Calculate positions based on actual geographic coordinates with overlap prevention
    // Track used positions to prevent overlaps
    const usedPositions = [];

    stories.forEach((story, index) => {
        // Process the story text
        // IMPORTANT: Escape first, then convert HTML to LaTeX
        // This way user content is escaped, but LaTeX commands we create are not
        let storyText = story.story;
        storyText = escapeLatex(storyText);
        storyText = htmlToLatex(storyText);

        // Add location header
        const locationText = `\\textbf{${escapeLatex(story.location)}}\\\\[0.1in]\n${storyText}`;

        // Calculate position based on story's actual coordinates
        let pos;
        if (tileInfo && tileInfo.bounds && story.coordinates) {
            const [lon, lat] = story.coordinates;
            pos = coordToPagePosition(lat, lon, tileInfo.bounds, usedPositions);
            usedPositions.push(pos);  // Track this position
        } else {
            // Fallback to simple grid if tile info not available
            const gridPos = index % 5;
            const positions = [
                { x: 0.5, y: 1.0 }, { x: 5.0, y: 1.0 },
                { x: 0.5, y: 5.0 }, { x: 5.0, y: 5.0 },
                { x: 2.75, y: 8.0 }
            ];
            pos = positions[gridPos];
        }

        latex += `\\storybox{${pos.x.toFixed(2)}}{${pos.y.toFixed(2)}}{${locationText}}\n\n`;
    });

    latex += `\\clearpage\n\n`;

    return latex;
}

/**
 * Generate the document epilogue
 */
function generateEpilogue() {
    return `
% Colophon
\\clearpage
\\vspace*{\\fill}

\\noindent\\small\\sffamily
This novel was procedurally generated using RiTa.js grammar rules written by Mark Sample.

\\vspace{0.2in}

Maps: Stamen Design watercolor tiles

\\vspace{0.2in}

Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

\\vspace{0.2in}

Code available under GPLv3 license at:\\\\
\\url{https://github.com/samplereality/no-time-to-discourse}

\\end{document}
`;
}

/**
 * Create a complete LaTeX document
 */
function createLatexDocument(chapters, outputPath) {
    let latex = generatePreamble();

    chapters.forEach((chapter, index) => {
        latex += generateChapterHeader(index + 1, chapter.title);

        chapter.pages.forEach((page, pageIndex) => {
            latex += generatePage(page.mapImagePath, page.stories, pageIndex + 1, page.tileInfo);
        });
    });

    latex += generateEpilogue();

    // Write to file
    fs.writeFileSync(outputPath, latex, 'utf8');
    console.log(`LaTeX document written to: ${outputPath}`);

    return latex;
}

/**
 * Create a simple compile script
 */
function createCompileScript(texFilename, outputDir) {
    const scriptContent = `#!/bin/bash
# Compile the LaTeX document to PDF

echo "Compiling ${texFilename} to PDF..."

# Single pdflatex run is sufficient (no TOC or cross-references to resolve)
pdflatex -interaction=nonstopmode -output-directory="${outputDir}" "${texFilename}"

echo "Done! PDF created."
`;

    const scriptPath = path.join(outputDir, 'compile.sh');
    fs.writeFileSync(scriptPath, scriptContent, 'utf8');
    fs.chmodSync(scriptPath, '755');

    console.log(`Compile script created: ${scriptPath}`);
}

module.exports = {
    escapeLatex,
    htmlToLatex,
    generatePreamble,
    generateChapterHeader,
    generatePage,
    generateEpilogue,
    createLatexDocument,
    createCompileScript
};
