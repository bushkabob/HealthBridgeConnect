import { BlurView } from "expo-blur";
import { Dimensions } from "react-native";
import MapView, { BoundingBox, EdgePadding, Region } from "react-native-maps";
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

export function getMinZoomsForIds(
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

export function deltasToZoom(latitudeDelta: number, longitudeDelta: number) {
    // Fallback if delta missing
    if (!longitudeDelta || longitudeDelta <= 0) return 20;

    const zoom = Math.log2(360 / longitudeDelta);

    // Clamp to Google/Supercluster zoom range
    return Math.min(Math.max(zoom, 0), 20);
}

export function zoomFromAltitude(altitudeMeters: number, mapHeightPx: number) {
    const earthCircumference = 40075016.686; // in meters
    const tileSize = 256; // Web Mercator tile size

    const zoom = Math.log2(
        (earthCircumference * mapHeightPx) / (altitudeMeters * tileSize)
    );
    return zoom;
}

import { useRef } from "react";

type Resolver = (() => void) | null;

// meters per pixel at current latitude + zoom
const metersPerPixel = (lat: number, zoom: number) => {
    const C = 40075016.686;
    return (C * Math.cos(lat * Math.PI / 180)) / Math.pow(2, zoom + 8);
};

// meters → degrees latitude
const metersToLat = (meters: number) => meters / 111320;

// meters → degrees longitude
const metersToLon = (meters: number, lat: number) =>
  meters / (111320 * Math.cos(lat * Math.PI / 180));


export const getUnpaddedBoundaries = (paddedBounds: BoundingBox, zoom: number, padding: EdgePadding, additionalPadding?: number) => {
    const { northEast, southWest } = paddedBounds;
    const center = {
        latitude: (northEast.latitude + southWest.latitude) / 2,
        longitude: (northEast.longitude + southWest.longitude) / 2,
    };

    const addPadding = additionalPadding ? additionalPadding : 0

    const mpp = metersPerPixel(center.latitude, zoom);

    const topLat = metersToLat((padding.top + addPadding) * mpp);
    const bottomLat = metersToLat((padding.bottom  + addPadding) * mpp);

    const leftLon = metersToLon((padding.left + addPadding) * mpp, center.latitude);
    const rightLon = metersToLon((padding.right  + addPadding) * mpp, center.latitude);

    return {
        northEast: {
            latitude: northEast.latitude + topLat,
            longitude: northEast.longitude + rightLon,
        },
        southWest: {
            latitude: southWest.latitude - bottomLat,
            longitude: southWest.longitude - leftLon,
        },
    };
}

export function useAwaitableMapAnimation(
    mapRef: React.RefObject<MapView | null>,
    defaultTimeout = 1200 // ms safety timeout
) {
    const resolverRef = useRef<Resolver>(null);
    const timeoutRef = useRef<number | null>(null);
    const isWaitingRef = useRef(false);

    const cleanup = () => {
        // Clear active resolver
        resolverRef.current = null;

        // Clear timeout
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        isWaitingRef.current = false;
    };

    const animateToRegionAsync = (
        region: Region,
        duration = 500,
        timeout = defaultTimeout
    ) => {
        // Ensure no overlapping animations
        cleanup();

        return new Promise<void>((resolve) => {
            isWaitingRef.current = true;
            resolverRef.current = resolve;

            mapRef.current?.animateToRegion(region, duration);

            // Safety timeout in case onRegionChangeComplete never fires
            timeoutRef.current = setTimeout(() => {
                if (isWaitingRef.current && resolverRef.current) {
                    resolverRef.current(); // resolve anyway
                }
                cleanup();
            }, timeout);
        });
    };

    // MUST be passed to <MapView onRegionChangeComplete={...} />
    const onRegionChangeCompleteHandler = () => {
        if (!isWaitingRef.current) return;

        if (resolverRef.current) {
            resolverRef.current(); // resolve the await call
        }
        cleanup();
    };

    return {
        animateToRegionAsync,
        onRegionChangeCompleteHandler,
    };
}

export const checkNeedsUpdate = async (lastUpdate: number) => {
    const params = new URLSearchParams({
        client_timestamp: lastUpdate.toString(),
        platform: "web"
    });

    const res = await fetch(`https://api.healthbridgelabs.com/latest_timestamp?${params.toString()}`)
    if(!res.ok) {
        return false
    } else {
        const responseJson = await res.json()
        return responseJson["update_needed"]
    }
}

export const downloadNewDb = async () => {
    const res = await fetch(`https://api.healthbridgelabs.com/fetch_data`)
    if(!res.ok) {
        return false
    } else {
        
    }
}