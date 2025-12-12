import { AnimatedBlurView, haversineDistance } from "@/app/utils";
import { useThemeColor } from "@/hooks/use-theme-color";
import { City, FQHCSite, MapCenter } from "@/types/types";
import React, { RefObject, useEffect, useRef, useState } from "react";
import { Platform, Text, View } from "react-native";
import { GestureDetector } from "react-native-gesture-handler";
import MapView from "react-native-maps";
import Animated, {
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedProps,
    useAnimatedReaction,
} from "react-native-reanimated";
import CenterInfoSearch from "./CenterInfoSearch";
import { DraggableHandle } from "./FixedDraggable";
import { useFixedDraggable } from "./FixedDraggableContext";
import SearchRow from "./SearchRow";

interface DraggableContentProps {
    setDisplayCenters: Function;
    setDetailCenter: Function;
    currentCenter: MapCenter;
    setSearchingCenters: Function;
    allCenters: FQHCSite[];
    nearbyCenters: FQHCSite[];
    displayCenters: FQHCSite[];
    setCurrentCenter: Function;
    unit: string;
    searching: boolean;
    mapRef: RefObject<MapView | null>
    //@ts-ignore
    // markerRefs: RefObject<Record<string, Marker | null>>;
}

const DraggableContent = (props: DraggableContentProps) => {
    const [searchValue, setSearchValue] = useState("");
    const [displayCities, setDisplayCities] = useState<City[]>([]);
    const [searchArea, setSearchArea] = useState<string>("");
    const [searchActive, setSearchActive] = useState<boolean>(false);
    const [cities, setCities] = useState<{
        [key: string]: { alternatives: string[], lat: number; lon: number };
    }>({});

    const { progress, snapping, scrollY, setViewHeight, MIN_HEIGHT } = useFixedDraggable();

    const headerHeight = MIN_HEIGHT;

    const cancelActiveSearch = () => {
        setSearchActive(false);
    };

    useAnimatedReaction(
        () => [progress, snapping],
        (curr, prev) => {
            if (!prev) {
                return;
            }
            if (curr[1].value === false && (curr[0].value as number) < 1 && searchValue === "") {
                runOnJS(cancelActiveSearch)();
            }
        }
    );

    const searchCenters = (centerOptions: FQHCSite[]) => {
        props.setSearchingCenters(true);
        const filteredCenters = centerOptions
            .filter((val) => {
                const address = (`${val["Site Address"]}, ${val["Site City"]}, ${val["Site State Abbreviation"]} ${val["Site Postal Code"]}`).toLowerCase().replaceAll(" ", "").replaceAll(",", "");
                const lowerSearch = searchValue.toLowerCase().replaceAll(" ", "");
                return (
                    address.includes(lowerSearch) ||
                    val["Site Name"].toLowerCase().replaceAll(" ", "").includes(lowerSearch)
                );
            })
            .sort((a, b) => a.distance - b.distance);
        if (filteredCenters.length > 100) {
            filteredCenters.length = 100;
        }

        return filteredCenters;
    };

    useEffect(() => {
        !searchActive && setSearchValue("")
    }, [searchActive])

    //Debounced search
    useEffect(() => {
        console.log("search run")
        if (props.allCenters.length === 0) return;
        const handler = setTimeout(() => {
            if (searchValue === "") {
                console.log("blank search")
                props.setDisplayCenters(props.nearbyCenters);
                setDisplayCities([]);
            } else {
                // TODO - Combine into single search function
                props.setDisplayCenters(
                    searchCenters(
                        searchArea === "Nearby"
                            ? props.nearbyCenters
                            : props.allCenters
                    )
                );
                const lowerSearch = searchValue.toLowerCase().replaceAll(" ", "");
                searchArea === "Nearby"
                    ? setDisplayCities([])
                    : setDisplayCities(
                          searchCities(lowerSearch, {
                              lat: props.currentCenter?.lat || 0,
                              lon: props.currentCenter?.lon || 0,
                          })
                      );
            }
        }, 250);

        return () => clearTimeout(handler);
    }, [searchValue, props.nearbyCenters, searchArea]);

    //Function for searching cities
    const searchCities = (
        query: string,
        currentCenter: { lat: number; lon: number }
    ) => {
        if (!query) return [];
        const q = query.toLowerCase().trim().replaceAll(",", "");
        const cityKeys = Object.keys(cities);
        const directMatches: string[] = [];

        for (const key of cityKeys) {
            if (cities[key].alternatives.filter(val=> val.includes(q)).length > 0) {
                directMatches.push(key);
                if (directMatches.length >= 15) break;
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
        // const fuzzyResults = cityKeys
        //     .slice(0, 1000)
        //     .map((k) => ({
        //         key: k,
        //         dist: levenshtein(k, q),
        //     }))
        //     .sort((a, b) => a.dist - b.dist)
        //     .slice(0, 5);

        // return fuzzyResults.map(({ key }) => ({
        //     name: key
        //         .split(",")
        //         .map((x) => x.trim().replace(/^\w/, (c) => c.toUpperCase()))
        //         .join(", "),
        //     lat: cities[key].lat,
        //     lon: cities[key].lon,
        //     distance: haversineDistance(
        //         cities[key].lat,
        //         cities[key].lon,
        //         currentCenter.lat,
        //         currentCenter.lon
        //     ),
        // }));
        return []
    };

    //Load initial cities
    useEffect(() => {
        (async () => {
            const data = (await import("@/assets/cities.json")) as any;
            const textCoords: { [key: string]: { alternatives: string[], lat: number; lon: number } } =
                {};
            Object.keys(data).forEach((val) => {
                if (val != "default") {
                    const countryObj = data[val];
                    textCoords[countryObj.name] = {
                        alternatives: [countryObj.name.replaceAll(" ", ""), countryObj.iso2],
                        lat: Number(countryObj["latitude"]),
                        lon: Number(countryObj["longitude"]),
                    };
                    Object.keys(countryObj.states).forEach((state) => {
                        const stateObject = countryObj.states[state];
                        const stateName = stateObject.name.toLowerCase().replaceAll(" ", "");
                        const stateAbbreviation = stateObject.state_code.toLowerCase().replaceAll(" ", "");
                        textCoords[stateObject.name] = {
                            alternatives: [stateName, stateAbbreviation],
                            lat: Number(stateObject.latitude),
                            lon: Number(stateObject.longitude),
                        };
                        
                        stateObject.cities.forEach((city: any) => {
                            const cityName = city.name.toLowerCase().replaceAll(" ", "")
                            textCoords[city.name + ", " + stateObject.name] = {
                                alternatives: [cityName + stateName, cityName + stateAbbreviation, stateName + cityName, stateAbbreviation + cityName],
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

    // const derivedY = useDerivedValue(() => { return props.scrollY?.value })

    const animatedIntensity = useAnimatedProps(() => {
        const intensity = interpolate(
            scrollY.value,
            [0, 150],
            [0, 100],
            Extrapolation.CLAMP
        );
        return { intensity };
    });

    return (
        <View style={{ width: "100%", height: "100%", borderRadius: 40 }}>
            <AnimatedBlurView
                animatedProps={animatedIntensity}
                style={{
                    position: "absolute",
                    top: 0,
                    right: 0,
                    left: 0,
                    zIndex: 100,
                    minHeight: headerHeight,
                }}
                experimentalBlurMethod="dimezisBlurView"
            >
                <DraggableHandle />
                <SearchRow
                    searchActive={searchActive}
                    setSearchActive={setSearchActive}
                    value={searchValue}
                    setValue={setSearchValue}
                    setViewHeight={setViewHeight}
                    searchArea={searchArea}
                    setSearchArea={setSearchArea}
                />
            </AnimatedBlurView>
            <SearchResults
                setDetailCenter={props.setDetailCenter}
                searchingCenters={props.searching}
                unit={props.unit}
                displayCenters={props.displayCenters}
                cities={displayCities}
                setCenter={props.setCurrentCenter}
                headerHeight={searchActive ? headerHeight + 50 : headerHeight}
                setSearchActive={setSearchActive}
                mapRef={props.mapRef}
                minimizeScroll={() => {
                    setViewHeight(0.0, 300);
                }}
            />
        </View>
    );
};

export default DraggableContent;

interface SearchResultsProps {
    setDetailCenter: Function;
    setSearchActive: Function
    searchingCenters: boolean;
    unit: string;
    displayCenters: FQHCSite[];
    cities: City[];
    mapRef: RefObject<MapView | null>
    setCenter: Function;
    headerHeight: number;
    minimizeScroll?: Function;
}

const SearchResults = React.memo((props: SearchResultsProps) => {
    const { progress, snapping, scrollHandler, gesture } = useFixedDraggable();

    const locales: {
        name: string;
        id: string;
        distance: number;
        isCity: boolean;
        lon: number;
        lat: number;
    }[] = [];
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
    //Sort distance-wise
    locales.sort((a, b) => (a.distance <= b.distance ? -1 : 1));

    const backgroundColor = useThemeColor({}, "background");
    const textColor = useThemeColor({}, "text");
    const flatListRef = useRef<Animated.FlatList | null>(null);

    const scrollToTop = () => {
        flatListRef.current!.scrollToOffset({ animated: true, offset: 0 });
    };

    useAnimatedReaction(
        () => [progress, snapping],
        (curr, prev) => {
            if (!prev) {
                return;
            }
            if (
                curr[1].value === false &&
                (curr[0].value as number) < 1 &&
                flatListRef
            ) {
                runOnJS(scrollToTop)();
            }
        }
    );

    const additionalScrollProps = useAnimatedProps(() => {
        return {
            showsVerticalScrollIndicator: !(Platform.OS === "android") && progress.value > 0,
            scrollEnabled: progress.value === 1
        }
    })

    return (
        <GestureDetector gesture={gesture}>
            <Animated.FlatList
                ref={flatListRef}
                contentContainerStyle={{
                    paddingBottom: 100,
                    paddingTop: props.headerHeight,
                }}
                scrollIndicatorInsets={{ top: props.headerHeight }}
                showsVerticalScrollIndicator={!(Platform.OS === "android")}
                data={locales}
                removeClippedSubviews
                initialNumToRender={15}
                maxToRenderPerBatch={15}
                onScroll={scrollHandler}
                animatedProps={additionalScrollProps}
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
                                color: textColor,
                                fontWeight: "bold",
                            }}
                        >
                            No Centers within Search Area
                        </Text>
                    </View>
                }
                renderItem={(val) => {
                    const delta = val.item.isCity ? 0.1 : 0.1;
                    const moveToIcon = () => {
                        val.item.isCity && props.mapRef.current?.animateToRegion(
                            {
                                latitude: val.item.lat,
                                longitude: val.item.lon,
                                latitudeDelta: delta,
                                longitudeDelta: delta,
                            },
                            1000
                        );
                        props.minimizeScroll && props.minimizeScroll();
                        flatListRef?.current?.scrollToOffset({
                            animated: true,
                            offset: 0,
                        });
                        !val.item.isCity
                            ? (setTimeout(
                                  () =>
                                    props.setDetailCenter(
                                        props.displayCenters.filter(
                                            (center) => center["BPHC Assigned Number"] === val.item.id
                                        )[0]
                                    )
                              ,1000))
                              //Movement to center will take care of animation
                            : (props.setCenter({
                                  lat: val.item.lat,
                                  lon: val.item.lon,
                              }), props.setSearchActive(false)
                            );
                    };
                    return (
                        <CenterInfoSearch
                            onClick={moveToIcon}
                            textColor={textColor}
                            color={backgroundColor}
                            key={val.item.id}
                            distance={val.item.distance}
                            name={val.item.name}
                            showCityIcon={val.item.isCity}
                            unit={props.unit === "Imperial" ? "mi" : "km"}
                        />
                    );
                }}
            />
        </GestureDetector>
    );
});
