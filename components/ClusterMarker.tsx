import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import { MapMarker } from "react-native-maps";

const ClusterMarker: React.FC<{
    coordinate: { latitude: number; longitude: number };
    count: number;
    onPress: () => void;
    id: number | string;
    isSpiderfied: boolean
}> = ({ coordinate, count, onPress, id, isSpiderfied }) => {
    return (
        <MapMarker
            key={`cluster-${id}`}
            coordinate={coordinate}
            onPress={onPress}
        >
            <View
                style={{
                    minWidth: 40,
                    height: 40,
                    borderRadius: 40,
                    backgroundColor: "#007affff",
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 6,
                    overflow: "hidden"
                }}
            >
                <LinearGradient style={StyleSheet.absoluteFill} colors={["#787affff","#007affff"]}/>
                {
                    isSpiderfied ?
                    <Ionicons size={22} color={"white"} name="close" />
                    :
                    <Text style={{ color: "white", fontWeight: "700" }}>
                        {count}
                    </Text>
                }
            </View>
        </MapMarker>
    );
};

export default ClusterMarker