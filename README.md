# EnclaveFit PWA

> **Offline-first workout and meal planner with spectacular Enclave-inspired UI**

EnclaveFit is a Progressive Web App (PWA) designed for fitness enthusiasts who want a personalized, offline-capable training and nutrition companion. Built with React, TypeScript, and modern web technologies, it delivers a native-like experience with Enclave-themed aesthetics.

## 🚀 Features

### 🎯 Core Functionality
- **Personalized Training Programs**: AI-driven workout recommendations based on user profile, goals, and strength levels
- **Intelligent Nutrition Planning**: TDEE-based calorie and macro calculations with goal-specific recommendations
- **Offline-First Architecture**: Full functionality without internet connection using IndexedDB and Service Workers
- **Progress Analytics**: Comprehensive tracking with interactive charts and insights
- **Multi-Platform Support**: PWA for web + Android APK via Trusted Web Activity (TWA)

### 🧠 Smart Personalization Engine
- **Strength Assessment**: Uses strength standards and body weight ratios to determine user level
- **BMR/TDEE Calculations**: Mifflin-St Jeor equation with activity multipliers
- **Program Selection**: Automatically chooses between strength, hypertrophy, or fat loss protocols
- **Macro Distribution**: Goal-specific protein/carb/fat ratios (Cut: 40/30/30, Bulk: 25/50/25, Maintain: 30/40/30)

### 📊 Advanced Analytics
- **Weight Progress Tracking**: Time-series charts with trend analysis
- **Strength Progression**: Comparative bar charts for major lifts
- **Calorie Intake Monitoring**: Target vs actual with visual feedback
- **Consistency Metrics**: Workout completion rates and adherence tracking

