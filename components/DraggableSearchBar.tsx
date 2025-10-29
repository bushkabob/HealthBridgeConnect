// DraggableSearchBar.tsx
import { useThemeColor } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import Constants from "expo-constants";
import { GlassView } from "expo-glass-effect";
import React, { useRef, useState } from "react";
import {
    Dimensions,
    Keyboard,
    Pressable,
    StyleSheet,
    View,
} from "react-native";
import {
    Gesture,
    GestureDetector,
    GestureHandlerRootView,
    TextInput,
} from "react-native-gesture-handler";
import Animated, {
    Extrapolate,
    interpolate,
    runOnJS,
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

    console.log("Desired Bottom: ", height - MIN_HEIGHT);
    console.log("Top: ", SNAP_TOP);
    console.log("Bottom: ", SNAP_BOTTOM);

    const translateY = useSharedValue(SNAP_BOTTOM);
    const [focused, setFocused] = useState(false);
    const textInputRef = useRef<TextInput>(null);

    const dismissKeyboard = () => Keyboard.dismiss();

    // === Gesture ======================================================
    const pan = Gesture.Pan()
        .onBegin(() => runOnJS(dismissKeyboard)())
        .onChange((e) => {
            const newY = translateY.value + e.changeY;
            translateY.value = Math.min(Math.max(newY, SNAP_TOP), SNAP_BOTTOM);
        })
        .onEnd(() => {
            const midpoint = (SNAP_BOTTOM - SNAP_TOP) / 2;
            const target = translateY.value < midpoint ? SNAP_TOP : SNAP_BOTTOM;
            translateY.value = withTiming(target, { duration: 200 });
        });

    // === Animations ===================================================
    const sheetStyle = useAnimatedStyle(() => {
        // progress: 0 = closed, 1 = fully open
        const progress =
            1 - (translateY.value - SNAP_TOP) / (SNAP_BOTTOM - SNAP_TOP);
        console.log("Translate: " + translateY.value);
        console.log("Snap Bottom: " + SNAP_BOTTOM);
        console.log("Snap top: " + SNAP_TOP);
        console.log("SB - ST: " + (SNAP_BOTTOM - SNAP_TOP));
        console.log("Progress: " + progress);
        const scale = interpolate(
            progress,
            [0, 1],
            [0.94, 1],
            Extrapolate.CLAMP
        );
        const translateYInter = translateY.value;

        return {
            transform: [{ translateY: translateYInter }, {scale: scale}],
            transformOrigin: "top",
        };
    });

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

        const height =
            interpolate(progress, [0, 1], [MIN_HEIGHT * scale, MAX_HEIGHT * scale], Extrapolate.CLAMP);

        return {
            transform: [{ translateY: translateYInter }, {scale: scale}],
            transformOrigin: "top",
            height,
        };
    });

    const childFade = useAnimatedStyle(() => {
		const progress =
            1 - (translateY.value - SNAP_TOP) / (SNAP_BOTTOM - SNAP_TOP);
		const opacity = interpolate(
				translateY.value,
				[SNAP_BOTTOM * 0.5, SNAP_BOTTOM * 0.3],
				[1, 0],
				Extrapolate.CLAMP
		)
		const scale = interpolate(
            progress,
            [0, 1],
            [0.94, 1],
            Extrapolate.CLAMP
        );
		const translateYInter = translateY.value - BOTTOM_OFFSET - 100 - 10;
		

		return {
			transform: [{ translateY: translateYInter }, {scale: scale}],
			opacity: opacity,
			transformOrigin: "top"
		}
});

    // === Render ======================================================
    return (
        <>
			<Animated.View
                style={[
                    { position: "absolute", top: 0, right: 0, marginHorizontal: 10 },
                    childFade,
                ]}
            >
                {children}
            </Animated.View>
            {/* Floating controls / children */}
            <MaskedView
                style={{ height: "100%", width: "100%", position: "absolute", 
					pointerEvents: "box-none"
				}}
                maskElement={
                    <Animated.View
                        style={[
                            { backgroundColor: "black", borderRadius: 40 },
                            styles.sheet,
                            mask,
                        ]}
                    />
                }
            >
                <GestureHandlerRootView
                    style={{
                        width: "100%",
                        height: "100%",
                        position: "absolute",
                    }}
                >
                    <GestureDetector gesture={pan}>
                        <Animated.View
                            style={[
                                styles.sheet,
                                { height: MAX_HEIGHT },
                                sheetStyle,
                            ]}
                        >
                            {/* Static blur background */}
                            {/* <BlurView
                                intensity={80}
                                tint="default"
                                style={[
                                    StyleSheet.absoluteFill,
                                ]}
                            /> */}

                            {/* Content */}
                            <GlassView style={styles.glass}>
                                {/* Handle */}
                                <BlurView style={styles.header} >
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
                                                        styl={{ padding: 20 }}
                                                    />
                                                </GlassView>
                                            </Pressable>
                                        )}
                                    </View>
                                </BlurView>
                                {/* Scroll / List content */}
                                <View style={{ height: "100%", width: "100%" }}>
                                    {React.cloneElement(searchContent as any, {
                                        headerOffset: MIN_HEIGHT,
                                        header: focused && searchActiveCotent, 
                                    })}
                                </View>
                            </GlassView>
                        </Animated.View>
                    </GestureDetector>
                </GestureHandlerRootView>
            </MaskedView>
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
        borderRadius: 40
    },
    header: {
        width: "100%",
        alignItems: "center",
        position: "absolute",
        top: 0,
        zIndex: 100,
    }
});

export default DraggableSearchBar;
