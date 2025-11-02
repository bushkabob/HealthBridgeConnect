// DraggableSearchBar.tsx
import { useThemeColor } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import React, { useRef, useState } from "react";
import {
    Dimensions,
    Keyboard,
    Pressable,
    StyleSheet,
    View
} from "react-native";
import {
    Gesture,
    GestureDetector,
    TextInput,
} from "react-native-gesture-handler";
import Animated, {
    Extrapolate,
    Extrapolation,
    interpolate,
    runOnJS,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    withTiming,
} from "react-native-reanimated";

import { BlurView } from "expo-blur";

type Props = {
    searchContent: React.ReactElement;
    searchActiveCotent?: React.ReactElement;
    searchValue: string;
    setSearchValue: (v: string) => void;
    children?: React.ReactElement;
};

const DraggableSearchBar: React.FC<Props> = ({
    searchContent,
    searchActiveCotent,
    searchValue,
    setSearchValue,
    children,
}) => {
    const themeBack = useThemeColor({}, "background");
    const themeText = useThemeColor({}, "text");

    const { height } = Dimensions.get("window");

    const MIN_HEIGHT = 82;
    const MAX_HEIGHT = height - Constants.statusBarHeight;
    const SNAP_TOP = 0 + Constants.statusBarHeight;
    const BOTTOM_OFFSET = 5;
    const SNAP_BOTTOM = height - MIN_HEIGHT - BOTTOM_OFFSET;

    const translateY = useSharedValue(SNAP_BOTTOM);
    const scrollY = useSharedValue(0);
    const [focused, setFocused] = useState(false);
    const textInputRef = useRef<TextInput>(null);

    const dismissKeyboard = () => Keyboard.dismiss();

    //Gesture Handler
    const pan = Gesture.Pan()
        .onBegin(() => runOnJS(dismissKeyboard)())
        .onChange((e) => {
            const newY = translateY.value + e.changeY;
            translateY.value = Math.min(Math.max(newY, SNAP_TOP), SNAP_BOTTOM);
        })
        .onEnd((e) => {
            if (Math.abs(e.velocityY) > 2500) {
                const target = e.velocityY < 0 ? SNAP_TOP : SNAP_BOTTOM;
                translateY.value = withTiming(target, { duration: 200 });
            } else {
                const midpoint = (SNAP_BOTTOM - SNAP_TOP) / 2;
                const target =
                    translateY.value < midpoint ? SNAP_TOP : SNAP_BOTTOM;
                translateY.value = withTiming(target, { duration: 200 });
            }
        });

    //Main sheet
    const sheetStyle = useAnimatedStyle(() => {
        // progress: 0 = closed, 1 = fully open
        const progress =
            1 - (translateY.value - SNAP_TOP) / (SNAP_BOTTOM - SNAP_TOP);
        const scale = interpolate(
            progress,
            [0, 1],
            [0.94, 1],
            Extrapolate.CLAMP
        );
        const translateYInter = translateY.value;

        return {
            transform: [{ translateY: translateYInter }, { scale: scale }],
            transformOrigin: "top",
        };
    });

    //Mask
    const mask = useAnimatedStyle(() => {
        const progress =
            1 - (translateY.value - SNAP_TOP) / (SNAP_BOTTOM - SNAP_TOP);
        // const bottom = interpolate(progress, [0, 1], [BOTTOM_OFFSET, 0]);
        const scale = interpolate(
            progress,
            [0, 1],
            [0.94, 1],
            Extrapolate.CLAMP
        );
        const translateYInter = translateY.value;

        const height = interpolate(
            progress,
            [0, 1],
            [MIN_HEIGHT * scale, MAX_HEIGHT * scale],
            Extrapolation.CLAMP
        );

        const radius = interpolate(
            progress,
            [0.7,1],
            [40, 0],
            Extrapolation.CLAMP
        )

        return {
            height,
            borderBottomLeftRadius: radius,
            borderBottomRightRadius: radius,
        };
    });

    //Function buttons
    const childFade = useAnimatedStyle(() => {
        const progress =
            1 - (translateY.value - SNAP_TOP) / (SNAP_BOTTOM - SNAP_TOP);
        const opacity = interpolate(
            translateY.value,
            [SNAP_BOTTOM * 0.5, SNAP_BOTTOM * 0.3],
            [1, 0],
            Extrapolate.CLAMP
        );
        const scale = interpolate(
            progress,
            [0, 1],
            [0.94, 1],
            Extrapolate.CLAMP
        );
        const translateYInter = translateY.value - BOTTOM_OFFSET - 150 - 10;
        return {
            transform: [{ translateY: translateYInter }, { scale: scale }],
            opacity: opacity,
            transformOrigin: "top",
        };
    });

    //Blur functions
    const blurView = useAnimatedStyle(() => {
        const opacity = interpolate(
            scrollY.value,
            [0, 30],
            [0, 1],
            Extrapolate.CLAMP
        );
        return {
            opacity,
        };
    });

    const childScrollHandler = useAnimatedScrollHandler({
        onScroll: (event) => {
            scrollY.value = event.contentOffset.y;
        },
    });

    const minimizeScroll = () => {
        translateY.value = withTiming(SNAP_BOTTOM, { duration: 200 });
    };

    const flatListRef = useRef<Animated.FlatList>(null)

    //Render
    return (
        <>
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
                {children}
            </Animated.View>
            {/* Floating controls / children */}
                <Animated.View
                    style={[
                        styles.sheet,
                        { height: MAX_HEIGHT },
                        sheetStyle,
                    ]}
                >
                    <Animated.View
                        style={[
                            isLiquidGlassAvailable() ? { borderRadius: 40, overflow: "hidden"} : { borderRadius: 40, overflow: "hidden", backgroundColor: themeBack},
                            styles.sheet,
                            mask,
                        ]}
                    >
                        {/* Content */}
                        <GlassView style={styles.glass} >
                            {/* Handle */}
                            <GestureDetector gesture={pan}>
                            <View style={[styles.header]}>
                                <Animated.View
                                    style={[
                                        {
                                            position: "absolute",
                                            top: 0,
                                            left: 0,
                                            bottom: 0,
                                            right: 0,
                                        },
                                        blurView,
                                    ]}
                                >
                                    <BlurView
                                        style={{
                                            height: "100%",
                                            width: "100%",
                                        }}
                                        intensity={100}
                                        experimentalBlurMethod="dimezisBlurView"
                                    />
                                </Animated.View>
                                <View style={styles.handle} />
                                {/* Search Row */}
                                <View style={styles.row}>
                                    <Pressable
                                        style={{ flex: 1 }}
                                        onPress={() =>
                                            textInputRef.current?.focus()
                                        }
                                    >
                                        <GlassView
                                            tintColor={themeBack}
                                            style={styles.inputBox}
                                        >
                                            <Ionicons
                                                name="search"
                                                size={20}
                                                color={themeText}
                                                style={{ marginRight: 8 }}
                                            />
                                            <TextInput
                                                ref={textInputRef}
                                                onFocus={() => {
                                                    setFocused(true);
                                                    translateY.value =
                                                        withSpring(SNAP_TOP);
                                                }}
                                                value={searchValue}
                                                onChangeText={setSearchValue}
                                                placeholder="Search FQHCs"
                                                placeholderTextColor={themeText}
                                                style={{
                                                    color: themeText,
                                                    flex: 1,
                                                }}
                                            />
                                        </GlassView>
                                    </Pressable>

                                    {focused && (
                                        <Pressable
                                            onPress={() => {
                                                setFocused(false);
                                                setSearchValue("");
                                                translateY.value =
                                                    withSpring(SNAP_BOTTOM);
                                            }}
                                        >
                                            <GlassView
                                                isInteractive
                                                tintColor={themeBack}
                                                style={{
                                                    padding: 8,
                                                    borderRadius: 100,
                                                }}
                                            >
                                                <Ionicons
                                                    name="close"
                                                    size={22}
                                                    color={themeText}
                                                />
                                            </GlassView>
                                        </Pressable>
                                    )}
                                </View>
                            </View>
                            </GestureDetector>
                            {/* Scroll / List content */}
                            <View style={{ height: "100%", width: "100%" }}>
                                {React.cloneElement(searchContent as any, {
                                    headerOffset: MIN_HEIGHT,
                                    header: focused && searchActiveCotent,
                                    scrollHandler: childScrollHandler,
                                    minimizeScroll: minimizeScroll,
                                    flatListRef: flatListRef
                                })}
                            </View>
                        </GlassView>
                    </Animated.View>
                </Animated.View>
            {/* </MaskedView> */}
        </>
    );
};

const styles = StyleSheet.create({
    sheet: {
        position: "absolute",
        right: 0,
        left: 0,
        zIndex: 100,
    },
    glass: {
        flex: 1,
        alignItems: "center",
        paddingBottom: 0,
    },

    handle: {
        width: 50,
        height: 4,
        borderRadius: 2,
        backgroundColor: "rgba(255,255,255,0.5)",
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

export default DraggableSearchBar;
