#!/usr/bin/env node
/**
 * Match top 282 population cities with disasters.json locations
 */

const fs = require('fs');

// Load the data
console.log('Loading data...');
const top282 = JSON.parse(fs.readFileSync('./output/top-282-cities.json', 'utf8'));
const disasterData = JSON.parse(fs.readFileSync('./assets/js/disasters.json', 'utf8'));

console.log(`Top 282 cities: ${top282.length}`);
console.log(`Disaster locations: ${disasterData.features.length}\n`);

// Function to normalize city names for matching
function normalizeCityName(cityString) {
    // Extract just the city name (before the comma)
    // e.g., "New York city, New York" -> "New York"
    const parts = cityString.split(',')[0].trim();

    // Remove "city" suffix
    const normalized = parts.replace(/\s+city$/i, '').trim();

    return normalized.toLowerCase();
}

// Create a map of normalized city names to population cities
const popCityMap = new Map();
top282.forEach(city => {
    const normalized = normalizeCityName(city.city);
    popCityMap.set(normalized, city);
});

console.log('Sample normalized city names:');
Array.from(popCityMap.keys()).slice(0, 10).forEach(name => {
    console.log(`  "${name}"`);
});
console.log('');

// Match with disaster locations
const matches = [];
const unmatched = [];

disasterData.features.forEach(location => {
    const locationName = location.properties.name.toLowerCase().trim();

    if (popCityMap.has(locationName)) {
        const popCity = popCityMap.get(locationName);
        matches.push({
            location: location,
            populationData: popCity
        });
    }
});

console.log(`\nMatches found: ${matches.length}`);
console.log('\nFirst 10 matches:');
matches.slice(0, 10).forEach(match => {
    console.log(`  ${match.location.properties.name} (${match.location.properties.adm1name})`);
    console.log(`    Population: ${match.populationData.population2024.toLocaleString()}`);
});

// Check which top cities we didn't find
const matchedCityNames = new Set(matches.map(m => normalizeCityName(m.populationData.city)));
const unmatchedPopCities = top282.filter(city => !matchedCityNames.has(normalizeCityName(city.city)));

console.log(`\nUnmatched top 282 cities: ${unmatchedPopCities.length}`);
if (unmatchedPopCities.length > 0) {
    console.log('First 20 unmatched:');
    unmatchedPopCities.slice(0, 20).forEach(city => {
        console.log(`  ${city.rank}. ${city.city}`);
    });
}

// Save the matches
fs.writeFileSync('./output/population-matches.json', JSON.stringify(matches, null, 2));
console.log(`\nWrote ${matches.length} matches to output/population-matches.json`);

// Save just the location features for easy use
const matchedLocations = matches.map(m => m.location);
fs.writeFileSync('./output/high-population-locations.json',
    JSON.stringify({ type: 'FeatureCollection', features: matchedLocations }, null, 2));
console.log(`Wrote ${matchedLocations.length} locations to output/high-population-locations.json`);
