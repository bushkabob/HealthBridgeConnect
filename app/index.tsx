import CenterDetails from "@/components/CenterDetails";
import DraggableContent from "@/components/DraggableContent";
import DraggableHeader from "@/components/DraggableHeader";
import ClippedDraggables, {
    ClippedDraggablesHandle,
} from "@/components/FixedDraggableOverlap";
import useDatabase from "@/hooks/useDatabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dimensions, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MapView, { MapMarker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Supercluster from "supercluster";

import { FQHCSite, MapCenter } from "../types/types";
import { haversineDistance } from "./utils";

const INITIAL_REGION = {
    latitude: 39.3669492313556,
    latitudeDelta: 82.71817584815484,
    longitude: -96.13953430290948,
    longitudeDelta: 55.18789991356607,
};

const { width, height } = Dimensions.get("window");

export default function Map() {
    const [locationColor, setLocationColor] = useState<string>("gray");

    const [allCenters, setAllCenters] = useState<FQHCSite[]>([]);
    const [nearbyCenters, setNearbyCenters] = useState<FQHCSite[]>([]);
    const [displayCenters, setDisplayCenters] = useState<FQHCSite[]>([]);

    const [currentCenter, setCurrentCenter] = useState<MapCenter>(undefined);
    const [detailCenter, setDetailCenter] = useState<FQHCSite>();
    const [lastValidDetailCenter, setLastValidDetailCenter] =
        useState<FQHCSite>();

    const [searchRadius, setSearchRadius] = useState<number>(10);
    const [unit, setUnit] = useState<string>("Imperial");
    const [searchingCenters, setSearchingCenters] = useState<boolean>(false);

    const [supercluster, setSupercluster] = useState<Supercluster>();
    const [clusteredDisplayCenters, setClusteredDisplayCenters] = useState<
        any[]
    >([]);

    const { loading, query } = useDatabase();

    const mapRef = useRef<MapView>(null);
    // @ts-ignore
    const markerRefs = useRef<Record<string, Marker | null>>({});

    //Loads data from db
    useEffect(() => {
        if (!loading) {
            try {
                query("SELECT * FROM centers;").then((vals) => {
                    const centers = vals as FQHCSite[];
                    setAllCenters(centers);
                });
            } catch (error) {
                console.error("Error querying database:", error);
            }
        }
    }, [loading]);

    //Marker ref factory
    const createMarkerRef = useCallback(
        (id: string) => {
            //@ts-ignore
            return (ref: Marker | null) => {
                if (!markerRefs || !markerRefs.current) return;
                if (ref) {
                    markerRefs.current[id] = ref;
                } else {
                    delete markerRefs.current[id];
                }
            };
        },
        [markerRefs]
    );

    //Determines centers near location
    const determineNearbyCenters = (
        centerOptions: FQHCSite[],
        refLat: number,
        refLon: number
    ) => {
        const filteredCenters = centerOptions
            .map((val) => {
                const distance = haversineDistance(
                    refLat,
                    refLon,
                    Number(
                        val["Geocoding Artifact Address Primary Y Coordinate"]
                    ),
                    Number(
                        val["Geocoding Artifact Address Primary X Coordinate"]
                    )
                );
                val["distance"] = distance;
                return { ...val };
            })
            .filter(
                (val) =>
                    val.distance * (unit === "Imperial" ? 0.621371 : 1) <
                    searchRadius
            )
            .sort((a, b) => a.distance - b.distance);
        setNearbyCenters(filteredCenters);
    };

    //Turn off activity indicator when displayed centers are updated
    useEffect(() => {
        !loading && setSearchingCenters(false);
        //Super cluster
        if (!displayCenters || displayCenters.length === 0) {
            setSupercluster(undefined);
            setClusteredDisplayCenters([]);
            return;
        }

        const points = displayCenters.map((item) => ({
            type: "Feature" as "Feature",
            properties: {
                cluster: false,
                id: item["BPHC Assigned Number"],
                raw: item,
            },
            geometry: {
                type: "Point" as "Point",
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

        const sc = new Supercluster({
            radius: 60,
            maxZoom: 20,
        });

        sc.load(points);
        setSupercluster(sc);
    }, [displayCenters]);

    const computeVisibleClusters = async () => {
        console.log("computing superlcluster");
        if (!supercluster || !mapRef.current) return;

        const bounds = await mapRef.current.getMapBoundaries();
        const zoom = boundariesToZoom(bounds);
        console.log("computed zoom:", zoom);

        const worldBounds: [number, number, number, number] = [
            -180, -85, 180, 85,
        ];

        const clusters = supercluster.getClusters(worldBounds, zoom);

        const formatted = clusters.map((item) => {
            if (item.properties.cluster) {
                return {
                    type: "cluster",
                    id: item.id,
                    count: item.properties.point_count,
                    coordinate: {
                        latitude: item.geometry.coordinates[1],
                        longitude: item.geometry.coordinates[0],
                    },
                };
            }

            return {
                type: "center",
                id: item.properties.id,
                center: item.properties.raw,
                coordinate: {
                    latitude: item.geometry.coordinates[1],
                    longitude: item.geometry.coordinates[0],
                },
            };
        });
        console.log(formatted.length)
        setClusteredDisplayCenters(formatted);
    };

    function boundariesToZoom(boundaries: {
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

    useEffect(() => {
        computeVisibleClusters();
    }, [supercluster]);

    //Show callout when detailCenter is set
    useEffect(() => {
        if (detailCenter !== undefined) {
            setLastValidDetailCenter(detailCenter);
            (
                markerRefs.current[
                    detailCenter["BPHC Assigned Number"]
                ] as MapMarker
            ).showCallout();
        }
        if (
            detailCenter !== undefined &&
            draggableOverlapImperatives.current !== undefined
        ) {
            draggableOverlapImperatives.current.open();
        } else if (draggableOverlapImperatives.current !== undefined) {
            draggableOverlapImperatives.current.close();
        }
    }, [detailCenter]);

    //Search when unit, map center, or search radius changes
    useEffect(() => {
        setSearchingCenters(true);
        allCenters.length > 0 &&
            currentCenter !== undefined &&
            determineNearbyCenters(
                allCenters,
                currentCenter.lat,
                currentCenter.lon
            );
    }, [searchRadius, unit, currentCenter]);

    //Get nearby centers when map loads
    useEffect(() => {
        getCurrentLocation(async (location) => {
            const lat = location.coords.latitude;
            const lon = location.coords.longitude;
            setCurrentCenter({ lat: lat, lon: lon });
            moveToLocation(location);
        });
    }, [allCenters]);

    //Moves map to provided location
    const moveToLocation = (location: Location.LocationObject) => {
        if (mapRef.current !== undefined && mapRef.current !== null) {
            setLocationColor("#60b1fc");
            mapRef.current.animateToRegion(
                {
                    latitude: location.coords.latitude,
                    longitude: location.coords.longitude,
                    latitudeDelta: 0.1,
                    longitudeDelta: 0.1,
                },
                1000
            );
            currentCenter !== undefined &&
                (location.coords.latitude !== currentCenter.lat ||
                    location.coords.longitude !== currentCenter.lon) &&
                setCurrentCenter({
                    lat: location.coords.latitude,
                    lon: location.coords.longitude,
                });
        }
    };

    //Gets the users current location
    async function getCurrentLocation(
        callback?: (location: Location.LocationObject) => void
    ) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            console.warn("Location permission not granted");
            return;
        }
        const location = await Location.getCurrentPositionAsync({});
        callback && callback(location);
    }

    //Calls the function for loading user prefs
    useFocusEffect(() => {
        getData();
    });

    //Loads users preferences
    const getData = async () => {
        try {
            const asycnUnit = await AsyncStorage.getItem("unitPref");
            if (asycnUnit !== null) {
                unit !== asycnUnit && setUnit(asycnUnit);
            } else {
                await AsyncStorage.setItem("unitPref", "Imperial");
                setUnit("Imperial");
            }
            const asyncSearchRadius = await AsyncStorage.getItem("radiusPref");
            if (asyncSearchRadius !== null) {
                Number(asyncSearchRadius) !== searchRadius &&
                    setSearchRadius(Number(asyncSearchRadius));
            } else {
                await AsyncStorage.setItem("radiusPref", "10");
                setSearchRadius(Number("10"));
            }
        } catch (e) {
            console.log(e);
        }
    };

    //Updates map center
    const updateCenter = () => {
        mapRef &&
            mapRef.current
                ?.getCamera()
                .then((val) => {
                    setCurrentCenter({
                        lat: val.center.latitude,
                        lon: val.center.longitude,
                    });
                })
                .catch((err) => {
                    console.log("Error, " + err);
                });
    };

    const safeAreaInsets = useSafeAreaInsets();
    const MAP_OFFSET =
        Platform.OS === "android"
            ? {
                  top: safeAreaInsets.top,
                  right: safeAreaInsets.right + 20,
                  bottom: safeAreaInsets.bottom + 60,
                  left: safeAreaInsets.left + 20,
              }
            : {
                  top: 0,
                  right: safeAreaInsets.left + 20,
                  bottom: safeAreaInsets.bottom + 15,
                  left: safeAreaInsets.left + 20,
              };

    const draggableOverlapImperatives =
        useRef<ClippedDraggablesHandle>(undefined);

    const clusterTimeout = useRef<number | null>(null);

    const safeComputeClusters = () => {
        if (clusterTimeout.current) clearTimeout(clusterTimeout.current);
        clusterTimeout.current = setTimeout(() => {
            computeVisibleClusters();
        }, 200);
    };

    return (
        <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
            <GestureHandlerRootView
                style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    left: 0,
                    bottom: 0,
                }}
            >
                <MapView
                    toolbarEnabled={false}
                    onPanDrag={() => {
                        locationColor !== "gray" && setLocationColor("gray");
                    }}
                    onRegionChangeComplete={safeComputeClusters}
                    onPress={() => {
                        setDetailCenter(undefined);
                    }}
                    mapPadding={MAP_OFFSET}
                    //@ts-ignore
                    ref={(ref) => (mapRef.current = ref)}
                    style={{ width: "100%", height: "100%" }}
                    showsMyLocationButton={false}
                    showsUserLocation
                    initialRegion={INITIAL_REGION}
                >
                    {/* {clusteredDisplayCenters.map((item) => {
                        if (item.type === "cluster") {
                            console.log(item);
                            return (
                                <ClusterMarker
                                    key={`c-${item.coordinate.latitude}-${item.coordinate.longitude}-${item.count}`}
                                    id={item.id}
                                    count={item.count}
                                    coordinate={item.coordinate}
                                    onPress={() => {
                                        // mapRef.current?.animateCamera({
                                        //     center: item.coordinate,
                                        //     zoom: camZoom + 2,
                                        // });
                                    }}
                                />
                            );
                        }

                        return (
                            <CenterMarker
                                key={item.id}
                                center={item.center}
                                selected={
                                    item.center["BPHC Assigned Number"] ===
                                    detailCenter?.["BPHC Assigned Number"]
                                }
                                onPress={() => {
                                    setDetailCenter(item.center);
                                }}
                                coordinate={item.coordinate}
                                refFunc={createMarkerRef(item.id)}
                            />
                        );
                    })} */}
                </MapView>
                <ClippedDraggables
                    header={
                        <DraggableHeader
                            loading={!searchingCenters && !loading}
                            locationColor={locationColor}
                            updateCenter={updateCenter}
                            returnToUser={() =>
                                getCurrentLocation(moveToLocation)
                            }
                        />
                    }
                    clippedContent={
                        <DraggableContent
                            setDetailCenter={setDetailCenter}
                            nearbyCenters={nearbyCenters}
                            allCenters={allCenters}
                            setSearchingCenters={setSearchingCenters}
                            setDisplayCenters={setDisplayCenters}
                            currentCenter={currentCenter}
                            setCurrentCenter={setCurrentCenter}
                            displayCenters={displayCenters}
                            unit={unit}
                            searching={loading || searchingCenters}
                            mapRef={mapRef}
                        />
                    }
                    topContent={
                        lastValidDetailCenter ? (
                            <CenterDetails
                                close={
                                    draggableOverlapImperatives.current
                                        ? () => {
                                              (
                                                  markerRefs.current[
                                                      lastValidDetailCenter[
                                                          "BPHC Assigned Number"
                                                      ]
                                                  ] as MapMarker
                                              ).hideCallout();
                                              draggableOverlapImperatives.current &&
                                                  draggableOverlapImperatives.current.close();
                                              setDetailCenter(undefined);
                                          }
                                        : () => {}
                                }
                                center={lastValidDetailCenter}
                            />
                        ) : (
                            <></>
                        )
                    }
                    ref={draggableOverlapImperatives}
                />
                {/*Cover whole screen, always be on top, but let touches through*/}
            </GestureHandlerRootView>
        </View>
    );
}
