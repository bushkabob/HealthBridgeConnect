import { BlurView } from "expo-blur";
import { Dimensions } from "react-native";
import Animated from "react-native-reanimated";
import Supercluster from "supercluster";

export function levenshtein(a: string, b: string): number {
    if (a === b) return 0;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;

    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            const cost = a[j - 1] === b[i - 1] ? 0 : 1;
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1, // deletion
                matrix[i][j - 1] + 1, // insertion
                matrix[i - 1][j - 1] + cost // substitution
            );
        }
    }

    return matrix[b.length][a.length];
}

export function haversineDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
) {
    const R = 6371; // Earth radius in km
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
}

export const AnimatedBlurView = Animated.createAnimatedComponent(BlurView);

const { width, height } = Dimensions.get("screen");

export function getMinZoomForPoint(
    lat: number,
    lon: number,
    id: string,
    supercluster: Supercluster,
    maxZoom = 20
) {
    for (let z = 0; z <= maxZoom; z++) {
        const features = supercluster.getClusters([-180, -90, 180, 90], z);
        for (let index = 0; index < features.length; index++) {
            const val = features[index];
            if (!val.properties.cluster && val.properties.id === id) {
                return z;
            }
        }
    }
    return maxZoom + 1;
}

export function boundariesToZoom(boundaries: {
    northEast: { latitude: number; longitude: number };
    southWest: { latitude: number; longitude: number };
}) {
    const {
        northEast: { latitude: latNE, longitude: lonNE },
        southWest: { latitude: latSW, longitude: lonSW },
    } = boundaries;

    const lonDelta = Math.abs(lonNE - lonSW);

    const zoom = Math.max(
        0,
        Math.min(20, Math.round(Math.log2(360 / lonDelta)))
    );

    return zoom;
}

export function zoomToBoundaries(
    center: { latitude: number; longitude: number },
    zoom: number,
    aspectRatio: number = 1 // width / height of the viewport
): {
    north: number;
    south: number;
    east: number;
    west: number;
} {
    // Calculate longitude delta from zoom level
    const lonDelta = 360 / Math.pow(2, zoom);

    // Calculate latitude delta accounting for Mercator projection
    // Adjust for aspect ratio (wider viewports show more longitude)
    const adjustedLonDelta = lonDelta * aspectRatio;
    const latDelta = lonDelta / aspectRatio;

    // Account for Mercator projection distortion at different latitudes
    const latCos = Math.cos((center.latitude * Math.PI) / 180);
    const adjustedLatDelta = latDelta * latCos;

    return {
        west: center.longitude - adjustedLonDelta / 2,
        south: Math.max(-85, center.latitude - adjustedLatDelta / 2),
        east: center.longitude + adjustedLonDelta / 2,
        north: Math.min(85, center.latitude + adjustedLatDelta / 2),
    };
}

export function zoomFromAltitude(altitudeMeters: number, mapHeightPx: number) {
    const earthCircumference = 40075016.686; // in meters
    const tileSize = 256; // Web Mercator tile size

    const zoom = Math.log2(
        (earthCircumference * mapHeightPx) / (altitudeMeters * tileSize)
    );
    return zoom;
}
