import { AnimatedBlurView } from "@/app/utils";
import { useThemeColor } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { ExternalPathString, Link } from "expo-router";
import { useEffect, useRef } from "react";
import {
    Alert,
    Linking,
    Platform,
    Pressable,
    Share,
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
import { FQHCSite } from "../types/types";
import { DraggableHandle } from "./FixedDraggable";
import { useFixedDraggable } from "./FixedDraggableContext";

interface CenterDetailProps {
    center: FQHCSite;
    close: Function;
    unit: string;
    dialogShown: boolean;
    setDialogShown: Function;
}

const CenterDetails = (props: CenterDetailProps) => {
    const { progress, scrollHandler, scrollY, MIN_HEIGHT, snapping } =
        useFixedDraggable();

    const headerHeight = MIN_HEIGHT;
    // const headerHeight = getDefaultHeaderHeight(frame, false, insets.top);

    const flatListRef = useRef<Animated.ScrollView>(null);

    const textColor = useThemeColor({}, "text");
    const searchBackground = useThemeColor({}, "background");
    const cardBackground = useThemeColor({}, "card");
    const titleColor = useThemeColor({}, "textSecondary");

    useEffect(() => {
        if (props.center !== null && !props.dialogShown) {
            Alert.alert(
                "Insurance Disclaimer",
                "The information provided regarding Federally Qualified Health Centers (FQHCs) is compiled from the resources identified in the Acknowledgements section of the “About” page. While we strive to maintain accurate and up-to-date information, no guarantee, warranty, or representation is made regarding the completeness, accuracy, reliability, or current status of any information presented.\n\nUsers are solely responsible for verifying all details directly with the FQHC, including whether the facility accepts their specific insurance plan and any other requirements for receiving care. This platform does not assume liability for any decisions or actions taken based on the information provided.",
                [
                    {
                        text: "OK",
                        onPress: () => props.setDialogShown(),
                    },
                ]
            );
        }
    }, [props.center, props.dialogShown]);

    const address =
        props.center === null
            ? ""
            : `${props.center["Site Address"]}, ${props.center["Site City"]}, ${props.center["Site State Abbreviation"]} ${props.center["Site Postal Code"]}`;

    const encoded = encodeURIComponent(address);

    const url =
        Platform.select({
            ios: `https://maps.apple.com/?q=${encoded}`,
        }) || `https://www.google.com/maps/search/?api=1&query=${encoded}`;
    
    const openInUrl =
            Platform.select({
                ios: `maps:0,0?q=${encoded}`,
                android: `geo:0,0?q=${encoded}`,
            }) || `https://www.google.com/maps/search/?api=1&query=${encoded}`;

    const openInMaps = () => {
        Linking.openURL(openInUrl);
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

    const scrollToTop = () => {
        flatListRef.current!.scrollTo({ animated: true, y: -headerHeight });
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

    //disbale scrolling if draggable is not fully open
    const additionalScrollProps = useAnimatedProps(() => {
        return {
            showsVerticalScrollIndicator:
                !(Platform.OS === "android") && progress.value > 0,
            scrollEnabled: progress.value === 1,
        };
    });

    const animatedIntensity = useAnimatedProps(() => {
        const intensity = interpolate(
            scrollY.value,
            [0, 150],
            [0, 100],
            Extrapolation.CLAMP
        );
        return { intensity };
    });

    const sharing = async () => {
        Share.share({ message: url }).catch(() => {
            Alert.alert(
                "Sharing Error",
                "Sharing this site failed. Please try again."
            );
        });
    };

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
                        <Pressable onPress={sharing}>
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
                            style={[
                                styles.title,
                                {
                                    color: textColor,
                                    paddingTop: 8,
                                    flexGrow: 1,
                                },
                            ]}
                        >
                            {props.center["Site Name"]}
                        </Text>
                        <Pressable
                            onPress={() => {
                                scrollToTop()
                                props.close();
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
                style={{ width: "100%", padding: 10 }}
                contentContainerStyle={[
                    {
                        paddingBottom: 100,
                        paddingTop: headerHeight,
                    },
                ]}
                scrollIndicatorInsets={{ top: headerHeight }}
                onScroll={scrollHandler}
                ref={flatListRef}
                animatedProps={additionalScrollProps}
            >
                <View style={styles.content}>
                    <View style={[styles.card]}>
                        <View style={styles.row}>
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
                                    props.center["Site Web Address"] === "" ||
                                    props.center["Site Web Address"] === "NA"
                                }
                            />
                        </View>
                        <View style={[styles.row]}>
                            <InfoView
                                icon="time-outline"
                                color={textColor}
                                label="Hours"
                                text={
                                    props.center["Operating Hours per Week"] !==
                                    ""
                                        ? props.center[
                                              "Operating Hours per Week"
                                          ] + " / Week"
                                        : "Unknown"
                                }
                                titleColor={titleColor}
                                backgroundColor={cardBackground}
                            />
                            <InfoView
                                icon="map-outline"
                                color={textColor}
                                label="Distance"
                                text={
                                    props.center.distance
                                        .toFixed(0)
                                        .toString() +
                                    " " +
                                    props.unit
                                }
                                titleColor={titleColor}
                                backgroundColor={cardBackground}
                            />
                        </View>
                        <View style={[styles.infoSection]}>
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 10,
                                }}
                            >
                                <Text
                                    style={[
                                        styles.sectionTitle,
                                        { color: textColor },
                                    ]}
                                >
                                    Details
                                </Text>
                                <Pressable
                                    onPress={() => {
                                        Alert.alert(
                                            "Information Disclaimer",
                                            "The information provided regarding Federally Qualified Health Centers (FQHCs) is compiled from the resources identified in the Acknowledgements section of the “About” page. While we strive to maintain accurate and up-to-date information, no guarantee, warranty, or representation is made regarding the completeness, accuracy, reliability, or current status of any information presented.\n\nUsers are solely responsible for verifying all details directly with the FQHC. This platform does not assume liability for any decisions or actions taken based on the information provided.",
                                            [
                                                {
                                                    text: "OK",
                                                },
                                            ]
                                        );
                                    }}
                                >
                                    <Ionicons
                                        name="information-circle"
                                        size={28}
                                        color={textColor}
                                    />
                                </Pressable>
                            </View>
                            <DetailRow
                                title="Center Name"
                                titleColor={titleColor}
                                text={props.center["Site Name"]}
                                textColor={textColor}
                            />
                            {props.center["Site Telephone Number"] !== "" && (
                                <DetailRow
                                    title="Telephone"
                                    titleColor={titleColor}
                                    text={props.center["Site Telephone Number"]}
                                    linkHref={"tel:"+props.center["Site Telephone Number"] as ExternalPathString}
                                    textColor={textColor}
                                />
                            )}
                            {props.center["Site Web Address"] !== "" &&
                                props.center["Site Web Address"] !== "NA" && (
                                    <DetailRow
                                        title="Website"
                                        titleColor={titleColor}
                                        text={props.center["Site Web Address"]}
                                        linkHref={"https://"+props.center["Site Web Address"] as ExternalPathString}
                                        textColor={textColor}
                                    />
                                )}
                            <DetailRow
                                title="Structure Type"
                                titleColor={titleColor}
                                text={
                                    props.center[
                                        "Health Center Location Type Description"
                                    ]
                                }
                                textColor={textColor}
                            />
                            <DetailRow
                                title="Location Type"
                                titleColor={titleColor}
                                text={
                                    props.center[
                                        "Health Center Location Type Description"
                                    ] === "Mobile Van"
                                        ? props.center[
                                              "Health Center Location Type Description"
                                          ]
                                        : props.center[
                                              "Health Center Service Delivery Site Location Setting Description"
                                          ] === "All Other Clinic Types"
                                        ? "Not Specified"
                                        : props.center[
                                              "Health Center Service Delivery Site Location Setting Description"
                                          ]
                                }
                                textColor={textColor}
                            />
                            <DetailRow
                                title="Address"
                                titleColor={titleColor}
                                text={address}
                                textColor={textColor}
                                linkHref={openInUrl as ExternalPathString}
                            />
                        </View>
                        <View style={[styles.infoSection]}>
                            <View
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    gap: 10,
                                }}
                            >
                                <Text
                                    style={[
                                        styles.sectionTitle,
                                        { color: textColor },
                                    ]}
                                >
                                    Insurance
                                </Text>
                                <Pressable
                                    onPress={() => {
                                        Alert.alert(
                                            "Insurance Disclaimer",
                                            "The information provided regarding Federally Qualified Health Centers (FQHCs) is compiled from the resources identified in the Acknowledgements section of the “About” page. While we strive to maintain accurate and up-to-date information, no guarantee, warranty, or representation is made regarding the completeness, accuracy, reliability, or current status of any information presented.\n\nUsers are solely responsible for verifying all details directly with the FQHC, including whether the facility accepts their specific insurance plan and any other requirements for receiving care. This platform does not assume liability for any decisions or actions taken based on the information provided.",
                                            [
                                                {
                                                    text: "OK",
                                                },
                                            ]
                                        );
                                    }}
                                >
                                    <Ionicons
                                        name="information-circle"
                                        size={28}
                                        color={textColor}
                                    />
                                </Pressable>
                            </View>
                            <DetailRow
                                title="Medicare"
                                titleColor={titleColor}
                                text={""}
                                hasIcon
                                icon={
                                    props.center.Medicare === 1
                                        ? "checkmark-circle"
                                        : "help-circle"
                                }
                                textColor={
                                    props.center.Medicare === 1
                                        ? "#15ff00ff"
                                        : textColor
                                }
                            />
                            <DetailRow
                                title="Medicaid"
                                titleColor={titleColor}
                                text={""}
                                textColor={"#15ff00ff"}
                                hasIcon
                                icon={"checkmark-circle"}
                            />
                            <DetailRow
                                title="Private / Other"
                                titleColor={titleColor}
                                text={""}
                                textColor={textColor}
                                hasIcon
                                icon={"help-circle"}
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
            styles.buttonShadow,
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
        <Text style={[styles.buttonText, { color: "white" }]}>{label}</Text>
    </Pressable>
);

