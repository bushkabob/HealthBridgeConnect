// FixedDraggableContext.tsx
import { HeightUpdateFunction } from "@/types/types";
import { createContext, useContext } from "react";
import { NativeGesture } from "react-native-gesture-handler";
import type { ScrollHandlerProcessed, SharedValue } from "react-native-reanimated";

type FixedDraggableContextType = {
    progress: SharedValue<number>;
    snapping: SharedValue<boolean>;
    scrollY: SharedValue<number>;
    setViewHeight: HeightUpdateFunction;
    scrollHandler?: ScrollHandlerProcessed<Record<string, unknown>>
    gesture: NativeGesture
};

const FixedDraggableContext = createContext<FixedDraggableContextType | null>(null);

export const useFixedDraggable = () => {
    const ctx = useContext(FixedDraggableContext);
    if (!ctx)
        throw new Error(
            "useFixedDraggable must be used within a FixedDraggableProvider"
        );
    return ctx;
};

export const FixedDraggableProvider = FixedDraggableContext.Provider;
