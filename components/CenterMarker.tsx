import { FQHCSite } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import { View } from "react-native";
import { LatLng, MarkerAnimated } from "react-native-maps";
import Animated, {
    useAnimatedStyle,
    useSharedValue
} from "react-native-reanimated";

interface CenterMarkerProps {
    center: FQHCSite;
    onPress: Function;
    selected: boolean;
    coordinate: LatLng
}

const CenterMarker = (props: CenterMarkerProps) => {
    // Reanimated shared value
    const scale = useSharedValue(1);

    // useEffect(() => {
    //     scale.value = withTiming(props.selected ? 1.5 : 1, {
    //         duration: 120,
    //     });
    // }, [props.selected]);

    // Reanimated style
    const animatedStyle = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }]
        };
    });

    return (
        <MarkerAnimated
            onPress={(e: any) => {
                props.onPress();
                e.stopPropagation();
                e.preventDefault()
            }}
            tracksViewChanges={false}
            key={props.center["BPHC Assigned Number"]}
            id={props.center["BPHC Assigned Number"]}
            coordinate={props.coordinate}
        >
            {/* FIX: Stable bounding box wrapper */}
            <View
                style={{
                    width: 60,
                    height: 70,
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <Animated.View style={[{ alignItems: "center" }, animatedStyle]}>
                    <View
                        style={{
                            width: 40,
                            height: 40,
                            borderRadius: 20,
                            backgroundColor: "red",
                            borderWidth: 2,
                            borderColor: "white",
                            alignItems: "center",
                            justifyContent: "center",
                        }}
                    >
                        <Ionicons name="medical" size={22} color="white" />
                    </View>

                    <View
                        style={{
                            width: 10,
                            height: 10,
                            borderLeftColor: "transparent",
                            borderRightColor: "transparent",
                            borderTopColor: "white",
                            marginTop: -2,
                        }}
                    />
                </Animated.View>
            </View>
        </MarkerAnimated>
    );
};

export default CenterMarker;
