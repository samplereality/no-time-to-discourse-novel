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
        //.replace(/[\u2013\u2014]/g, '-')
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
\\usepackage[margin=0.5in,top=0.75in,bottom=0.75in,footskip=0.5in]{geometry}
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

% Use single spacing after periods (not double)
\\frenchspacing

% Define Hawaiian 'okina character (U+02BB)
\\newunicodechar{ʻ}{\\textquotesingle}

% Page style - no headers or footers (page numbers added manually per page)
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

\\noindent This novel was generated for NaNoGenMo (National Novel Generation Month), transforming the web-based interactive experience of https://notime.now/ into a print format. Each page combines watercolor maps from Stamen Design with works of flash fiction, which are procedurally-generated through bespoke RiTa.js grammars developed by Mark Sample.

\\vspace{0.3in}

\\noindent Each of the stories in this novel is a work of fiction, yet each also attempts to capture at a human level the realities of climate disaster.

\\vspace{0.3in}

\\noindent\\textbf{Original Web Project:} \\url{https://notime.now/}

\\noindent\\textbf{Code Repository:} \\url{https://github.com/samplereality/no-time-to-discourse-novel}

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

// Story box dimensions (shared constants)
const BOX_WIDTH = 2.75;   // actual measured width in inches
const BOX_HEIGHT = 2.45;  // actual measured max height in inches
const MARGIN = 0.3;       // minimum gap between boxes

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

    // Map margins (maps now have 0.25" margin on all sides)
    const MAP_MARGIN = 0.25;
    const EDGE_PADDING = 0.15; // extra padding from page edges (a skosh!)

    // Calculate normalized position (0-1) within tile bounds
    const normalizedX = (lon - tileBounds.west) / (tileBounds.east - tileBounds.west);
    const normalizedY = (tileBounds.north - lat) / (tileBounds.north - tileBounds.south);

    // Convert to page coordinates
    // Page is 8.5" x 11"
    // Map has 0.25" margins, so map area is 8" x 10.5"
    // Map starts at (0.25", 0.25")
    const originalX = MAP_MARGIN + (normalizedX * 8.0);
    const originalY = MAP_MARGIN + (normalizedY * 10.5);

    /**
     * Check if two bounding boxes overlap
     * Coordinates: (x,y) is bottom-left corner, Y increases upward
     */
    function boxesOverlap(x1, y1, x2, y2) {
        // Box 1 bounds (with margin)
        // (x,y) is bottom-left, so box extends right and up
        const box1Left = x1 - MARGIN;
        const box1Right = x1 + BOX_WIDTH + MARGIN;
        const box1Bottom = y1 - MARGIN;  // Y coordinate of bottom edge
        const box1Top = y1 + BOX_HEIGHT + MARGIN;  // Y coordinate of top edge

        // Box 2 bounds (with margin)
        const box2Left = x2 - MARGIN;
        const box2Right = x2 + BOX_WIDTH + MARGIN;
        const box2Bottom = y2 - MARGIN;
        const box2Top = y2 + BOX_HEIGHT + MARGIN;

        // Check for overlap (if boxes DON'T overlap, one of these will be true)
        const noOverlap = (
            box1Right < box2Left ||   // box1 is completely to the left of box2
            box1Left > box2Right ||   // box1 is completely to the right of box2
            box1Top < box2Bottom ||   // box1 is completely below box2 (Y increases upward!)
            box1Bottom > box2Top      // box1 is completely above box2
        );

        return !noOverlap;
    }

    // Generate candidate positions in a spiral pattern
    const candidatePositions = [];

    // Add the original position first
    candidatePositions.push({ x: originalX, y: originalY });

    // Generate spiral positions radiating outward
    const angleSteps = 16; // Try 16 angles per ring
    const maxRings = 10;   // Try up to 10 rings outward

    for (let ring = 1; ring <= maxRings; ring++) {
        const radius = ring * 0.75; // Each ring is 0.75" further out
        for (let i = 0; i < angleSteps; i++) {
            const angle = (i / angleSteps) * Math.PI * 2;
            candidatePositions.push({
                x: originalX + Math.cos(angle) * radius,
                y: originalY + Math.sin(angle) * radius
            });
        }
    }

    // Define valid area boundaries (with edge padding)
    const minX = MAP_MARGIN + EDGE_PADDING;
    const maxX = 8.5 - MAP_MARGIN - EDGE_PADDING;
    const minY = MAP_MARGIN + EDGE_PADDING;
    const maxY = 11 - MAP_MARGIN - EDGE_PADDING;

    // Filter candidates to only valid positions (within bounds and no overlap)
    const validPositions = [];

    for (const testPos of candidatePositions) {
        // Check if box would fit within map boundaries

        if (testPos.x < minX || testPos.x + BOX_WIDTH > maxX ||
            testPos.y < minY || testPos.y + BOX_HEIGHT > maxY) {
            continue; // Out of bounds
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
            // Calculate distance from original position (for scoring)
            const distance = Math.sqrt(
                Math.pow(testPos.x - originalX, 2) +
                Math.pow(testPos.y - originalY, 2)
            );
            validPositions.push({
                x: testPos.x,
                y: testPos.y,
                distance: distance
            });
        }
    }

    // If we found valid positions, return the one closest to the original location
    if (validPositions.length > 0) {
        // Sort by distance (closest first)
        validPositions.sort((a, b) => a.distance - b.distance);
        const best = validPositions[0];

        if (best.distance > 0.5) {
            console.log(`  Placed story ${Math.round(best.distance * 100) / 100}" from true location (${validPositions.length} candidates)`);
        }

        return { x: best.x, y: best.y };
    }

    // If no valid positions found, this is a serious problem
    // Try to find ANY position on the page that doesn't overlap
    console.warn(`  WARNING: Could not find position in spiral! Searching entire page...`);

    // Create a grid of positions across the entire page
    const gridPositions = [];
    const stepSize = 0.5; // Check every 0.5 inches

    for (let x = minX; x <= maxX - BOX_WIDTH; x += stepSize) {
        for (let y = minY; y <= maxY - BOX_HEIGHT; y += stepSize) {
            gridPositions.push({ x, y });
        }
    }

    // Find valid grid positions
    for (const testPos of gridPositions) {
        let hasOverlap = false;
        for (const used of usedPositions) {
            if (boxesOverlap(testPos.x, testPos.y, used.x, used.y)) {
                hasOverlap = true;
                break;
            }
        }

        if (!hasOverlap) {
            console.log(`  Found fallback position at (${testPos.x.toFixed(2)}, ${testPos.y.toFixed(2)})`);
            return testPos;
        }
    }

    // Absolute last resort - place it anyway and warn loudly
    console.error(`  ERROR: NO VALID POSITION EXISTS! This story will overlap!`);
    return {
        x: Math.max(minX, Math.min(originalX, maxX - BOX_WIDTH)),
        y: Math.max(minY, Math.min(originalY, maxY - BOX_HEIGHT))
    };
}

/**
 * Test if stories can be placed on a page without overlap
 * Returns array of stories that can fit (may be fewer than input if some can't fit)
 *
 * @param {Array} stories - Array of story objects with coordinates
 * @param {Object} tileInfo - Tile information including bounds
 * @returns {Array} Stories that can fit on the page
 */
function getStoriesThatFit(stories, tileInfo) {
    const usedPositions = [];
    const fittingStories = [];

    for (const story of stories) {
        const pos = coordToPagePosition(
            story.coordinates[1],  // latitude
            story.coordinates[0],  // longitude
            tileInfo.bounds,
            usedPositions
        );

        // Check if this position actually avoids overlap
        let hasOverlap = false;
        for (const used of usedPositions) {
            const box1Left = pos.x - MARGIN;
            const box1Right = pos.x + BOX_WIDTH + MARGIN;
            const box1Bottom = pos.y - MARGIN;
            const box1Top = pos.y + BOX_HEIGHT + MARGIN;

            const box2Left = used.x - MARGIN;
            const box2Right = used.x + BOX_WIDTH + MARGIN;
            const box2Bottom = used.y - MARGIN;
            const box2Top = used.y + BOX_HEIGHT + MARGIN;

            const noOverlap = (
                box1Right < box2Left ||
                box1Left > box2Right ||
                box1Top < box2Bottom ||
                box1Bottom > box2Top
            );

            if (!noOverlap) {
                hasOverlap = true;
                break;
            }
        }

        if (!hasOverlap) {
            fittingStories.push(story);
            usedPositions.push(pos);
        }
    }

    return fittingStories;
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
    // Pre-check: see if all stories will fit
    const fittingStories = getStoriesThatFit(stories, tileInfo);
    if (fittingStories.length < stories.length) {
        console.log(`  Page ${pageNumber}: Only ${fittingStories.length}/${stories.length} stories fit, reducing page content`);
        stories = fittingStories;
    }
    // Escape ampersands in file paths for LaTeX
    const escapedMapPath = mapImagePath.replace(/&/g, '\\&');

    let latex = `
% Page ${pageNumber}
\\AddToShipoutPictureBG*{%
  \\put(0.25in,0.25in){%
    \\includegraphics[width=8in,height=10.5in,keepaspectratio=false]{${escapedMapPath}}%
  }%
  % Page number in bottom margin (below map)
  \\put(4.25in,0.05in){%
    \\makebox[0pt]{- ${pageNumber} -}%
  }%
}%
~\\vfill

`;

    // Sequential placement with geographic priority
    // Place stories at their actual geographic coordinates, with collision avoidance
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

        // Get geographic position for this story
        // coordToPagePosition will try the exact coordinates first, then spiral out if needed
        const pos = coordToPagePosition(
            story.coordinates[1],  // latitude
            story.coordinates[0],  // longitude
            tileInfo.bounds,
            usedPositions
        );

        // Verify no overlap before adding (diagnostic check)
        for (const used of usedPositions) {
            const box1Left = pos.x - MARGIN;
            const box1Right = pos.x + BOX_WIDTH + MARGIN;
            const box1Bottom = pos.y - MARGIN;
            const box1Top = pos.y + BOX_HEIGHT + MARGIN;

            const box2Left = used.x - MARGIN;
            const box2Right = used.x + BOX_WIDTH + MARGIN;
            const box2Bottom = used.y - MARGIN;
            const box2Top = used.y + BOX_HEIGHT + MARGIN;

            const noOverlap = (
                box1Right < box2Left ||
                box1Left > box2Right ||
                box1Top < box2Bottom ||
                box1Bottom > box2Top
            );

            if (!noOverlap) {
                console.warn(`  WARNING: Page ${pageNumber}, story ${index + 1} WILL OVERLAP with existing story!`);
                console.warn(`    New: (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)})`);
                console.warn(`    Existing: (${used.x.toFixed(2)}, ${used.y.toFixed(2)})`);
            }
        }

        // Add this position to used positions
        usedPositions.push(pos);

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

\\noindent Maps: Stamen Design watercolor tiles

\\vspace{0.2in}

\\noindent Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}

\\vspace{0.2in}

\\noindent Code available under GPLv3 license at:\\\\
\\url{https://github.com/samplereality/no-time-to-discourse-novel}

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
