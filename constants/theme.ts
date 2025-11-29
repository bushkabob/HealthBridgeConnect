/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

// const tintColorLight = '#0a7ea4';
// const tintColorDark = '#fff';

const tintColorLight = "#2f95dc";
const tintColorDark = "#63b3ed";

export const Colors = {
  light: {
    // 🩶 Base text and icons
    text: "#1a1a1a",
    textSecondary: "#7e7e7eff",
    icon: "#5b6470",
    placeholder: "#9ba3af",

    // 🎨 Background hierarchy
    background0: "#ffffff", // pure white base
    background1: "#f9f9fb", // subtle off-white
    background2: "#f1f3f6", // neutral container
    background3: "#e6e9ed", // light gray surface
    background4: "#dde1e7", // mid-gray for panels
    background5: "#cfd4db", // muted backdrop
    background: "#f9f9fb", // alias for convenience
    backgroundAlt: "#f1f3f6",

    // 🧾 Card hierarchy
    card0: "#ffffff", // main elevated cards
    card1: "#f8f9fb", // lighter panel
    card2: "#eef1f5", // section divider
    card3: "#e2e6eb", // subdued container
    card: "#ffffff",
    cardAlt: "#f5f7fa",
    border: "#d7dce3",
    shadow: "rgba(0,0,0,0.05)",

    // 💠 Accent colors
    tint: tintColorLight,
    accent: "#0078d7",
    accentAlt: "#5aa9e6",
    accentMuted: "#cce7fb",
    accentHover: "#3ea0f2",

    // 🌈 Semantic colors
    success: "#2ecc71",
    warning: "#f39c12",
    error: "#e74c3c",
    info: "#3498db",

    // 🗺️ Map / marker palette
    mapMarkerPrimaryFill: "#2f95dc",
    mapMarkerPrimaryBorder: "#ffffff",
    mapMarkerSecondaryFill: "#30c67c",
    mapMarkerSecondaryBorder: "#eaf8f0",
    mapMarkerHighlightFill: "#ffb100",
    mapMarkerHighlightBorder: "#fff7e6",
    mapRegionBorder: "#0078d7",

    // 🧭 UI elements
    tabIconDefault: "#8c97a2",
    tabIconSelected: tintColorLight,
  },

  dark: {
    // 🩶 Base text and icons
    text: "#e6e8eb",
    textSecondary: "#a5acb3",
    icon: "#a0a6ad",
    placeholder: "#6b7280",

    // 🎨 Background hierarchy
    background0: "#0d0f10", // pure black-ish
    background1: "#101214", // app background
    background2: "#1a1d20", // card container
    background3: "#22262b", // elevated surface
    background4: "#2a2e33", // secondary panel
    background5: "#353a40", // tertiary tone
    background: "#101214",
    backgroundAlt: "#1a1d20",

    // 🧾 Card hierarchy
    card0: "#1e2125", // default surface
    card1: "#2a2e33", // slightly raised
    card2: "#33373d", // dim container
    card3: "#3e4349", // muted background block
    card: "#1e2125",
    cardAlt: "#2a2e33",
    border: "#30363d",
    shadow: "rgba(0,0,0,0.6)",

    // 💠 Accent colors
    tint: tintColorDark,
    accent: "#63b3ed",
    accentAlt: "#4fa3e0",
    accentMuted: "#284560",
    accentHover: "#7ec9ff",

    // 🌈 Semantic colors
    success: "#27ae60",
    warning: "#f1c40f",
    error: "#e74c3c",
    info: "#3498db",

    // 🗺️ Map / marker palette
    mapMarkerPrimaryFill: "#63b3ed",
    mapMarkerPrimaryBorder: "#101214",
    mapMarkerSecondaryFill: "#30c67c",
    mapMarkerSecondaryBorder: "#1a1d20",
    mapMarkerHighlightFill: "#ffb100",
    mapMarkerHighlightBorder: "#292b2e",
    mapRegionBorder: "#63b3ed",

    // 🧭 UI elements
    tabIconDefault: "#9ca3af",
    tabIconSelected: tintColorDark,
  },
};


export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    serif: "Georgia, 'Times New Roman', serif",
    rounded: "'SF Pro Rounded', 'Hiragino Maru Gothic ProN', Meiryo, 'MS PGothic', sans-serif",
    mono: "SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
  },
});
