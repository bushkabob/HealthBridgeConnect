import CenterInfoSearch from "@/components/CenterInfoSearch";
import DraggableSearchBar from "@/components/DraggableSearchBar";
import { useThemeColor } from "@/hooks/use-theme-color";
import useDatabase from "@/hooks/useDatabase";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
import React, {
    ReactElement,
    RefObject,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import {
    ActivityIndicator,
    Platform,
    Pressable,
    Text,
    View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import MapView, { Callout, Marker } from "react-native-maps";
import Animated, { useAnimatedScrollHandler } from "react-native-reanimated";
import { FQHCSite } from "./types";

export default function Map() {
    const [locationColor, setLocationColor] = useState<string>("gray");

    const [allCenters, setAllCenters] = useState<FQHCSite[]>([]);
    const [nearbyCenters, setNearbyCenters] = useState<FQHCSite[]>([]);
    const [displayCenters, setDisplayCenters] = useState<FQHCSite[]>([]);
    const [currentCenter, setCurrentCenter] = useState<
        { lat: number; lon: number } | undefined
    >(undefined);

    const [searchValue, setSearchValue] = useState<string>("");
    const [searchArea, setSearchArea] = useState<string>("Nearby");

    const [searchRadius, setSearchRadius] = useState<number>(10);
    const [unit, setUnit] = useState<string>("Imperial");
    const [searchingCenters, setSearchingCenters] = useState<boolean>(false);

    const { loading, query } = useDatabase();

    const mapRef = useRef<MapView>(null);
    //This works by TS does not like it
    const markerRefs = useRef<any>({});

    const themeBack = useThemeColor({}, "background");
    const themeText = useThemeColor({}, "text");

    //Distance is KM!
    function haversineDistance(
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
            Math.cos(toRad(lat1)) *
                Math.cos(toRad(lat2)) *
                Math.sin(dLon / 2) ** 2;
        return 2 * R * Math.asin(Math.sqrt(a));
    }

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

    const determineNearbyCenters = (refLat: number, refLon: number) => {
        const filteredCenters = allCenters
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

    const searchCenters = (centerOptions: FQHCSite[]) => {
        setSearchingCenters(true);
        const filteredCenters = centerOptions
            .filter((val) => {
                const address = `${val["Site Address"]}, ${val["Site City"]}, ${val["Site State Abbreviation"]} ${val["Site Postal Code"]}`;
                const lowerSearch = searchValue.toLowerCase();
                return (
                    address.toLowerCase().includes(lowerSearch) ||
                    val["Site Name"].toLowerCase().includes(lowerSearch)
                );
            })
            .sort((a, b) => a.distance - b.distance);
        if (filteredCenters.length > 100) {
            filteredCenters.length = 100;
        }

        return filteredCenters;
    };

    useEffect(() => {
        if (allCenters.length > 0) {
            searchValue === ""
                ? setDisplayCenters(nearbyCenters)
                : setDisplayCenters(
                      searchCenters(
                          searchArea === "Nearby" ? nearbyCenters : allCenters
                      )
                  );
        }
    }, [searchValue, nearbyCenters, searchArea]);

    useEffect(() => {
        !loading && setSearchingCenters(false);
    }, [displayCenters]);

    useEffect(() => {
        setSearchingCenters(true);
        allCenters.length > 0 &&
            currentCenter !== undefined &&
            determineNearbyCenters(currentCenter.lat, currentCenter.lon);
    }, [searchRadius, unit, currentCenter]);

    useEffect(() => {
        getCurrentLocation(async (location) => {
            const lat = location.coords.latitude;
            const lon = location.coords.longitude;
            setCurrentCenter({ lat: lat, lon: lon });
        });
    }, [allCenters]);

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

    useEffect(() => {
        getCurrentLocation();
    }, []);

    useFocusEffect(() => {
        getData();
    });

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

    const updateCenter = () => {
        console.log("run");
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

    useLayoutEffect(() => {
        getData();
    }, []);

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
                    onPanDrag={() => {
                        locationColor !== "gray" && setLocationColor("gray");
                    }}
                    mapPadding={{ top: 0, right: 0, bottom: 50, left: 20 }}
                    ref={mapRef}
                    style={{ width: "100%", height: "100%" }}
                    showsMyLocationButton
                    showsUserLocation
                >
                    {displayCenters.map((center) => (
                        <Marker
                            key={center["BPHC Assigned Number"]}
                            ref={(ref) => {
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
                        >
                            <Callout
                                onPress={() => {
                                    router.push({
                                        pathname: "/details",
                                        params: {
                                            id: center["BPHC Assigned Number"],
                                            name: center["Site Name"],
                                        },
                                    });
                                }}
                            >
                                <View
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        maxWidth: 250,
                                        flexWrap: "nowrap",
                                    }}
                                >
                                    <View
                                        style={{ flexShrink: 1, flexGrow: 1 }}
                                    >
                                        <Text ellipsizeMode="tail">
                                            {center["Site Name"]}
                                        </Text>
                                        <Text ellipsizeMode="tail">
                                            {center["Site Address"]}
                                        </Text>
                                    </View>

                                    <Pressable
                                        style={{
                                            width: 24,
                                            alignItems: "center",
                                            justifyContent: "center",
                                            marginLeft: 6,
                                        }}
                                    >
                                        <Ionicons
                                            size={20}
                                            name="arrow-forward"
                                        />
                                    </Pressable>
                                </View>
                            </Callout>
                        </Marker>
                    ))}
                </MapView>

                <DraggableSearchBar
                    searchValue={searchValue}
                    setSearchValue={setSearchValue}
                    searchContent={
                        <SearchResults
                            themeBack={themeBack}
                            themeText={themeText}
                            unit={unit}
                            markerRefs={markerRefs}
                            mapRef={mapRef}
                            searchingCenters={searchingCenters}
                            displayCenters={displayCenters}
                        />
                    }
                    searchActiveCotent={
                        <View
                            style={{
                                margin: 5,
                                paddingHorizontal: 10,
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            <SegmentedControl
                                onChange={() =>
                                    setSearchArea((val) =>
                                        val === "All" ? "Nearby" : "All"
                                    )
                                }
                                values={["Search Current Area", "Search All"]}
                                selectedIndex={searchArea === "Nearby" ? 0 : 1}
                                style={{ width: "100%" }}
                            />
                        </View>
                    }
                >
                    <GlassView
                        isInteractive
                        style={[
                            {
                                padding: 10,
                                borderRadius: 40,
                                alignSelf: "flex-end",
                                gap: 20,
                            },
                            isLiquidGlassAvailable()
                                ? {}
                                : { backgroundColor: themeBack },
                        ]}
                    >
                        <Pressable onPress={updateCenter}>
                            {!searchingCenters && !loading ? (
                                <Ionicons
                                    name="search"
                                    size={30}
                                    color={"gray"}
                                />
                            ) : (
                                <ActivityIndicator size={30} />
                            )}
                        </Pressable>
                        <Pressable
                            onPress={() => getCurrentLocation(moveToLocation)}
                        >
                            <Ionicons
                                name="navigate"
                                size={30}
                                color={locationColor}
                            />
                        </Pressable>
                        <Pressable onPress={() => router.navigate("/settings")}>
                            <Ionicons
                                name="settings"
                                size={30}
                                color={"gray"}
                            />
                        </Pressable>
                    </GlassView>
                </DraggableSearchBar>
            </GestureHandlerRootView>
        </View>
    );
}

interface SearchResultsProps {
    searchingCenters: boolean;
    themeText: string;
    themeBack: string;
    unit: string;
    displayCenters: FQHCSite[];
    markerRefs: any;
    mapRef: RefObject<MapView | null>;
    flatListRef?: RefObject<Animated.FlatList | null>;
    header?: ReactElement;
    headerOffset?: number;
    scrollEnabled?: boolean;
    scrollHandler?: ReturnType<typeof useAnimatedScrollHandler>;
    minimizeScroll?: Function;
}

const SearchResults = React.memo((props: SearchResultsProps) => {
    return (
        <>
            <Animated.FlatList
                ref={props.flatListRef}
                contentContainerStyle={{
                    paddingBottom: 100,
                    marginTop: props.headerOffset,
                }} /**/
                scrollIndicatorInsets={{ top: props.headerOffset }}
                showsVerticalScrollIndicator={!(Platform.OS === "android")}
                data={props.displayCenters}
                ListHeaderComponent={props.header}
                removeClippedSubviews
                initialNumToRender={15}
                maxToRenderPerBatch={15}
                scrollEnabled={props.scrollEnabled}
                onScroll={props.scrollHandler}
                ListEmptyComponent={
                    <View
                        style={{
                            width: "100%",
                            height: "100%",
                            marginTop: 10,
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Text
                            style={{
                                color: props.themeText,
                                fontWeight: "bold",
                            }}
                        >
                            No Centers within Search Area
                        </Text>
                    </View>
                }
                renderItem={(val) => {
                    const moveToIcon = () => {
                        props.mapRef.current?.animateToRegion(
                            {
                                latitude: Number(
                                    val.item[
                                        "Geocoding Artifact Address Primary Y Coordinate"
                                    ]
                                ),
                                longitude: Number(
                                    val.item[
                                        "Geocoding Artifact Address Primary X Coordinate"
                                    ]
                                ),
                                latitudeDelta: 0.01,
                                longitudeDelta: 0.01,
                            },
                            1000
                        );
                        props.minimizeScroll && props.minimizeScroll();
                        props.flatListRef?.current?.scrollToOffset({
                            animated: true,
                            offset: -1 * (props.headerOffset || 0),
                        });
                        setTimeout(
                            () =>
                                props.markerRefs.current[
                                    val.item["BPHC Assigned Number"]
                                ].showCallout(),
                            1000
                        );
                    };
                    return (
                        <CenterInfoSearch
                            onClick={moveToIcon}
                            textColor={props.themeText}
                            color={props.themeBack}
                            key={val.item["BPHC Assigned Number"]}
                            site={val.item}
                            unit={props.unit === "Imperial" ? "mi" : "km"}
                        />
                    );
                }}
            />
        </>
    );
});
