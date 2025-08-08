import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Minimal global error visibility for mobile
window.addEventListener("error", (e) => {
  try {
    const el = document.getElementById("root");
    if (!el) return;
    const msg = String(e?.error?.message || e?.message || "Unknown error");
    el.setAttribute("data-error", msg);
  } catch {}
});
window.addEventListener("unhandledrejection", (e) => {
  try {
    const el = document.getElementById("root");
    if (!el) return;
    const msg = String(
      (e.reason && e.reason.message) || e.reason || "Promise rejection"
    );
    el.setAttribute("data-error", msg);
  } catch {}
});

root.render(
  <React.StrictMode>
    <div className="w-full h-full max-w-md mx-auto">
      <App />
    </div>
  </React.StrictMode>
);
