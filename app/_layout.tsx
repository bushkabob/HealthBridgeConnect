import { useThemeColor } from "@/hooks/use-theme-color";
import {
	DarkTheme,
	DefaultTheme,
	ThemeProvider,
} from "@react-navigation/native";
import { Stack } from "expo-router";
import { StyleSheet, useColorScheme, View } from "react-native";

export default function TabLayout() {
    const colorScheme = useColorScheme();
    console.log(colorScheme);
    const background = useThemeColor({}, "background");

    return (
        <View style={[{ backgroundColor: background }, StyleSheet.absoluteFill]}>
            <ThemeProvider
                value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
            >
                <Stack>
                    <Stack.Screen
                        name="index"
                        options={{ headerShown: false, title: "Home" }}
                    />
                    <Stack.Screen
                        name="settings"
                        options={{
                            title: "Settings",
                            headerTransparent: true,
                            headerTitle: "",
                            headerBackButtonDisplayMode: "minimal",
                        }}
                    />
                    <Stack.Screen
                        name="settings_detailed"
                        options={{
                            title: "Settings",
                            headerTransparent: true,
                            headerTitle: "",
                            headerBackButtonDisplayMode: "minimal",
                        }}
                    />
                    <Stack.Screen
                        name="unit"
                        options={{
                            title: "Unit Selection",
                            headerTransparent: true,
                            headerTitle: "",
                            headerBackButtonDisplayMode: "minimal",
                        }}
                    />
                    <Stack.Screen
                        name="radius"
                        options={{
                            title: "Radius",
                            headerTransparent: true,
                            headerTitle: "",
                            headerBackButtonDisplayMode: "minimal",
                        }}
                    />
                    <Stack.Screen
                        name="acknowledgements"
                        options={{
                            title: "Acknowledgements",
                            headerTransparent: true,
                            headerTitle: "",
                            headerBackButtonDisplayMode: "minimal",
                        }}
                    />
                    <Stack.Screen
                        name="faq"
                        options={{
                            title: "FAQ",
                            headerTransparent: true,
                            headerTitle: "FAQ",
                            headerBackButtonDisplayMode: "minimal",
                        }}
                    />
                </Stack>
            </ThemeProvider>
        </View>
    );
}
