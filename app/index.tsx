import CenterMarker from "@/components/CenterMarker";
import DraggableContent from "@/components/DraggableContent";
import DraggableHeader from "@/components/DraggableHeader";
import FixedDraggable from "@/components/FixedDraggable";
import useDatabase from "@/hooks/useDatabase";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { useFocusEffect } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import { Platform, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MapView from "react-native-maps";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { FQHCSite, MapCenter } from "../types/types";
import { haversineDistance } from "./utils";

export default function Map() {
    const [locationColor, setLocationColor] = useState<string>("gray");

    const [allCenters, setAllCenters] = useState<FQHCSite[]>([]);
    const [nearbyCenters, setNearbyCenters] = useState<FQHCSite[]>([]);
    const [displayCenters, setDisplayCenters] = useState<FQHCSite[]>([]);
    const [currentCenter, setCurrentCenter] = useState<MapCenter>(undefined);

    const [searchRadius, setSearchRadius] = useState<number>(10);
    const [unit, setUnit] = useState<string>("Imperial");
    const [searchingCenters, setSearchingCenters] = useState<boolean>(false);

    const { loading, query } = useDatabase();

    const mapRef = useRef<MapView>(null);
    // @ts-ignore
    const markerRefs = useRef<Marker>({});

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
    }, [displayCenters]);

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
        });
    }, [allCenters]);

    //Moves map to provided location
    const moveToLocation = (location: Location.LocationObject) => {
        if (mapRef.current) {
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

    //Calls function for user location on first load
    useEffect(() => {
        getCurrentLocation();
    }, []);

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
                    ref={mapRef}
                    style={{ width: "100%", height: "100%" }}
                    showsMyLocationButton={false}
                    showsUserLocation
                >
                    {displayCenters.map((center) => (
                        <CenterMarker
                            key={center["BPHC Assigned Number"]}
                            center={center}
                            ref={(ref: any) => {
                                if (ref) {
                                    //@ts-ignore
                                    markerRefs.current[
                                        center["BPHC Assigned Number"]
                                    ] = ref;
                                } else {
                                    delete markerRefs.current[
                                        center["BPHC Assigned Number"]
                                    ];
                                }
                            }}
                        />
                    ))}
                </MapView>
                <FixedDraggable
                    content={
                        <DraggableContent
                            nearbyCenters={nearbyCenters}
                            allCenters={allCenters}
                            setSearchingCenters={setSearchingCenters}
                            setDisplayCenters={setDisplayCenters}
                            currentCenter={currentCenter}
                            setCurrentCenter={setCurrentCenter} 
                            displayCenters={displayCenters}
                            unit={unit} 
                            searching={loading || searchingCenters} 
                            markerRefs={markerRefs} 
                            mapRef={mapRef}                        />
                    }
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
                />
                {/* <DraggableSearchBar
                    searchValue={searchValue}
                    setSearchValue={setSearchValue}
                    searchContent={
                        <SearchResults
                            themeBack={themeBack}
                            themeText={themeText}
                            unit={unit}
                            markerRefs={markerRefs}
                            mapRef={mapRef}
                            cities={displayCities}
                            searchingCenters={searchingCenters}
                            displayCenters={displayCenters}
                            setCenter={setCurrentCenter}
                        />
                    }
                >
                    
                </DraggableSearchBar> */}
            </GestureHandlerRootView>
        </View>
    );
}
