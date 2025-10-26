// DraggableSearchBar.tsx
import { useThemeColor } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Constants from "expo-constants";
import { GlassContainer, GlassView } from "expo-glass-effect";
import React, { useState } from "react";
import { Dimensions, Keyboard, Pressable, View } from "react-native";
import { Gesture, GestureDetector, GestureHandlerRootView, TextInput } from "react-native-gesture-handler";
import Animated, { Easing, Extrapolate, interpolate, useAnimatedScrollHandler, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";

type DraggableSearchBarProps = {
	searchContent?: React.ReactNode;
	children?: React.ReactNode;
	searchActiveCotent?: React.ReactNode
	searchValue: string
	setSearchValue: Function
}

const DraggableSearchBar: React.FC<DraggableSearchBarProps> = ({children, searchContent, searchActiveCotent, searchValue, setSearchValue}) => {
	const [searchFocused, setSearchFocused] = useState<boolean>(false)

	const themeBack = useThemeColor({}, 'background');
	const themeText = useThemeColor({}, 'text');

	const TextInputRef = React.useRef<TextInput>(null);
	const ScrollViewRef = React.useRef<Animated.ScrollView>(null)

	const { height, width } = Dimensions.get("window");
	const maxHeight = height - Constants.statusBarHeight;

	const config = { duration: 500, easing: Easing.bezier(0.5, 0.01, 0, 1),};

	const minHeight = 65;
	const viewHeight = useSharedValue(minHeight);

	const scrollY = useSharedValue(0);

	// useAnimatedReaction(() => scrollY.value, (val) => {
	// 	console.log(val)
	// 	val < -64 ? (scrollEnabled && runOnJS(setScrollEnabled)(false)) : (!scrollEnabled && runOnJS(setScrollEnabled)(true))
	// }, [scrollY])

	function dismissKeyboard () {
		Keyboard.dismiss();
	};

	const panGesture = Gesture.Pan()
		.onBegin((event) => {
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
				// ScrollViewRef.current?.scrollTo({y: 0}, )
				viewHeight.value = withTiming(minHeight, config);
			}
		});

	//Change view height
	const animatedStyles = useAnimatedStyle(() => {
		return {
			height: viewHeight.value,
			bottom: 20 - 21 * (viewHeight.value - minHeight) / (maxHeight - minHeight),
			left: 20 - 21 * (viewHeight.value - minHeight) / (maxHeight - minHeight),
			right: 20 - 21 * (viewHeight.value - minHeight) / (maxHeight - minHeight)
		};
	});

	//Move children up and hide when appropriate
	const animatedChildrenStyles = useAnimatedStyle(() => {
		return {
			opacity: interpolate(viewHeight.value, [maxHeight / 2, 3 * maxHeight / 4], [1, 0]),
			bottom: viewHeight.value + 30 - 21 * (viewHeight.value - minHeight) / (maxHeight - minHeight),
			left: 20 - 21 * (viewHeight.value - minHeight) / (maxHeight - minHeight),
			right: 20 - 21 * (viewHeight.value - minHeight) / (maxHeight - minHeight),
			pointerEvents: viewHeight.value <= maxHeight / 2 ? "box-none" : "none"
		};
	});

	// Smoothly fade gradient in as content scrolls under glass
	const gradientAnimatedStyle = useAnimatedStyle(() => {
		const opacity = interpolate(
		scrollY.value,
		[0, 80], // fade range
		[0, 1],  // 0 = fully hidden, 1 = fully visible
		Extrapolate.CLAMP
		);
		return { opacity: withTiming(opacity, { duration: 1 }) };
	});

	// Scroll event handler
	const scrollHandler = useAnimatedScrollHandler({
		onScroll: (event) => {
			scrollY.value = event.contentOffset.y;
		},
	});

	return (
			<>
				<Animated.View style={[{position: "absolute", marginHorizontal: 10}, animatedChildrenStyles]} >
					{children}
				</Animated.View>
				<GestureHandlerRootView style={{flex: 1, width: "100%"}} >
					<GestureDetector gesture={Gesture.Simultaneous(panGesture)}>
						<Animated.View style={[{ position: 'absolute', overflow: 'hidden', borderRadius: 40}, animatedStyles]}>
							<GlassContainer>
									<GlassView style={{zIndex: 30, width: "100%", alignItems: "center", paddingBottom: 10, height: "100%"}} >
										<View style={{backgroundColor: "gray", height: 4, marginHorizontal: 10, marginVertical: 4, borderRadius: 20, width: 50, zIndex: 100}} />
										<View style={{width: "100%", flexDirection: "row", alignItems: "center", zIndex: 100}} >
											<Pressable onPress={()=>TextInputRef.current?.focus()} style={{alignSelf: "stretch", flexGrow: 1}} >
												<GlassView tintColor={themeBack} style={{ flexDirection: "row", alignSelf: "stretch", alignItems: "center", height: 40, marginHorizontal: 10, marginVertical: 2, borderRadius: 80}} >
													<Ionicons name="search" size={20} color={themeText} style={{ marginLeft: 10, marginRight: 5 }} />
													<TextInput onFocus={()=>{viewHeight.value = withTiming(maxHeight, config); setSearchFocused(true)}} value={searchValue} onChangeText={(val)=>setSearchValue(val)} ref={TextInputRef} placeholder="Search FQHCs" placeholderTextColor={themeText} style={{color: themeText}} />
												</GlassView>
											</Pressable>
											{
												searchFocused &&
												<Pressable onPress={()=>{setSearchFocused(false); setSearchValue("")}} >
													<GlassView isInteractive tintColor={themeBack} style={{borderRadius: 80, padding: 8, marginRight: 20}} >
														<Ionicons name="close" size={20} color={themeText} />
													</GlassView>
												</Pressable>
											}
										</View>
										<View style={{top: 0, bottom: 0, width: "100%", position: "absolute"}}>
											{/* <Animated.View
												style={[
												{
													position: "absolute",
													top: 0,
													left: 0,
													right: 0,
													height: 100,
													zIndex: 50,
												},
												
												]}
											> */}
											<BlurView intensity={80} style={{ height: 64, width: "100%", position: "absolute", top: 0, left: 0, right: 0, zIndex: 50 }} />
											<Animated.ScrollView
												showsVerticalScrollIndicator={true} 
												onScroll={scrollHandler} 
												contentOffset={{x: 0, y: 84}} 
												contentInset={{top: 64, bottom: 20}} 
												style={{zIndex: 20}}
												ref={ScrollViewRef}
											>	
												{(searchFocused || searchValue !== "") && searchActiveCotent}
												{searchContent}
											</Animated.ScrollView>
											
										</View>
								</GlassView>
							</GlassContainer>
						</Animated.View>
					</GestureDetector>
				</GestureHandlerRootView>
			</>
	)
}

export default DraggableSearchBar;