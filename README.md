# Cheche POS

A production-ready Point of Sale mobile app built with **Expo SDK 56**, **React Native**, and **TypeScript**. Designed for iOS with a clean, premium business UI using the Cheche brand (`#E30074`).

## Features

- **Authentication** — Login, registration flow, biometric login (Face ID / Touch ID)
- **Dashboard** — Sales stats, charts, top products, low stock alerts
- **Sell (POS)** — Barcode scanner, product search, cart, checkout
- **Products** — Browse, search, filter by category, product detail modal
- **History** — Sales history with filters and transaction details
- **Profile / More** — Business profile, settings menu, logout
- **Receipts** — Print and share receipts after checkout

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Expo SDK 56, React Native 0.85 |
| Navigation | Expo Router (file-based) |
| State | Zustand (cart, auth) |
| Server state | TanStack React Query |
| Styling | NativeWind / Tailwind + theme tokens |
| Forms | React Hook Form + Zod |
| Icons | Lucide React Native |

## Getting Started

```bash
npm install
npx expo start
```

Press `i` for iOS Simulator or scan the QR code with a development build.

> **Note:** Expo Go for SDK 56 may not be available on the App Store. Use a [development build](https://docs.expo.dev/develop/development-builds/introduction/) for full native feature support.

## Project Structure

```
src/
├── app/                  # Expo Router screens
│   ├── (auth)/           # Login, registration
│   ├── (tabs)/           # Main tab navigation
│   ├── checkout.tsx      # Payment flow
│   └── cart.tsx          # Cart review
├── components/ui/        # Reusable UI components
├── data/                 # Static config (business types, banks, etc.)
├── features/auth/        # Auth schemas & validation
├── hooks/                # React Query hooks
├── services/             # API-ready service layer
├── store/                # Zustand stores
├── constants/theme.ts    # Design tokens
└── types/                # TypeScript types
```

## API Integration

Data is loaded from the Cheche POS API via `src/services/` and React Query hooks in `src/hooks/`:

| Service | File | Endpoints |
|---------|------|-----------|
| Auth | `services/authService.ts` | Auth service login, password, sessions |
| Products | `services/productService.ts` | `GET /inventory/products`, barcode search |
| POS | `services/posService.ts` | `POST /pos/direct-orders`, payment methods |
| Dashboard | `services/dashboardService.ts` | Invoices, inventory stats |

## Brand

- **App name:** Cheche POS
- **Primary color:** `#E30074`
- **Style:** iOS-native, clean white interface, rounded cards, magenta accents

## Scripts

```bash
npm start       # Start Expo dev server
npm run ios     # Open iOS simulator
npm run android # Open Android emulator
```
