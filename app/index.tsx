import DraggableSearchBar from '@/components/DraggableSearchBar';
import { Ionicons } from '@expo/vector-icons';
import { GlassView } from 'expo-glass-effect';
import * as Location from 'expo-location';
import { useEffect, useRef } from 'react';
import { Pressable, View } from "react-native";
import MapView from 'react-native-maps';

export default function Map() {
    const mapRef = useRef<MapView>(null);

    const moveToLocation = (location: Location.LocationObject) => {
        if (mapRef.current) {
            mapRef.current.animateToRegion({
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
                latitudeDelta: 0.01,
                longitudeDelta: 0.01,
            }, 1000);
        }
    }

    async function getCurrentLocation(callback?: (location: Location.LocationObject) => void) {
        
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
            return;
        }

        let location = await Location.getCurrentPositionAsync({});
        callback && callback(location);
    }

    useEffect(() => {
        getCurrentLocation();
    }, []);


    return (
        <View
            style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
            }}
        >
            <MapView mapPadding={{ top: 50, bottom:50, left: 20, right:20 }} ref={mapRef} style={{ width: '100%', height: '100%', }} showsMyLocationButton showsUserLocation />
            <DraggableSearchBar>
                <GlassView isInteractive style={{ padding: 10, borderRadius: 100, alignSelf: "flex-end"}} >
                    <Pressable onPress={() => { getCurrentLocation(moveToLocation) }} >
                        <Ionicons name="navigate" size={30} color="gray" />
                    </Pressable>
                </GlassView>
            </DraggableSearchBar>
        </View>
    );
}

