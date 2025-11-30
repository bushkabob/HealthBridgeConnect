import { useThemeColor } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { Pressable, Text, useColorScheme, View } from "react-native";
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

interface ForwardCellProps {
    func: () => void;
    text: string;
    textSecondary?: string;
    showLine: boolean;
    showNextArrow: boolean;
    secondaryIcon?: any;
    color?: string;
    color2?: string;
}

export const ForwardCell = (props: ForwardCellProps) => {
    const textColor = useThemeColor({}, "text");
    const secondaryTextColor = useThemeColor({}, "textSecondary");
    const lineColor = useThemeColor({}, "cellLine");

    const light = "rgba(60,60,67,0.1)";
    const dark = "rgba(235,235,245,0.1)";

    const theme = useColorScheme();
    const highlight = theme === "dark" ? dark : light;

    const pressed = useSharedValue(0);

    const rStyle = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(
            pressed.value,
            [0, 1],
            ["transparent", highlight]
        ),
    }));

    const onPressIn = () => {
        pressed.value = withTiming(1, { duration: 120 });
    };

    const onPressOut = () => {
        pressed.value = withTiming(0, { duration: 160 });
    };

    return (
        <Pressable
            onPress={props.func}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            android_ripple={{ color: highlight }}
        >
            <Animated.View
                style={[
                    rStyle,
                    {
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 20,
                        gap: 10,
                    },
                ]}
            >
                {props.secondaryIcon &&
                    props.showNextArrow &&
                    (props.color && props.color2 ? (
                        <LinearGradient
                            style={{
                                alignItems: "center",
                                justifyContent: "center",
                                width: 40,
                                height: 40,
                                backgroundColor: props.color,
                                borderRadius: 20,
                            }}
                            colors={[props.color, props.color2]}
                        >
                            <Ionicons
                                size={24}
                                name={props.secondaryIcon}
                                color={props.color ? "white" : textColor}
                            />
                        </LinearGradient>
                    ) : (
                        <View
                            style={{
                                alignItems: "center",
                                justifyContent: "center",
                                width: 40,
                                height: 40,
                                backgroundColor: props.color,
                                borderRadius: 20,
                            }}
                        >
                            <Ionicons
                                size={24}
                                name={props.secondaryIcon}
                                color={props.color ? "white" : textColor}
                            />
                        </View>
                    ))}
                <View
                    style={[
                        {
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                            justifyContent: "space-between",
                            flex: 1,
                            height: "100%",
                            paddingVertical:
                                props.secondaryIcon && props.showNextArrow
                                    ? 20
                                    : 15,
                        },
                        props.showLine
                            ? {
                                  borderBottomColor: lineColor,
                                  borderBottomWidth: 1,
                              }
                            : {},
                    ]}
                >
                    <Text
                        style={{
                            fontWeight: "400",
                            fontSize: 17,
                            color: textColor,
                        }}
                    >
                        {props.text}
                    </Text>
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            gap: 10,
                        }}
                    >
                        <Text
                            style={{
                                fontWeight: "400",
                                fontSize: 16,
                                color: secondaryTextColor,
                            }}
                        >
                            {props.textSecondary}
                        </Text>
                        {props.showNextArrow && (
                            <Ionicons
                                size={22}
                                name="chevron-forward"
                                color={textColor}
                            />
                        )}
                        {props.secondaryIcon && !props.showNextArrow && (
                            <Ionicons
                                size={20}
                                name={props.secondaryIcon}
                                color={textColor}
                            />
                        )}
                    </View>
                </View>
            </Animated.View>
        </Pressable>
    );
};

interface CellProps {
    children: ReactNode;
    showLine: boolean;
}

const Cell = (props: CellProps) => {
    const lineColor = useThemeColor({}, "cellLine");

    return (
        <View
            style={[
                {
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                },
                props.showLine
                    ? {
                          borderBottomColor: lineColor,
                          borderBottomWidth: 1,
                      }
                    : {},
            ]}
        >
            {props.children}
        </View>
    );
};

export default Cell;
