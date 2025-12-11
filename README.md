# 🏥 HealthBridge: Connect

An **Expo-powered React Native** application that helps users find **Federally Qualified Health Centers (FQHCs)** across the United States.  
The app provides an interactive map interface, searchable list of locations, and details on each center without requiring an internet connection.

---

## ✨ Features

- 📍 **Map View** – Explore FQHCs near you or anywhere in the U.S.  
- 🔍 **Search by City** – Quickly find centers by name or city.  
- 🧭 **Location Services** – Automatically center the map on your current location.  
- 💬 **Detailed Info Cards** – View address, phone, and website for each center.  
- ⚡ **Offline Support (optional)** – Cached results for faster repeat lookups.  
- 🌗 **Dark/Light Mode** – Auto-adjusts based on system theme.

---

## 🧱 Tech Stack

| Category | Technology |
|-----------|-------------|
| Framework | [Expo](https://expo.dev/) (React Native) |
| Language | TypeScript / JavaScript |
| Maps | [react-native-maps](https://github.com/react-native-maps/react-native-maps) |
| UI | React Native / Custom components |
| State Management | React Hooks |
| Navigation | Expo Router |

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/bushkabob/fqhc-locator.git
cd fqhc
```

### 2️⃣ Install Dependencies

```bash
npm install
# or
yarn install
```

### 3️⃣ Run the App

Start the Expo development server:

```bash
npx expo start
```

Then scan the QR code with the **Expo Go** app (iOS or Android).

---

## 📂 Project Structure

```
fqhc-locator/
├── app/                  # App entry (Expo Router or App.tsx)
├── components/           # Reusable UI components
├── hooks/                # Custom React hooks (e.g. useLocation)
├── screens/              # App screens (Map, Search, Details)
├── assets/               # Icons, images, etc.
├── data/                 # Static FQHC dataset (optional)
├── package.json
└── README.md
```

---

## 🧭 Usage

1. Allow location permissions when prompted.
2. Pan and zoom the map to explore FQHCs.
3. Tap any marker to view details about that health center.
4. Use the search bar to locate centers by city name.

---

## 🧑‍💻 Development Notes

- Enable **live reload** with `r` in the Expo CLI.
- For debugging, use [React Native Debugger](https://github.com/jhen0409/react-native-debugger) or Flipper.

---

## 📜 License

This project is licensed under the **MIT License**.  
See the [LICENSE](./LICENSE) file for details.

---

## ❤️ Acknowledgments

- [HRSA Data](https://data.hrsa.gov/) for FQHC information  
- [Expo](https://expo.dev/) for cross-platform development  
- [React Native Maps](https://github.com/react-native-maps/react-native-maps) for map integration  

---

> “Improving access to quality care—one map at a time.” 🌍
