# Customer Mobile App — Project Structure

## Overview

**App Name:** MyMobileApp
**Framework:** React Native 0.83.1 (React 19)
**Language:** TypeScript
**State Management:** Redux Toolkit
**Navigation:** React Navigation (native-stack + bottom-tabs)
**Entry Point:** `index.js` → `App.tsx`

Customers use this app to submit car repair requests, view mechanic bids on a map, make Stripe payments, and book appointments.

---

## Root-Level Configuration Files

| File | Purpose |
|------|---------|
| `package.json` | Dependencies and scripts (android, ios, start, test, lint) |
| `app.json` | App name registration + Expo/Stripe config |
| `index.js` | RN entry point — imports mapbox config, registers App |
| `App.tsx` | Root component — Redux Provider, StripeProvider, SafeAreaProvider, AppNavigator |
| `tsconfig.json` | TypeScript config (extends @react-native) |
| `babel.config.js` | Babel — react-native-dotenv plugin, reanimated plugin |
| `metro.config.js` | Metro bundler configuration |
| `jest.config.js` | Jest test runner config |
| `.env.example` | Template: API_BASE_URL, STRIPE_PUBLISHABLE_KEY, MAPBOX_TOKEN, LOGIN_IMAGE_URL |
| `.eslintrc.js` | ESLint config |
| `.prettierrc.js` | Prettier formatting rules |
| `.watchmanconfig` | Watchman config (empty/default) |
| `.gitignore` | Git ignore rules |
| `Gemfile` | Ruby deps for iOS CocoaPods |

---

## `src/config/` — Configuration

| File | Purpose |
|------|---------|
| `env.ts` | Reads env vars from `@env` module, exports typed `ENV` object |
| `mapbox.ts` | Initializes Mapbox SDK with token, disables telemetry |
| `stripe.ts` | Exports `STRIPE_CONFIG` with publishable key |

---

## `src/api/` — API Layer

| File | Purpose |
|------|---------|
| `apiClient.ts` | Axios instance — attaches Bearer token, clears session on 401 |
| `profile.ts` | Profile API: getProfile(), updateProfile() |
| `notifications.ts` | Notifications API: getAll(), markAsRead(), markAllAsRead() |
| `payment.ts` | Payment API (30s timeout): processPayment(), getPaymentStatus(), updatePaymentStatus() |

### `src/api/services/`

| File | Purpose |
|------|---------|
| `geoApi.ts` | Address validation (backend), reverse geocode & search (Mapbox direct) |

---

## `src/store/` — Redux State Management

| File | Purpose |
|------|---------|
| `index.ts` | Store config with 5 slices: auth, requests, payment, profile, notifications |
| `hooks.ts` | Typed useAppDispatch and useAppSelector |

### `src/store/slices/`

| File | Purpose |
|------|---------|
| `authSlice.ts` | Auth state — loadUser, loginUser, registerUser, sendOtp, logoutUser. Persists to AsyncStorage |
| `requestSlice.ts` | Request state — fetchRequests, fetchRequestById |
| `paymentSlice.ts` | Payment state — processPaymentThunk, getPaymentStatusThunk, updatePaymentStatusThunk |
| `profileSlice.ts` | Profile state — fetchProfile, updateProfile |
| `notificationSlice.ts` | Notification state — fetchNotifications, markAsRead, markAllAsRead |

---

## `src/navigation/` — Navigation Structure

| File | Purpose |
|------|---------|
| `types.ts` | TypeScript type definitions for all navigation params |
| `AppNavigator.tsx` | Root navigator — auth check, shows AuthNavigator or AppStack |
| `AuthNavigator.tsx` | Stack: Login → Register → PasswordReset → OtpVerification |
| `AppStack.tsx` | Stack: BottomTabs + RequestDetail, Bids, Payment, PaymentConfirmation, MechanicProfile, PersonalInfo |
| `BottomTabs.tsx` | Custom bottom tabs: Home, Requests, SubmitRequest (center FAB), Notifications, Profile |

### Navigation Structure

```
AppNavigator
├── AuthNavigator (if not authenticated)
│   ├── Login
│   ├── Register
│   ├── PasswordReset
│   └── OtpVerification
│
└── AppStack (if authenticated)
    ├── BottomTabs
    │   ├── Home
    │   ├── Requests
    │   ├── SubmitRequest (center FAB)
    │   ├── Notifications
    │   └── Profile
    ├── RequestDetail
    ├── Bids (map view)
    ├── Payment
    ├── PaymentConfirmation
    ├── MechanicProfile
    └── PersonalInfo
```

