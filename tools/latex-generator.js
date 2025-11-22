/**
 * LaTeX Generator for No Time to Discourse Novel
 * Creates LaTeX document with map images and overlaid stories
 */

const fs = require('fs');
const path = require('path');

/**
 * Escape special LaTeX characters in text
 */
function escapeLatex(text) {
    if (!text) return '';

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

{\\large\\sffamily Procedurally Generated Novel}

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

The project follows Rita Raley's call for electronic literature that "narrativizes data." Each of the stories in this novel is a work of fiction, yet each also attempts to capture at a human level the realities of climate disaster.

\\vspace{0.3in}

\\textbf{Original Web Project:} \\url{https://notime.now/}

\\textbf{Code Repository:} \\url{https://github.com/samplereality/no-time-to-discourse}

\\vspace{0.3in}

\\textit{"The day is hot, and the weather, and the wars, and the King, and the Dukes; it is no time to discourse."} --- Henry V

\\clearpage

`;
}

/**
 * Generate a chapter header on its own page
 */
function generateChapterHeader(chapterNumber, chapterTitle) {
    const escapedTitle = escapeLatex(chapterTitle);
    return `
% Chapter ${chapterNumber}
\\clearpage
\\vspace*{\\fill}
\\begin{center}
  {\\Huge\\sffamily\\bfseries Chapter ${chapterNumber}}\\\\[0.5in]
  {\\LARGE\\sffamily ${escapedTitle}}
\\end{center}
\\vspace*{\\fill}
\\clearpage

`;
}

/**
 * Generate a single page with map background and stories
 *
 * @param {String} mapImagePath - Path to the map tile image
 * @param {Array} stories - Array of story objects with coordinates
 * @param {Number} pageNumber - Page number for reference
 */
function generatePage(mapImagePath, stories, pageNumber) {
    // Escape ampersands in file paths for LaTeX
    const escapedMapPath = mapImagePath.replace(/&/g, '\\&');

    let latex = `
% Page ${pageNumber}
\\AddToShipoutPictureBG*{%
  \\includegraphics[width=\\paperwidth,height=\\paperheight,keepaspectratio=false]{${escapedMapPath}}%
}%
~\\vfill

`;

    // Define 5 different layouts that alternate like comic book panels
    // Each layout provides visual variety with staggered, non-linear positioning
    const layouts = [
        // Layout 1: Classic corners + center (slightly staggered)
        [
            { x: 0.5, y: 1.0 },   // Top left
            { x: 5.2, y: 1.2 },   // Top right (offset)
            { x: 0.7, y: 4.5 },   // Middle left (offset)
            { x: 4.8, y: 4.7 },   // Middle right (offset)
            { x: 2.75, y: 8.0 }   // Bottom center
        ],
        // Layout 2: Staggered verticals with horizontal variety
        [
            { x: 0.5, y: 1.0 },   // Top left
            { x: 1.2, y: 4.0 },   // Middle left (shifted right)
            { x: 0.8, y: 7.0 },   // Bottom left (slight shift)
            { x: 4.8, y: 2.5 },   // Right upper
            { x: 4.2, y: 5.5 }    // Right lower (shifted left)
        ],
        // Layout 3: Diagonal cascade (more spacing, staggered)
        [
            { x: 0.5, y: 0.75 },  // Top left
            { x: 1.5, y: 3.5 },   // Upper middle (shifted left to avoid overlap)
            { x: 3.8, y: 6.2 },   // Center (shifted right and down to avoid overlap)
            { x: 5.0, y: 8.5 },   // Lower right (more spacing)
            { x: 4.2, y: 1.5 }    // Top right (breaks pattern, further from top left)
        ],
        // Layout 4: Staggered columns (zigzag effect)
        [
            { x: 0.5, y: 1.5 },   // Left top
            { x: 1.2, y: 4.5 },   // Left middle (shifted right)
            { x: 0.7, y: 7.5 },   // Left bottom (slightly right)
            { x: 4.8, y: 1.2 },   // Right top (offset)
            { x: 4.0, y: 5.0 }    // Right middle-bottom (shifted left)
        ],
        // Layout 5: Scattered asymmetric
        [
            { x: 0.5, y: 0.75 },  // Top left corner
            { x: 5.0, y: 1.2 },   // Top right (lower)
            { x: 2.8, y: 3.8 },   // Center (offset)
            { x: 1.2, y: 7.0 },   // Bottom left
            { x: 4.2, y: 6.5 }    // Bottom right (higher)
        ]
    ];

    // Choose layout based on page number to create alternating pattern
    const layoutIndex = pageNumber % layouts.length;
    const layout = layouts[layoutIndex];

    stories.forEach((story, index) => {
        // Process the story text
        // IMPORTANT: Escape first, then convert HTML to LaTeX
        // This way user content is escaped, but LaTeX commands we create are not
        let storyText = story.story;
        storyText = escapeLatex(storyText);
        storyText = htmlToLatex(storyText);

        // Add location header
        const locationText = `\\textbf{${escapeLatex(story.location)}}\\\\[0.1in]\n${storyText}`;

        // Use position from current layout
        // If we have more stories than layout positions, cycle through them with small offsets
        const basePos = layout[index % layout.length];
        const offset = Math.floor(index / layout.length) * 0.3;

        const pos = {
            x: Math.max(0.5, Math.min(basePos.x + (offset * 0.5), 5.5)),
            y: Math.max(0.5, Math.min(basePos.y + offset, 9.5))
        };

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
