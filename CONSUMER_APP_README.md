# SLR Water Consumer App - React Native/Expo

This is the **Consumer Mobile Application** for the San Lorenzo Ruiz Municipal Water Billing and Payment Record Management System, converted from PWA to React Native/Expo.

## 🎯 Overview

A mobile app for water consumers to:
- View water bills and consumption
- Check payment history
- View and download receipts
- Manage account profile

## 📱 Features Implemented

### ✅ Authentication
- **Login Screen** (`app/login.tsx`)
  - Username/password authentication
  - Clean, modern UI with gradient background
  - Form validation

### ✅ Dashboard (`app/(tabs)/dashboard.tsx`)
- Welcome card with consumer info
- Total amount due display
- Due date with countdown
- Quick stats (consumption, unpaid bills, account status)
- Latest receipt preview
- Receipt actions (Download, Print, View)
- New receipt notification banner

### ✅ Payment History (`app/(tabs)/history.tsx`)
- List of all payment records
- Summary cards (Total Unpaid, Total Paid)
- Payment status indicators (Paid/Unpaid)
- Consumption tracking per bill
- Chronological order

### ✅ Profile (`app/(tabs)/profile.tsx`)
- Consumer account information
- Contact details (email, phone, address)
- Meter number and account details
- Settings menu (Edit Profile, Change Password, Contact Support)
- Logout functionality
- App version info

### ✅ Receipt Modal (`app/receipt-modal.tsx`)
- Full receipt view in Filipino ("Bayarin sa Tubig")
- Official government format
- Consumption breakdown
- Billing details with penalties
- Print functionality
- Modal presentation

## 🏗️ Project Structure

```
app/
├── login.tsx                    # Login screen
├── receipt-modal.tsx            # Receipt detail modal
├── _layout.tsx                  # Root navigation layout
└── (tabs)/
    ├── _layout.tsx              # Tab navigation
    ├── dashboard.tsx            # Main dashboard
    ├── history.tsx              # Payment history
    ├── profile.tsx              # User profile
    ├── index.tsx                # (hidden - old starter)
    └── explore.tsx              # (hidden - old starter)
```

## 🎨 Design System

### Colors
- **Primary**: `#1a73e8` (Blue)
- **Success**: `#10b981` (Green)
- **Danger**: `#dc2626` (Red)
- **Background**: `#f7f7f8`
- **Text**: `#202124`
- **Muted**: `#6b7280`

### Typography
- System fonts (Segoe UI, SF Pro)
- Font weights: 400, 500, 600, 700
- Responsive sizing

### Components
- Cards with rounded corners (8-16px)
- Subtle shadows and borders
- Gradient backgrounds for hero sections
- Emoji icons for visual appeal
- Bottom tab navigation

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Expo CLI
- iOS Simulator (Mac) or Android Emulator

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on platform:
```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

## 📊 Data Model

### Consumer
```typescript
{
  accountNumber: string;      // e.g., "07-11-46-2"
  name: string;               // "Juan Dela Cruz"
  email: string;
  phone: string;
  address: string;
  zone: string;
  meterNumber: string;
  status: 'active' | 'inactive';
}
```

### Payment Record
```typescript
{
  id: string;
  date: string;
  amount: string;
  status: 'paid' | 'unpaid';
  month: string;
  consumption: string;        // in m³
}
```

### Receipt
```typescript
{
  accountNumber: string;
  meterNumber: string;
  readingDate: string;
  consumerName: string;
  address: string;
  currentReading: number;
  previousReading: number;
  consumption: number;
  currentMonthBill: number;
  unpaidBills: number;
  penalties: number;
  totalDue: number;
}
```

## 🔄 Navigation Flow

```
Login Screen
    ↓
Tab Navigator
    ├── Dashboard (default)
    ├── History
    └── Profile
        └── Logout → Login Screen

Dashboard → Receipt Modal (View Receipt)
```

## 🎯 Next Steps / TODO

### Backend Integration
- [ ] Connect to REST API
- [ ] Implement real authentication (JWT)
- [ ] Fetch consumer data from server
- [ ] Sync payment records
- [ ] Real-time receipt updates

### Features to Add
- [ ] Push notifications for new bills
- [ ] Payment gateway integration
- [ ] Offline mode with local storage
- [ ] Receipt PDF generation
- [ ] Share receipt functionality
- [ ] Bill payment reminders
- [ ] Consumption analytics/charts
- [ ] Multi-language support (English/Filipino)

### UI Enhancements
- [ ] Loading states
- [ ] Error handling UI
- [ ] Empty states
- [ ] Skeleton loaders
- [ ] Pull-to-refresh
- [ ] Animations (React Native Reanimated)

### Technical Improvements
- [ ] Add TypeScript types throughout
- [ ] State management (Context API or Redux)
- [ ] Form validation library (React Hook Form)
- [ ] API client (Axios/React Query)
- [ ] Unit tests (Jest)
- [ ] E2E tests (Detox)

## 🔐 Security Considerations

- Implement secure token storage (SecureStore)
- Add biometric authentication
- Encrypt sensitive data
- Implement certificate pinning
- Add input sanitization
- Implement rate limiting on API calls

## 📝 Notes

### Differences from PWA
- Native navigation instead of HTML routing
- React Native components instead of HTML/CSS
- Platform-specific optimizations
- Better performance and UX
- Access to native device features

### Preserved from PWA
- All consumer features
- UI/UX design language
- Color scheme and branding
- Receipt format (Filipino)
- Data structure

## 🤝 Contributing

This is a municipal government project. For contributions or issues, contact the development team.

## 📄 License

Proprietary - San Lorenzo Ruiz Municipal Government

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Platform**: React Native (Expo SDK 54)
