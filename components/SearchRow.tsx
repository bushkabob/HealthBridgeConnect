import { useThemeColor } from "@/hooks/use-theme-color";
import { HeightUpdateFunction } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, StyleSheet, TextInput, View } from "react-native";

interface SearchRowProps {
    value: string;
    setValue: Function;
    setViewHeight?: HeightUpdateFunction;
    searchArea: string;
    setSearchArea: Function;
    setSearchActive: Function;
    searchActive: boolean;
}

const SearchRow = (props: SearchRowProps) => {
    const searchBackground = useThemeColor({}, "background");
    const textColor = useThemeColor({}, "text");
    const textFieldRef = useRef<TextInput>(null);
    const [editing, setEditing] = useState(false);

    useEffect(() => {
        // props.setHeaderHeight(searchActive ? 82 + 50 : 82)
        console.log(props.searchActive);
    }, [props.searchActive]);

    useEffect(() => {
        console.log("mounted");
    }, []);

    useEffect(() => {
        if (Platform.OS === "android") {
            if (editing) {
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        textFieldRef.current?.focus();
                    }, 0);
                });
            }
        } else {
            textFieldRef.current && editing && textFieldRef.current?.focus();
        }
    }, [editing]);

    return (
        <View style={styles.header}>
            <View style={styles.row}>
                <Pressable
                    style={styles.search}
                    onPress={() => {
                        setEditing(true);
                    }}
                    onMoveShouldSetResponder={() => false}
                    onStartShouldSetResponder={() => false}
                >
                    <GlassView
                        isInteractive
                        tintColor={searchBackground}
                        style={[
                            styles.searchBar,
                            {
                                backgroundColor: isLiquidGlassAvailable()
                                    ? undefined
                                    : searchBackground,
                            },
                        ]}
                        pointerEvents={editing ? "auto" : "none"}
                    >
                        <Ionicons
                            name="search"
                            size={20}
                            color={textColor}
                            style={{ marginRight: 8 }}
                        />
                        <TextInput
                            ref={textFieldRef}
                            value={props.value}
                            onChangeText={(val) => props.setValue(val)}
                            placeholder="Search FQHCs"
                            placeholderTextColor={textColor}
                            style={{
                                color: textColor,
                                flex: 1,
                            }}
                            onFocus={() => {
                                props.setViewHeight &&
                                    props.setViewHeight(1.0, 300);
                                props.setSearchActive(true);
                            }}
                            onBlur={() => setEditing(false)}
                            scrollEnabled={false}
                        />
                    </GlassView>
                </Pressable>
                {props.searchActive && (
                    <Pressable
                        onPress={() => {
                            props.setViewHeight &&
                                props.setViewHeight(0.0, 300);
                            props.setSearchActive(false);
                        }}
                    >
                        <GlassView
                            isInteractive
                            tintColor={searchBackground}
                            style={[
                                {
                                    backgroundColor: isLiquidGlassAvailable()
                                        ? undefined
                                        : searchBackground,
                                },
                                styles.close,
                            ]}
                        >
                            <Ionicons
                                name="close"
                                size={22}
                                color={textColor}
                            />
                        </GlassView>
                    </Pressable>
                )}
            </View>
            {(props.searchActive) && (
                <View style={{ marginBottom: 20 }}>
                    <SegmentedControl
                        onChange={() =>
                            props.setSearchArea((val: string) =>
                                val === "All" ? "Nearby" : "All"
                            )
                        }
                        values={["Search Current Area", "Search All"]}
                        selectedIndex={props.searchArea === "Nearby" ? 0 : 1}
                        style={{ width: "100%" }}
                    />
                </View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    row: {
        flexDirection: "row",
        gap: 10,
    },
    search: {
        flex: 1,
        paddingBottom: 20,
    },
    searchBar: {
        flexDirection: "row",
        borderRadius: 40,
        padding: Platform.OS === "android" ? 0 : 10,
        alignItems: "center",
        paddingHorizontal: 10,
    },
    close: {
        padding: 10,
        borderRadius: 30,
    },
    header: {
        marginHorizontal: 20,
    },
});

export default SearchRow;
