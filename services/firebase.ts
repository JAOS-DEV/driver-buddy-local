import { initializeApp } from "firebase/app";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  type User,
} from "firebase/auth";

const runtimeConfig = (window as any).__FIREBASE_CONFIG__ || {};
const firebaseConfig = {
  apiKey:
    (import.meta.env.VITE_FIREBASE_API_KEY as string) || runtimeConfig.apiKey,
  authDomain:
    (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) ||
    runtimeConfig.authDomain,
  projectId:
    (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) ||
    runtimeConfig.projectId,
  storageBucket:
    (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) ||
    runtimeConfig.storageBucket,
  messagingSenderId:
    (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) ||
    runtimeConfig.messagingSenderId,
  appId:
    (import.meta.env.VITE_FIREBASE_APP_ID as string) || runtimeConfig.appId,
};

// Initialize Firebase app (singleton by module scope)
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
auth.useDeviceLanguage();

// Initialize Firestore with persistent cache
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
});

const provider = new GoogleAuthProvider();
provider.setCustomParameters({ prompt: "select_account" });

export async function signInWithGoogle(): Promise<User> {
  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error) {
    // Fallback to redirect if popup fails (CSP, blockers, third-party cookies)
    await signInWithRedirect(auth, provider);
    const redirectResult = await getRedirectResult(auth);
    if (!redirectResult) {
      throw error instanceof Error ? error : new Error("Sign-in failed");
    }
    return redirectResult.user;
  }
}

export async function signOutUser(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged };
