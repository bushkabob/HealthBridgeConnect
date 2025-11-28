import { Ionicons } from "@expo/vector-icons";
import { GlassView } from "expo-glass-effect";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
} from "react-native-reanimated";

interface CenterInfoSearchProps {
    name: string;
    distance: number;
    color: string;
    textColor: string;
    unit: string;
    onClick: Function;
    showCityIcon: boolean;
}

function SiteCard({
    name,
    distance,
    color,
    textColor,
    unit,
    onClick,
    showCityIcon,
}: CenterInfoSearchProps) {
    const scale = useSharedValue(1);

    const animatedStyle = useAnimatedStyle(() => ({
        transform: [{ scale: scale.value }],
    }));

    const AnimatedGlassView = Animated.createAnimatedComponent(GlassView)

    return (
        <Pressable
            onPress={() => onClick()}
            onPressIn={() => {
                scale.value = withSpring(1.05, {
                    duration: 0.9,
                    dampingRatio: 1,
                });
            }}
            onPressOut={() => {
                scale.value = withSpring(1, { duration: 0.9, dampingRatio: 1 });
            }}
        >
            <AnimatedGlassView
                style={[
                    animatedStyle,
                    {
                        backgroundColor: color,
                        margin: 10,
                        padding: 10,
                        borderRadius: 40,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 10,
                    },
                ]}
            >
                {showCityIcon ? (
                    <View
                        style={{
                            aspectRatio: 1,
                            width: 40,
                            borderRadius: 100,
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden"
                        }}
                    >
                        <LinearGradient style={StyleSheet.absoluteFill} colors={["#9d9d9dff","#535353ff"]}/>
                        <Ionicons name="business" size={24} color={"white"} />
                    </View>
                ) : (
                    <View
                        style={{
                            aspectRatio: 1,
                            width: 40,
                            borderRadius: 100,
                            alignItems: "center",
                            justifyContent: "center",
                            overflow: "hidden"
                        }}
                    >
                        <LinearGradient style={StyleSheet.absoluteFill} colors={["#ff7878ff","#ff4545ff"]}/>
                        <Ionicons name="medical" size={24} color={"white"} />
                    </View>
                )}
                <View style={{ flexShrink: 1 }}>
                    <Text
                        style={{
                            color: textColor,
                            flexWrap: "wrap",
                            width: "100%",
                        }}
                    >
                        {name}
                    </Text>
                </View>
                <View
                    style={{
                        flexGrow: 1,
                        alignItems: "center",
                        flexDirection: "row",
                        justifyContent: "flex-end",
                    }}
                >
                    <Text style={{ color: textColor }}>
                        {((unit === "mi" ? 0.621371 : 1) * distance).toFixed(
                            1
                        ) +
                            " " +
                            unit}
                    </Text>
                    <Ionicons
                        name="chevron-forward"
                        size={24}
                        color={textColor}
                    />
                </View>
            </AnimatedGlassView>
        </Pressable>
    );
}

export default SiteCard;
