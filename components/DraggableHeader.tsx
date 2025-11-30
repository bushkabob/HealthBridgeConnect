import { useThemeColor } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useRouter } from "expo-router";
import { RefObject } from "react";
import { ActivityIndicator, Pressable } from "react-native";
import MapView from "react-native-maps";

interface DraggableHeaderProps {
    updateCenter: Function;
    loading: boolean;
    locationColor: string;
    returnToUser: Function;
    mapRef: RefObject<MapView | null>
}

const DraggableHeader = (props: DraggableHeaderProps) => {
    const backgroundColor = useThemeColor({}, "background");
    const router = useRouter();

    return (
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
                    : { backgroundColor: backgroundColor },
            ]}
        >
            <Pressable
                onPress={() => {
                    props.mapRef.current?.animateCamera({ 
                        heading: 0,
                        pitch: 0
                     })
                    props.updateCenter();
                }}
                disabled={!props.loading}
                hitSlop={5}
            >
                {props.loading ? (
                    <Ionicons name="search" size={30} color={"gray"} />
                ) : (
                    <ActivityIndicator size={30} style={{paddingVertical: 0.5}} />
                )}
            </Pressable>
            <Pressable onPress={() => props.returnToUser()}>
                <Ionicons
                    name="navigate"
                    size={30}
                    color={props.locationColor}
                    hitSlop={5}
                />
            </Pressable>
            <Pressable hitSlop={5} onPress={() => router.navigate("/settings")}>
                <Ionicons name="settings" size={30} color={"gray"} />
            </Pressable>
        </GlassView>
    );
};

export default DraggableHeader;
