#!/bin/bash
# Compile the LaTeX document to PDF

echo "Compiling novel.tex to PDF..."

# Single pdflatex run is sufficient (no TOC or cross-references to resolve)
pdflatex -interaction=nonstopmode -output-directory="./output" "novel.tex"

echo "Done! PDF created."
