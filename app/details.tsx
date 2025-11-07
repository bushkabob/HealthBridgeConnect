import { useThemeColor } from "@/hooks/use-theme-color";
import useDatabase from "@/hooks/useDatabase";
import { Ionicons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
    ActivityIndicator,
    Linking,
    Platform,
    Pressable,
    StyleSheet,
    Text,
    View,
} from "react-native";
import { FQHCSite } from "./types";

const CenterDetails = () => {
    const { id, name } = useLocalSearchParams();
    const [siteInfo, setSiteInfo] = useState<FQHCSite | null>(null);

    const textColor = useThemeColor({}, "text");
    const backgroundColor = useThemeColor({}, "background");
    const cardColor = useThemeColor({}, "card")
    const cardColor2 = useThemeColor({}, "card1")

    const { query } = useDatabase();

    useEffect(() => {
        query('SELECT * FROM centers WHERE "BPHC Assigned Number" = ?', [id])
            .then((val) => setSiteInfo(val[0] as FQHCSite))
            .catch((error) => console.error("Error querying database:", error));
    }, []);

    const address =
        siteInfo === null
            ? ""
            : `${siteInfo["Site Address"]}, ${siteInfo["Site City"]}, ${siteInfo["Site State Abbreviation"]} ${siteInfo["Site Postal Code"]}`;

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
    if (siteInfo && siteInfo["Health Center Operating Calendar Surrogate Key"] === "1") {
        operatesYearRound = "Yes";
    } else if (siteInfo && siteInfo["Health Center Operating Calendar Surrogate Key"] === "2") {
        operatesYearRound = "No";
    }

    return (
        <View style={[styles.container, { backgroundColor }]}>
            <Stack.Screen options={{ title: name as string }} />
            {!siteInfo ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator />
                </View>
            ) : (
                <View style={styles.content}>
                    <View style={[styles.card, { backgroundColor: cardColor }]}>
                        <Text style={[styles.title, { color: textColor }]}>{name}</Text>
                        <Text style={[styles.address, { color: textColor }]}>{address}</Text>

                        <View style={[styles.infoSection, {backgroundColor: cardColor2}]}>
                            <Text style={[styles.infoText, { color: textColor }]}>
                                <Text style={styles.label}>Weekly Hours: </Text>
                                {siteInfo["Operating Hours per Week"]}{" "}
                                {siteInfo["Health Center Operating Schedule Identification Number"] !== "0"
                                    ? `(${siteInfo["Health Center Operational Schedule Description"]})`
                                    : ""}
                            </Text>
                            <Text style={[styles.infoText, { color: textColor }]}>
                                <Text style={styles.label}>Year-Round: </Text>
                                {operatesYearRound}
                            </Text>
                            <Text style={[styles.infoText, { color: textColor }]}>
                                <Text style={styles.label}>Location Type: </Text>
                                {siteInfo["Health Center Location Type Description"]}
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
                                onPress={() => Linking.openURL("tel:" + siteInfo["Site Telephone Number"])}
                                disabled={siteInfo["Site Telephone Number"] === ""}
                            />
                            <ActionButton
                                icon="globe"
                                label="Site"
                                onPress={() =>
                                    Linking.openURL(
                                        "http://" +
                                            siteInfo["Site Web Address"]
                                                .replace("https://", "")
                                                .replace("http://", "")
                                    )
                                }
                                disabled={siteInfo["Site Web Address"] === ""}
                            />
                        </View>
                    </View>
                </View>
            )}
        </View>
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
        padding: 20,
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
});

export default CenterDetails;