### 🎨 Enclave-Inspired UI
- **Dark Theme**: Deep space colors (#0b0f14 background, #0f1720 panels)
- **HUD Elements**: Glowing borders, scanline effects, and futuristic styling
- **Animated Interactions**: Smooth transitions with Framer Motion
- **Typography**: Orbitron for headings, Inter for body text
- **Responsive Design**: Mobile-first approach with desktop optimization

## 🏗️ Technology Stack

### Frontend
- **React 19** with TypeScript
- **Vite** for build tooling and HMR
- **Framer Motion** for animations
- **Recharts** for data visualization
- **CSS-in-JS** with component-scoped styling

### Data & Storage
- **IndexedDB** with Dexie.js ORM
- **Service Workers** for offline caching
- **Sync Queue** for deferred online operations
- **PWA Manifest** for installability

### Mobile
- **Trusted Web Activity (TWA)** for Android
- **Custom Tabs** with Enclave branding
- **Adaptive Icons** with flag image

## 📁 Project Structure

```
/offline/                           # PWA Application
├── public/
│   ├── icons/                     # PWA icons (192px, 512px, adaptive)
│   └── manifest.json              # PWA manifest
├── src/
│   ├── components/
│   │   ├── Header.tsx             # App header with branding
│   │   ├── Dashboard.tsx          # Mission control dashboard
│   │   ├── OnboardingWizard.tsx   # Multi-step user setup
│   │   ├── WorkoutPlanner.tsx     # Exercise management
│   │   ├── MealPlanner.tsx        # Nutrition planning
│   │   ├── Graphs.tsx             # Progress analytics
│   │   └── OfflineStatusIndicator.tsx
│   ├── db/
│   │   └── db.ts                  # IndexedDB schema & helpers
│   ├── logic/
│   │   └── evaluation.ts          # Personalization engine
│   ├── App.tsx                    # Main application
│   └── index.tsx                  # Entry point
├── vite.config.ts                 # Build configuration
└── package.json

/android/                          # Android TWA Wrapper
├── app/
│   ├── src/main/
│   │   ├── java/com/enclave/health/
│   │   │   └── MainActivity.java
│   │   ├── res/
│   │   │   ├── mipmap-*/          # App icons (48-192px)
│   │   │   ├── values/
│   │   │   │   ├── strings.xml
│   │   │   │   └── themes.xml     # Enclave color scheme
│   │   │   └── xml/
│   │   └── AndroidManifest.xml
│   └── build.gradle
├── build.gradle
└── settings.gradle
```

## 🚀 Quick Start

### Development Setup

1. **Clone and install dependencies**:
```bash
cd offline
npm install
```

2. **Start development server**:
```bash
npm run dev
```

3. **Build for production**:
```bash
npm run build
```

### PWA Installation

1. **Build the app**: `npm run build`
2. **Serve from `dist/` folder** using any static server
3. **Install prompt** will appear in supported browsers
4. **Add to home screen** on mobile devices

### Android APK Build

1. **Install Android Studio** with SDK 34
2. **Open `/android` project**
3. **Sync Gradle** and resolve dependencies
4. **Build APK**: `Build > Build Bundle(s) / APK(s) > Build APK(s)`

## 🎯 Usage Guide

### First Time Setup

1. **Launch the app** and complete the onboarding wizard
2. **Enter personal details**: Name, age, weight, height, gender
3. **Set fitness goal**: Lose fat, gain muscle, or maintain
4. **Input strength levels**: Current max lifts (optional)
5. **Review personalized plan** and initialize protocol

### Daily Workflow

1. **Dashboard Overview**: Check today's mission and targets
2. **Log Workouts**: Mark exercises complete or add custom ones
3. **Track Nutrition**: Monitor macro intake vs targets
4. **View Progress**: Analyze trends and consistency metrics

### Advanced Features

- **Offline Mode**: Full functionality without internet
- **Custom Workouts**: Add/edit exercises with sets, reps, weights
- **Meal Planning**: Create custom meals with macro calculations
- **Progress Photos**: Visual tracking with IndexedDB storage
- **Data Export**: Sync queue preserves changes for upload

## 🔧 Customization

### Theming
Modify colors in component styles:
```css
--enclave-bg: #0b0f14
--enclave-panel: #0f1720
--enclave-primary: #00b4ff
--enclave-accent: #ff8a00
```

### Personalization Engine
Adjust formulas in `evaluation.ts`:
- **BMR**: Mifflin-St Jeor equation
- **TDEE**: Activity multiplier (default: 1.55)
- **Strength Standards**: Body weight ratios
- **Macro Splits**: Goal-specific percentages

### PWA Configuration
Update `vite.config.ts` for:
- **Cache Strategy**: Network-first vs Cache-first
- **Manifest Settings**: Icons, theme colors, display mode
- **Service Worker**: Custom caching rules

## 📱 Platform Support

| Platform | Status | Installation Method |
|----------|--------|-------------------|
| Chrome (Desktop) | ✅ Full Support | Install button in omnibox |
| Chrome (Android) | ✅ Full Support | Add to Home Screen |
| Safari (iOS) | ✅ Limited Support | Add to Home Screen |
| Firefox | ✅ Full Support | Install from menu |
| Edge | ✅ Full Support | Install from menu |
| Android APK | ✅ Native Feel | TWA wrapper |

## 🏆 Acceptance Criteria ✅

- [x] **PWA Installation**: Installable in Chrome on Android
- [x] **Icon Usage**: Flag image used for all icons (resized appropriately)
- [x] **Personalization**: Onboarding generates custom program and macros
- [x] **Dashboard**: Shows daily workout and nutrition plan
- [x] **Progress Tracking**: Graphs tab displays history-based analytics
- [x] **Offline Functionality**: Add workout offline, persist data, sync when online
- [x] **Android APK**: TWA wrapper builds with adaptive icons
- [x] **UI Excellence**: Spectacular Enclave-themed interface with accessibility
- [x] **Data Persistence**: IndexedDB with sync queue for offline-first architecture

## 🔮 Future Enhancements

- **Wearable Integration**: Apple Watch / Wear OS support
- **Social Features**: Workout sharing and community challenges
- **AI Coaching**: Advanced form analysis and technique feedback
- **Nutrition Scanner**: Barcode scanning for food tracking
- **Biometric Integration**: Heart rate and sleep data incorporation

## 📄 License

MIT License - Built for the Enclave community with ❤️

---

*"In the wasteland of fitness apps, EnclaveFit stands as your technological sanctuary."*