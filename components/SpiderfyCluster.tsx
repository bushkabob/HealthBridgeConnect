import { Center } from "@/hooks/useSuperCluster";
import React, { useEffect, useState } from "react";
import {
    useAnimatedProps,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import CenterMarker from "./CenterMarker";
import ClusterMarker from "./ClusterMarker";

type Props = {
    origin: { latitude: number; longitude: number };
    items: Center[];
    radius: number; // meters
    duration: number;
    expanded: boolean;
    onPress: Function;
    selected?: string;
    onCollapseEnd?: () => void;
};

export const determineDeltas = (numberOfItems: number, index: number, originLat: number, radius: number) => {
    console.log(numberOfItems,index,  originLat, radius)
    const angleStep = (2 * Math.PI) / numberOfItems;
    const earthMetersPerDegreeLat = 111_320; // ~ meters per 1 lat degree

    const angle = index * angleStep;
    // convert meter radius → degree offset
    const deltaLat =
        (radius * Math.sin(angle)) / earthMetersPerDegreeLat;
    const deltaLon =
        (radius * Math.cos(angle)) /
        (earthMetersPerDegreeLat *
            Math.cos((originLat * Math.PI) / 180));
    return { deltaLat: deltaLat, deltaLon: deltaLon }
};

export default function SpiderfyCluster(props: Props) {
    const [expanded, setExpanded] = useState(true);

    const animatedPoints = props.items.map((item, index) => {
        const { deltaLat, deltaLon } = determineDeltas(props.items.length, index, props.origin.latitude, props.radius)

        return {
            id: item.id,
            item,
            lat: useSharedValue(props.origin.latitude),
            lon: useSharedValue(props.origin.longitude),
            targetLat: props.origin.latitude + deltaLat,
            targetLon: props.origin.longitude + deltaLon,
        };
    });

    // Animate expand/collapse
    useEffect(() => {
        animatedPoints.forEach((p, index) => {
            p.lat.value = withTiming(
                expanded ? p.targetLat : props.origin.latitude,
                { duration: props.duration }
            );
            p.lon.value = withTiming(
                expanded ? p.targetLon : props.origin.longitude,
                { duration: props.duration }
            );
        });
        !expanded &&
            setTimeout(
                props.onCollapseEnd ? props.onCollapseEnd : () => {},
                props.duration
            );
    }, [expanded]);

    return (
        <>
            <ClusterMarker
                onPress={() => {
                    console.log("closing");
                    props.onPress(undefined);
                    setExpanded(false);
                }}
                key="cluster-center"
                coordinate={props.origin}
                count={0}
                id={"cluster-center"}
                isSpiderfied={true}
            />

            {animatedPoints.map((p) => {
                const animatedProps = useAnimatedProps(() => ({
                    coordinate: {
                        latitude: p.lat.value,
                        longitude: p.lon.value,
                    },
                }));

                return (
                    <CenterMarker
                        center={p.item.center}
                        onPress={() => props.onPress(p.item.center)}
                        selected={p.id === props.selected}
                        key={p.id}
                        animateProps={animatedProps}
                        coordinate={p.item.coordinate}
                    />
                );
            })}
        </>
    );
}
