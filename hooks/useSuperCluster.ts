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

    // NEW: currentZoom state
    const [currentZoom, setCurrentZoom] = useState<number>(0);

    const clusterTimeout = useRef<number | null>(null);

    // INIT SUPERCLUSTER
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

    // SPIDERFY STATE
    const [spiderfiedClusters, setSpiderfiedClusters] = useState<
        Record<number, Center[]>
    >({});
    const [expandedClusterId, setExpandedClusterId] = useState<number | null>(
        null
    );

    // spiderfy ALL clusters visible at MAX_ZOOM
    const spiderfyAll = useCallback(
        (formatted: ClusterResult[]) => {
            if (!supercluster) return [];
            const out: Record<number, Center[]> = {};
            formatted.forEach((item) => {
                if (item.type !== "cluster") return [];
                const leaves = supercluster
                    .getLeaves(item.id, Infinity)
                    .map((val) => ({
                        type: "center",
                        id: val.properties.id,
                        center: val.properties.raw,
                        coordinate: {
                            latitude: val.geometry.coordinates[1],
                            longitude: val.geometry.coordinates[0],
                        },
                    }));
                if (leaves.length > 1) {
                    out[item.id] = leaves as Center[];
                }
            });
            setSpiderfiedClusters(out);
            // if expanded one is no longer valid, reset
            if (expandedClusterId && !out[expandedClusterId]) {
                setExpandedClusterId(null);
            }
            return out;
        },
        [supercluster, expandedClusterId]
    );

    const expandCluster = useCallback(
        (clusterId: number) => {
            console.log(clusterId);
            if (expandedClusterId === clusterId) return;
            setExpandedClusterId(null);
            requestAnimationFrame(() => {
                setExpandedClusterId(clusterId);
            });
        },
        [expandedClusterId]
    );

    const closeCluster = useCallback(() => {
        if (expandedClusterId == null) return;
        requestAnimationFrame(() => {
            setExpandedClusterId(null);
        });
    }, [expandedClusterId]);

    const clearSpiderfy = useCallback(() => {
        setExpandedClusterId(null);
        setSpiderfiedClusters({})
    }, []);

    // BASIC CLUSTER COMPUTATION
    const computeVisibleClusters = useCallback(
        async (targetZoom?: number) => {
            if (!supercluster || !mapRef.current) return {};

            const bounds = await mapRef.current.getMapBoundaries();
            const zoom = targetZoom ?? boundariesToZoom(bounds);

            setPrevZoom(currentZoom);
            setCurrentZoom(zoom);

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

            var spiderfiedClusters: Record<number, Center[]> = {};

            console.log("Current zoom: ", zoom)

            // AUTO-SPIDERFY LOGIC
            if (zoom >= MAX_ZOOM) {
                spiderfiedClusters = spiderfyAll(formatted);

                // expand first cluster if none expanded
                if (expandedClusterId == null) {
                    const firstCluster = formatted.find(
                        (c) => c.type === "cluster"
                    );
                    if (firstCluster) setExpandedClusterId(firstCluster.id);
                }
            }
            setClusteredDisplayCenters(formatted)
            return spiderfiedClusters;
        },
        [supercluster, expandedClusterId]
    );

    useEffect(() => {
        computeVisibleClusters();
    }, [supercluster]);

    // ZOOM-DEBOUNCED RECALC
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

    return {
        supercluster,
        clusteredDisplayCenters,
        prevZoom,
        currentZoom,

        spiderfiedClusters,
        expandedClusterId,

        safeComputeClusters,
        computeVisibleClusters,
        expandCluster,
        closeCluster,
        clearSpiderfy
    };
}