---

## `src/screens/` — Screen Components

### Auth Screens

| File | Purpose |
|------|---------|
| `LoginScreen.tsx` | Email/password login with react-hook-form + zod validation |
| `RegisterScreen.tsx` | Registration form → sends OTP → navigates to verification |
| `OtpVerificationScreen.tsx` | 6-digit OTP input with auto-advance and resend cooldown |
| `PasswordReset.tsx` | Two-step: request reset link → enter token + new password |

### Main App Screens

| File | Purpose |
|------|---------|
| `HomeScreen.tsx` | Dashboard — greeting, quick actions, active request status, recent history |
| `RequestsList.tsx` | All user requests in animated FlatList with pull-to-refresh |
| `SubmitRequest.tsx` | Multi-section form: car details, number plate (OCR), address (Mapbox), description, images (3-10) |
| `RequestDetail.tsx` | Full request detail — status, car info, images, action buttons by status |
| `Bids.tsx` | Full-screen Mapbox map — mechanic markers, driving routes, bottom sheet with bid list, booking flow |
| `Payment.tsx` | Stripe CardField + name input → createPaymentMethod → confirm |
| `PaymentConfirmation.tsx` | Success/failure screen after payment |
| `MechanicProfile.tsx` | Mechanic profile display (name, rating, contact, experience) |
| `ProfileScreen.tsx` | User profile — avatar, stats, menu items (personal info, payment methods, etc.) |
| `PersonalInfoScreen.tsx` | Editable personal info form with edit/save/cancel flow |
| `Notifications.tsx` | Notification list with mark-all-as-read, relative timestamps |

---

## `src/components/` — Reusable Components

### Root Components

| File | Purpose |
|------|---------|
| `Button.tsx` | Generic primary button with loading state |
| `Input.tsx` | Text input with label and error message |
| `ImagePreview.tsx` | Image preview component |

### `components/address/`

| File | Purpose |
|------|---------|
| `MapboxAddressPicker.tsx` | Address input with Mapbox autocomplete + map pin |

### `components/bids/`

| File | Purpose |
|------|---------|
| `BidComparisonView.tsx` | Side-by-side bid comparison |
| `BidLockedView.tsx` | Pay-to-unlock UI when bids are locked |
| `BidMechanicCard.tsx` | Individual bid card (mechanic info, price, duration) |

### `components/common/`

| File | Purpose |
|------|---------|
| `StarRating.tsx` | Star rating display |

### `components/forms/`

| File | Purpose |
|------|---------|
| `CarDetailsForm.tsx` | Reusable car details form fields |
| `DamageDescriptionInput.tsx` | Multiline damage description textarea |

### `components/images/`

| File | Purpose |
|------|---------|
| `ImageGallery.tsx` | Image gallery for viewing multiple images |
| `ImagePreview.tsx` | Image preview grid with remove button |

### `components/mechanics/`

| File | Purpose |
|------|---------|
| `MechanicProfileView.tsx` | Reusable mechanic profile display |

### `components/payments/`

| File | Purpose |
|------|---------|
| `PaymentForm.tsx` | Reusable payment form |

### `components/requests/`

| File | Purpose |
|------|---------|
| `RequestCard.tsx` | Request list item card (car info, status, date) |
| `StatusBadge.tsx` | Colored status badge component |

---

## `src/types/` — TypeScript Types

| File | Purpose |
|------|---------|
| `api.ts` | All API model types: Auth, Profile, Requests, Notifications, Payment, Geo |
| `screens.ts` | Screen-specific types for Bids screen (bid items, routes, booking) |
| `components.ts` | Component prop types |
| `images.d.ts` | Image import declarations (.jpg, .png, .webp) |

---

## `src/utils/` — Utilities

| File | Purpose |
|------|---------|
| `validation.ts` | Zod schemas for login and registration |
| `requestValidation.ts` | Zod schema for submit request form |
| `imagePicker.ts` | Camera and gallery image picker wrappers |
| `uploadImages.ts` | Multipart image upload to `/requests/:id/images` |

---

## `src/theme/` — Design System

