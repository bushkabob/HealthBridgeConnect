import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";
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
                    backgroundColor: "rgba(0,122,255,1)",
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 6,
                    borderWidth: 2,
                    borderColor: "white",
                }}
            >
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