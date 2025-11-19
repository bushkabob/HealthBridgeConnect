import { Canvas, RoundedRect } from "@shopify/react-native-skia";
import React, {
    ReactElement,
    RefObject,
    useImperativeHandle,
    useRef,
} from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useDerivedValue,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import FixedDraggable, { FixedDraggableHandle } from "./FixedDraggable";

interface ClippedDraggablesProps {
    clippedContent: ReactElement;
    clippedHeader?: ReactElement;
    topContent: ReactElement;
    topHeader?: ReactElement;
    ref: RefObject<ClippedDraggablesHandle | undefined>;
}

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

    const callUpdateHeight = () => {
        topDraggableRef.current?.updateHeight(0.5, 1);
    };

    // Pull values from FixedDraggable
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
            <Canvas
                style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}
                pointerEvents="none"
            >
                <RoundedRect
                    x={0}
                    y={0}
                    origin={transformOrigin}
                    width={width}
                    height={draggableHeight}
                    r={radius}
                    color="rgba(255,0,0,0.3)"
                    transform={transform}
                />
                {/* </Animated.View> */}
            </Canvas>

            {/* Background draggable */}
            <View style={[StyleSheet.absoluteFill]} pointerEvents="box-none">
                <FixedDraggable
                    content={props.clippedContent}
                    header={props.clippedHeader}
                />
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
                    header={props.topHeader}
                    ref={topDraggableRef}
                    defaultPosition={0.5}
                />
            </Animated.View>
        </View>
    );
};

export default ClippedDraggables;
