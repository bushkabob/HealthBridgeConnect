import { FQHCSite } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import { useEffect } from "react";
import { View } from "react-native";
import { LatLng, Marker } from "react-native-maps";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from "react-native-reanimated";

interface CenterMarkerProps {
    center: FQHCSite;
    onPress: Function;
    selected: boolean;
    coordinate: LatLng;
    key: string;
    animateProps?: any
}

const AniamtedIcon = Animated.createAnimatedComponent(Ionicons)
const AnimatedMarker = Animated.createAnimatedComponent(Marker)

const CenterMarker = (props: CenterMarkerProps) => {
    // Reanimated shared value
    const scale = useSharedValue(1);
    // Reanimated style
    const animatedStyle = useAnimatedStyle(() => {
        return {
            height: scale.value * 40,
            width: scale.value * 40,
            borderWidth: scale.value * 2
        };
    });

    const animatedProps = useAnimatedStyle(() => {
        return {
            transform: [{ scale: scale.value }]
        }
    })

    useEffect(() => {
        scale.value = props.selected ? withTiming(1.5) : withTiming(1)
    }, [props.selected])

    return (
        <AnimatedMarker
            onPress={(e: any) => {
                props.onPress();
                e.stopPropagation();
                e.preventDefault();
            }}
            key={props.center["BPHC Assigned Number"]}
            id={props.center["BPHC Assigned Number"]}
            coordinate={props.coordinate}
            animatedProps={props.animateProps}
        >
                <View
                    style={[{ alignItems: "center", justifyContent: "center", width: 60, height: 60 }]}
                >
                    <Animated.View
                        style={[{
                            width: 40,
                            height: 40,
                            borderRadius: 60,
                            backgroundColor: "red",
                            borderColor: "white",
                            alignItems: "center",
                            justifyContent: "center",
                            
                        }, animatedStyle]}
                    >
                        <AniamtedIcon name="medical" style={animatedProps} size={22} color="white" />
                    </Animated.View>
                </View>
        </AnimatedMarker>
    );
};

export default CenterMarker;
