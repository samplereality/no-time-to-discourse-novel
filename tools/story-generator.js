/**
 * Story Generator for No Time to Discourse Novel
 * Generates diverse flash fiction stories for each location
 */

const fs = require('fs');
const vm = require('vm');

// Import RiTa from npm package (v2.x exports RiTa as default)
const RiTa = require('rita');

// Load the grammar rules (it's a plain JS object defined as: var rules = {...})
const grammarCode = fs.readFileSync('./assets/js/grammar.js', 'utf8');
const grammarContext = {};
vm.createContext(grammarContext);
vm.runInContext('var rules; ' + grammarCode, grammarContext);
const rules = grammarContext.rules;

// Import dayjs for date handling
const dayjs = require('dayjs');

/**
 * Setup context similar to main.js
 */
function createContext(feature) {
    let currentMonth = null;
    let distantFutureMonth = null;
    let currentYear = null;
    let cachedStartYear = null;
    let isDistantFutureContext = false;

    const context = {
        silent: () => '',
        pluralNoun: () => RiTa.randomWord({ pos: "nns" }),
        adjective: () => RiTa.randomWord({pos: 'jj'}),
        noun: () => RiTa.randomWord({ pos: "nn" }),
        date: () => makeDateSmart(),
        time: () => makeTime(),
        timeOfDay: () => makeTimeOfDay(),
        device: () => getDeviceType(),
        cityName: () => feature ? feature.properties.name : 'Unknown City',
        month: () => isDistantFutureContext ? distantFutureMonth : currentMonth,
        year: () => currentYear,
        startYear: () => {
            if (!currentYear) return 'unknown';
            if (cachedStartYear === null) {
                const yearsBefore = Math.floor(Math.random() * 21) + 10;
                cachedStartYear = parseInt(currentYear) - yearsBefore;
            }
            return cachedStartYear;
        },
        season: () => {
            const monthToCheck = isDistantFutureContext ? distantFutureMonth : currentMonth;
            if (!monthToCheck) return 'unknown';

            const winterMonths = ['November', 'December', 'January', 'February'];
            const springMonths = ['March', 'April', 'May'];
            const summerMonths = ['June', 'July', 'August'];
            const fallMonths = ['September','October'];

            if (winterMonths.includes(monthToCheck)) return 'winter';
            if (springMonths.includes(monthToCheck)) return 'spring';
            if (summerMonths.includes(monthToCheck)) return 'summer';
            if (fallMonths.includes(monthToCheck)) return 'fall';

            return 'unknown';
        },
        waterLevel: () => {
            return Math.floor(Math.random() * 41) + 10;
        },
        iceCondition: () => {
            const currentSeason = context.season();

            if (currentSeason === 'winter') return '(surprisingly slushy | not solid at all)';
            if (currentSeason === 'spring') return '(mostly melted | softening | patchy)';
            if (currentSeason === 'summer') return '(thawed | gone)';
            if (currentSeason === 'fall') return '(mushy | barely refreezing)';

            return 'unknown';
        },
        POI: () => {
            if (!feature) return '';

            const poiField = feature.properties.POI;

            if (!poiField) return '';

            if (poiField.includes('|')) {
                const tempRules = {
                    poiRule: poiField
                };
                const tempGrammar = RiTa.grammar(tempRules, context);
                return tempGrammar.expand('poiRule');
            } else {
                return poiField;
            }
        }
    };

    function makeDate() {
        const minDays = 3;
        const maxDays = 1460;
        const randomDaysToAdd = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;

        const futureDate = dayjs().add(randomDaysToAdd, 'day');
        currentMonth = futureDate.format('MMMM');
        currentYear = futureDate.format('YYYY');

        return futureDate.format('dddd, MMMM D, YYYY');
    }

    function makeDistantFutureDate() {
        const minYears = 15;
        const maxYears = 100;
        const randomYearsToAdd = Math.floor(Math.random() * (maxYears - minYears + 1)) + minYears;

        const distantFutureDate = dayjs().add(randomYearsToAdd, 'year');
        distantFutureMonth = distantFutureDate.format('MMMM');
        currentYear = distantFutureDate.format('YYYY');
        isDistantFutureContext = true;

        return distantFutureDate.format('dddd, MMMM D, YYYY');
    }

    function makeDateSmart() {
        if (feature && feature.properties.note === 6) {
            return makeDistantFutureDate();
        } else {
            return makeDate();
        }
    }

    function makeTime() {
        return dayjs().format('dddd, h:mm a');
    }

    function makeTimeOfDay() {
        const hour = dayjs().hour();

        if (hour >= 5 && hour < 12) {
            return 'morning';
        } else if (hour >= 12 && hour < 17) {
            return 'afternoon';
        } else if (hour >= 17 && hour < 21) {
            return 'evening';
        } else {
            return 'night';
        }
    }

    function getDeviceType() {
        const devices = ['phone', 'tablet', 'computer'];
        return devices[Math.floor(Math.random() * devices.length)];
    }

    return context;
}

