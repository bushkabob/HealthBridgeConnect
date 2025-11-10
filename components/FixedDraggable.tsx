// DraggableSearchBar.tsx
import { useThemeColor } from "@/hooks/use-theme-color";
import Constants from "expo-constants";
import { GlassView } from "expo-glass-effect";
import React, { cloneElement, ReactElement } from "react";
import {
    Dimensions,
    Keyboard,
    StyleSheet,
    View
} from "react-native";
import {
    Gesture,
    GestureDetector
} from "react-native-gesture-handler";
import Animated, {
    Extrapolate,
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withTiming
} from "react-native-reanimated";

import { FixedDraggableProvider } from "./FixedDraggableContext";

type FixedDraggableProps = {
    content: ReactElement
    header?: ReactElement
};

const FixedDraggable: React.FC<FixedDraggableProps> = (props: FixedDraggableProps) => {
    const background2 = useThemeColor({}, "background3")

    const { height } = Dimensions.get("window");

    const MIN_HEIGHT = 82;
    const MAX_HEIGHT = height - Constants.statusBarHeight;
    const SNAP_TOP = 0 + Constants.statusBarHeight;
    const BOTTOM_OFFSET = 15;
    const SNAP_BOTTOM = height - MIN_HEIGHT - BOTTOM_OFFSET;
    const SNAP_MIDDLE = (SNAP_TOP + SNAP_BOTTOM)/2

    const translateY = useSharedValue(SNAP_BOTTOM);
    const progress = useDerivedValue(() => 1 - (translateY.value - SNAP_TOP) / (SNAP_BOTTOM - SNAP_TOP))
    const snapping = useSharedValue(false)

    const dismissKeyboard = () => Keyboard.dismiss();

    const updateHeight = (height: number, delay: number = 200) => {
        if(height > 1 || height < 0) { throw new Error("Height must be between [0, 1]") }
        const newYVal = (SNAP_BOTTOM - SNAP_TOP) * (1-height) + SNAP_TOP
        translateY.value = withTiming(newYVal, { duration: delay })
    }

    const cancelSnapping = () => {
        "worklet";
        snapping.value = false
    }

    //Gesture Handler
    const pan = Gesture.Pan()
        .onBegin(() => {snapping.value = true; runOnJS(dismissKeyboard)()})
        .onChange((e) => {
            const newY = translateY.value + e.changeY;
            translateY.value = Math.min(Math.max(newY, SNAP_TOP), SNAP_BOTTOM);
        })
        .onEnd((e) => {
            if (Math.abs(e.velocityY) > 2500) {
                const target = e.velocityY < 0 ? SNAP_TOP : SNAP_BOTTOM;
                translateY.value = withTiming(target, { duration: 200 }, cancelSnapping);
            } else {
                const topBarrier = (SNAP_BOTTOM - SNAP_TOP) / 4;
                const bottomBarrier = ((SNAP_BOTTOM - SNAP_TOP) * 3 / 4) + MIN_HEIGHT
                const target =
                    translateY.value < topBarrier ? SNAP_TOP : translateY.value > bottomBarrier ? SNAP_BOTTOM : SNAP_MIDDLE;
                translateY.value = withTiming(target, { duration: 200 }, cancelSnapping);
            }
    });

    //Main sheet
    const sheetStyle = useAnimatedStyle(() => {
        // progress: 0 = closed, 1 = fully open
        const scale = interpolate(
            progress.value,
            [0, 1],
            [0.90, 1],
            Extrapolate.CLAMP
        );
        const translateYInter = translateY.value;

        const radius = interpolate(
            progress.value,
            [0.7,1],
            [40, 0],
            Extrapolation.CLAMP
        )

        const height = interpolate(
            progress.value,
            [0, 1],
            [MIN_HEIGHT, MAX_HEIGHT],
            Extrapolation.CLAMP
        );

        return {
            transformOrigin: "bottom",
            transform: [{ translateY: translateYInter }, { scale: scale }],
            borderBottomLeftRadius: radius,
            borderBottomRightRadius: radius,
            height
        };
    });

    //Function buttons
    const childFade = useAnimatedStyle(() => {            
        const opacity = interpolate(
            translateY.value,
            [SNAP_BOTTOM * 0.5, SNAP_BOTTOM * 0.3],
            [1, 0],
            Extrapolate.CLAMP
        );
        const scale = interpolate(
            progress.value,
            [0, 1],
            [0.94, 1],
            Extrapolate.CLAMP
        );
        const translateYInter = translateY.value - BOTTOM_OFFSET - 130;
        return {
            transform: [{ translateY: translateYInter }, { scale: scale }],
            opacity: opacity,
            transformOrigin: "top",
        };
    });

    const glassViewFade = useAnimatedStyle(() => {
        const opacity = interpolate(progress.value, [0.9, 1], [1, 0], Extrapolation.CLAMP)
        return {
            opacity: opacity
        }
    })

    const backgroundViewFade = useAnimatedStyle(() => {
        const opacity = interpolate(progress.value, [0.5, 0.9], [0, 1], Extrapolation.CLAMP)
        return {
            opacity: opacity
        }
    })

    const AnimatedGlassView = Animated.createAnimatedComponent(GlassView)

    //Render
    return (
        <FixedDraggableProvider value={{ progress, snapping }}>
            <Animated.View
                style={[
                    {
                        position: "absolute",
                        top: 0,
                        right: 0,
                        marginHorizontal: 10,
                    },
                    childFade,
                ]}
            >
                {props.header}
            </Animated.View>
            {/* Floating controls / children */}
                <Animated.View
                    style={[
                        styles.sheet,
                        { height: MAX_HEIGHT },
                        sheetStyle,
                    ]}
                >
                        <AnimatedGlassView style={[styles.background, glassViewFade]} />
                        <Animated.View style={[styles.background, backgroundViewFade, {backgroundColor: background2}]} />
                            <GestureDetector gesture={pan}>
                                <View style={{width: "100%", height: "100%", alignItems: "center" }} >
                                    <DraggableHandle />
                                    {cloneElement(props.content as any, { setViewHeight: updateHeight })}
                                </View>
                            </GestureDetector>
                </Animated.View>
        </FixedDraggableProvider>
    );
};

const DraggableHandle = () => {
    const themeGray = useThemeColor({}, "tabIconDefault")
    return (
        <View style={[styles.handle, {backgroundColor: themeGray}]} />
    )
}

const styles = StyleSheet.create({
    sheet: {
        position: "absolute",
        right: 0,
        left: 0,
        zIndex: 100,
        overflow: "hidden"
    },
    background: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        borderRadius: 40,
    },
    handle: {
        width: 50,
        height: 4,
        borderRadius: 2,
        marginVertical: 8,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 16,
        marginBottom: 18,
        gap: 10,
    },

    inputBox: {
        flexDirection: "row",
        alignItems: "center",
        height: 40,
        paddingHorizontal: 12,
        backgroundColor: "rgba(255,255,255,0.15)",
        borderRadius: 40,
    },
    header: {
        width: "100%",
        alignItems: "center",
        position: "absolute",
        top: 0,
        zIndex: 100,
    },
});

export default FixedDraggable;
