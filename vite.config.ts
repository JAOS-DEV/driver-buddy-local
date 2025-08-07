import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    base: process.env.NODE_ENV === "production" ? "/driver-buddy-local/" : "/",
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    server: {
      headers: {
        "Content-Security-Policy":
          "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://esm.sh https://apis.google.com https://accounts.google.com https://www.gstatic.com https://www.googleapis.com https://www.googletagmanager.com; frame-src 'self' https://accounts.google.com https://www.gstatic.com https://driver-buddy-eae91.firebaseapp.com; connect-src 'self' https://apis.google.com https://accounts.google.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://firebase.googleapis.com https://firebaseinstallations.googleapis.com https://region1.google-analytics.com https://*.google-analytics.com;",
      },
    },
  };
});
