import { Text, View } from "react-native";
import { MapMarker } from "react-native-maps";

const ClusterMarker: React.FC<{
    coordinate: { latitude: number; longitude: number };
    count: number;
    onPress: () => void;
    id: number | string;
}> = ({ coordinate, count, onPress, id }) => {
    return (
        <MapMarker
            key={`cluster-${id}`}
            coordinate={coordinate}
            onPress={onPress}
        >
            <View
                style={{
                    minWidth: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: "rgba(0,122,255,0.9)",
                    justifyContent: "center",
                    alignItems: "center",
                    paddingHorizontal: 6,
                    borderWidth: 2,
                    borderColor: "white",
                }}
            >
                <Text style={{ color: "white", fontWeight: "700" }}>
                    {count}
                </Text>
            </View>
        </MapMarker>
    );
};

export default ClusterMarker