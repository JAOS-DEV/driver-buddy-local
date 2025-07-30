# Driver Buddy Web App

Driver Buddy is a modern, responsive web application designed for professional drivers in the UK. It serves as a digital assistant to help track work hours, calculate wages, monitor compliance with legal driving limits, and provide instant advice from an AI union representative.

## Features

- **Time Tracker**: Easily add and remove work shifts using start and end times (HH:MM format). The app automatically calculates the duration for each entry and the total time worked for the day.
- **Wage Calculator**: Input your hourly rate to get an estimated daily wage based on the total hours tracked.
- **Law Limits**: Visual progress bars help you monitor your daily, weekly, and fortnightly driving hours against standard UK legal limits, preventing accidental non-compliance.
- **AI Union Rep**: A powerful chatbot powered by the Google Gemini API. It's primed with a system instruction to act as an expert on UK driving laws, union rules (specifically Unite's 'Big Red Book'), and employment rights, providing clear and supportive answers.
- **Responsive Design**: Built with a mobile-first approach, the interface is clean, intuitive, and works seamlessly on both mobile phones and desktop browsers.
- **No Build Step**: The app uses modern browser features like ES Modules and import maps to run without any complex build configuration, making it lightweight and easy to get started with.

## Tech Stack

- **Frontend Library**: [React 19](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) (loaded via CDN)
- **AI / LLM**: [Google Gemini API](https://ai.google.dev/) (using the `@google/genai` package)
- **Module System**: Browser-native ES Modules with an `importmap` in `index.html` for dependency management.
- **Icons**: Custom inline SVG components for a sharp, fast-loading UI.

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
          API_KEY: 'YOUR_GEMINI_API_KEY_HERE'
        }
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
│   ├── BottomNav.tsx
│   ├── icons.tsx
│   ├── LawLimits.tsx
│   ├── TimeTracker.tsx
│   ├── UnionChatbot.tsx
│   ├── WageCalculator.tsx
│   └── WorkLog.tsx
├── hooks/              # Custom React hooks
│   └── useTimeCalculations.ts
├── services/           # Services for external APIs
│   └── geminiService.ts
├── App.tsx             # Main application component
├── index.html          # HTML entry point, contains importmap
├── index.tsx           # React root renderer
├── metadata.json       # Application metadata
├── types.ts            # TypeScript type definitions
├── env.js              # (Local only) For API key management
└── README.md           # This file
```
