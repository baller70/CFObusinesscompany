#!/usr/bin/env node
/**
 * Standalone PDF text extraction script
 * Used by parse-pdf API route to avoid webpack bundling issues with pdf-parse
 */

const fs = require('fs');
const path = require('path');

// Get args
const pdfPath = process.argv[2];
const outputPath = process.argv[3];

if (!pdfPath || !outputPath) {
  console.error('Usage: node extract-pdf-text.js <pdf-path> <output-path>');
  process.exit(1);
}

// Load pdf-parse - need to resolve from project root
const projectRoot = path.resolve(__dirname, '..');
const pdfParsePath = path.join(projectRoot, 'node_modules', 'pdf-parse');

let PDFParse;
try {
  const pdfParseModule = require(pdfParsePath);
  PDFParse = pdfParseModule.PDFParse;
  if (!PDFParse) {
    throw new Error('PDFParse not found in module');
  }
} catch (e) {
  console.error('Failed to load pdf-parse:', e.message);
  process.exit(1);
}

// Read and parse PDF
const dataBuffer = fs.readFileSync(pdfPath);

// PDFParse is a class that needs options
const parser = new PDFParse({ data: dataBuffer });
parser.getText()
  .then(result => {
    fs.writeFileSync(outputPath, result.text, 'utf-8');
    console.log('Text extracted successfully');
    process.exit(0);
  })
  .catch(err => {
    console.error('PDF parse error:', err.message);
    process.exit(1);
  });

