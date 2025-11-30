import Cell from "@/components/Cell";
import { useThemeColor } from "@/hooks/use-theme-color";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import { getDefaultHeaderHeight } from "@react-navigation/elements";
import { useLayoutEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaFrame, useSafeAreaInsets } from "react-native-safe-area-context";

const RadiusSelection = () => {
    const frame = useSafeAreaFrame();
    const insets = useSafeAreaInsets();
    const headerHeight = getDefaultHeaderHeight(frame, false, insets.top);

    const [radius, setRadius] = useState(5);
    const [unit, setUnit] = useState("Imperial")
    const background = useThemeColor({}, "background");
    const cardBackground = useThemeColor({}, "card")
    const textColor = useThemeColor({}, "text")

    const getData = async () => {
        try {
            const asyncRadius = await AsyncStorage.getItem("radiusPref");
            if (asyncRadius !== null) {
                setRadius(Number(asyncRadius));
            }
            const unit = await AsyncStorage.getItem("unitPref");
            if (unit !== null) {
                setUnit(unit);
            }
        } catch (e) {
            console.log(e);
        }
    };

    const changeRadius = async (val: number) => {
        await AsyncStorage.setItem("radiusPref", val.toString())
        setRadius(val)
    }

    useLayoutEffect(() => {
        getData();
    }, []);

    return (
        <View
            style={{
                backgroundColor: background,
                width: "100%",
                height: "100%",
            }}
        >
            <ScrollView
                contentContainerStyle={{ height: "100%", width: "100%" }}
            >
                <View style={{ width: "100%", height: headerHeight }} />
                <View style={[styles.shadow, { backgroundColor: cardBackground }]}>
                    <Cell showLine={false}>
                        <View style={{width: "100%"}}>
                            <View style={{flexDirection: "row", width: "100%", gap: 10, justifyContent: "space-between"}} >
                                <Text style={{color: textColor, fontSize: 17}} >Search Radius</Text>
                                <Text style={{color: textColor, fontSize: 17}} >{radius.toString() + (unit === "Imperial" ? " mi" : " km")}</Text>
                            </View>
                            <Slider style={{marginTop: 15}} value={radius} onValueChange={(val)=>changeRadius(Number(val.toFixed(0)))} minimumValue={5} maximumValue={30} />
                        </View>
                    </Cell>
                </View>
            </ScrollView>
        </View>
    );
};

export default RadiusSelection;

const styles = StyleSheet.create({
    shadow: {
        margin: 10,
        padding: 20,
        borderRadius: 20,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.22,
        shadowRadius: 2.22,

        elevation: 3,
        gap: 10,
    },
    contentView: {
        marginTop: 30,
    },
    row: {
        flexDirection: "row",
        justifyContent: "space-between",
        gap: 10,
        padding: 10,
        margin: 10,
    },
});
