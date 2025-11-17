import { useThemeColor } from "@/hooks/use-theme-color";
import { FQHCSite } from "@/types/types";
import { useRouter } from "expo-router";
import { Marker } from "react-native-maps";

interface CenterMarkerProps {
    center: FQHCSite;
    refFunc: any
    onPress: Function
}

const CenterMarker = (props: CenterMarkerProps) => {
    const backgroundColor = useThemeColor({}, "background");
    const textColor = useThemeColor({}, "text");
    const router = useRouter();

    console.log(props.onPress)

    return (
        <Marker onPress={(e)=>{props.onPress(); e.stopPropagation()}} ref={(ref) => {props.refFunc(ref)}} coordinate={{ latitude: Number(props.center["Geocoding Artifact Address Primary Y Coordinate"]), longitude: Number(props.center["Geocoding Artifact Address Primary X Coordinate"]) }} >
            {/* <Callout
                onPress={() => {
                    router.push({
                        pathname: "/details",
                        params: {
                            id: props.center["BPHC Assigned Number"],
                            name: props.center["Site Name"],
                        },
                    });
                }}
                tooltip={Platform.OS !== "android"}
            >
                <View
                    style={{
                        backgroundColor: backgroundColor,
                        borderRadius: 16,
                        paddingVertical: 10,
                        paddingHorizontal: 14,
                        overflow: "hidden",
                        maxWidth: 260,
                        flexShrink: 1,
                    }}
                >
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            flexWrap: "wrap", // allows text to expand vertically
                            justifyContent: "space-between",
                        }}
                    >
                        <View
                            style={{
                                flexShrink: 1,
                                flexGrow: 1,
                                marginRight: 8,
                            }}
                        >
                            <Text
                                style={{
                                    color: textColor,
                                    fontWeight: "600",
                                    flexShrink: 1,
                                    flexWrap: "wrap",
                                }}
                            >
                                {props.center["Site Name"]}
                            </Text>
                            <Text
                                style={{
                                    color: textColor,
                                    flexShrink: 1,
                                    flexWrap: "wrap",
                                }}
                            >
                                {props.center["Site Address"]}
                            </Text>
                        </View>

                        <Pressable
                            style={{
                                alignItems: "center",
                                justifyContent: "center",
                                marginTop: 4,
                            }}
                        >
                            <Ionicons
                                size={20}
                                name="arrow-forward"
                                color={textColor}
                            />
                        </Pressable>
                    </View>
                </View>
            </Callout> */}
        </Marker>
    );
};

export default CenterMarker;
