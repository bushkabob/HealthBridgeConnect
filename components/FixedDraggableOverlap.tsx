import {
    Canvas,
    Group,
    Mask,
    Rect,
    RoundedRect,
} from "@shopify/react-native-skia";
import React, { ReactElement, RefObject, useImperativeHandle } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface ClippedDraggablesProps {
    clippedContent: ReactElement;
    header?: ReactElement;
    topContent: ReactElement;
    ref: RefObject<ClippedDraggablesHandle | undefined>;
}

import MaskedView from "@react-native-masked-view/masked-view";
import Constants from "expo-constants";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import FixedDraggable from "./FixedDraggable";

export const HIDE_OVERLAY_DELAY = 600;

export type ClippedDraggablesHandle = {
    open: () => void;
    close: () => void;
};

const height = Dimensions.get("screen").height;
const width = Dimensions.get("screen").width;

const MIN_HEIGHT = 82;
const MAX_HEIGHT = height - Constants.statusBarHeight;
const BOTTOM_OFFSET = 15;
const SCALE_MIN = 0.9;
const SCALE_MAX = 1.0;

const SNAP_TOP = 0 + Constants.statusBarHeight;
const SNAP_BOTTOM = height - MIN_HEIGHT - BOTTOM_OFFSET;
const SNAP_MIDDLE = (SNAP_TOP + SNAP_BOTTOM) / 2;

