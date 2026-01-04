# Ktoubaty

Ktoubaty is a cross-platform React Native app that helps readers discover, curate, and manage their personal library. It blends a personalized Open Library feed with Firebase-backed profiles and favorites so users can browse, save, and create books seamlessly. Built with care by **Yassine Aouni**, **Mohammed ElMarghani**, and **Bayi Brahim**.

## Table of Contents
- [Overview](#overview)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
  - [Directory Layout](#directory-layout)
  - [Navigation Flow](#navigation-flow)
- [Data & Services](#data--services)
- [Feature Walkthrough](#feature-walkthrough)
- [Getting Started](#getting-started)
- [Running the App](#running-the-app)
- [Configuration](#configuration)
- [Firestore Data Model](#firestore-data-model)
- [Project Scripts](#project-scripts)
- [Development Notes](#development-notes)
- [Testing](#testing)
- [Known Issues & TODOs](#known-issues--todos)
- [Future Improvements](#future-improvements)
- [Contributors](#contributors)
- [License](#license)

## Overview
Ktoubaty authenticates readers with Firebase, stores their preferences in Firestore, and serves a dynamically curated catalog sourced from Open Library subjects and searches. The root navigator switches between the authenticated app shell and the login/register flow depending on the Firebase session state.@App.js#1-27 @src/firebase/auth.js#1-32 @src/firebase/firestore.js#4-37 @src/screens/HomeScreen.js#41-139

### Key Capabilities
- **Email/password authentication with session-aware navigation** using Firebase Auth.@App.js#1-27 @src/firebase/auth.js#1-32
- **User onboarding and persistence** through Firestore documents that capture profile details, favorite genres, and saved titles.@src/firebase/firestore.js#4-62
- **Personalized home feed** that blends favorite genres with curated fallbacks from Open Library subjects.@src/screens/HomeScreen.js#41-139
- **Instant search with debounce** against the Open Library catalog and a shortcut to create custom entries when no results are found.@src/screens/SearchScreen.js#14-80
- **Favorites management** that syncs Firestore IDs with Open Library metadata and gracefully handles missing covers.@src/screens/FavoritesScreen.js#22-152
- **Book detail view** with author enrichment and Firestore fallback for custom submissions.@src/screens/BookDetailScreen.js#16-78
- **Custom book creation** that persists to a `customBooks` collection and auto-favorites the new entry for the authoring user.@src/screens/CreateBookScreen.js#14-62
- **Profile center** for refreshing user data, managing favorite genres, and signing out.@src/screens/ProfileScreen.js#20-109
- **Edit profile workflow** designed to update display name and email with inline validation.@src/screens/EditProfileScreen.js#20-160

## Tech Stack
- **React Native 0.81** with **Expo 54** for cross-platform delivery.@package.json#11-24
- **React Navigation 7** for stack and bottom-tab flows.@package.json#13-15 @src/navigation/AppNavigator.js#11-109
- **Firebase (Auth + Firestore)** for authentication and persistent storage.@src/firebase/config.js#1-21 @src/firebase/auth.js#1-32 @src/firebase/firestore.js#4-62
- **Open Library APIs** for public book metadata and covers.@src/screens/HomeScreen.js#56-138 @src/screens/SearchScreen.js#22-79 @src/screens/FavoritesScreen.js#36-66 @src/screens/BookDetailScreen.js#24-78

## Architecture
The app is composed of a thin Expo entry point that registers the React component tree, an authentication-aware root navigator, and a feature-rich tab navigator hosting the core screens.@index.js#1-9 @App.js#1-27 @src/navigation/RootNavigator.js#8-16 @src/navigation/AppNavigator.js#11-109

### Directory Layout
```
Ktoubaty/
├── App.js
├── index.js
├── package.json
├── src/
│   ├── components/
│   ├── firebase/
│   │   ├── auth.js
│   │   ├── config.js
│   │   └── firestore.js
│   ├── navigation/
│   │   ├── AppNavigator.js
│   │   ├── AuthNavigator.js
│   │   └── RootNavigator.js
│   └── screens/
│       ├── BookDetailScreen.js
│       ├── CreateBookScreen.js
│       ├── EditProfileScreen.js
│       ├── FavoritesScreen.js
│       ├── HomeScreen.js
│       ├── LoginScreen.js
│       ├── ProfileScreen.js
│       ├── SearchScreen.js
│       └── SignUpScreen.js
└── assets/
```

### Navigation Flow
- **`AuthNavigator`** hosts Login and Sign Up while the user is unauthenticated.@src/navigation/AuthNavigator.js#7-13
- **`RootNavigator`** switches into the main app once a Firebase session exists, layering book detail and creation stacks atop the tab navigator.@src/navigation/RootNavigator.js#8-16
- **`AppNavigator`** renders Home, Search, Favorites, and Profile tabs with tailored iconography, styling, and header suppression.@src/navigation/AppNavigator.js#11-109

## Data & Services
### Firebase Authentication & Firestore
- Sign-up, sign-in, and sign-out helpers wrap Firebase Auth primitives and return friendly responses for the UI.@src/firebase/auth.js#1-32
- `createUserIfNotExists` seeds the `users` collection with email, display name, favorite genres, and a favorites array on first login.@src/firebase/firestore.js#4-37
- Helper methods mutate favorites and favorite genres, keeping Firestore as the single source of truth.@src/firebase/firestore.js#20-62

### Open Library Integration
Home, Search, Favorites, and Book Detail screens use Open Library subjects, search endpoints, and work detail routes to hydrate the UI with live data, while falling back to Firestore `customBooks` when needed.@src/screens/HomeScreen.js#56-138 @src/screens/SearchScreen.js#22-79 @src/screens/FavoritesScreen.js#32-67 @src/screens/BookDetailScreen.js#24-78 @src/screens/CreateBookScreen.js#27-58

## Feature Walkthrough
- **Home:** fetches works for each favorite genre (or popular fallbacks), deduplicates results, and presents a grid layout while tracking scroll to hide the tab bar gracefully.@src/screens/HomeScreen.js#41-139
- **Search:** debounces user input, queries Open Library, and invites the user to create a custom book when no matches appear.@src/screens/SearchScreen.js#14-80
- **Favorites:** loads saved work IDs from Firestore, resolves cover art via Open Library, and allows unfavoriting inline.@src/screens/FavoritesScreen.js#22-152
- **Book Detail:** enriches metadata with author lookups, toggles favorites, and shows Firestore-backed custom content when applicable.@src/screens/BookDetailScreen.js#16-78
- **Create Book:** persists new custom entries with optional author/cover info and immediately bookmarks them for the creator.@src/screens/CreateBookScreen.js#14-62
- **Profile:** fetches user data, manages favorite genres, and exposes logout controls with tactile feedback.@src/screens/ProfileScreen.js#20-109
- **Edit Profile:** collects updated contact info with validation before attempting Firestore and Auth updates.@src/screens/EditProfileScreen.js#20-160
- **Authentication:** Login and Sign Up screens validate inputs, surface form errors, and create Firestore documents during onboarding.@src/screens/LoginScreen.js#29-149 @src/screens/SignUpScreen.js#39-99

## Getting Started
1. Install the Expo CLI if you have not already: `npm install --global expo-cli`.
2. Ensure Node.js 18+ (or the LTS recommended by Expo 54) and npm are available.
3. Install dependencies: `npm install`.
4. Launch the development server using one of the scripts below.
5. Use Expo Go or an emulator/simulator to open the project URL.

## Running the App
Use the npm scripts provided by Expo:
- `npm start` – launch the Expo dev server with the platform chooser.@package.json#5-9
- `npm run android` – open the project directly in Android (Expo Go or emulator).@package.json#7-7
- `npm run ios` – open the project in iOS Simulator (macOS only).@package.json#8-8
- `npm run web` – preview the project in a web browser using Expo for Web.@package.json#9-9

## Configuration
Firebase credentials currently live in `src/firebase/config.js`. Replace them with your own project values or load them via environment variables / `app.config.js` to keep secrets out of source control.@src/firebase/config.js#6-20

If you rotate keys:
1. Update Firebase console (Auth + Firestore) with the appropriate configuration.
2. Update `firebaseConfig` in `config.js` (or reference env vars) and restart Expo.
3. Confirm Firestore security rules align with the structure documented below.

## Firestore Data Model
- **`users/{uid}`**
  ```json
  {
    "email": "user@example.com",
    "displayName": "Jane Doe",
    "favoriteGenres": ["Fiction", "Fantasy"],
    "favorites": ["OL12345W", "customBookId"],
    "createdAt": "2024-06-01T12:00:00.000Z"
  }
  ```
  Managed via `createUserIfNotExists`, `addFavorite`, `removeFavorite`, and `setFavoriteGenres` helpers.@src/firebase/firestore.js#4-62

- **`customBooks/{id}`**
  ```json
  {
    "owner": "uid",
    "title": "My Custom Book",
    "author": "Author Name",
    "coverUrl": "https://...",
    "createdAt": "<server timestamp>"
  }
  ```
  Created by the custom book workflow and added to favorites automatically.@src/screens/CreateBookScreen.js#14-62

## Project Scripts
Package scripts mirror Expo defaults and cover local development entry points.@package.json#5-9

## Development Notes
- Entry point is registered via `index.js`, which ensures the app bootstraps correctly in Expo Go and standalone builds.@index.js#1-9
- `App.js` listens to Firebase auth state changes and chooses between `AuthNavigator` and the main `RootNavigator` once loading completes.@App.js#1-27
- Bottom tab styling is centralized in `AppNavigator`; consider extracting the design into a reusable component if you expand the navigation system.@src/navigation/AppNavigator.js#13-76
- A placeholder `BottomTabBar.js` component exists under `src/components` for future custom tab bar styling.@src/components/BottomTabBar.js#1-1

## Contributors
- **Yassine Aouni**
- **Mohammed ElMarghani**
- **Bayi Brahim**

## License
No license file is included. Add an open-source license (MIT, Apache 2.0, etc.) or specify proprietary usage terms before distributing the project.
