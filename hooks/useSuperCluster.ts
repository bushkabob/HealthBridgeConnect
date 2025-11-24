import { FQHCSite } from "@/types/types";
import { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions } from "react-native";
import MapView from "react-native-maps";
import Supercluster from "supercluster";
import { boundariesToZoom } from "../app/utils";

const { width, height } = Dimensions.get("window");
const MAX_ZOOM = 20;

export type ClusterResult =
    | {
          type: "cluster";
          id: number;
          count: number;
          coordinate: { latitude: number; longitude: number };
      }
    | Center;

export type Center = {
    type: "center";
    id: string;
    center: FQHCSite;
    coordinate: { latitude: number; longitude: number };
};

export default function useSupercluster(
    displayCenters: any[],
    mapRef: React.RefObject<MapView | null>
) {
    const [supercluster, setSupercluster] = useState<Supercluster>();
    const [clusteredDisplayCenters, setClusteredDisplayCenters] = useState<
        ClusterResult[]
    >([]);

    const [prevZoom, setPrevZoom] = useState<number>(0);

    const clusterTimeout = useRef<number | null>(null);

    // ---------------------------------------------------------
    // INIT SUPERCLUSTER
    // ---------------------------------------------------------
    useEffect(() => {
        if (!displayCenters || displayCenters.length === 0) {
            setSupercluster(undefined);
            setClusteredDisplayCenters([]);
            return;
        }

        const points = displayCenters.map((item) => ({
            type: "Feature" as const,
            properties: {
                cluster: false,
                id: item["BPHC Assigned Number"],
                raw: item,
            },
            geometry: {
                type: "Point" as const,
                coordinates: [
                    Number(
                        item["Geocoding Artifact Address Primary X Coordinate"]
                    ),
                    Number(
                        item["Geocoding Artifact Address Primary Y Coordinate"]
                    ),
                ],
            },
        }));

        const sc = new Supercluster({ radius: 60, maxZoom: MAX_ZOOM });
        sc.load(points);

        setSupercluster(sc);
    }, [displayCenters]);

    // BASIC CLUSTER COMPUTATION
    const computeVisibleClusters = useCallback(
        async (targetZoom?: number) => {
            if (!supercluster || !mapRef.current) return;

            const bounds = await mapRef.current.getMapBoundaries();
            const zoom = targetZoom ?? boundariesToZoom(bounds);
            setPrevZoom(zoom);

            const worldBounds: [number, number, number, number] = [
                -180, -85, 180, 85,
            ];

            const clusters = supercluster.getClusters(worldBounds, zoom);

            const formatted = clusters.map((item: any) => {
                if (item.properties.cluster) {
                    return {
                        type: "cluster",
                        id: item.id,
                        count: item.properties.point_count,
                        coordinate: {
                            latitude: item.geometry.coordinates[1],
                            longitude: item.geometry.coordinates[0],
                        },
                    } as ClusterResult;
                }

                return {
                    type: "center",
                    id: item.properties.id,
                    center: item.properties.raw,
                    coordinate: {
                        latitude: item.geometry.coordinates[1],
                        longitude: item.geometry.coordinates[0],
                    },
                } as ClusterResult;
            });

            setClusteredDisplayCenters(formatted);
        },
        [supercluster]
    );

    useEffect(() => {
        computeVisibleClusters();
    }, [supercluster]);

    // ---------------------------------------------------------
    // ZOOM-DEBOUNCED RECALC
    // ---------------------------------------------------------
    const safeComputeClusters = useCallback(async () => {
        if (!mapRef.current) return;

        const boundaries = await mapRef.current.getMapBoundaries();
        const zoom = boundariesToZoom(boundaries);

        if (zoom !== prevZoom) {
            if (clusterTimeout.current) clearTimeout(clusterTimeout.current);
            clusterTimeout.current = setTimeout(() => {
                computeVisibleClusters();
            }, 200) as unknown as number;
        } else {
            if (clusterTimeout.current) clearTimeout(clusterTimeout.current);
        }
    }, [prevZoom, computeVisibleClusters]);

    // SPIDERFY HELPERS
    const [spiderfiedClusterId, setSpiderfiedClusterId] = useState<
        SpiderCenter | null
    >(null);
    const [spiderfiedLeaves, setSpiderfiedLeaves] = useState<Center[]>([]);

    const spiderfy = useCallback(
        (clusterId: number, lat: number, lon: number) => {
            if (!supercluster) return;

            const leaves: Center[] = supercluster.getLeaves(clusterId, Infinity).map((val) => {
                return {
                    type: "center",
                    id: val.properties.id,
                    center: val.properties.raw,
                    coordinate: { latitude: val.geometry.coordinates[1], longitude: val.geometry.coordinates[0] }
                }
            });
            if (!leaves || leaves.length <= 1) return;
            setSpiderfiedClusterId({id: clusterId, lat: lat, lon: lon});
            setSpiderfiedLeaves(leaves);
        },
        [supercluster]
    );

    const unspiderfy = () => {
        setSpiderfiedClusterId(null);
        setSpiderfiedLeaves([]);
    };

    // ---------------------------------------------------------
    return {
        supercluster,
        clusteredDisplayCenters,
        computeVisibleClusters,
        safeComputeClusters,
        prevZoom,
        spiderfy,
        unspiderfy,
        spiderfiedClusterId,
        spiderfiedLeaves,
    };
}

export type SpiderCenter = {
    id: number,
    lat: number,
    lon: number
}