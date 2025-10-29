import CenterInfoSearch from "@/components/CenterInfoSearch";
import DraggableSearchBar from "@/components/DraggableSearchBar";
import { useThemeColor } from "@/hooks/use-theme-color";
import useDatabase from "@/hooks/useDatabase";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { GlassView } from "expo-glass-effect";
import * as Location from "expo-location";
import { router, useFocusEffect } from "expo-router";
import React, {
    ReactElement,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from "react";
import { Pressable, Text, View } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import MapView, { Marker } from "react-native-maps";
import { FQHCSite } from "./types";

export default function Map() {
    const [locationColor, setLocationColor] = useState<string>("gray");

    const [allCenters, setAllCenters] = useState<FQHCSite[]>([]);
    const [nearbyCenters, setNearbyCenters] = useState<FQHCSite[]>([]);
    const [displayCenters, setDisplayCenters] = useState<FQHCSite[]>([]);

    const [searchValue, setSearchValue] = useState<string>("");
    const [searchArea, setSearchArea] = useState<string>("Nearby");

    const [searchRadius, setSearchRadius] = useState<number>(10);
    const [unit, setUnit] = useState<string>("Imperial");
    const [searchingCenters, setSearchingCenters] = useState<boolean>(true);

    const { loading, query } = useDatabase();

    const mapRef = useRef<MapView>(null);

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
        console.log("filtered lenght: " + filteredCenters.length);
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
        setSearchingCenters(false);
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
        if (allCenters.length > 0) {
            setSearchingCenters(true);
            getCurrentLocation(async (location) => {
                const lat = location.coords.latitude;
                const lon = location.coords.longitude;
                determineNearbyCenters(lat, lon);
                setSearchingCenters(false);
            });
        }
    }, [searchRadius, unit, allCenters]);

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

    useLayoutEffect(() => {
        getData();
    }, []);

    return (
        <View
            style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
        >
            <MapView
                onPanDrag={() => {
                    locationColor !== "gray" && setLocationColor("gray");
                }}
                mapPadding={{ top: 50, bottom: 50, left: 20, right: 20 }}
                ref={mapRef}
                style={{ width: "100%", height: "100%" }}
                showsMyLocationButton
                showsUserLocation
            >
                {displayCenters.map((center) => (
                    <Marker
                        key={center["BPHC Assigned Number"]}
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
                        title={center["Site Name"]}
                        description={center["Site Address"]}
                    />
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
                    style={{
                        padding: 10,
                        borderRadius: 40,
                        alignSelf: "flex-end",
                        gap: 20,
                    }}
                >
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
                        <Ionicons name="settings" size={30} color={"gray"} />
                    </Pressable>
                </GlassView>
            </DraggableSearchBar>
        </View>
    );
}

interface SearchResultsProps {
    searchingCenters: boolean;
    themeText: string;
    themeBack: string;
    unit: string;
    displayCenters: FQHCSite[];
    header?: ReactElement;
    headerOffset?: number
    scrollEnabled?: boolean
}

const SearchResults = React.memo((props: SearchResultsProps) => {
    return (
        <>
            <FlatList
                contentContainerStyle={{ paddingBottom: 64 }}
                contentInset={{top: props.headerOffset}}
                scrollIndicatorInsets={{top: props.headerOffset}}
                data={props.displayCenters}
                ListHeaderComponent={props.header}
                removeClippedSubviews
                initialNumToRender={15}
                maxToRenderPerBatch={15}
                scrollEnabled={props.scrollEnabled}
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
                    return (
                        <CenterInfoSearch
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