interface InfoViewProps {
    icon: any;
    label: string;
    color: string;
    text: string;
    titleColor: string;
    backgroundColor: string;
}

const InfoView = (props: InfoViewProps) => {
    return (
        <View style={[styles.button, {}]}>
            <Text style={[styles.infoTextTitle, { color: props.titleColor }]}>
                {props.label}
            </Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
                <Ionicons name={props.icon} size={20} color={props.color} />
                <Text style={{ color: props.color }}>{props.text}</Text>
            </View>
        </View>
    );
};

interface DetailRowProps {
    title: string;
    text: string;
    titleColor: string;
    textColor: string;
    linkHref?: ExternalPathString;
    hasIcon?: boolean;
    icon?: any;
}

const DetailRow = (props: DetailRowProps) => {
    return (
        <View style={styles.detailTextRow}>
            <Text style={[styles.detailTextTitle, { color: props.titleColor }]}>
                {props.title}
            </Text>
            <View
                style={{
                    width: "50%",
                    flexDirection: "row",
                    justifyContent: "flex-end",
                }}
            >
                {props.linkHref ?
                    <Link href={props.linkHref} >
                        <Text style={{ textAlign: "right", color: "#0A84FF" }}>
                        {props.text}
                    </Text>
                    </Link>
                    :
                    <Text style={{ textAlign: "right", color: props.textColor }}>
                        {props.text}
                    </Text>
                }
                {props.hasIcon && (
                    <Ionicons
                        size={28}
                        color={props.textColor}
                        name={props.icon}
                    />
                )}
            </View>
        </View>
    );
};

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
        elevation: 5,
    },
    title: {
        fontSize: 22,
        fontWeight: "600",
        textAlign: "center",
        marginBottom: 6,
        flexShrink: 1,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: "600",
    },
    infoSection: {
        borderRadius: 12,
        padding: 12,
        margin: 10,
    },
    detailTextRow: {
        marginVertical: 10,
        flexDirection: "row",
        overflow: "hidden",
    },
    detailTextTitle: {
        width: "50%",
        fontSize: 18,
        fontWeight: "600",
    },
    infoTextTitle: {
        fontSize: 14,
        fontWeight: "600",
        marginVertical: 5,
    },
    label: {
        fontWeight: "600",
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-evenly",
        marginVertical: 4,
    },
    button: {
        borderRadius: 10,
        justifyContent: "center",
        alignItems: "center",
        paddingHorizontal: 30,
        paddingVertical: 10,
    },
    buttonShadow: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 3,
        shadowOpacity: 0.2,
        elevation: 3,
    },
    buttonText: {
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
