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
    const banner = document.getElementById("debug-banner");
    if (banner) {
      banner.textContent = `Error: ${msg}`;
      const style = banner.getAttribute("style") || "";
      if (style.includes("display:none")) {
        banner.setAttribute(
          "style",
          style.replace("display:none", "display:block")
        );
      } else {
        banner.setAttribute("style", style + ";display:block");
      }
    }
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
    const banner = document.getElementById("debug-banner");
    if (banner) {
      banner.textContent = `Rejection: ${msg}`;
      const style = banner.getAttribute("style") || "";
      if (style.includes("display:none")) {
        banner.setAttribute(
          "style",
          style.replace("display:none", "display:block")
        );
      } else {
        banner.setAttribute("style", style + ";display:block");
      }
    }
  } catch {}
});

root.render(
  <React.StrictMode>
    <div className="w-full h-full max-w-md mx-auto">
      <App />
    </div>
  </React.StrictMode>
);
