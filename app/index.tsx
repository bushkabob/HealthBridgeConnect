import CenterDetails from "@/components/CenterDetails";
import CenterMarker from "@/components/CenterMarker";
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
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MapView, { MapMarker } from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { FQHCSite, MapCenter } from "../types/types";
import { haversineDistance } from "./utils";

const INITIAL_REGION = {
    latitude: 39.3669492313556,
    latitudeDelta: 82.71817584815484,
    longitude: -96.13953430290948,
    longitudeDelta: 55.18789991356607,
};

export default function Map() {
    const [locationColor, setLocationColor] = useState<string>("gray");

    const [allCenters, setAllCenters] = useState<FQHCSite[]>([]);
    const [nearbyCenters, setNearbyCenters] = useState<FQHCSite[]>([]);
    const [displayCenters, setDisplayCenters] = useState<FQHCSite[]>([]);
    // const [geoJson, setGeoJson] = useState<
    //     Supercluster.PointFeature<Supercluster.AnyProps>[]
    // >([]);
    const [currentCenter, setCurrentCenter] = useState<MapCenter>(undefined);
    const [detailCenter, setDetailCenter] = useState<FQHCSite>();
    const [lastValidDetailCenter, setLastValidDetailCenter] =
        useState<FQHCSite>();

    const [searchRadius, setSearchRadius] = useState<number>(10);
    const [unit, setUnit] = useState<string>("Imperial");
    const [searchingCenters, setSearchingCenters] = useState<boolean>(false);
    const [region, setRegion] = useState(INITIAL_REGION);

    const { loading, query } = useDatabase();

    const mapRef = useRef<MapView>(null);
    // @ts-ignore
    const markerRefs = useRef<Record<string, Marker | null>>({});

    // const [points, supercluster] = useClusterer(
    //     geoJson,
    //     {
    //         width: Dimensions.get("screen").width,
    //         height: Dimensions.get("screen").height,
    //     },
    //     region
    // );

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
        // const geoJsons = displayCenters.map((val) => {
        //     return {
        //         type: "Feature" as "Feature",
        //         geometry: {
        //             type: "Point" as "Point",
        //             coordinates: [Number(val["Geocoding Artifact Address Primary Y Coordinate"]), Number(val["Geocoding Artifact Address Primary X Coordinate"])]
        //         },
        //         properties: {}
        //     };
        // });
        // setGeoJson(geoJsons);
    }, [displayCenters]);

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

    const draggableOverlapImperatives =
        useRef<ClippedDraggablesHandle>(undefined);

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
                    onPress={() => {
                        setDetailCenter(undefined);
                    }}
                    mapPadding={
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
                              }
                    }
                    //@ts-ignore
                    ref={(ref) => (mapRef.current = ref)}
                    style={{ width: "100%", height: "100%" }}
                    showsMyLocationButton={false}
                    showsUserLocation
                    onRegionChangeComplete={setRegion}
                    initialRegion={INITIAL_REGION}
                >
                    {displayCenters.map((center) => (
                        <CenterMarker
                            onPress={() => {
                                setDetailCenter(center);
                            }}
                            key={center["BPHC Assigned Number"]}
                            center={center}
                            refFunc={createMarkerRef(
                                center["BPHC Assigned Number"]
                            )}
                            selected={
                                center["BPHC Assigned Number"] ===
                                detailCenter?.["BPHC Assigned Number"]
                            }
                            coordinate={{
                                latitude: Number(
                                    center[
                                        "Geocoding Artifact Address Primary Y Coordinate"
                                    ]
                                ),
                                longitude: Number(
                                    center[
                                        "Geocoding Artifact Address Primary X Coordinate"
                                    ]
                                ),
                            }}
                        />
                    ))}
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
                            // markerRefs={markerRefs}
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
