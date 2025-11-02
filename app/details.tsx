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
    Text,
    View,
} from "react-native";
import { FQHCSite } from "./types";

const CenterDetails = () => {
    const { id, name } = useLocalSearchParams();
    const [siteInfo, setSiteInfo] = useState<FQHCSite | null>(null);

    const textColor = useThemeColor({}, "text");
    const backgroundColor = useThemeColor({}, "background")

    const { query } = useDatabase();

    useEffect(() => {
        query('SELECT * FROM centers WHERE "BPHC Assigned Number" = ?', [id])
            .then((val) => {
                setSiteInfo(val[0] as FQHCSite);
            })
            .catch((error) => {
                console.error("Error querying database:", error);
            });
    }, []);

    const address =
        siteInfo === null
            ? ""
            : `${siteInfo["Site Address"]}, ${siteInfo["Site City"]}, ${siteInfo["Site State Abbreviation"]} ${siteInfo["Site Postal Code"]}`;

    const openInMaps = () => {
        const encoded = encodeURIComponent(address);

        const url =
            Platform.select({
                ios: `maps:0,0?q=${encoded}`, // Opens Apple Maps
                android: `geo:0,0?q=${encoded}`, // Opens Google Maps
            }) || `https://www.google.com/maps/search/?api=1&query=${encoded}`;

        Linking.openURL(url);
    };

    let operatesYearRound = "Unknown";
    if(siteInfo && siteInfo["Health Center Operating Calendar Surrogate Key"] === '1'){
        operatesYearRound = "Yes"    
    }
    if(siteInfo && siteInfo["Health Center Operating Calendar Surrogate Key"] === '2'){
        operatesYearRound = "No"    
    }

    return (
        <View style={{ width: "100%", height: "100%", backgroundColor: backgroundColor }}>
            <Stack.Screen options={{ title: name as string }} />
            {siteInfo === null && (
                <View
                    style={{
                        height: "100%",
                        width: "100%",
                        alignItems: "center",
                        justifyContent: "center",
                    }}
                >
                    <ActivityIndicator />
                </View>
            )}
            {siteInfo && (
                <View
                    style={{
                        flexDirection: "column",
                        gap: 10,
                        width: "100%",
                        alignItems: "center",
                    }}
                >
                    <Text style={{color: textColor}}>{name}</Text>
                    <Text style={{ color: textColor }}>{address}</Text>
                    <Text style={{color: textColor}}>Weekly Hours Operated: {siteInfo["Operating Hours per Week"]} {siteInfo["Health Center Operating Schedule Identification Number"] !== '0' ? "(" + siteInfo["Health Center Operational Schedule Description"] + ")" : "" }</Text>
                    <Text style={{color: textColor}}>Operates Year-Round: {operatesYearRound}</Text>
                    <View
                        style={{
                            width: "100%",
                            flexDirection: "row",
                            justifyContent: "space-evenly",
                            gap: 10,
                        }}
                    >
                        <Pressable
                            style={({ pressed }) => {
                                return {
                                    backgroundColor:
                                        pressed ? "rgba(128, 128, 128, 0.4)" : "rgb(62, 139, 255)",
                                    borderRadius: 8,
                                    justifyContent: "center",
                                    alignItems: "center",
                                    paddingHorizontal: 30, // keep some horizontal space
                                    paddingVertical: 10, // ✨ minimal vertical height
                                    flexShrink: 0,
                                    
                                }
                            }}
                            onPress={() => openInMaps()}
                        >
                            <Ionicons name="location" size={18} color="white" />
                            <Text
                                style={{
                                    color: "white",
                                    fontSize: 12,
                                    marginTop: 2,
                                }}
                            >
                                Map
                            </Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => {
                                return {
                                    backgroundColor:
                                        pressed ? "rgba(128, 128, 128, 0.4)" :
                                        siteInfo["Site Telephone Number"] === ""
                                            ? "rgb(198, 198, 198)"
                                            : "rgb(62, 139, 255)",
                                    borderRadius: 8,
                                    justifyContent: "center",
                                    alignItems: "center",
                                    paddingHorizontal: 30, // keep some horizontal space
                                    paddingVertical: 10, // ✨ minimal vertical height
                                    flexShrink: 0,
                                    
                                }
                            }}
                            disabled={siteInfo["Site Telephone Number"] === ""}
                            onPress={() =>
                                Linking.openURL(
                                    "tel:" + siteInfo["Site Telephone Number"]
                                )
                            }
                        >
                            <Ionicons
                                name="phone-portrait"
                                size={18}
                                color="white"
                            />
                            <Text
                                style={{
                                    color: "white",
                                    fontSize: 12,
                                    marginTop: 2,
                                }}
                            >
                                Call
                            </Text>
                        </Pressable>
                        <Pressable
                            style={({ pressed }) => {
                                return {
                                    backgroundColor:
                                        pressed ? "rgba(128, 128, 128, 0.4)" :
                                        siteInfo["Site Web Address"] === ""
                                            ? "rgb(198, 198, 198)"
                                            : "rgb(62, 139, 255)",
                                    borderRadius: 8,
                                    justifyContent: "center",
                                    alignItems: "center",
                                    paddingHorizontal: 30, // keep some horizontal space
                                    paddingVertical: 10, // ✨ minimal vertical height
                                    flexShrink: 0,
                                    
                                }
                            }}
                            disabled={siteInfo["Site Web Address"] === ""}
                            onPress={() =>
                                Linking.openURL("http://"+siteInfo["Site Web Address"].replace("https://", "").replace("http://", ""))
                            }
                        >
                            <Ionicons name="globe" size={18} color="white" />
                            <Text
                                style={{
                                    color: "white",
                                    fontSize: 12,
                                    marginTop: 2,
                                }}
                            >
                                Site
                            </Text>
                        </Pressable>
                    </View>
                </View>
            )}
        </View>
    );
};

export default CenterDetails;
