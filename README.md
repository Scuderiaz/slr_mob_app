# San Lorenzo Ruiz Municipal Water Billing System 💧

A mobile application for meter readers to collect water consumption data for San Lorenzo Ruiz Municipal Government.

## 🏗️ System Architecture

This system focuses on **field data collection** with:

### 📱 **Meter Reader Mobile App**
- React Native app for field meter reading and data collection
- Offline-first architecture with sync capabilities
- Receipt generation and printing
- Photo documentation support
- Zone-based consumer management

## 🚀 Quick Start

### Meter Reader Mobile App
```bash
cd meter-reader-app
npm install
npx expo start
```

## 📁 Project Structure

```
slr_mobile_apps/
├── meter-reader-app/          # Mobile app for meter readers
│   ├── .vscode/              # VS Code settings
│   ├── shared/               # App-specific shared services
│   ├── app/                  # React Native app code
│   ├── utils/                # Utility functions
│   ├── types/                # TypeScript definitions
│   └── package.json          # App dependencies
├── docs/                     # All project documentation
│   ├── METER_READER_*.md     # Meter reader specific docs
│   └── *.md                  # General project docs
├── mob app/                  # Legacy PWA (reference)
└── water_billing_system.sql  # Database schema
```

## 🗄️ Database

- **MySQL** production database
- **SQLite** local storage for mobile app
- **Offline-first** data collection
- **Sync capabilities** between mobile and server

## 🔧 Technology Stack

- **Mobile**: React Native + Expo SDK 54
- **Database**: MySQL + SQLite
- **Language**: TypeScript
- **Storage**: AsyncStorage + SQLite

## 👥 User Role

**Meter Reader** - Field data collection, meter reading, receipt generation, photo documentation

## 📄 License

Proprietary - San Lorenzo Ruiz Municipal Government

---

**Version**: 2.0.0  
**Last Updated**: November 2025  
**Platform**: React Native Mobile App
