# Driver Buddy Web App

Driver Buddy is a modern, responsive web application designed for professional drivers in the UK. It serves as a digital assistant to help track work hours, calculate pay, monitor compliance with legal driving limits, and provide instant advice from an AI union representative.

## Features

### Core Functionality

- **Time Tracker**: Easily add and remove work shifts using start and end times (HH:MM format). The app automatically calculates the duration for each entry and the total time worked for the day.
- **Pay Calculator**: Input your hourly rate to get an estimated daily pay based on the total hours tracked.
- **Law Limits**: Visual progress bars help you monitor your daily, weekly, and fortnightly driving hours against standard UK legal limits, preventing accidental non-compliance.
- **AI Union Rep**: A powerful chatbot powered by the Google Gemini API. It's primed with a system instruction to act as an expert on UK driving laws, union rules (specifically Unite's 'Big Red Book'), and employment rights, providing clear and supportive answers.

### Enhanced Features

- **Daily Submission System**: Submit completed days of work with timestamps, allowing multiple submissions per day for drivers who work through midnight or have multiple shifts.
- **Historical Data Management**: View and manage submitted days with the ability to clear individual submissions or reset all data.
- **Toast Notifications**: Temporary pop-up notifications that appear for 3 seconds when submitting days, showing the count of submissions for the day.
- **Data Persistence**: User data is saved to Local Storage by default. Optional Cloud mode uses Firebase Firestore with auto-sync when signed in.
- **Responsive Design**: Mobile-first interface that works on phones and desktop browsers.

## Tech Stack

- **Frontend Library**: React + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Auth/DB**: Firebase Auth + Firestore
- **AI / LLM**: Google Gemini API

## Getting Started

1. Install dependencies

```sh
npm install
```

2. Run dev server

```sh
npm run dev
```

3. Build

```sh
npm run build
```

## Deployment

### Recommended: Firebase Hosting (prod) + GitHub Pages (previews)

- Use Firebase Hosting with a custom domain for production.
- Keep GitHub Pages for preview builds if desired.

#### One-time setup

```sh
npm i -g firebase-tools
firebase login
firebase init hosting   # choose existing project, public: dist, SPA: yes
# optionally enable the GitHub Action during init
```

Ensure package.json contains:

```json
{
  "scripts": {
    "build": "vite build"
  }
}
```

#### Deploy to Firebase Hosting

```sh
npm run build
firebase deploy --only hosting
```

#### Custom domain

- Firebase Console → Hosting → Add custom domain
- Add DNS records at your registrar as instructed
- SSL cert will auto-provision (may take a few minutes)
- Add the new domain to Firebase Auth → Authorized domains

#### Keep GH Pages for previews

- Continue publishing from a preview branch to GitHub Pages
- Optionally link from the GH Pages build to your production domain

## Contributing

- Keep UI mobile-first and consistent
- Add/maintain TypeScript types
- Avoid introducing breaking CSP changes (Firebase Auth requires specific domains)
