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
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MapView from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import CenterMarker from "@/components/CenterMarker";
import ClusterMarker from "@/components/ClusterMarker";
import SpiderfyCluster, { determineDeltas } from "@/components/SpiderfyCluster";
import useSupercluster, { Center } from "@/hooks/useSuperCluster";
import { FQHCSite, MapCenter } from "../types/types";
import {
    deltasToZoom,
    getMinZoomForPoint,
    haversineDistance,
    useAwaitableMapAnimation,
} from "./utils";

const INITIAL_REGION = {
    latitude: 39.3669492313556,
    latitudeDelta: 82.71817584815484,
    longitude: -96.13953430290948,
    longitudeDelta: 55.18789991356607,
};

const { width, height } = Dimensions.get("window");

const currentOffset = -0.2;

const MAX_ZOOM = 20;

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
    const [dialogShown, setDialogShown] = useState<boolean>(false)
    const [searchingCenters, setSearchingCenters] = useState<boolean>(false);
    const [useOffset, setUseOffset] = useState(false);

    const { loading, query } = useDatabase();
    const mapRef = useRef<MapView>(null);

    const { animateToRegionAsync, onRegionChangeCompleteHandler } =
        useAwaitableMapAnimation(mapRef);

    const {
        supercluster,
        clusteredDisplayCenters,
        prevZoom,
        currentZoom,
        spiderfiedClusters,
        expandedClusterId,
        safeComputeClusters,
        expandCluster,
        closeCluster,
        clearSpiderfy,
        computeVisibleClusters,
    } = useSupercluster(displayCenters, mapRef);

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
        // computeVisibleClusters()
    }, [displayCenters]);

    //Move to detail center when it is selected
    useEffect(() => {
        if (detailCenter !== undefined) {
            setLastValidDetailCenter(detailCenter);
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

    const animateToCenter = (detailCenter: FQHCSite) => {
        const lat = Number(
            detailCenter["Geocoding Artifact Address Primary Y Coordinate"]
        );
        const lon = Number(
            detailCenter["Geocoding Artifact Address Primary X Coordinate"]
        );

        const minZoom = getMinZoomForPoint(
            detailCenter["BPHC Assigned Number"],
            supercluster!
        );

        const minZoomMod =
            minZoom < MAX_ZOOM
                ? minZoom + 1
                : minZoom > MAX_ZOOM
                ? minZoom - 1
                : minZoom;

        const zoomToUse = Math.ceil(
            currentZoom > minZoomMod ? currentZoom : minZoomMod
        );
        const lonDelta = 360 / Math.pow(2, zoomToUse);
        const aspectRatio = width / height;
        const latDelta = lonDelta / aspectRatio;

        const determineOffets = (
            spiderfiedClusters: Record<number, Center[]>,
            detailCenter: FQHCSite
        ) => {
            var latOffset = 0;
            var lonOffset = 0;
            const spiderfiedIds = Object.keys(spiderfiedClusters);
            const spiderfiedClusterIndex = spiderfiedIds.findIndex(
                (val) =>
                    spiderfiedClusters[Number(val)].findIndex(
                        (center) =>
                            center.center["BPHC Assigned Number"] ===
                            detailCenter["BPHC Assigned Number"]
                    ) !== -1
            );

            const expandedId =
                spiderfiedClusterIndex !== -1
                    ? Number(spiderfiedIds[spiderfiedClusterIndex])
                    : undefined;
            if (expandedId) {
                expandCluster(expandedId);
                const index = spiderfiedClusters[expandedId].findIndex(
                    (val) =>
                        val.center["BPHC Assigned Number"] ===
                        detailCenter["BPHC Assigned Number"]
                );
                console.log(index);
                console.log(spiderfiedClusters[expandedId].length);
                const { deltaLat, deltaLon } = determineDeltas(
                    spiderfiedClusters[expandedId].length,
                    index,
                    spiderfiedClusters[expandedId][0].coordinate.latitude,
                    10
                );

                latOffset += deltaLat;
                lonOffset += deltaLon;
            }
            return { latOffset: latOffset, lonOffset: lonOffset };
        };

        console.log(zoomToUse, currentZoom);
        //If zooming in;
        if (zoomToUse !== currentZoom) {
            computeVisibleClusters(zoomToUse).then((spiderfiedClusters) => {
                const { latOffset, lonOffset } = determineOffets(
                    spiderfiedClusters,
                    detailCenter
                );
                moveToLocation(
                    {
                        lat: lat + currentOffset * latDelta + latOffset,
                        lon: lon + lonOffset,
                    },
                    false,
                    { latDelta: latDelta, lonDelta: lonDelta }
                );
            });
            //if already zoomed in
        } else {
            const { latOffset, lonOffset } = determineOffets(
                spiderfiedClusters,
                detailCenter
            );
            moveToLocation(
                {
                    lat: lat + currentOffset * latDelta + latOffset,
                    lon: lon + lonOffset,
                },
                false,
                { latDelta: latDelta, lonDelta: lonDelta }
            );
        }
        requestAnimationFrame(() => {
            setDetailCenter(detailCenter);
        });
    };

    const [usePostanimationCallback, setUsePostAnimationCallback] = useState<boolean>(false)

    const postAnimationCallback = () => {
        clearSpiderfy();
        setUsePostAnimationCallback(false)
        safeComputeClusters();
    };

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
    }, [allCenters, searchRadius, unit, currentCenter]);

    //Get nearby centers when map loads
    useEffect(() => {
        getCurrentLocation(async (location) => {
            const lat = location.lat;
            const lon = location.lon;
            moveToLocation({ lat: lat, lon: lon }, true);
        });
    }, [allCenters]);

    //Moves map to provided location
    const moveToLocation = (
        location: { lat: number; lon: number },
        shouldSetLocation: boolean,
        deltas?: { latDelta: number; lonDelta: number }
    ) => {
        const latDelta = deltas ? deltas.latDelta : 0.1;
        const lonDelta = deltas ? deltas.lonDelta : 0.1;
        if (mapRef.current !== undefined && mapRef.current !== null) {
            setLocationColor("#60b1fc");
            mapRef.current.animateToRegion(
                {
                    latitude: location.lat,
                    longitude: location.lon,
                    latitudeDelta: latDelta,
                    longitudeDelta: lonDelta,
                },
                1000
            );
            (currentCenter === undefined ||
                location.lat !== currentCenter.lat ||
                location.lon !== currentCenter.lon) &&
                shouldSetLocation &&
                setCurrentCenter({
                    lat: location.lat,
                    lon: location.lon,
                });
        }
    };

    //Gets the users current location
    async function getCurrentLocation(
        callback?: (
            location: { lat: number; lon: number },
            shouldSetLocation: boolean
        ) => void
    ) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
            console.warn("Location permission not granted");
            return;
        }
        const location = await Location.getCurrentPositionAsync({});
        callback &&
            callback(
                {
                    lat: location.coords.latitude,
                    lon: location.coords.longitude,
                },
                true
            );
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
            const dialogShown = await AsyncStorage.getItem("dialogShown");
            if(dialogShown === "true") {
                setDialogShown(true)
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
                  top: safeAreaInsets.top,
                  right: safeAreaInsets.left + 20,
                  bottom: safeAreaInsets.bottom + 15,
                  left: safeAreaInsets.left + 20,
              };

    const draggableOverlapImperatives =
        useRef<ClippedDraggablesHandle>(undefined);

    const markDialogShown = () => {
        setDialogShown(true)
        AsyncStorage.setItem("dialogShown", "true")
    }

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
                    onRegionChangeComplete={(region) => {
                        const currentZoom = Math.ceil(deltasToZoom(region.latitudeDelta, region.longitudeDelta))
                        onRegionChangeCompleteHandler();
                        console.log(
                            prevZoom,
                            currentZoom,
                            currentZoom <= MAX_ZOOM
                        );
                        if (expandedClusterId !== null) {
                            if(currentZoom < MAX_ZOOM) {
                                requestAnimationFrame(() => {
                                    closeCluster();
                                });
                                setUsePostAnimationCallback(true)
                            }
                        } else {
                            safeComputeClusters();
                        }
                    }}
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
                    {clusteredDisplayCenters.map((item) => {
                        if (item.type === "cluster") {
                            // console.log(spiderfiedClusters)
                            const spiderfied = Object.keys(
                                spiderfiedClusters
                            ).includes(item.id.toString());
                            return spiderfied ? (
                                <SpiderfyCluster
                                    key={item.id.toString()}
                                    origin={{
                                        latitude: item.coordinate.latitude,
                                        longitude: item.coordinate.longitude,
                                    }}
                                    items={spiderfiedClusters[item.id]}
                                    radius={10}
                                    duration={300}
                                    expanded={expandedClusterId === item.id}
                                    onPress={() => {
                                        if (expandedClusterId === item.id) {
                                            closeCluster();
                                        } else {
                                            expandCluster(item.id);
                                        }
                                    }}
                                    onPressCenter={(val: FQHCSite) =>
                                        animateToCenter(val)
                                    }
                                    mustClose={usePostanimationCallback}
                                    postMustClose={postAnimationCallback}
                                />
                            ) : (
                                <ClusterMarker
                                    key={`c-${item.coordinate.latitude}-${item.coordinate.longitude}-${item.count}`}
                                    id={item.id.toString()}
                                    count={item.count}
                                    coordinate={item.coordinate}
                                    isSpiderfied={false}
                                    onPress={() => {
                                        const expansionZoom =
                                            supercluster!.getClusterExpansionZoom(
                                                item.id
                                            );
                                        const zoom =
                                            expansionZoom > MAX_ZOOM
                                                ? MAX_ZOOM
                                                : expansionZoom;
                                        const lonDelta =
                                            360 / Math.pow(2, zoom);
                                        const aspectRatio = width / height;
                                        const latDelta = lonDelta / aspectRatio;
                                        computeVisibleClusters(zoom);
                                        animateToRegionAsync({
                                            latitude:
                                                item.coordinate.latitude +
                                                latDelta *
                                                    (useOffset
                                                        ? currentOffset
                                                        : 0),
                                            longitude:
                                                item.coordinate.longitude,
                                            latitudeDelta: latDelta,
                                            longitudeDelta: lonDelta,
                                        }).then(() => {
                                            if (expansionZoom > MAX_ZOOM) {
                                                expandCluster(item.id);
                                            }
                                        });
                                    }}
                                />
                            );
                        } else if (item.type === "center") {
                            return (
                                <CenterMarker
                                    key={item.id}
                                    center={item.center}
                                    selected={
                                        item.id ===
                                        detailCenter?.["BPHC Assigned Number"]
                                    }
                                    onPress={() => {
                                        animateToCenter(item.center);
                                    }}
                                    coordinate={item.coordinate}
                                />
                            );
                        }
                    })}
                </MapView>
                <ClippedDraggables
                    useOffset={useOffset}
                    setUseOffset={setUseOffset}
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
                            setDetailCenter={animateToCenter}
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
                                              draggableOverlapImperatives.current &&
                                                  draggableOverlapImperatives.current.close();
                                              setDetailCenter(undefined);
                                          }
                                        : () => {}
                                }
                                dialogShown={dialogShown}
                                setDialogShown={markDialogShown}
                                center={lastValidDetailCenter}
                                unit={unit === "Imperial" ? "mi" : "km"}
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
