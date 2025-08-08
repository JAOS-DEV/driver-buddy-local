import React from "react";
import { signInWithGoogle } from "../services/firebase";

const Login: React.FC = () => {
  const handleSignIn = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error("Google sign-in failed", error);
      alert("Sign-in failed. Please try again.");
    }
  };

  return (
    <div className="h-full flex items-center justify-center">
      <div className="w-full max-w-sm p-6 rounded-2xl shadow-xl border bg-white">
        <div className="text-center mb-4">
          <h1 className="text-xl font-bold text-slate-800">Driver Buddy</h1>
          <p className="text-sm text-slate-500 mt-1">Sign in to continue</p>
        </div>
        <button
          onClick={handleSignIn}
          className="w-full flex items-center justify-center gap-2 py-2 px-4 border rounded-md bg-white hover:bg-gray-50 text-slate-800"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 48 48"
            className="w-5 h-5"
          >
            <path
              fill="#FFC107"
              d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12s5.373-12,12-12 c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C33.441,6.053,28.935,4,24,4C12.955,4,4,12.955,4,24s8.955,20,20,20 s20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"
            />
            <path
              fill="#FF3D00"
              d="M6.306,14.691l6.571,4.819C14.655,16.108,18.961,13,24,13c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657 C33.441,6.053,28.935,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"
            />
            <path
              fill="#4CAF50"
              d="M24,44c5.169,0,9.86-1.977,13.409-5.197l-6.197-5.238C29.211,35.091,26.715,36,24,36 c-5.192,0-9.607-3.317-11.283-7.946l-6.543,5.039C9.505,39.556,16.227,44,24,44z"
            />
            <path
              fill="#1976D2"
              d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-3.994,5.565 c0.001-0.001,0.002-0.001,0.003-0.002l6.197,5.238C35.271,40.841,44,36,44,24C44,22.659,43.862,21.35,43.611,20.083z"
            />
          </svg>
          <span className="font-medium">Continue with Google</span>
        </button>
      </div>
    </div>
  );
};

export default Login;
