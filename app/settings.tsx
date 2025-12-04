import { ForwardCell } from "@/components/Cell";
import { useThemeColor } from "@/hooks/use-theme-color";
import { getDefaultHeaderHeight } from "@react-navigation/elements";
import { useAssets } from "expo-asset";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { ScrollView, Text, View } from "react-native";
import {
    useSafeAreaFrame,
    useSafeAreaInsets,
} from "react-native-safe-area-context";
import { styles } from "./styles";

const Settings = () => {
    const [assets, error] = useAssets(require("../assets/images/icon.png"));

    const frame = useSafeAreaFrame();
    const insets = useSafeAreaInsets();
    const headerHeight = getDefaultHeaderHeight(frame, false, insets.top);

    const themeBack = useThemeColor({}, "background");
    const cardBack = useThemeColor({}, "card");
    const themeColor = useThemeColor({}, "text");

    const cellLine = useThemeColor({}, "background2");

    const titleWeight = "bold";
    const titleSize = 25;

    const router = useRouter();

    const navigateToSettings = () => {
        router.push("/settings_detailed");
    };

    const navigateToAcknowledgements = () => {
        router.push("/acknowledgements");
    };

    const navigateToFAQ = () => {
        router.push("/faq")
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
                <View style={{ height: headerHeight, width: "100%"}} />
                <View style={styles.contentView}>
                    <View
                        style={[
                            {
                                backgroundColor: cardBack,
                            },
                            styles.shadow,
                            styles.cellInset,
                        ]}
                    >
                        <Image
                            source={assets ? assets[0] : null}
                            style={{ height: 60, width: 60, borderRadius: 15 }}
                        />
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
                            Distributed by HealthBridge Labs LLC. under the MIT
                            License
                        </Text>
                    </View>
                    <View
                        style={[
                            {
                                backgroundColor: cardBack,
                            },
                            styles.shadow,
                        ]}
                    >
                        <View style={[styles.shadowOverflow]} >
                            <ForwardCell
                                func={navigateToFAQ}
                                text="FAQ"
                                showLine
                                showNextArrow
                            />
                            <ForwardCell
                                func={navigateToSettings}
                                text={"Settings"}
                                showLine
                                showNextArrow
                            />
                            <ForwardCell
                                func={navigateToAcknowledgements}
                                text={"Acknowledgements"}
                                showLine={false}
                                showNextArrow
                            />
                            </View>
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default Settings;
