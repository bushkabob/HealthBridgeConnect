import { ForwardCell } from "@/components/Cell";
import { useThemeColor } from "@/hooks/use-theme-color";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDefaultHeaderHeight } from "@react-navigation/elements";
import { useFocusEffect, useRouter } from "expo-router";
import React, { useState } from "react";
import { ScrollView, Text, View } from "react-native";
import {
    useSafeAreaFrame,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { styles } from "./styles";

const SettingsDetailed = () => {
    const frame = useSafeAreaFrame();
    const insets = useSafeAreaInsets();
    const headerHeight = getDefaultHeaderHeight(frame, false, insets.top);

    const [unit, setUnit] = useState("Imperial");
    const [searchRadius, setSearchRadius] = useState(10);

    const getData = async () => {
        try {
            const unit = await AsyncStorage.getItem("unitPref");
            if (unit !== null) {
                setUnit(unit);
            }
            const searchRadius = await AsyncStorage.getItem("radiusPref");
            if (searchRadius !== null) {
                setSearchRadius(Number(searchRadius));
            }
        } catch (e) {
            console.log(e);
        }
    };

    useFocusEffect(() => {
        getData();
    });

    const themeBack = useThemeColor({}, "background");
    const cardBack = useThemeColor({}, "card");
    const themeColor = useThemeColor({}, "text");

    const titleWeight = "bold";
    const titleSize = 25;
    const router = useRouter()

    const pushToUnitSelection = () => {
        router.push("/unit")
    }

    const pushToRadiusSelection = () => {
        router.push("/radius")
    }

    return (
        <View
            style={{
                backgroundColor: themeBack,
                width: "100%",
                height: "100%",
            }}
        >
            <ScrollView
                contentContainerStyle={{ height: "100%", width: "100%" }}
            >
                <View style={{ width: "100%", height: headerHeight }} />
                <View style={[styles.shadow, { backgroundColor: cardBack }]}>
                    <View style={[styles.shadowOverflow]} >
                        <Text
                            style={[{
                                color: themeColor,
                                fontWeight: titleWeight,
                                fontSize: titleSize,
                            }, styles.title, styles.titleInset]}
                        >
                            Settings
                        </Text>
                        <ForwardCell 
                            text="Unit"
                            func={pushToUnitSelection}
                            showLine
                            showNextArrow
                            color="rgba(25, 17, 255, 1)"
                            secondaryIcon={"globe-outline"}
                            textSecondary={unit}
                        />
                        <ForwardCell
                            text="Search Radius"
                            func={pushToRadiusSelection}
                            showNextArrow
                            color="rgba(13, 202, 0, 1)"
                            secondaryIcon={"search-outline"}
                            textSecondary={searchRadius + (unit === "Imperial" ? " mi" : " km")}
                            showLine={false}
                        />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default SettingsDetailed;


