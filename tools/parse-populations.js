#!/usr/bin/env node
/**
 * Parse populations.xlsx to extract city population data
 */

const XLSX = require('xlsx');
const fs = require('fs');

// Read the Excel file
console.log('Reading populations.xlsx...');
const workbook = XLSX.readFile('./populations.xlsx');

// Get the first sheet
const sheetName = workbook.SheetNames[0];
console.log(`Sheet name: ${sheetName}`);

const sheet = workbook.Sheets[sheetName];

// Convert to JSON without headers (we'll parse manually)
const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

console.log(`Total rows: ${data.length}`);
console.log('\nFirst 10 rows (raw):');
data.slice(0, 10).forEach((row, i) => {
    console.log(`Row ${i}:`, row);
});

// Find the data rows - they start after the header rows
// Looking for rows where column 0 is a number (rank) and column 1 is a city name
const cities = [];
for (let i = 0; i < data.length; i++) {
    const row = data[i];
    // Skip empty rows or header rows
    if (!row || row.length < 2) continue;

    const rank = row[0];
    const cityName = row[1];
    const pop2024 = row[7]; // 2024 population is in column 7

    // Check if this looks like a data row (rank is a number, city name exists)
    if (typeof rank === 'number' && typeof cityName === 'string' && cityName.includes(',')) {
        cities.push({
            rank: rank,
            city: cityName,
            population2024: pop2024
        });
    }
}

console.log(`\nParsed ${cities.length} cities`);
console.log('\nFirst 5 cities:');
cities.slice(0, 5).forEach(c => {
    console.log(`${c.rank}. ${c.city} - ${c.population2024.toLocaleString()}`);
});

// Export top 282 cities
const top282 = cities.slice(0, 282);
fs.writeFileSync('./output/top-282-cities.json', JSON.stringify(top282, null, 2));
console.log(`\nWrote top ${top282.length} cities to output/top-282-cities.json`);
