import CenterInfoSearch from "@/components/CenterInfoSearch";
import CenterMarker from "@/components/CenterMarker";
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
import MapView from "react-native-maps";
import Animated, { useAnimatedScrollHandler } from "react-native-reanimated";
import { City, FQHCSite } from "./types";
import { levenshtein } from "./utils";

export default function Map() {
    const [locationColor, setLocationColor] = useState<string>("gray");

    const [allCenters, setAllCenters] = useState<FQHCSite[]>([]);
    const [nearbyCenters, setNearbyCenters] = useState<FQHCSite[]>([]);
    const [displayCenters, setDisplayCenters] = useState<FQHCSite[]>([]);
    const [displayCities, setDisplayCities] = useState<City[]>([]);
    const [currentCenter, setCurrentCenter] = useState<
        { lat: number; lon: number } | undefined
    >(undefined);

    const [searchValue, setSearchValue] = useState<string>("");
    const [searchArea, setSearchArea] = useState<string>("Nearby");

    const [searchRadius, setSearchRadius] = useState<number>(10);
    const [unit, setUnit] = useState<string>("Imperial");
    const [searchingCenters, setSearchingCenters] = useState<boolean>(false);

    const [cities, setCities] = useState<{
        [key: string]: { lat: number; lon: number };
    }>({});

    const { loading, query } = useDatabase();

    const mapRef = useRef<MapView>(null);
    // @ts-ignore
    const markerRefs = useRef<Marker>({});

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

    const searchCities = (
        query: string,
        currentCenter: { lat: number; lon: number }
    ) => {
        if (!query) return [];
        const q = query.toLowerCase().trim();
        const cityKeys = Object.keys(cities);
        const directMatches: string[] = [];

        for (const key of cityKeys) {
            if (key.toLowerCase().includes(q)) {
                directMatches.push(key);
                if (directMatches.length >= 15) break; // limit results
            }
        }

        //Direct matches
        if (directMatches.length > 0) {
            return directMatches.map((key) => ({
                name: key
                    .split(",")
                    .map((x) => x.trim().replace(/^\w/, (c) => c.toUpperCase()))
                    .join(", "),
                lat: cities[key].lat,
                lon: cities[key].lon,
                distance: haversineDistance(
                    cities[key].lat,
                    cities[key].lon,
                    currentCenter.lat,
                    currentCenter.lon
                ),
            }));
        }

        //Fuzzy fallback
        const fuzzyResults = cityKeys
            .slice(0, 1000)
            .map((k) => ({
                key: k,
                dist: levenshtein(k, q),
            }))
            .sort((a, b) => a.dist - b.dist)
            .slice(0, 5);

        return fuzzyResults.map(({ key }) => ({
            name: key
                .split(",")
                .map((x) => x.trim().replace(/^\w/, (c) => c.toUpperCase()))
                .join(", "),
            lat: cities[key].lat,
            lon: cities[key].lon,
            distance: haversineDistance(
                cities[key].lat,
                cities[key].lon,
                currentCenter.lat,
                currentCenter.lon
            ),
        }));
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

    //Debounced search
    useEffect(() => {
        if (allCenters.length === 0) return;

        // create a timeout
        const handler = setTimeout(() => {
            if (searchValue === "") {
                setDisplayCenters(nearbyCenters);
                setDisplayCities([]);
            } else {
                setDisplayCenters(
                    searchCenters(
                        searchArea === "Nearby" ? nearbyCenters : allCenters
                    )
                );
                const lowerSearch = searchValue.toLowerCase();
                searchArea === "Nearby"
                    ? setDisplayCities([])
                    : setDisplayCities(
                          searchCities(lowerSearch, {
                              lat: currentCenter?.lat || 0,
                              lon: currentCenter?.lon || 0,
                          })
                      );
            }
        }, 250); // <-- debounce delay (ms)

        // cleanup (cancel previous timeout if user types again)
        return () => clearTimeout(handler);
    }, [searchValue, nearbyCenters, searchArea]);

    useEffect(() => {
        !loading && setSearchingCenters(false);
    }, [displayCenters]);

    //Research when unit, map center, or search radius changes
    useEffect(() => {
        setSearchingCenters(true);
        allCenters.length > 0 &&
            currentCenter !== undefined &&
            determineNearbyCenters(currentCenter.lat, currentCenter.lon);
    }, [searchRadius, unit, currentCenter]);

    useEffect(() => {
        setSearchValue("");
    }, [currentCenter]);

    //Get nearby centers when map loads
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

    useEffect(() => {
        (async () => {
            const data = (await import("@/assets/cities.json")) as any;
            const textCoords: { [key: string]: { lat: number; lon: number } } =
                {};
            Object.keys(data).forEach((val) => {
                if (val != "default") {
                    const countryObj = data[val];
                    textCoords[countryObj.name] = {
                        lat: Number(countryObj["latitude"]),
                        lon: Number(countryObj["longitude"]),
                    };
                    textCoords[countryObj.iso2] = {
                        lat: Number(countryObj["latitude"]),
                        lon: Number(countryObj["longitude"]),
                    };
                    textCoords[countryObj.iso3] = {
                        lat: Number(countryObj["latitude"]),
                        lon: Number(countryObj["longitude"]),
                    };
                    Object.keys(countryObj.states).forEach((state) => {
                        const stateObject = countryObj.states[state];
                        textCoords[stateObject.name] = {
                            lat: Number(stateObject.latitude),
                            lon: Number(stateObject.longitude),
                        };
                        // textCoords[stateObject.state_code] = {
                        //     lat: Number(stateObject.latitude),
                        //     lon: Number(stateObject.longitude),
                        // };
                        stateObject.cities.forEach((city: any) => {
                            textCoords[city.name + ", " + stateObject.name] = {
                                lat: Number(city.latitude),
                                lon: Number(city.longitude),
                            };
                        });
                    });
                }
            });
            setCities(textCoords);
        })();
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
                    {displayCenters.map((center) => <CenterMarker key={center["BPHC Assigned Number"]} center={center} />)}
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
                            cities={displayCities}
                            searchingCenters={searchingCenters}
                            displayCenters={displayCenters}
                            setCenter={setCurrentCenter}
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
    cities: City[];
    markerRefs: any;
    mapRef: RefObject<MapView | null>;
    flatListRef?: RefObject<Animated.FlatList | null>;
    header?: ReactElement;
    headerOffset?: number;
    scrollEnabled?: boolean;
    scrollHandler?: ReturnType<typeof useAnimatedScrollHandler>;
    minimizeScroll?: Function;
    setCenter: Function;
}

const SearchResults = React.memo((props: SearchResultsProps) => {
    const locales: ({
        name: string;
        id: string;
        distance: number;
        isCity: boolean;
        lon: number;
        lat: number;
    })[] = [];
    props.displayCenters.forEach((val) =>
        locales.push({
            name: val["Site Name"],
            id: val["BPHC Assigned Number"],
            distance: val["distance"],
            isCity: false,
            lat: Number(val["Geocoding Artifact Address Primary Y Coordinate"]),
            lon: Number(val["Geocoding Artifact Address Primary X Coordinate"]),
        })
    );
    props.cities.forEach((val) => {
        locales.push({
            name: val.name,
            id: val.name,
            distance: val.distance,
            isCity: true,
            lat: val.lat,
            lon: val.lon,
        });
    });
    locales.sort((a, b) => (a.distance <= b.distance ? -1 : 1));
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
                data={locales}
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
                    const delta = val.item.isCity ? 0.1 : 0.01;
                    const moveToIcon = () => {
                        props.mapRef.current?.animateToRegion(
                            {
                                latitude: val.item.lat,
                                longitude: val.item.lon,
                                latitudeDelta: delta,
                                longitudeDelta: delta,
                            },
                            1000
                        );
                        props.minimizeScroll && props.minimizeScroll();
                        props.flatListRef?.current?.scrollToOffset({
                            animated: true,
                            offset: -1 * (props.headerOffset || 0),
                        });

                        !val.item.isCity
                            ? setTimeout(
                                  () =>
                                      props.markerRefs.current[
                                          val.item.id
                                      ].showCallout(),
                                  1000
                              )
                            : props.setCenter({
                                  lat: val.item.lat,
                                  lon: val.item.lon,
                              });
                    };
                    console.log(val.item);
                    return (
                        <CenterInfoSearch
                            onClick={moveToIcon}
                            textColor={props.themeText}
                            color={props.themeBack}
                            key={val.item.id}
                            distance={val.item.distance}
                            name={val.item.name}
                            showCityIcon={val.item.isCity}
                            unit={props.unit === "Imperial" ? "mi" : "km"}
                        />
                    );
                }}
            />
        </>
    );
});
