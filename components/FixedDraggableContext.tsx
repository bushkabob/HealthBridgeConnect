// FixedDraggableContext.tsx
import { createContext, useContext } from "react";
import type { SharedValue } from "react-native-reanimated";

type FixedDraggableContextType = {
    progress: SharedValue<number>;
    snapping: SharedValue<boolean>
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