const ClippedDraggables = (props: ClippedDraggablesProps) => {
    const safeAreaInsets = useSafeAreaInsets();

    const defaultTopBottomSheetOffset = height;
    const detailSheetY = useSharedValue(defaultTopBottomSheetOffset);

    const bottomSheetStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: detailSheetY.value }],
        };
    });

    const callUpdateHeight = () => {
        const newYVal = (SNAP_BOTTOM - SNAP_TOP) * (1 - 0.5) + SNAP_TOP;
        setTimeout(() => {
            topTranslateY.value = newYVal;
        }, HIDE_OVERLAY_DELAY);
    };

    const minimizeBottom = () => {
        const newYVal = (SNAP_BOTTOM - SNAP_TOP) * (1 - 0) + SNAP_TOP;
        bottomTranslateY.value = withTiming(newYVal, { duration: 1 });
    };

    //Values for draggables
    const topTranslateY = useSharedValue(SNAP_BOTTOM);
    const bottomTranslateY = useSharedValue(SNAP_BOTTOM);

    const topProgress = useDerivedValue(
        () => 1 - (topTranslateY.value - SNAP_TOP) / (SNAP_BOTTOM - SNAP_TOP)
    );
    const bottomProgress = useDerivedValue(
        () => 1 - (bottomTranslateY.value - SNAP_TOP) / (SNAP_BOTTOM - SNAP_TOP)
    );

    const scaleRange = [SCALE_MIN, SCALE_MAX] as [number, number];
    const topScale = useDerivedValue(() => {
        const scale = interpolate(
            topProgress.value,
            [0, 1],
            scaleRange,
            Extrapolate.CLAMP
        );
        return scale;
    });

    const heightRange = [MIN_HEIGHT, MAX_HEIGHT] as [number, number];
    const topHeight = useDerivedValue(() => {
        const height = interpolate(
            topProgress.value,
            [0, 1],
            heightRange,
            Extrapolation.CLAMP
        );
        return height;
    });

    const radiusRange = [40, 0] as [number, number];
    const topRadius = useDerivedValue(() => {
        const radius = interpolate(
            topProgress.value,
            [0.7, 1],
            radiusRange,
            Extrapolation.CLAMP
        );
        return radius;
    });

    // Full transform for Skia
    const originY = useDerivedValue(() => {
        return safeAreaInsets.top;
    });

    const transform = useDerivedValue(() => {
        const s = topScale.value;
        const ty = topTranslateY.value + detailSheetY.value;
        const oy = originY.value;

        return [{ translateY: ty }, { scale: s }];
    });

    const transformOriginY = useDerivedValue(() => {
        return topHeight.value;
    });

    const transformOrigin = useDerivedValue(() => {
        return { x: width / 2, y: transformOriginY.value };
    });

    const childFade = useAnimatedStyle(() => {
        const topProgress = 1 - (topTranslateY.value + detailSheetY.value - SNAP_TOP) / (SNAP_BOTTOM - SNAP_TOP)
        const progress = Math.max(topProgress,  bottomProgress.value);

        const opacity = interpolate(
            progress,
            [0.7, 0.8],
            [1, 0],
            Extrapolate.CLAMP
        );

        const scaleInter = interpolate(
            progress,
            [0, 1],
            [0.94, 1],
            Extrapolate.CLAMP
        );

        const bottomClamp = bottomTranslateY.value;
        const combined = topTranslateY.value + detailSheetY.value;

        const translateYInter =
            Math.min(combined, bottomClamp) - BOTTOM_OFFSET - 130;

        return {
            transform: [{ translateY: translateYInter }, { scale: scaleInter }],
            opacity,
            transformOrigin: "top",
        };
    });

    useImperativeHandle(props.ref, () => ({
        open: () => {
            detailSheetY.value = withTiming(
                0,
                {
                    duration: HIDE_OVERLAY_DELAY,
                },
                () => runOnJS(minimizeBottom)()
            );
        },
        close: () => {
            detailSheetY.value = withTiming(
                defaultTopBottomSheetOffset,
                {
                    duration: HIDE_OVERLAY_DELAY,
                },
                () => runOnJS(callUpdateHeight)()
            );
        },
    }));

    return (
        <View
            style={{
                position: "absolute",
                top: 0,
                bottom: 0,
                right: 0,
                left: 0,
            }}
        >
            {/* Background draggable */}
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
            <View style={[StyleSheet.absoluteFill]} pointerEvents="box-none">
                {isLiquidGlassAvailable() ? (
                    <MaskedView
                        pointerEvents="box-none"
                        style={[StyleSheet.absoluteFill]}
                        maskElement={
                            <Canvas
                                style={[
                                    StyleSheet.absoluteFill,
                                    { zIndex: 1000 },
                                ]}
                                pointerEvents="none"
                            >
                                <Mask
                                    mode="luminance"
                                    mask={
                                        <Group>
                                            <Rect
                                                x={0}
                                                y={0}
                                                width={width}
                                                height={height}
                                                color="white"
                                            />
                                            <RoundedRect
                                                x={0}
                                                y={0}
                                                origin={transformOrigin}
                                                width={width}
                                                height={topHeight}
                                                r={topRadius}
                                                color="black"
                                                transform={transform}
                                            />
                                        </Group>
                                    }
                                >
                                    <Rect
                                        x={0}
                                        y={0}
                                        width={width}
                                        height={height}
                                        color="white"
                                    />
                                </Mask>
                            </Canvas>
                        }
                    >
                        <FixedDraggable
                            content={props.clippedContent}
                            translateY={bottomTranslateY}
                            progress={bottomProgress}
                        />
                    </MaskedView>
                ) : (
                    <FixedDraggable
                        content={props.clippedContent}
                        translateY={bottomTranslateY}
                        progress={bottomProgress}
                    />
                )}
            </View>

            {/* Foreground draggable */}
            <Animated.View
                pointerEvents={"box-none"}
                style={[
                    {
                        width: "100%",
                        height: "100%",
                        position: "absolute",
                        zIndex: 999,
                    },
                    bottomSheetStyle,
                ]}
            >
                <FixedDraggable
                    content={props.topContent}
                    // defaultPosition={0.5}
                    translateY={topTranslateY}
                    progress={topProgress}
                    scaleRange={scaleRange}
                    heightRange={heightRange}
                    radiusRange={radiusRange}
                />
            </Animated.View>
        </View>
    );
};

export default ClippedDraggables;
