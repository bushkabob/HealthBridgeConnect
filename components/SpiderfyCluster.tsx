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
    radius: number;
    duration: number;
    expanded: boolean;
    onPress: Function;
    selected?: string;
    onCollapseEnd?: () => void;
};

export const determineDeltas = (
    numberOfItems: number,
    index: number,
    originLat: number,
    radius: number
) => {
    console.log(numberOfItems, index, originLat, radius);
    const angleStep = (2 * Math.PI) / numberOfItems;
    const earthMetersPerDegreeLat = 111_320; // ~ meters per 1 lat degree

    const angle = index * angleStep;
    // convert meter radius → degree offset
    const deltaLat = (radius * Math.sin(angle)) / earthMetersPerDegreeLat;
    const deltaLon =
        (radius * Math.cos(angle)) /
        (earthMetersPerDegreeLat * Math.cos((originLat * Math.PI) / 180));
    return { deltaLat: deltaLat, deltaLon: deltaLon };
};

export default function SpiderfyCluster(props: Props) {
    const [expanded, setExpanded] = useState(true);

    const animatedPoints = props.items.map((item, index) => {
        const { deltaLat, deltaLon } = determineDeltas(
            props.items.length,
            index,
            props.origin.latitude,
            props.radius
        );

        return {
            id: item.id,
            item,
            baseAngle: index * ((2 * Math.PI) / props.items.length),
            targetLat: props.origin.latitude + deltaLat,
            targetLon: props.origin.longitude + deltaLon,
            progress: useSharedValue(0), // 0 → 1 controls spiral
        };
    });

    // Spiral animation
    useEffect(() => {
        animatedPoints.forEach((p, index) => {
            p.progress.value = withTiming(expanded ? 1 : 0, {
                duration: props.duration,
            });
        });

        if (!expanded) {
            setTimeout(props.onCollapseEnd ?? (() => {}), props.duration);
        }
    }, [expanded]);

    return (
        <>
            <ClusterMarker
                onPress={() => {
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
                const maxRotation = (120 * Math.PI) / 180; // 120° in radians

                const animatedProps = useAnimatedProps(() => {
                    const t = p.progress.value; // 0 → 1

                    // spiral reduces as t → 1
                    const spiralAngle = maxRotation * (1 - t);

                    // linear interpolation to target delta
                    const latDelta = p.targetLat - props.origin.latitude;
                    const lonDelta = p.targetLon - props.origin.longitude;

                    // apply spiral rotation
                    const rotatedLat =
                        latDelta * Math.cos(spiralAngle) -
                        lonDelta * Math.sin(spiralAngle);
                    const rotatedLon =
                        latDelta * Math.sin(spiralAngle) +
                        lonDelta * Math.cos(spiralAngle);

                    return {
                        coordinate: {
                            latitude: props.origin.latitude + rotatedLat * t,
                            longitude: props.origin.longitude + rotatedLon * t,
                        },
                    };
                });

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
