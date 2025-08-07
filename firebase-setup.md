# Firebase Setup Guide

## Step 1: Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter a project name (e.g., "driver-buddy")
4. Follow the setup wizard (you can disable Google Analytics if you don't need it)

## Step 2: Enable Authentication

1. In your Firebase project, go to "Authentication" in the left sidebar
2. Click "Get started"
3. Go to the "Sign-in method" tab
4. Enable "Google" provider:
   - Click on "Google"
   - Toggle "Enable"
   - Add your support email
   - Save
5. Enable "Email/Password" provider:
   - Click on "Email/Password"
   - Toggle "Enable"
   - Save

## Step 3: Get Your Firebase Config

1. In your Firebase project, click the gear icon (⚙️) next to "Project Overview"
2. Select "Project settings"
3. Scroll down to "Your apps" section
4. Click the web icon (</>)
5. Register your app with a nickname (e.g., "driver-buddy-web")
6. Copy the firebaseConfig object

## Step 4: Update Your App

1. Open `services/firebase.ts`
2. Replace the placeholder config with your actual Firebase config:

```typescript
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "your-sender-id",
  appId: "your-app-id",
};
```

## Step 5: Test the Authentication

1. Run your app: `npm run dev`
2. You should see a login screen
3. Try signing in with Google or creating an account with email/password

## Notes

- Your data will continue to be stored locally by default
- Authentication is now required to access the app
- Users can sign out from the Settings page
- The app will remember authentication state between sessions

## Next Steps (Future Phases)

- Phase 2: Add Firebase Firestore for cloud data sync
- Phase 3: Add offline support and real-time sync
- Phase 4: Add push notifications
