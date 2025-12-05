# Quick Start Guide - Meter Reader App

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- Expo Go app on your mobile device ([Android](https://play.google.com/store/apps/details?id=host.exp.exponent) | [iOS](https://apps.apple.com/app/expo-go/id982107779))
- Code editor (VS Code recommended)

### Installation

1. **Navigate to project directory:**
   ```bash
   cd mobsapp
   ```

2. **Install dependencies** (if not already done):
   ```bash
   npm install
   ```

3. **Start the development server:**
   ```bash
   npm start
   ```
   Or:
   ```bash
   npx expo start
   ```

4. **Run on your device:**
   - Open Expo Go app on your phone
   - Scan the QR code displayed in terminal
   - Wait for the app to load

## 📱 App Overview

### Main Screens

#### 1. Dashboard (Home)
- Shows today's reading progress (36/45 meters read)
- Displays assigned zone information
- Recent activity feed
- Quick stats: remaining, flagged readings

#### 2. Entry
- Input meter readings for consumers
- Automatic consumption calculation
- Add exceptions (locked meter, damaged, etc.)
- Add notes and photos
- Save and print receipts

#### 3. Consumers
- View all assigned consumers
- Search by name or account number
- Filter by zone
- View consumer details
- Check reading status

#### 4. Profile
- Personal information
- Device and sync status
- Connection monitoring
- Change password
- Clear local data
- Logout

## 🎯 Key Features

### Offline-First Design
- All readings saved locally
- Works without internet connection
- Auto-sync when connection restored
- View cached consumer data offline

### Data Storage
- Uses AsyncStorage for local persistence
- Readings stored until synced
- Profile and preferences saved locally

### Network Awareness
- Connection status indicator
- Sync button enabled only when online
- Offline mode notification

## 🔧 Development

### Project Structure
```
app/(tabs)/
├── index.tsx      - Dashboard screen
├── entry.tsx      - Meter reading entry
├── consumers.tsx  - Consumer records
├── profile.tsx    - Profile & settings
└── _layout.tsx    - Tab navigation config

types/
└── index.ts       - TypeScript definitions

utils/
└── storage.ts     - AsyncStorage utilities
```

### Key Files
- **app.json** - App configuration
- **package.json** - Dependencies
- **tsconfig.json** - TypeScript config

## 📝 Usage Tips

### Recording Readings
1. Go to **Entry** tab
2. Find consumer in list
3. Enter current meter reading
4. Consumption auto-calculates
5. Add exception if needed
6. Save reading
7. Print receipt if required

### Viewing Progress
- Dashboard shows real-time progress
- Green = completed
- Orange = pending
- Red = flagged/issues

### Syncing Data
1. Go to **Profile** tab
2. Check connection status
3. Tap **Sync Now** button
4. Wait for confirmation
5. All local readings uploaded

### Managing Data
- Clear local data from Profile > Actions
- Logout to switch users
- Change password in Security section

## 🐛 Troubleshooting

### App won't start
```bash
# Clear cache and restart
npx expo start -c
```

### Dependencies issues
```bash
# Reinstall dependencies
rm -rf node_modules
npm install
```

### TypeScript errors
```bash
# Check types
npx tsc --noEmit
```

## 📦 Building for Production

### Android APK
```bash
# Install EAS CLI
npm install -g eas-cli

# Build APK
eas build --platform android --profile preview
```

### iOS
```bash
eas build --platform ios --profile preview
```

## 🔐 Security Notes

- Passwords stored securely
- Local data encrypted
- Sync requires authentication
- Logout clears sensitive data

## 📞 Support

For technical support or issues:
- Contact system administrator
- Check app logs in Profile > Device Info
- Report sync issues immediately

## 🎨 Customization

### Colors
Primary: `#1a73e8` (Blue)
Success: `#4caf50` (Green)
Warning: `#ff9800` (Orange)
Danger: `#f44336` (Red)

### Fonts
- System default (Segoe UI on Windows)
- Font weights: 400, 600, 700, 800

## 📚 Additional Resources

- [Expo Documentation](https://docs.expo.dev/)
- [React Native Docs](https://reactnative.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Developed for**: San Lorenzo Ruiz Municipal Water Billing System
