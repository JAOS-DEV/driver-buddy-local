import path from "path";
import { defineConfig, loadEnv } from "vite";
import legacy from "@vitejs/plugin-legacy";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    base: process.env.NODE_ENV === "production" ? "./" : "/",
    plugins: [
      legacy({
        targets: [
          "defaults",
          "not IE 11",
          "iOS >= 12",
          "Safari >= 12",
          "Android >= 7",
        ],
        additionalLegacyPolyfills: ["whatwg-fetch"],
        modernPolyfills: true,
      }),
    ],
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
          "script-src 'self' 'unsafe-inline' https://esm.sh https://apis.google.com https://accounts.google.com https://www.gstatic.com https://www.googleapis.com https://www.googletagmanager.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; frame-src 'self' https://accounts.google.com https://www.gstatic.com https://*.firebaseapp.com https://*.web.app; connect-src 'self' https://apis.google.com https://accounts.google.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.googleapis.com https://firebase.googleapis.com https://firebaseinstallations.googleapis.com https://firestore.googleapis.com https://firebasestorage.googleapis.com https://region1.google-analytics.com https://*.google-analytics.com;",
      },
    },
  };
});
