# Security Guide

## 🔒 Environment Variables

This project uses environment variables to keep sensitive configuration secure. Never commit API keys or secrets to version control.

### Required Environment Variables

Create a `.env.local` file in the project root with the following variables:

```bash
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id

# Optional: Gemini API Key
VITE_GEMINI_API_KEY=your_gemini_api_key
```

### Getting Firebase Configuration

1. Go to your [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click the gear icon (⚙️) next to "Project Overview"
4. Select "Project settings"
5. Scroll down to "Your apps" section
6. Copy the configuration values

### Security Best Practices

✅ **Do:**

- Use `.env.local` for local development
- Keep `.env.local` in your `.gitignore`
- Use environment variables in production
- Share `.env.example` with other developers

❌ **Don't:**

- Commit `.env.local` to version control
- Hardcode API keys in source code
- Share API keys publicly
- Use the same keys across different environments

### Production Deployment

For production deployment, set these environment variables in your hosting platform:

- **Vercel**: Add in Project Settings → Environment Variables
- **Netlify**: Add in Site Settings → Environment Variables
- **Firebase Hosting**: Use Firebase Functions or set in build process

## 🔐 Firebase Security Rules

Make sure your Firebase project has proper security rules configured for:

- Authentication
- Firestore (if using)
- Storage (if using)

## 🚨 Security Alerts

If you see GitHub security alerts about exposed API keys:

1. Immediately rotate the exposed keys in Firebase Console
2. Update your environment variables with new keys
3. Remove any hardcoded keys from your codebase
4. Consider the keys compromised and regenerate them
