# 🧊 Fridgy  
**Smart fridge companion for iOS** — built with **Expo Router**, **TypeScript**, and **Firebase**  

[![Expo](https://img.shields.io/badge/Built_with-Expo-1C1E24?logo=expo&logoColor=white)](https://expo.dev/)
[![Firebase](https://img.shields.io/badge/Backend-Firebase-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Platform](https://img.shields.io/badge/Platform-iOS-blue?logo=apple&logoColor=white)](https://apps.apple.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

---

## 📱 Overview  
Fridgy helps you keep track of what’s in your fridge, stay ahead of expiration dates, and manage grocery lists — all from your iPhone.  
Designed to make food tracking simple, visual, and effortless.  

> 🧃 **Coming soon to the Apple App Store**

---

## ✨ Features  
- 🧩 **Visual Fridge Layout** — Color-coded sections mimic your real fridge.  
- 🔍 **Barcode Scanning** — Instantly fetch nutrition facts using the FatSecret API.  
- 🔔 **Smart Expiration Reminders** — Never let food go bad again.  
- 📶 **Offline Caching** — View and update your fridge even without internet.  
- 🛒 **Real-Time Grocery Sync** — Drag-and-drop list stays updated across sessions.  

---

## 🏗️ Tech Stack  

| Category | Technology |
|-----------|-------------|
| UI | React Native · Expo Router · NativeWind |
| Backend | Firebase Auth · Cloud Firestore · AsyncStorage |
| APIs | Expo Camera · Expo Notifications · Expo Haptics |
| Integrations | FatSecret API (OAuth 1.0a) |
| Tooling | TypeScript · ESLint · Prettier |

---

## 🧠 Data Model  
```plaintext
users/{uid}
  sections/{sectionId}
    name, color, createdAt
  items/{itemId}
    name, macros, expiresAt, notifId
  groceries/{itemId}
    name, qty, checked, order
🔄 Core App Flows

Auth Bootstrap – Anonymous sign-in for instant access.

Inventory Loading – Firestore listeners keep data live.

Barcode Intake – Scans, fetches nutrition, writes instantly.

Expiry Tracking – Schedules notifications automatically.

Grocery Sync – Real-time cross-session updates.

🗺️ Roadmap

Shared households (multi-user fridge)

Analytics on waste saved & nutrition intake

Web companion with camera scanning

Siri Shortcuts + iOS widgets

📬 Contact

Questions or feedback?
📎 Reach out via LinkedIn
 or open an issue.