/**
 * Get the grammar rule for a location based on its note property
 */
function getRuleForLocation(note) {
    const ruleLookup = {
        1: "westCoast",
        2: "orlando",
        3: "florida",
        4: "eastCoast",
        5: "gulfCoast",
        6: "farNorth",
        7: "hawaii"
    };

    return ruleLookup[note] || "start";
}

/**
 * Generate a single story for a location
 */
function generateStory(feature) {
    const context = createContext(feature);
    const rg = RiTa.grammar(rules, context);
    const rule = getRuleForLocation(feature.properties.note);

    const story = rg.expand(rule);
    const city = feature.properties.name;
    const state = feature.properties.adm1name;
    const disasterType = identifyDisasterType(story);

    // Capture the season from the context
    const season = context.season();

    return {
        location: `${city}, ${state}`,
        rule: rule,
        story: story,
        disasterType: disasterType,
        season: season,
        coordinates: feature.geometry.coordinates
    };
}

/**
 * Identify the disaster type from a generated story
 * Returns one of: fire, drought, flood, storm, heat, hurricane, ice, personal, oil, tide, etc.
 */
function identifyDisasterType(story) {
    const text = story.toLowerCase();

    // Check for specific disaster keywords
    if (text.includes('fire') || text.includes('blaze') || text.includes('smoke')) return 'fire';
    if (text.includes('drought') || text.includes('water shortage')) return 'drought';
    if (text.includes('flood') || text.includes('rising water') || text.includes('waters are rising')) return 'flood';
    if (text.includes('hurricane')) return 'hurricane';
    if (text.includes('storm') || text.includes('tornado')) return 'storm';
    if (text.includes('heat') || text.includes('temperature')) return 'heat';
    if (text.includes('ice') || text.includes('melting') || text.includes('arctic')) return 'ice';
    if (text.includes('oil') || text.includes('spill') || text.includes('crude')) return 'oil';
    if (text.includes('red tide') || text.includes('algal bloom')) return 'tide';
    if (text.includes('disney') || text.includes('universal') || text.includes('epcot')) return 'theme-park';
    if (text.includes('your phone') || text.includes('your computer') || text.includes('doomscrolling')) return 'personal';

    // Default
    return 'general';
}

/**
 * Generate multiple diverse stories for a set of locations
 * Ensures variety by avoiding too many of the same disaster type
 */
function generateDiverseStories(features, count = 5, maxSameType = 2) {
    const stories = [];
    const typeCounts = {};
    let attempts = 0;
    const maxAttempts = count * 10; // Prevent infinite loops

    while (stories.length < count && attempts < maxAttempts) {
        // Randomly select a feature
        const feature = features[Math.floor(Math.random() * features.length)];

        // Generate story
        const storyData = generateStory(feature);
        const disasterType = identifyDisasterType(storyData.story);

        // Check if we already have too many of this type
        const currentCount = typeCounts[disasterType] || 0;

        if (currentCount < maxSameType) {
            stories.push({ ...storyData, disasterType });
            typeCounts[disasterType] = currentCount + 1;
        }

        attempts++;
    }

    return stories;
}

module.exports = {
    createContext,
    getRuleForLocation,
    generateStory,
    identifyDisasterType,
    generateDiverseStories
};
