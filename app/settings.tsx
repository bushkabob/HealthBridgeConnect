import { useThemeColor } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Slider from "@react-native-community/slider";
import SegmentedControl from "@react-native-segmented-control/segmented-control";
import { Link } from "expo-router";
import { useLayoutEffect, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

const Settings = () => {
    const [unit, setUnit] = useState("Imperial");
    const [searchRadius, setSearchRadius] = useState(10);

    const themeBack = useThemeColor({}, "background");
    const cardBack = useThemeColor({}, "card");
    const themeColor = useThemeColor({}, "text");

    const titleWeight = "bold";
    const titleSize = 20;

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

    useLayoutEffect(() => {
        getData();
    }, []);

    const updateUnit = () => {
        const newUnit = unit === "Imperial" ? "Metric" : "Imperial";
        AsyncStorage.setItem("unitPref", newUnit);
        setUnit(newUnit);
    };

    const updateRadius = (val: number) => {
        AsyncStorage.setItem("radiusPref", val.toString());
        setSearchRadius(val);
    };

    return (
        <View
            style={{
                backgroundColor: themeBack,
                width: "100%",
                height: "100%",
            }}
        >
            <ScrollView contentContainerStyle={{height: "100%", width: "100%"}} >
                <View
                    style={[
                        {
                            backgroundColor: cardBack,
                        },
                        styles.shadow,
                    ]}
                >
                    <Text
                        style={{
                            color: themeColor,
                            fontWeight: titleWeight,
                            fontSize: titleSize,
                        }}
                    >
                        Unit Type
                    </Text>
                    <SegmentedControl
                        onChange={updateUnit}
                        values={["Imperial", "Metric"]}
                        selectedIndex={unit === "Metric" ? 1 : 0}
                    />
                </View>
                <View
                    style={[
                        {
                            backgroundColor: cardBack,
                        },
                        styles.shadow,
                    ]}
                >
                    <Text
                        style={{
                            color: themeColor,
                            fontWeight: titleWeight,
                            fontSize: titleSize,
                        }}
                    >
                        Search Radius
                    </Text>
                    <Text style={{ color: themeColor }}>
                        {searchRadius.toFixed(0)}{" "}
                        {unit === "Imperial" ? "mi" : "km"}
                    </Text>
                    <Slider
                        minimumValue={1}
                        maximumValue={30}
                        style={{ marginHorizontal: 40 }}
                        value={searchRadius}
                        onValueChange={(val) => updateRadius(val)}
                    />
                </View>
                <View style={[
                        {
                            backgroundColor: cardBack,
                        },
                        styles.shadow,
                    ]}>
                        <Text
                        style={{
                            color: themeColor,
                            fontWeight: titleWeight,
                            fontSize: titleSize,
                        }}
                    >
                        About
                    </Text>
                    <Text style={{ color: themeColor }}>
                        Distributed under the MIT License
                    </Text>
                </View>
                <View style={[
                        {
                            backgroundColor: cardBack,
                        },
                        styles.shadow,
                    ]}>
                        <Text
                        style={{
                            color: themeColor,
                            fontWeight: titleWeight,
                            fontSize: titleSize,
                        }}
                    >
                        Acknowledgments
                    </Text>
                    <Text style={{ color: themeColor }}>
                        Built on the <Link href={"https://expo.dev"} dataDetectorType={"link"} ><Ionicons name="link" /> Expo Platform</Link> 
                    </Text>
                    <Text style={{ color: themeColor }}>
                        Data sourced from the Health Resource and Service Administration <Link href={"https://data.hrsa.gov/data/download"} dataDetectorType={"link"} ><Ionicons name="link" /> Data Warehouse</Link> 
                    </Text>
                    <Text style={{ color: themeColor }}>
                        Medicare enrollment status provided by the Center for Medicare & Medicaid Services <Link href={"https://data.cms.gov/provider-characteristics/hospitals-and-other-facilities/federally-qualified-health-center-enrollments"} dataDetectorType={"link"} ><Ionicons name="link" /> Data Warehouse</Link> 
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

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
});

export default Settings;
