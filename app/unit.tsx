import { ForwardCell } from "@/components/Cell";
import { useThemeColor } from "@/hooks/use-theme-color";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getDefaultHeaderHeight } from "@react-navigation/elements";
import { useLayoutEffect, useState } from "react";
import { ScrollView, View } from "react-native";
import { useSafeAreaFrame, useSafeAreaInsets } from "react-native-safe-area-context";
import { styles } from "./styles";

const UnitSelection = () => {
    const frame = useSafeAreaFrame();
    const insets = useSafeAreaInsets();
    const headerHeight = getDefaultHeaderHeight(frame, false, insets.top);

    const [unit, setUnit] = useState("Imperial");
    const background = useThemeColor({}, "background");
    const cardBackground = useThemeColor({}, "card")

    const getData = async () => {
        try {
            const unit = await AsyncStorage.getItem("unitPref");
            if (unit !== null) {
                setUnit(unit);
            }
        } catch (e) {
            console.log(e);
        }
    };

    const changeUnit = async (val: string) => {
        await AsyncStorage.setItem("unitPref", val)
        setUnit(val)
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
                    <View style={[styles.shadowOverflow]} >
                        <ForwardCell 
                            func={()=>changeUnit("Imperial")}
                            secondaryIcon={unit==="Imperial"?"checkmark-outline":""}
                            text="Mi"
                            showLine
                            showNextArrow={false}
                        />
                        <ForwardCell 
                            func={()=>changeUnit("Metric")}
                            text="Km"
                            secondaryIcon={unit==="Metric"?"checkmark-outline":""}
                            showLine={false}
                            showNextArrow={false}
                        />
                    </View>
                </View>
            </ScrollView>
        </View>
    );
};

export default UnitSelection;
