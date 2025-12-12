import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { StyleSheet } from "react-native";
import { LatLng, Marker } from "react-native-maps";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

interface CenterMarkerProps {
    id: string;
    iconName: string;
    onPress: Function;
    selected: boolean;
    coordinate: LatLng;
    key: string;
    animateProps?: any;
    animatedStyle?: any;
}

const AnimatedMarker = Animated.createAnimatedComponent(Marker);

// const { version } = require("react-native-maps/package.json");

const CenterMarker = (props: CenterMarkerProps) => {
    // Reanimated shared value
    const scale = useSharedValue(1);
    // Reanimated style
    const animatedStyle = useAnimatedStyle(() => {
        // Remove transformOrigin and use translateX/translateY to center the scale
        return {
            transform: [
                { scale: scale.value }
            ]
        };
    });

    useEffect(() => {
        // if (version !== "1.20.1") {
        scale.value = props.selected ? withTiming(1.5) : withTiming(1);
        // }
    }, [props.selected]);

    return (
        <AnimatedMarker
            onPress={(e: any) => {
                props.onPress();
                e.stopPropagation();
                e.preventDefault();
            }}
            key={props.id}
            id={props.id}
            coordinate={props.coordinate}
            animatedProps={props.animateProps}
            style={[
                {
                    justifyContent: "center",
                    alignItems: "center",
                }
            ]}
        >
            <Animated.View 
            style={[{
                height: 40,
                width: 40,
                justifyContent: "center",
                alignItems: "center",
                backgroundColor: "red",
                borderRadius: 60,
            },props.animatedStyle]}>
                <Animated.View
                    style={[
                        {
                            justifyContent: "center",
                            alignItems: "center",
                            width: 40,
                            height: 40,
                            borderRadius: 60,
                            overflow: "hidden",

                        },
                        animatedStyle,
                        props.animatedStyle,
                    ]}
                >
                    <LinearGradient
                        style={StyleSheet.absoluteFill}
                        colors={["#ff7878ff", "#ff4545ff"]}
                    />
                    <Ionicons
                        name={props.iconName as any}
                        size={22}
                        color="white"
                    />
                </Animated.View>
            </Animated.View>
        </AnimatedMarker>
    );
};

export default CenterMarker;
