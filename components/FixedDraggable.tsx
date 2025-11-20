// DraggableSearchBar.tsx
import { useThemeColor } from "@/hooks/use-theme-color";
import Constants from "expo-constants";
import { GlassView } from "expo-glass-effect";
import React, { ReactElement, RefObject, useImperativeHandle } from "react";
import { Dimensions, Keyboard, Platform, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
    Extrapolate,
    Extrapolation,
    interpolate,
    runOnJS,
    SharedValue,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";

import { FixedDraggableProvider } from "./FixedDraggableContext";

export type FixedDraggableHandle = {
    updateHeight: (height: number, delay: number) => void;
    translateY: SharedValue<number>;
    scale: SharedValue<number>;
    radius: SharedValue<number>;
    height: SharedValue<number>;
    progress: SharedValue<number>;
    // updateTranslateY_INTERNAL_USE_ONLY: (value: number) => void;
};

type FixedDraggableProps = {
    content: ReactElement;
    header?: ReactElement;
    defaultPosition?: number;
    ref?: RefObject<FixedDraggableHandle | undefined>;
};

const { height } = Dimensions.get("window");
const AnimatedGlassView = Animated.createAnimatedComponent(GlassView);

export const MIN_HEIGHT = 82;
export const MAX_HEIGHT = height - Constants.statusBarHeight;
export const SNAP_TOP = 0 + Constants.statusBarHeight;
export const BOTTOM_OFFSET = 15;
export const SNAP_BOTTOM = height - MIN_HEIGHT - BOTTOM_OFFSET;
export const SNAP_MIDDLE = (SNAP_TOP + SNAP_BOTTOM) / 2;
export const SCALE_MIN = 0.9;
export const SCALE_MAX = 1.0;

const FixedDraggable: React.FC<FixedDraggableProps> = (
    props: FixedDraggableProps
) => {
    const background2 = useThemeColor({}, "background3");

    if (
        props.defaultPosition &&
        (props.defaultPosition > 1 || props.defaultPosition < 0)
    ) {
        throw new Error("Default position must be between 0 and 1");
    }

    const translateY = useSharedValue(SNAP_BOTTOM);
    const progress = useDerivedValue(
        () => 1 - (translateY.value - SNAP_TOP) / (SNAP_BOTTOM - SNAP_TOP)
    );
    const scale = useDerivedValue(() => {
        const scale = interpolate(
            progress.value,
            [0, 1],
            [SCALE_MIN, SCALE_MAX],
            Extrapolate.CLAMP
        );
        return scale;
    });

    const derivedHeight = useDerivedValue(() => {
        const height = interpolate(
            progress.value,
            [0, 1],
            [MIN_HEIGHT, MAX_HEIGHT],
            Extrapolation.CLAMP
        );
        return height;
    });

    const radius = useDerivedValue(() => {
        const radius = interpolate(
            progress.value,
            [0.7, 1],
            [40, 0],
            Extrapolation.CLAMP
        );
        return radius;
    });

    const snapping = useSharedValue(false);

    const scrollY = useSharedValue(0);
    const scrolling = useSharedValue(false);

    const scrollHandler = useAnimatedScrollHandler(
        {
            onBeginDrag: () => {
                scrolling.value = true;
            },
            onScroll: (event) => {
                scrollY.value = event.contentOffset.y;
            },
            onEndDrag: () => {
                scrolling.value = false;
            },
        },
        []
    );

    const dismissKeyboard = () => Keyboard.dismiss();

    const updateHeight = (height: number, delay: number = 200) => {
        if (height > 1 || height < 0) {
            throw new Error("Height must be between [0, 1]");
        }
        const newYVal = (SNAP_BOTTOM - SNAP_TOP) * (1 - height) + SNAP_TOP;
        translateY.value = withTiming(
            newYVal,
            { duration: delay },
            cancelSnapping
        );
    };

    // const updateTranslateY_INTERNAL_USE_ONLY = (value: number) => {
    //     "worklet";
    //     if (Math.abs(translateY.value - value) > 100) {
    //     } else {
    //         translateY.value = value;
    //     }
    // };

    useImperativeHandle(props.ref, () => {
        return {
            updateHeight,
            // updateTranslateY_INTERNAL_USE_ONLY,
            translateY,
            scale,
            height: derivedHeight,
            radius,
            progress,
        };
    });

    const cancelSnapping = () => {
        "worklet";
        snapping.value = false;
    };

    const native = Gesture.Native();

    //Gesture Handler
    const pan = Gesture.Pan()
        .requireExternalGestureToFail(native)
        .onBegin(() => {
            snapping.value = true;
            runOnJS(dismissKeyboard)();
        })
        .onChange((e) => {
            if (
                scrolling.value === true &&
                progress.value === 1 &&
                scrollY.value > 0
            ) {
                return;
            }
            const newY = translateY.value + e.changeY;
            translateY.value = Math.min(Math.max(newY, SNAP_TOP), SNAP_BOTTOM);
        })
        .onEnd((e) => {
            // if (Math.abs(e.velocityY) > 2500) {
            //     const target = e.velocityY < 0 ? SNAP_TOP : SNAP_BOTTOM;
            //     translateY.value = withTiming(target, { duration: 200 }, cancelSnapping);
            // } else {
            const topBarrier = (SNAP_BOTTOM - SNAP_TOP) / 4;
            const bottomBarrier =
                ((SNAP_BOTTOM - SNAP_TOP) * 3) / 4 + MIN_HEIGHT;
            const target =
                translateY.value < topBarrier
                    ? SNAP_TOP
                    : translateY.value > bottomBarrier
                    ? SNAP_BOTTOM
                    : SNAP_MIDDLE;
            translateY.value = withTiming(
                target,
                { duration: 200 },
                cancelSnapping
            );
            // }
        });

    //Main sheet
    const sheetStyle = useAnimatedStyle(() => {
        //Expand radi in case screen is square
        return {
            transformOrigin: "bottom",
            transform: [
                { translateY: translateY.value },
                { scale: scale.value },
            ],
            borderBottomLeftRadius: radius.value,
            borderBottomRightRadius: radius.value,
            height: derivedHeight.value,
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
        const opacity = interpolate(
            progress.value,
            [0.9, 1],
            [1, 0],
            Extrapolation.CLAMP
        );
        return {
            opacity: opacity,
        };
    });

    const backgroundViewFade = useAnimatedStyle(() => {
        const opacity = interpolate(
            progress.value,
            [0.5, 0.9],
            [0, 1],
            Extrapolation.CLAMP
        );
        return {
            opacity: opacity,
        };
    });

    //Render
    return (
        //Provider
        <FixedDraggableProvider
            value={{
                gesture: native,
                progress,
                snapping,
                scrollY,
                scrollHandler,
                setViewHeight: updateHeight,
            }}
        >
            {/*Header*/}
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
            {/*Combo mask*/}
            <Animated.View
                style={[styles.sheet, { height: MAX_HEIGHT }, sheetStyle]}
            >
                <AnimatedGlassView
                    style={[
                        styles.background,
                        glassViewFade,
                        {
                            backgroundColor:
                                Platform.OS === "android"
                                    ? background2
                                    : undefined,
                        },
                    ]}
                />
                <Animated.View
                    style={[
                        styles.background,
                        backgroundViewFade,
                        { backgroundColor: background2 },
                    ]}
                />
                <GestureDetector gesture={pan}>
                    <View
                        style={{
                            width: "100%",
                            height: "100%",
                            alignItems: "center",
                        }}
                    >
                        {props.content}
                    </View>
                </GestureDetector>
            </Animated.View>
        </FixedDraggableProvider>
    );
};

export const DraggableHandle = () => {
    const themeGray = useThemeColor({}, "tabIconDefault");
    return (
        <View style={{ width: "100%", alignItems: "center" }}>
            <View style={[styles.handle, { backgroundColor: themeGray }]} />
        </View>
    );
};

const styles = StyleSheet.create({
    sheet: {
        position: "absolute",
        right: 0,
        left: 0,
        zIndex: 100,
        borderRadius: 40,
        overflow: "hidden",
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
    header: {
        width: "100%",
        alignItems: "center",
        position: "absolute",
        top: 0,
        zIndex: 100,
    },
});

export default FixedDraggable;
