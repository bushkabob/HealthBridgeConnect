# 🏥 HealthBridge: Connect

HealthBridge: Connect helps people quickly identify nearby Federally Qualified Health Centers (FQHCs), making it easier to find trusted, affordable healthcare options. Many individuals struggle to understand where to go for primary or preventive care, and this app simplifies that process by providing clear, accessible information.

HealthBridge: Connect is currently in **beta testing**, and user feedback continues to guide improvements. If you are interested in participating in this and helping to shape the future of HealthBridge: Connect please reach out to [connect@healthbridgelabs.com](mailto:connect@healthbridgelabs.com?subject=HealthBridge%20Feedback).

**In line with our mission to promote transparency in healthcare access, HealthBridge: Connect is open-source.** If you’d like to explore the app or try features outside the current beta, setup instructions are included below (alongside the current tech stack used by the app).

We also welcome feature suggestions, whether they improve usability, expand access, or strengthen clarity. Feel free to share ideas by contacting us directly using the above email.

## ✨ Features

* 📍 **Map View** – Explore FQHCs near you or anywhere in the U.S.
* 🔍 **Search by City** – Quickly find centers by name or city.
* 🧭 **Location Services** – Automatically center the map on your current location.
* 💬 **Detailed Info Cards** – View address, phone, and website for each center.
* ⚡ **Offline Support** – Cached results for faster repeat lookups.
* 🌗 **Dark/Light Mode** – Auto-adjusts based on system theme.

---

# Technology & Development Details

## 🚀 Getting Started (Outside Current Beta)

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

## 🧱 Tech Stack

| Category         | Technology                       |
| ---------------- | -------------------------------- |
| Framework        | Expo (React Native)              |
| Language         | TypeScript / JavaScript          |
| Maps             | react-native-maps                |
| UI               | React Native / Custom components |
| State Management | React Hooks                      |
| Navigation       | Expo Router                      |

---

## 🧑‍💻 Development Notes

* Enable **live reload** with `r` in the Expo CLI.
* For debugging, use React Native Debugger or Flipper.

---

## 📜 License

This project is licensed under the **MIT License**.
See the LICENSE file for details.

---

## ❤️ Acknowledgments

* HRSA Data for FQHC information
* CMS for insurance enrollment information
* Expo for cross-platform development
* React Native Maps for map integration

---

> “Improving access to quality care-one map at a time.” 🌍
