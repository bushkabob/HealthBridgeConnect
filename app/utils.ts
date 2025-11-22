import { BlurView } from "expo-blur";
import Animated from "react-native-reanimated";

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

// import supercluster from "supercluster";

// const 

// function getZoomLevel(longitudeDelta: number) {
//     const angle = longitudeDelta;
//     return Math.round(Math.log(360 / angle) / Math.LN2);
// }

// export function getCluster(places, region) {
//     const cluster = supercluster({
//         radius: 40,
//         maxZoom: 16
//     });

//     let markers = [];

//     try {
//         const padding = 0;

//         cluster.load(places);

//         markers = cluster.getClusters(
//             [
//                 region.longitude - region.longitudeDelta * (0.5 + padding),
//                 region.latitude - region.latitudeDelta * (0.5 + padding),
//                 region.longitude + region.longitudeDelta * (0.5 + padding),
//                 region.latitude + region.latitudeDelta * (0.5 + padding)
//             ],
//             getZoomLevel(region.longitudeDelta)
//         );
//     } catch (e) {
//         console.debug("failed to create cluster", e);
//     }

//     return {
//         markers,
//         cluster
//     };
// }