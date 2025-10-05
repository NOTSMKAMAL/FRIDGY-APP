 Fridgy

A cross-platform (iOS, Android, and web) smart fridge companion built with Expo Router, TypeScript, and Firebase. Fridgy helps households keep an eye on what is inside the fridge, stay ahead of expiration dates, and build smarter grocery lists.

## What Makes It Stand Out
- Inventory is modeled as color-coded sections so the digital view feels like opening the real fridge (`app/(app)/fridge.tsx`).
- Barcode scanning pulls nutrition facts from FatSecret in seconds and stores the item in Firestore (`app/(app)/camera.tsx`, `API/fatsecret.ts`).
- Offline-first caching with AsyncStorage paints the UI instantly and reconciles with Firestore when the network is back.
- Expiration reminders are scheduled with Expo Notifications so nothing spoils unnoticed (`app/(app)/sections/id.tsx`).
- Drag-and-drop grocery list keeps shopping in sync across devices with real-time updates from Firestore (`app/(app)/List.tsx`).

## Architecture Snapshot
| Concern | Implementation |
| --- | --- |
| UI | React Native + Expo Router, NativeWind styling, Expo vector icons |
| State & Data | Firebase Auth (email, Google, anonymous), Cloud Firestore, React hooks with AsyncStorage hydration |
| Device APIs | Expo Camera for barcode capture, Expo Notifications, Expo Haptics, Expo Blur/Image |
| Integrations | FatSecret REST API (OAuth 1.0a) for nutrition lookup |
| Tooling | TypeScript, ESLint + Expo config, Prettier, Metro bundler |

### Data shape
```
users/{uid}
  sections/{sectionId}
    name, color, createdAt
  items/{itemId}
    name, macros, expiresAt, notifId
  groceries/{itemId}
    name, qty, checked, order
```

### Key flows
1. **Auth bootstrap** - `FirebaseConfig.ts` ensures a singleton app and anonymous fallback so first-run users get a working experience without sign-up friction.
2. **Inventory loading** - `app/(app)/fridge.tsx` seeds starter sections, hydrates from AsyncStorage, then live-updates via Firestore listeners.
3. **Barcode intake** - `app/(app)/camera.tsx` debounces camera detections, calls `findFoodIdByBarcode`, and writes both nutrition and section metadata back to Firestore (and local cache) with write batching.
4. **Expiry tracking** - `app/(app)/sections/id.tsx` allows manual edits and schedules per-item notifications at 9 AM local time.

## Getting Started
1. **Install dependencies**
   ```bash
   npm install
   ```
2. **Create environment file** - copy `.env` and fill in your own FatSecret keys (do not commit real secrets).
   ```bash
   # macOS/Linux
   cp .env .env.local
   # Windows (PowerShell)
   Copy-Item .env .env.local
   ```
3. **Configure Firebase** - update `FirebaseConfig.ts` with your project settings (current values match the demo instance).
4. **Start the app**
   ```bash
   npm run start
   ```
   Choose the platform (iOS simulator, Android emulator, or web) from the Expo CLI.

## Developer Tooling
- `npm run lint` - ESLint via Expo config (React + TypeScript rules).
- `npm run lint:fix` - auto-fix lint issues.
- `npm run format` - Prettier across the repo.
- `npm run reset-project` - convenience script to clear caches if Metro misbehaves.

## Notable Screens (quick links for reviewers)
- Authentication with animated gradients and Google Sign-In: `app/(auth)/login.tsx`, `app/(auth)/signup.tsx`.
- Fridge overview and section management: `app/(app)/fridge.tsx`.
- Detailed section with nutrition editing and expiry scheduling: `app/(app)/sections/id.tsx`.
- Camera scanner with FatSecret integration: `app/(app)/camera.tsx`.
- Collaborative grocery list with drag-and-drop ordering: `app/(app)/List.tsx`.
- Settings and profile management: `app/(app)/settings.tsx`, `app/components/profile.tsx`.

## Roadmap
- Add automated tests (unit and end-to-end) around data flows and notification scheduling.
- Surface analytics on waste saved, protein intake, and shopping cadence.
- Ship a web barcode scanning fallback using device camera access.
- Introduce shared households so multiple accounts manage one fridge.

## Contact
Questions or feedback? Reach out on LinkedIn or file an issue. Thanks for taking a look!

