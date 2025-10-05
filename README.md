Fridgy

Fridgy is a smart fridge companion for iOS built with Expo Router, TypeScript, and Firebase.
It helps you track what’s in your fridge, monitor expiration dates, and manage grocery lists—all in one place.

🧊 Coming soon to the Apple App Store

Features

Visual fridge layout — Items are shown in color-coded sections, making the digital view feel like opening a real fridge.

Barcode scanning — Instantly fetches nutrition facts using the FatSecret API and saves them to Firestore.

Offline caching — AsyncStorage ensures your fridge loads instantly even without network access.

Expiration reminders — Local notifications alert you before items spoil.

Smart grocery list — Drag-and-drop interface synced across devices in real time.

Tech Overview
Category	Stack
UI	React Native + Expo Router + NativeWind
Data	Firebase Auth + Cloud Firestore + AsyncStorage
APIs	Expo Camera, Expo Notifications, Expo Haptics
Integrations	FatSecret API (OAuth 1.0a) for nutrition lookup
Tooling	TypeScript, ESLint, Prettier
Data Structure
users/{uid}
  sections/{sectionId}
    name, color, createdAt
  items/{itemId}
    name, macros, expiresAt, notifId
  groceries/{itemId}
    name, qty, checked, order

Core Flows

Auth bootstrap — Anonymous sign-in ensures a frictionless first-run experience.

Inventory loading — Seeds starter sections and stays live via Firestore listeners.

Barcode intake — Scans, fetches nutrition data, and saves it instantly.

Expiry tracking — Schedules reminders for upcoming expirations.

Grocery sync — Real-time updates across sessions with Firestore listeners.

Roadmap

Household sharing so multiple users can manage one fridge

In-app analytics for waste reduction and nutrition stats

Web companion with camera scanning

Optional widget and Siri shortcuts integration

Contact

For questions or feedback, reach out on LinkedIn
 or open an issue here.
Thanks for checking out Fridgy.
