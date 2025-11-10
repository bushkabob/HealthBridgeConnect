import { useThemeColor } from "@/hooks/use-theme-color";
import { HeightUpdateFunction } from "@/types/types";
import { Ionicons } from "@expo/vector-icons";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { GlassView, isLiquidGlassAvailable } from "expo-glass-effect";
import { useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

interface SearchRowProps {
    value: string;
    setValue: Function;
    setViewHeight?: HeightUpdateFunction;
    searchArea: string
    setSearchArea: Function
}

const SearchRow = (props: SearchRowProps) => {
    const searchBackground = useThemeColor({}, "background");
    const textColor = useThemeColor({}, "text");
    const textFieldRef = useRef<TextInput>(null);
    const [searchActive, setSearchActive] = useState<boolean>(false);

    return (
        <View style={styles.header} >
            <View style={styles.row}>
                <Pressable
                    style={styles.search}
                    onPress={() =>
                        textFieldRef.current && textFieldRef.current?.focus()
                    }
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
                                setSearchActive(true);
                            }}
                        />
                    </GlassView>
                </Pressable>
                {searchActive && (
                    <Pressable
                        onPress={() => {
                            props.setViewHeight &&
                                props.setViewHeight(0.0, 300);
                            setSearchActive(false);
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
            {searchActive && (
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
    },
    searchBar: {
        flexDirection: "row",
        borderRadius: 40,
        padding: 10,
    },
    close: {
        padding: 10,
        borderRadius: 30,
    },
    header: {
        marginHorizontal: 20,
        gap: 20
    }
});

export default SearchRow;
