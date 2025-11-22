/**
 * Geographic Clustering for No Time to Discourse Novel
 * Groups nearby locations together for map-based storytelling
 */

/**
 * Calculate distance between two points using Haversine formula
 * Returns distance in kilometers
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRadians(degrees) {
    return degrees * (Math.PI / 180);
}

/**
 * Calculate geographic bounds for a set of coordinates
 */
function getBoundsForCoordinates(coords) {
    const lats = coords.map(c => c[1]);
    const lons = coords.map(c => c[0]);

    return {
        north: Math.max(...lats),
        south: Math.min(...lats),
        east: Math.max(...lons),
        west: Math.min(...lons)
    };
}

/**
 * Calculate center point of a set of coordinates
 */
function getCenterOfCoordinates(coords) {
    const lats = coords.map(c => c[1]);
    const lons = coords.map(c => c[0]);

    return {
        lat: (Math.max(...lats) + Math.min(...lats)) / 2,
        lon: (Math.max(...lons) + Math.min(...lons)) / 2
    };
}

/**
 * Simple greedy clustering algorithm with city diversity
 * Groups locations that are geographically close together while ensuring variety
 *
 * @param {Array} locations - GeoJSON features with coordinates
 * @param {Number} clusterSize - Number of locations per cluster (default 5)
 * @returns {Array} Array of clusters, each containing clusterSize locations
 */
function clusterLocationsByProximity(locations, clusterSize = 5) {
    const clusters = [];
    const remaining = [...locations];

    while (remaining.length >= clusterSize) {
        // Start with a random seed location
        const seedIndex = Math.floor(Math.random() * remaining.length);
        const seed = remaining[seedIndex];
        const cluster = [seed];
        remaining.splice(seedIndex, 1);

        // Track cities already in cluster to ensure diversity
        const citiesInCluster = new Set([seed.properties.name]);

        // Find the closest (clusterSize - 1) locations to this seed
        for (let i = 1; i < clusterSize && remaining.length > 0; i++) {
            let closestIndex = -1;
            let closestDistance = Infinity;

            // Find the closest remaining location to any location in the cluster
            // Prefer locations from different cities
            for (let j = 0; j < remaining.length; j++) {
                const loc = remaining[j];
                const locCoord = loc.geometry.coordinates;
                const cityName = loc.properties.name;

                // Skip if this city is already in the cluster
                if (citiesInCluster.has(cityName)) {
                    continue;
                }

                // Check distance to all locations in current cluster
                for (const clusterLoc of cluster) {
                    const clusterCoord = clusterLoc.geometry.coordinates;
                    const dist = haversineDistance(
                        locCoord[1], locCoord[0],
                        clusterCoord[1], clusterCoord[0]
                    );

                    if (dist < closestDistance) {
                        closestDistance = dist;
                        closestIndex = j;
                    }
                }
            }

            // If we couldn't find a location from a different city,
            // fall back to closest location regardless of city
            if (closestIndex === -1) {
                for (let j = 0; j < remaining.length; j++) {
                    const loc = remaining[j];
                    const locCoord = loc.geometry.coordinates;

                    for (const clusterLoc of cluster) {
                        const clusterCoord = clusterLoc.geometry.coordinates;
                        const dist = haversineDistance(
                            locCoord[1], locCoord[0],
                            clusterCoord[1], clusterCoord[0]
                        );

                        if (dist < closestDistance) {
                            closestDistance = dist;
                            closestIndex = j;
                        }
                    }
                }
            }

            if (closestIndex !== -1) {
                const selectedLoc = remaining[closestIndex];
                cluster.push(selectedLoc);
                citiesInCluster.add(selectedLoc.properties.name);
                remaining.splice(closestIndex, 1);
            } else {
                // No more locations available
                break;
            }
        }

        clusters.push(cluster);
    }

    // Handle remaining locations by distributing them to existing clusters
    // or creating smaller clusters
    if (remaining.length > 0) {
        if (remaining.length >= Math.floor(clusterSize / 2)) {
            // Create a smaller cluster if we have at least half the cluster size
            clusters.push(remaining);
        } else {
            // Distribute to existing clusters
            remaining.forEach((loc, i) => {
                const targetCluster = clusters[i % clusters.length];
                targetCluster.push(loc);
            });
        }
    }

    return clusters;
}

/**
 * Calculate the appropriate zoom level for a cluster
 * Based on the geographic spread of the locations
 *
 * @param {Array} cluster - Array of GeoJSON features
 * @returns {Number} Appropriate zoom level (higher = more zoomed in)
 */
function calculateZoomForCluster(cluster) {
    const coords = cluster.map(loc => loc.geometry.coordinates);
    const bounds = getBoundsForCoordinates(coords);

    // Calculate the span in degrees
    const latSpan = bounds.north - bounds.south;
    const lonSpan = bounds.east - bounds.west;
    const maxSpan = Math.max(latSpan, lonSpan);

    // Zoom levels roughly correspond to degree spans:
    // zoom 10: ~0.5 degrees
    // zoom 9: ~1 degree
    // zoom 8: ~2 degrees
    // zoom 7: ~4 degrees
    // zoom 6: ~8 degrees

    if (maxSpan < 0.5) return 10;
    if (maxSpan < 1) return 9;
    if (maxSpan < 2) return 8;
    if (maxSpan < 4) return 7;
    if (maxSpan < 8) return 6;
    return 5;
}

module.exports = {
    haversineDistance,
    getBoundsForCoordinates,
    getCenterOfCoordinates,
    clusterLocationsByProximity,
    calculateZoomForCluster
};
