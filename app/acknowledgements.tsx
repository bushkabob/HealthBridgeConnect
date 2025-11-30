import { useThemeColor } from "@/hooks/use-theme-color";
import { Ionicons } from "@expo/vector-icons";
import { getDefaultHeaderHeight } from "@react-navigation/elements";
import { Link } from "expo-router";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import {
    useSafeAreaFrame,
    useSafeAreaInsets,
} from "react-native-safe-area-context";

const Acknowledgements = () => {
    const themeBack = useThemeColor({}, "background");
    const cardBack = useThemeColor({}, "card");
    const themeColor = useThemeColor({}, "text");

    const titleWeight = "bold";
    const titleSize = 25;

    const frame = useSafeAreaFrame();
    const insets = useSafeAreaInsets();
    const headerHeight = getDefaultHeaderHeight(frame, false, insets.top);

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
                        Acknowledgments
                    </Text>
                    <Text style={{ color: themeColor }}>
                        Built on the{" "}
                        <Link
                            href={"https://expo.dev"}
                            dataDetectorType={"link"}
                        >
                            <Ionicons name="link" /> Expo Platform
                        </Link>
                    </Text>
                    <Text style={{ color: themeColor }}>
                        Data sourced from the Health Resource and Service
                        Administration{" "}
                        <Link
                            href={"https://data.hrsa.gov/data/download"}
                            dataDetectorType={"link"}
                        >
                            <Ionicons name="link" /> Data Warehouse
                        </Link>
                    </Text>
                    <Text style={{ color: themeColor }}>
                        Medicare enrollment status retrieved through the Center for
                        Medicare & Medicaid Services{" "}
                        <Link
                            href={
                                "https://data.cms.gov/provider-characteristics/hospitals-and-other-facilities/federally-qualified-health-center-enrollments"
                            }
                            dataDetectorType={"link"}
                        >
                            <Ionicons name="link" /> Data Warehouse
                        </Link>
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
};

export default Acknowledgements;

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
});
