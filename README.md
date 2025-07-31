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
- **Data Persistence**: All user data (entries, submissions, hourly rates, settings) is automatically saved to Local Storage and persists across browser sessions.
- **Responsive Design**: Built with a mobile-first approach, the interface is clean, intuitive, and works seamlessly on both mobile phones and desktop browsers.
- **No Build Step**: The app uses modern browser features like ES Modules and import maps to run without any complex build configuration, making it lightweight and easy to get started with.

### UI/UX Improvements

- **Mobile-Optimized Layout**: Centered phone-like interface on desktop, full-height on mobile devices
- **Smart Height Management**: Dynamic calculation ensures the total time display is always visible, with entries scrolling only when necessary
- **Compact Input Forms**: Optimized spacing and sizing for mobile screens
- **Clean Time Display**: Shows both hours and minutes (e.g., "8 hr/480 mins") instead of decimal hours
- **Intuitive Navigation**: Clock icon for time tracking, chat icon for AI assistant
- **Visual Progress Indicators**: Color-coded progress bars for law limits with clear over-limit warnings

## Tech Stack

- **Frontend Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (loaded via CDN)
- **AI / LLM**: [Google Gemini API](https://ai.google.dev/) (using the `@google/genai` package)
- **Module System**: Browser-native ES Modules with an `importmap` in `index.html` for dependency management.
- **Icons**: Custom inline SVG components for a sharp, fast-loading UI.
- **Data Persistence**: Browser Local Storage with custom `useLocalStorage` hook
- **Time Calculations**: Custom hooks for precise time formatting and calculations

## Getting Started & Running Locally

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- A modern web browser (e.g., Chrome, Firefox, Safari).
- A code editor (e.g., [Visual Studio Code](https://code.visualstudio.com/)).
- [Node.js](https://nodejs.org/) and npm installed (used only for the local web server).
- A **Google Gemini API Key**. You can get one from [Google AI Studio](https://aistudio.google.com/app/apikey).

### Installation & Setup

1.  **Clone the repository:**

    ```sh
    git clone <your-repository-url>
    cd <repository-folder>
    ```

2.  **Set up your API Key:**
    The application requires your Google Gemini API key to power the chatbot. For local development, we use a file to simulate an environment variable.

    - Create a new file named `env.js` in the root of the project.
    - Copy and paste the following code into `env.js`:

      ```javascript
      // FOR LOCAL DEVELOPMENT ONLY
      // This file simulates the process.env.API_KEY that is expected in production.
      // IMPORTANT: Do NOT commit this file to version control.

      window.process = {
        env: {
          // Replace "YOUR_GEMINI_API_KEY_HERE" with your actual Google Gemini API key.
          API_KEY: "YOUR_GEMINI_API_KEY_HERE",
        },
      };
      ```

    - **Important**: Replace `'YOUR_GEMINI_API_KEY_HERE'` with your actual key. This file is already listed in a `.gitignore` file to prevent you from accidentally committing your secret key.

3.  **Run the Local Server:**
    Since the app uses ES modules, you need to serve the files from a local web server, not by opening `index.html` directly in the browser. The `serve` package is a simple way to do this.

    - Install `serve` globally:
      ```sh
      npm install -g serve
      ```
    - From the root directory of the project, run:
      ```sh
      serve .
      ```
    - The server will start and give you a local URL, typically `http://localhost:3000`. Open this URL in your browser to see the app.

## File Structure

```
.
├── components/         # Reusable React components
│   ├── BottomNav.tsx  # Bottom navigation with clock and chat icons
│   ├── icons.tsx      # Custom SVG icons (clock, chat, plus, trash)
│   ├── LawLimits.tsx  # Driving time limits with progress bars
│   ├── TimeTracker.tsx # Main time tracking interface
│   ├── UnionChatbot.tsx # AI union representative chatbot
│   ├── PayCalculator.tsx # Pay calculation with manual hours option
│   └── WorkLog.tsx    # Main work log container with tabs
├── hooks/              # Custom React hooks
│   ├── useLocalStorage.ts # Data persistence hook
│   └── useTimeCalculations.ts # Time formatting and calculations
├── services/           # Services for external APIs
│   └── geminiService.ts # Google Gemini API integration
├── App.tsx             # Main application component with responsive layout
├── index.html          # HTML entry point, contains importmap
├── index.tsx           # React root renderer
├── metadata.json       # Application metadata
├── types.ts            # TypeScript type definitions
├── env.js              # (Local only) For API key management
└── README.md           # This file
```

## Key Features in Detail

### Time Tracker

- **Input Format**: HHMM format (e.g., 0930 for 9:30 AM)
- **Auto-focus**: Automatically moves to end time after entering start time
- **Validation**: Real-time validation with clear error messages
- **Entry Management**: Add, remove, and view individual time entries
- **Daily Submissions**: Submit completed days with timestamps for historical tracking
- **History View**: Toggle between current entries and submitted day history

### Pay Calculator

- **Dual Modes**: Time Tracker integration or manual hours input
- **Toggle Switch**: Easy switching between calculation modes
- **Side-by-side Inputs**: Hourly rate and manual hours displayed efficiently
- **Clean Display**: Shows hours and minutes instead of decimal hours
- **Real-time Calculation**: Updates pay estimate as you type

### Law Limits

- **Visual Progress Bars**: Color-coded bars for daily, weekly, and fortnightly limits
- **Clean Time Display**: Shows "X hr/XXX mins" format for clarity
- **Over-limit Warnings**: Red indicators when limits are exceeded
- **Data Management**: Reset all historical data with one click
- **Automatic Tracking**: Calculates totals from submitted daily entries

### AI Union Representative

- **Expert Knowledge**: Trained on UK driving laws and union rules
- **Responsive Design**: Optimized for mobile chat interface
- **Clear Communication**: Provides supportive and informative responses
- **Real-time Interaction**: Powered by Google Gemini API

## Data Persistence

All user data is automatically saved to the browser's Local Storage:

- Time entries and daily submissions
- Hourly rate and pay calculator settings
- Active tab selection
- Historical driving data

Data persists across browser sessions and device restarts, ensuring no work is lost.

## Browser Compatibility

The app is designed to work on modern browsers that support:

- ES Modules
- Local Storage API
- Modern CSS features (Flexbox, Grid)
- Fetch API for external requests

## Deployment

The app is configured for deployment to GitHub Pages with:

- Proper base path configuration for subdirectory deployment
- GitHub Actions workflow for automated builds and deployment
- Optimized for static hosting

## Contributing

When contributing to this project, please ensure:

- All new features include proper TypeScript types
- UI changes maintain mobile-first responsive design
- Data persistence is implemented using the `useLocalStorage` hook
- Time calculations use the centralized `useTimeCalculations` hook
- Icons are added to the `icons.tsx` file as SVG components
