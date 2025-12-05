# SLR Water - Meter Reader App 💧

A React Native mobile application for meter readers to record water consumption for San Lorenzo Ruiz Municipal Water Billing System.

## Overview

This app is specifically designed for **Meter Readers** to:
- Record water meter readings in the field
- Track daily progress and assigned zones
- Manage consumer records
- Generate and print reading receipts
- Sync data with the central system
- Work offline with local data storage

## Features

### 📊 Dashboard
- Real-time progress tracking (readings completed vs. assigned)
- Zone assignment overview
- Recent activity feed
- Completion statistics

### ✍️ Meter Entry
- Quick meter reading input
- Automatic consumption calculation
- Exception reporting (locked meters, damaged meters, etc.)
- Photo attachment support
- Notes and observations
- Receipt generation and printing

### 👥 Consumer Records
- Searchable consumer database
- Filter by zone and status
- View consumer details
- Reading history

### 👤 Profile
- Personal information management
- Device and sync status
- Connection monitoring
- Password management
- Local data management

## Installation

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npx expo start
   ```

3. Run on your device:
   - **Android**: Press `a` or scan QR code with Expo Go
   - **iOS**: Press `i` or scan QR code with Expo Go
   - **Web**: Press `w` (limited functionality)

## Project Structure

```
mobsapp/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx       # Dashboard screen
│   │   ├── entry.tsx       # Meter reading entry
│   │   ├── consumers.tsx   # Consumer records
│   │   ├── profile.tsx     # Profile & settings
│   │   └── _layout.tsx     # Tab navigation
│   └── _layout.tsx         # Root layout
├── components/             # Reusable components
├── types/                  # TypeScript type definitions
├── utils/
│   └── storage.ts         # AsyncStorage utilities
├── constants/             # App constants & theme
└── assets/               # Images and static files
```

## Technology Stack

- **Framework**: Expo SDK 54 + React Native 0.81.5
- **Language**: TypeScript 5.9.2
- **Navigation**: Expo Router (file-based)
- **Storage**: AsyncStorage
- **Network**: NetInfo
- **UI**: React Native core components
- **Styling**: StyleSheet API

## Key Dependencies

- `expo-linear-gradient` - Gradient backgrounds
- `@react-native-async-storage/async-storage` - Local data storage
- `@react-native-community/netinfo` - Network connectivity
- `expo-device` - Device information
- `expo-router` - File-based navigation
- `react-native-reanimated` - Animations

## Data Storage

The app uses AsyncStorage for offline-first functionality:
- **Readings**: Stored locally until synced
- **Consumer data**: Cached for offline access
- **Profile**: User preferences and settings
- **Sync status**: Last sync timestamp

## Offline Support

The app works fully offline:
- ✅ Record readings without internet
- ✅ View consumer records
- ✅ Generate receipts
- ✅ Auto-sync when connection restored

## Building for Production

### Android (APK)
```bash
eas build --platform android --profile preview
```

### iOS
```bash
eas build --platform ios --profile preview
```

## Related Apps

This is part of the **SLR Water Billing System**:
- **Meter Reader App** (this app) - For field meter reading
- **Consumer App** (separate) - For consumers to view bills and payment history
- **Web Dashboard** (PWA in `/mob app/`) - Administrative interface

## License

Developed for San Lorenzo Ruiz Municipal Water Billing System.

## Support

For issues or questions, contact the system administrator.
