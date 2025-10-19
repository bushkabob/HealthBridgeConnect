// DraggableSearchBar.tsx
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { GlassContainer, GlassView } from "expo-glass-effect";
import React from "react";
import { Dimensions, Keyboard, Pressable, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView, TextInput } from "react-native-gesture-handler";
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";

type DraggableSearchBarProps = {
	children?: React.ReactNode;
}

const DraggableSearchBar: React.FC<DraggableSearchBarProps> = ({children}) => {
	const TextInputRef = React.useRef<TextInput>(null);

	const { height, width } = Dimensions.get("window");
	const maxHeight = height - Constants.statusBarHeight;

	const config = {
    	duration: 500,
    	easing: Easing.bezier(0.5, 0.01, 0, 1),
	};

	const minHeight = 65;
	const viewHeight = useSharedValue(minHeight);

	function dismissKeyboard () {
		Keyboard.dismiss();
	};

	const panGesture = Gesture.Pan()
		.onBegin(() => {
			runOnJS(dismissKeyboard)();
		})
		.onChange((event) => {
			let newHeight = viewHeight.value + -event.changeY;
			newHeight = Math.max(minHeight, Math.min(maxHeight, newHeight));
			viewHeight.value = newHeight;
		})
		.onFinalize(() => {
			const quarterHeight = maxHeight / 4;
			if (viewHeight.value > quarterHeight * 3) {
				viewHeight.value = withTiming(maxHeight, config);
				return;
			}
			else if (viewHeight.value > quarterHeight) {
				viewHeight.value = withTiming(maxHeight/2, config);
				return;
			} else {
				viewHeight.value = withTiming(minHeight, config);
			}
		});

	const animatedStyles = useAnimatedStyle(() => {
		return {
			height: viewHeight.value,
			bottom: 20 - 20 * (viewHeight.value - minHeight) / (maxHeight - minHeight),
			left: 20 - 20 * (viewHeight.value - minHeight) / (maxHeight - minHeight),
			right: 20 - 20 * (viewHeight.value - minHeight) / (maxHeight - minHeight)
		};
	});

	const animatedChildrenStyles = useAnimatedStyle(() => {
		return {
			opacity: interpolate(viewHeight.value, [maxHeight / 2, 3 * maxHeight / 4], [1, 0]),
			bottom: viewHeight.value + 30 - 20 * (viewHeight.value - minHeight) / (maxHeight - minHeight),
			left: 20 - 20 * (viewHeight.value - minHeight) / (maxHeight - minHeight),
			right: 20 - 20 * (viewHeight.value - minHeight) / (maxHeight - minHeight),
			pointerEvents: viewHeight.value <= maxHeight / 2 ? "box-none" : "none"
		};
	});

	return (
			<>
				<Animated.View style={[{position: "absolute", marginHorizontal: 10}, animatedChildrenStyles]} >
					{children}
				</Animated.View>
				<GestureHandlerRootView style={{flex: 1, width: "100%"}} >
					<GestureDetector gesture={panGesture}>
						<Animated.View style={[{ position: 'absolute',
							borderRadius: 100
							}, animatedStyles]}
						>
							<GlassContainer>
								<GlassView style={{width: "100%", alignItems: "center", height: "100%", borderRadius: 100}} >
									<View style={{backgroundColor: "#a5adb0", height: 4, marginHorizontal: 10, marginVertical: 4, borderRadius: 20, width: 50}} />
									<Pressable onPress={()=>TextInputRef.current?.focus()} style={{alignSelf: "stretch"}} >
										<GlassView isInteractive tintColor="#d3d3d3" style={{ flexDirection: "row", alignSelf: "stretch", alignItems: "center", height: 40, marginHorizontal: 10, marginVertical: 2, borderRadius: 80}} >
											<Ionicons name="search" size={20} color="gray" style={{ marginLeft: 10, marginRight: 5 }} />
										<TextInput onFocus={()=>viewHeight.value = withTiming(maxHeight, config)} ref={TextInputRef} placeholder="Search FQHCs" placeholderTextColor="gray" style={{width: "100%"}} />
									</GlassView>
									</Pressable>
								</GlassView>
							</GlassContainer>

						</Animated.View>
					</GestureDetector>
				</GestureHandlerRootView>
			</>
	)
}

export default DraggableSearchBar;