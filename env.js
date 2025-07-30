// FOR LOCAL DEVELOPMENT ONLY
// Create this file in the root of your project but DO NOT commit it to version control.
// This file simulates the process.env.API_KEY environment variable that is expected to be present in the deployment environment.

window.process = {
  env: {
    // IMPORTANT: Replace "YOUR_GEMINI_API_KEY_HERE" with your actual Google Gemini API key.
    API_KEY: 'YOUR_GEMINI_API_KEY_HERE'
  }
};
