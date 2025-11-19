import { useThemeColor } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useRouter } from "expo-router";
import { ActivityIndicator, Pressable } from "react-native";

interface DraggableHeaderProps {
    updateCenter: Function;
    loading: boolean;
    locationColor: string;
    returnToUser: Function;
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
                    ? { }
                    : { backgroundColor: backgroundColor },
            ]}
        >
            <Pressable
                onPress={() => {
                    props.updateCenter();
                }}
            >
                {props.loading ? (
                    <Ionicons name="search" size={30} color={"gray"} />
                ) : (
                    <ActivityIndicator size={30} />
                )}
            </Pressable>
            <Pressable onPress={() => props.returnToUser()}>
                <Ionicons
                    name="navigate"
                    size={30}
                    color={props.locationColor}
                />
            </Pressable>
            <Pressable onPress={() => router.navigate("/settings")}>
                <Ionicons name="settings" size={30} color={"gray"} />
            </Pressable>
        </GlassView>
    );
};

export default DraggableHeader;
