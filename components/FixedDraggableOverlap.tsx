import {
    Canvas,
    Group,
    Mask,
    Rect,
    RoundedRect,
} from "@shopify/react-native-skia";
import React, {
    ReactElement,
    RefObject,
    useImperativeHandle,
    useRef,
} from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
    Extrapolate,
    interpolate,
    runOnJS,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FixedDraggable, { BOTTOM_OFFSET, FixedDraggableHandle } from "./FixedDraggable";

interface ClippedDraggablesProps {
    clippedContent: ReactElement;
    header?: ReactElement;
    topContent: ReactElement;
    ref: RefObject<ClippedDraggablesHandle | undefined>;
}

import MaskedView from "@react-native-masked-view/masked-view";
import { isLiquidGlassAvailable } from "expo-glass-effect";

export const HIDE_OVERLAY_DELAY = 600;

export type ClippedDraggablesHandle = {
    open: () => void;
    close: () => void;
};

const height = Dimensions.get("screen").height;
const width = Dimensions.get("screen").width;

const ClippedDraggables = (props: ClippedDraggablesProps) => {
    const safeAreaInsets = useSafeAreaInsets();

    const defaultTopBottomSheetOffset = height;
    const detailSheetY = useSharedValue(defaultTopBottomSheetOffset);

    const bottomSheetStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: detailSheetY.value }],
        };
    });

    const topDraggableRef = useRef<FixedDraggableHandle>(undefined);
    const bottomDraggableRef = useRef<FixedDraggableHandle>(undefined);

    const callUpdateHeight = () => {
        topDraggableRef.current?.updateHeight(0.5, 1);
    };

    // Pull values from FixedDraggable Top
    const translateY = useDerivedValue(() => {
        return topDraggableRef.current?.translateY.value ?? 0;
    });

    const scale = useDerivedValue(() => {
        return topDraggableRef.current?.scale.value ?? 1;
    });

    const radius = useDerivedValue(() => {
        return topDraggableRef.current?.radius.value ?? 0;
    });

    const draggableHeight = useDerivedValue(() => {
        // if(bottomDraggableRef.current !== undefined && topDraggableRef.current !== undefined && detailSheetY.value === 0) {
        //     bottomDraggableRef.current.updateTranslateY_INTERNAL_USE_ONLY(topDraggableRef.current.translateY.value)
        // }
        return topDraggableRef.current?.height.value ?? 0;
    });

    // Full transform for Skia
    const originY = useDerivedValue(() => {
        return safeAreaInsets.top;
    });

    const transform = useDerivedValue(() => {
        const s = scale.value;
        const ty = translateY.value + detailSheetY.value;
        const oy = originY.value;

        return [{ translateY: ty }, { scale: s }];
    });

    const transformOriginY = useDerivedValue(() => {
        return draggableHeight.value;
    });

    const transformOrigin = useDerivedValue(() => {
        return { x: width / 2, y: transformOriginY.value };
    });

    const childFade = useAnimatedStyle(() => {
        const progress = (topDraggableRef.current && bottomDraggableRef.current) ? Math.max(topDraggableRef.current.progress.value, bottomDraggableRef.current.progress.value) : 0
        const opacity = interpolate(
            progress,
            [0.7, 0.8],
            [1, 0],
            Extrapolate.CLAMP
        );
        const scale = interpolate(
            progress,
            [0, 1],
            [0.94, 1],
            Extrapolate.CLAMP
        );
        const translateYInter = Math.min(translateY.value + detailSheetY.value, bottomDraggableRef.current ? bottomDraggableRef.current.translateY.value : translateY.value + detailSheetY.value) - BOTTOM_OFFSET - 130;
        return {
            transform: [{ translateY: translateYInter }, { scale: scale }],
            opacity: opacity,
            transformOrigin: "top",
        };
    });

    useImperativeHandle(props.ref, () => ({
        open: () => {
            detailSheetY.value = withTiming(0, {
                duration: HIDE_OVERLAY_DELAY,
            });
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
            {/* <Canvas
                            style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}
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
                                    </Group>
                                }
                            >
                                <RoundedRect
                                    x={0}
                                    y={0}
                                    origin={transformOrigin}
                                    width={width}
                                    height={draggableHeight}
                                    r={radius}
                                    color="black"
                                    transform={transform}
                                />
                            </Mask>
                        </Canvas> */}
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
                                                height={draggableHeight}
                                                r={radius}
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
                            // <View style={[StyleSheet.absoluteFill, {backgroundColor: "white"}]} />
                        }
                    >
                        <FixedDraggable
                            content={props.clippedContent}
                            ref={bottomDraggableRef}
                        />
                    </MaskedView>
                ) : (
                    <FixedDraggable
                        content={props.clippedContent}
                        ref={bottomDraggableRef}
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
                    ref={topDraggableRef}
                    defaultPosition={0.5}
                />
            </Animated.View>
        </View>
    );
};

export default ClippedDraggables;
