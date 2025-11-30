import { FQHCSite } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
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
    animatedStyle?: any
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
            // borderWidth: scale.value * 2
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
            style={[props.animatedStyle, {width: 60, height: 60, justifyContent: "center", alignItems: "center"}]}
        >
                <View
                    style={[{ justifyContent: "center", alignItems: "center", width: 60, height: 60 }]}
                >
                    <Animated.View
                        style={[{
                            width: 40,
                            height: 40,
                            borderRadius: 60,
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden"
                        }, animatedStyle]}
                    >
                        <LinearGradient style={StyleSheet.absoluteFill} colors={["#ff7878ff","#ff4545ff"]}/>
                        <AniamtedIcon name="medical" style={animatedProps} size={22} color="white" />
                    </Animated.View>
                </View>
        </AnimatedMarker>
    );
};

export default CenterMarker;
