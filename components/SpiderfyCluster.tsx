import { Center } from "@/hooks/useSuperCluster";
import { FQHCSite } from "@/types/types";
import React, { useEffect } from "react";
import {
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from "react-native-reanimated";
import { runOnJS } from "react-native-worklets";
import CenterMarker from "./CenterMarker";
import ClusterMarker from "./ClusterMarker";

type Props = {
    origin: { latitude: number; longitude: number };
    items: Center[];
    radius: number;
    duration: number;
    expanded: boolean;
    onPress: () => void;
    onPressCenter: (center: FQHCSite) => void;
    selected?: string;
    mustClose: boolean
    postMustClose: () => void;
};

export const determineDeltas = (
    numberOfItems: number,
    index: number,
    originLat: number,
    radius: number
) => {
    const angleStep = (2 * Math.PI) / numberOfItems;
    const earthMetersPerDegreeLat = 111_320;

    const angle = index * angleStep;
    const deltaLat = (radius * Math.sin(angle)) / earthMetersPerDegreeLat;
    const deltaLon =
        (radius * Math.cos(angle)) /
        (earthMetersPerDegreeLat * Math.cos((originLat * Math.PI) / 180));
    return { deltaLat: deltaLat, deltaLon: deltaLon };
};

export default function SpiderfyCluster(props: Props) {
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
            progress: useSharedValue(0),
        };
    });

    // Spiral animation
    useEffect(() => {
        animatedPoints.forEach((p, index) => {
            p.progress.value = withTiming(props.expanded && !props.mustClose ? 1 : 0, {
                duration: props.duration,
            }, () => {if(props.mustClose){runOnJS(props.postMustClose)()}});
        });
    }, [props.expanded, props.mustClose]);

    return (
        <>
            <ClusterMarker
                onPress={props.onPress}
                key="cluster-center"
                coordinate={props.origin}
                count={props.items.length}
                id={"cluster-center"}
                isSpiderfied={props.expanded}
            />

            {animatedPoints.map((p) => {
                const maxRotation = (120 * Math.PI) / 180; // 120° in radians

                const animatedProps = useAnimatedProps(() => {
                    const t = p.progress.value;
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

                const animatedStyle = useAnimatedStyle(() => {
                    return {
                        opacity: p.progress.value,
                    };
                });

                return (
                    <CenterMarker
                        id={p.item.center["BPHC Assigned Number"]}
                        iconName={p.item.center["Health Center Location Type Description"] === "Mobile Van" ? "car" : "medical"}
                        onPress={() => props.onPressCenter(p.item.center)}
                        selected={p.id === props.selected}
                        key={p.id}
                        animateProps={animatedProps}
                        coordinate={p.item.coordinate}
                        animatedStyle={animatedStyle}
                    />
                );
            })}
        </>
    );
}
