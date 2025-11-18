import { AnimatedBlurView } from "@/app/utils";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useState } from "react";
import {
    Linking,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import Animated, {
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedProps,
    useAnimatedReaction,
} from "react-native-reanimated";
import {
    useSafeAreaFrame,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { FQHCSite } from "../types/types";
import { DraggableHandle, MIN_HEIGHT } from "./FixedDraggable";
import { useFixedDraggable } from "./FixedDraggableContext";

interface CenterDetailProps {
    center: FQHCSite;
    close: Function;
}

const CenterDetails = (props: CenterDetailProps) => {
    const {
        progress,
        scrollHandler,
        scrollY,
    } = useFixedDraggable();

    const frame = useSafeAreaFrame();
    const insets = useSafeAreaInsets();
    // const headerHeight = getDefaultHeaderHeight(frame, false, insets.top);
    const headerHeight = MIN_HEIGHT;
    const [scrollEnabled, setScrollEnabled] = useState<boolean>(false);

    const textColor = useThemeColor({}, "text");
    const searchBackground = useThemeColor({}, "background");
    const backgroundColor = useThemeColor({}, "background");
    const cardColor = useThemeColor({}, "card");
    const cardColor2 = useThemeColor({}, "card1");

    const address =
        props.center === null
            ? ""
            : `${props.center["Site Address"]}, ${props.center["Site City"]}, ${props.center["Site State Abbreviation"]} ${props.center["Site Postal Code"]}`;

    const openInMaps = () => {
        const encoded = encodeURIComponent(address);
        const url =
            Platform.select({
                ios: `maps:0,0?q=${encoded}`,
                android: `geo:0,0?q=${encoded}`,
            }) || `https://www.google.com/maps/search/?api=1&query=${encoded}`;
        Linking.openURL(url);
    };

    let operatesYearRound = "Unknown";
    if (
        props.center &&
        props.center["Health Center Operating Calendar Surrogate Key"] === "1"
    ) {
        operatesYearRound = "Yes";
    } else if (
        props.center &&
        props.center["Health Center Operating Calendar Surrogate Key"] === "2"
    ) {
        operatesYearRound = "No";
    }

    //disbale scrolling if draggable is not fully open
    useAnimatedReaction(
        () => progress.value,
        (p) => {
            runOnJS(setScrollEnabled)(p === 1);
        }
    );

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
        <>
            <View style={{ width: "100%", borderRadius: 40 }}>
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
                    <View
                        style={{
                            width: "100%",
                            alignItems: "center",
                            justifyContent: "center",
                            flexDirection: "row",
                            position: "absolute",
                            top: 0,
                            height: headerHeight,
                        }}
                    >
                        <Pressable>
                            <GlassView
                                isInteractive
                                tintColor={searchBackground}
                                style={[
                                    {
                                        backgroundColor:
                                            isLiquidGlassAvailable()
                                                ? undefined
                                                : searchBackground,
                                    },
                                    styles.close,
                                ]}
                            >
                                <Ionicons
                                    name="share-outline"
                                    size={22}
                                    color={textColor}
                                />
                            </GlassView>
                        </Pressable>
                        <Text
                            numberOfLines={2}
                            style={[styles.title, { color: textColor, paddingTop: 8, flexGrow: 1 }]}
                        >
                            {props.center["Site Name"]}
                        </Text>
                        <Pressable
                            onPress={() => {
                                props.close()
                            }}
                        >
                            <GlassView
                                isInteractive
                                tintColor={searchBackground}
                                style={[
                                    {
                                        backgroundColor:
                                            isLiquidGlassAvailable()
                                                ? undefined
                                                : searchBackground,
                                    },
                                    styles.close,
                                ]}
                            >
                                <Ionicons
                                    name="close"
                                    size={22}
                                    color={textColor}
                                />
                            </GlassView>
                        </Pressable>
                    </View>
                </AnimatedBlurView>
            </View>
            <Animated.ScrollView
                style={{ width: "100%", padding: 20, flex: 1}}
                contentContainerStyle={{
                    paddingBottom: 100,
                    paddingTop: headerHeight,
                    flex: 1
                }}
                scrollEnabled={scrollEnabled}
                scrollIndicatorInsets={{ top: headerHeight }}
                showsVerticalScrollIndicator={!(Platform.OS === "android")}
                onScroll={scrollHandler}
            >
                <View style={styles.content}>
                    <View style={[styles.card]}>
                        <Text style={[styles.address, { color: textColor }]}>
                            {address}
                        </Text>

                        <View style={[styles.infoSection]}>
                            <Text
                                style={[styles.infoText, { color: textColor }]}
                            >
                                <Text style={styles.label}>Weekly Hours: </Text>
                                {props.center["Operating Hours per Week"]}{" "}
                                {props.center[
                                    "Health Center Operating Schedule Identification Number"
                                ] !== "0"
                                    ? `(${props.center["Health Center Operational Schedule Description"]})`
                                    : ""}
                            </Text>
                            <Text
                                style={[styles.infoText, { color: textColor }]}
                            >
                                <Text style={styles.label}>Year-Round: </Text>
                                {operatesYearRound}
                            </Text>
                            <Text
                                style={[styles.infoText, { color: textColor }]}
                            >
                                <Text style={styles.label}>
                                    Location Type:{" "}
                                </Text>
                                {
                                    props.center[
                                        "Health Center Location Type Description"
                                    ]
                                }
                            </Text>
                        </View>

                        <View style={styles.buttonRow}>
                            <ActionButton
                                icon="location"
                                label="Map"
                                onPress={openInMaps}
                            />
                            <ActionButton
                                icon="phone-portrait"
                                label="Call"
                                onPress={() =>
                                    Linking.openURL(
                                        "tel:" +
                                            props.center[
                                                "Site Telephone Number"
                                            ]
                                    )
                                }
                                disabled={
                                    props.center["Site Telephone Number"] === ""
                                }
                            />
                            <ActionButton
                                icon="globe"
                                label="Site"
                                onPress={() =>
                                    Linking.openURL(
                                        "http://" +
                                            props.center["Site Web Address"]
                                                .replace("https://", "")
                                                .replace("http://", "")
                                    )
                                }
                                disabled={
                                    props.center["Site Web Address"] === ""
                                }
                            />
                        </View>
                    </View>
                </View>
            </Animated.ScrollView>
        </>
    );
};

const ActionButton = ({
    icon,
    label,
    onPress,
    disabled,
}: {
    icon: any;
    label: string;
    onPress: () => void;
    disabled?: boolean;
}) => (
    <Pressable
        style={({ pressed }) => [
            styles.button,
            {
                backgroundColor: disabled
                    ? "rgb(198,198,198)"
                    : pressed
                    ? "rgba(62,139,255,0.7)"
                    : "rgb(62,139,255)",
                shadowOpacity: pressed ? 0.1 : 0.25,
            },
        ]}
        onPress={onPress}
        disabled={disabled}
    >
        <Ionicons name={icon} size={18} color="white" />
        <Text style={styles.buttonText}>{label}</Text>
    </Pressable>
);

const styles = StyleSheet.create({
    container: {
        flex: 1,
        height: "100%",
        width: "100%",
    },
    loaderContainer: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    content: {
        flex: 1,
        alignItems: "center",
    },
    card: {
        width: "100%",
        borderRadius: 16,
        padding: 20,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    title: {
        fontSize: 22,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 6,
        flexShrink: 1,
    },
    address: {
        fontSize: 14,
        textAlign: "center",
        marginBottom: 16,
    },
    infoSection: {
        borderRadius: 12,
        padding: 12,
        marginBottom: 16,
    },
    infoText: {
        fontSize: 14,
        marginVertical: 4,
    },
    label: {
        fontWeight: "600",
    },
    buttonRow: {
        flexDirection: "row",
        justifyContent: "space-evenly",
        marginTop: 4,
    },
    button: {
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 24,
        paddingVertical: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 3,
        shadowOpacity: 0.2,
        elevation: 3,
    },
    buttonText: {
        color: "white",
        fontSize: 12,
        marginTop: 2,
        fontWeight: "500",
    },
    close: {
        padding: 10,
        borderRadius: 30,
        marginHorizontal: 15,
    },
});

export default CenterDetails;