| File | Purpose |
|------|---------|
| `colors.ts` | Color palette: primary violet (#7C3AED), backgrounds, text, status colors, gradients |
| `index.ts` | Unified theme export: colors, spacing, fontSizes, borderRadius, gradients |

---

## `src/Assets/` — Static Images

| File | Purpose |
|------|---------|
| `1.jpg` – `7.jpg` | Sample/placeholder car images |
| `download (2).webp`, `download (3).webp` | Additional sample images |
| `OIP (4).webp` | Additional sample image |

---

## `src/env.d.ts`

Module declaration for `@env` (react-native-dotenv) — typed exports for API_BASE_URL, STRIPE_PUBLISHABLE_KEY, MAPBOX_TOKEN, LOGIN_IMAGE_URL.

---

## `android/` — Android Native Project

| Path | Purpose |
|------|---------|
| `build.gradle` | Root Gradle config |
| `settings.gradle` | Gradle project settings |
| `gradle.properties` | JVM and Android build properties |
| `gradlew` / `gradlew.bat` | Gradle wrapper scripts |
| `app/build.gradle` | App module config (applicationId: com.mymobileapp) |
| `app/debug.keystore` | Debug signing keystore |
| `app/proguard-rules.pro` | ProGuard rules for release |
| `app/src/main/AndroidManifest.xml` | Permissions and activities |
| `app/src/main/java/.../MainActivity.kt` | Main activity (Kotlin) |
| `app/src/main/java/.../MainApplication.kt` | Application class (Kotlin) |
| `app/src/main/res/` | String resources, styles, drawables, launcher icons |

---

## `ios/` — iOS Native Project

| Path | Purpose |
|------|---------|
| `Podfile` | CocoaPods dependencies |
| `.xcode.env` | Xcode environment variables |
| `MyMobileApp/AppDelegate.swift` | iOS app delegate |
| `MyMobileApp/Info.plist` | iOS configuration |
| `MyMobileApp/LaunchScreen.storyboard` | Splash screen |
| `MyMobileApp/PrivacyInfo.xcprivacy` | Privacy manifest (iOS 17+) |
| `MyMobileApp/Images.xcassets/` | App icons |
| `MyMobileApp.xcodeproj/` | Xcode project |

---

## Folder Structure Summary

```
car-bidding-front-customer/
├── App.tsx                         # Root (Redux + Stripe + SafeArea + Navigator)
├── index.js                        # RN entry point
├── package.json
├── .env.example
├── src/
│   ├── api/                        # Axios clients (apiClient, profile, notifications, payment)
│   │   └── services/               # geoApi
│   ├── components/
│   │   ├── address/                # MapboxAddressPicker
│   │   ├── bids/                   # BidComparisonView, BidLockedView, BidMechanicCard
│   │   ├── common/                 # StarRating
│   │   ├── forms/                  # CarDetailsForm, DamageDescriptionInput
│   │   ├── images/                 # ImageGallery, ImagePreview
│   │   ├── mechanics/              # MechanicProfileView
│   │   ├── payments/               # PaymentForm
│   │   └── requests/               # RequestCard, StatusBadge
│   ├── config/                     # env, mapbox, stripe
│   ├── navigation/                 # AppNavigator, AuthNavigator, AppStack, BottomTabs, types
│   ├── screens/                    # 11 screens (auth + main app)
│   ├── store/                      # Redux store + 5 slices
│   ├── theme/                      # colors, index (spacing, fonts, radii)
│   ├── types/                      # api.ts, screens.ts, components.ts, images.d.ts
│   ├── utils/                      # validation, imagePicker, uploadImages
│   └── Assets/                     # Sample images
├── android/                        # Android native project
├── ios/                            # iOS native project
└── __tests__/                      # App smoke test
```

---

## API Endpoints Used

| Method | Endpoint | Used By |
|--------|----------|---------|
| POST | `/api/auth/login` | authSlice |
| POST | `/api/auth/register` | authSlice |
| POST | `/api/auth/send-otp` | authSlice |
| POST | `/api/auth/password-reset` | PasswordReset screen |
| POST | `/api/auth/reset-password/:token` | PasswordReset screen |
| GET | `/api/requests` | requestSlice |
| GET | `/api/requests/:id` | requestSlice |
| POST | `/api/requests` | SubmitRequest screen |
| POST | `/api/requests/:id/images` | uploadImages util |
| GET | `/api/bids/request/:id` | Bids screen |
| POST | `/api/payments/process` | Payment screen |
| GET | `/api/payments/status` | paymentSlice |
| POST | `/api/bookings` | Bids screen |
| GET | `/api/profile/me` | profileSlice |
| PATCH | `/api/profile/me` | profileSlice |
| GET | `/api/notifications` | notificationSlice |
| PATCH | `/api/notifications/:id/read` | notificationSlice |
| PATCH | `/api/notifications/read-all` | notificationSlice |
| POST | `/api/geo/validate-address` | geoApi |
| POST | `/api/ocr/extract-plate` | SubmitRequest screen |
