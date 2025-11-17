import { ReactElement, RefObject, useImperativeHandle, useRef } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg from "react-native-svg";
import FixedDraggable, {
    FixedDraggableHandle
} from "./FixedDraggable";

interface ClippedDraggablesProps {
    clippedContent: ReactElement;
    clippedHeader?: ReactElement;
    topContent: ReactElement;
    topHeader?: ReactElement;
    ref: RefObject<ClippedDraggablesHandle | undefined>;
}

export type ClippedDraggablesHandle = {
    open: () => void;
    close: () => void;
};

const AnimatedSvg = Animated.createAnimatedComponent(Svg);

const ClippedDraggables = (props: ClippedDraggablesProps) => {
    const safeAreaInsets = useSafeAreaInsets();
    
    const height = Dimensions.get("screen").height;
    const width = Dimensions.get("screen").width;

    const defaultTopBottomSheetOffset = height;
    const detailSheetY = useSharedValue(defaultTopBottomSheetOffset);

    const bottomSheetStyle = useAnimatedStyle(() => {
        return {
            transform: [{ translateY: detailSheetY.value }],
        };
    });

    const topDraggableRef = useRef<FixedDraggableHandle>(undefined)

    const callUpdateHeight = () => {
        topDraggableRef.current?.updateHeight(0.5, 1);
    }  ;

    useImperativeHandle(props.ref, () => ({
        open: () => {
            detailSheetY.value = withTiming(0, { duration: 350 });
        },
        close: () => {
            detailSheetY.value = withTiming(defaultTopBottomSheetOffset, {
                duration: 350,
            }, () => runOnJS(callUpdateHeight)());
        },
    }));

    const maskStyle = useAnimatedStyle(() => {
        return {
            transform: [
                {
                    translateY:
                        -defaultTopBottomSheetOffset + detailSheetY.value,
                },
            ],
        };
    });

    console.log(topDraggableRef.current?.updateHeight)


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
            <View
                style={[StyleSheet.absoluteFill, { zIndex: 1000 }]}
                pointerEvents="none"
            ></View>
            {/* <MaskedView
                style={[StyleSheet.absoluteFill]}
                pointerEvents="box-none"
                maskElement={
                    <Animated.View style={maskStyle}>
                        <View
                            style={{
                                height: height,
                                width: "100%",
                                backgroundColor: "white",
                            }}
                        />
                        <AnimatedSvg
                            pointerEvents="none"
                            style={{
                                width: "100%",
                                height: height,
                            }}
                        >
                            <Defs>
                                <Mask id="mask">
                                    <Rect
                                        width="100%"
                                        height="100%"
                                        fill="white"
                                    />
                                    <Rect
                                        fill={"black"}
                                        height={
                                            (MIN_HEIGHT + MAX_HEIGHT) * (SNAP_MIDDLE / (SNAP_BOTTOM + SNAP_TOP))
                                        }
                                        width="100%"
                                        originX={width / 2}
                                        originY={148}
                                        y={0}
                                        rx={40}
                                        ry={40}
                                        scale={
                                            (SCALE_MAX + SCALE_MIN) *
                                            (SNAP_MIDDLE /
                                                (SNAP_BOTTOM + SNAP_TOP))
                                        }
                                    />
                                </Mask>
                            </Defs>
                            <Rect
                                width="100%"
                                height="100%"
                                fill="rgba(255, 255, 255, 1)"
                                mask="url(#mask)"
                            />
                        </AnimatedSvg>
                    </Animated.View>
                }
            > */}
                <FixedDraggable
                    content={props.clippedContent}
                    header={props.clippedHeader}
                />
            {/* </MaskedView> */}
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
