import React from "react";
import { View, UserProfile } from "../types";
import { NavItem } from "./NavItem";
import {
  ClockIcon,
  ChatIcon,
  SettingsIcon,
  CalculatorIcon,
  ShieldIcon,
} from "./icons";

interface BottomNavProps {
  activeView: View;
  setActiveView: (view: View) => void;
  userProfile?: UserProfile | null;
  settings?: { darkMode: boolean };
}

const BottomNav: React.FC<BottomNavProps> = ({
  activeView,
  setActiveView,
  userProfile,
  settings,
}) => {
  const isAdmin = userProfile?.role === "admin";

  return (
    <nav
      className={`backdrop-blur-sm border-t shadow-sm ${
        settings?.darkMode
          ? "bg-gray-800/90 border-gray-600/60"
          : "bg-white/80 border-slate-200/60"
      }`}
    >
      <div className="flex items-center justify-around px-2 py-1">
        <NavItem
          icon={<ClockIcon />}
          label="Tracker"
          isActive={activeView === View.WORK}
          onClick={() => setActiveView(View.WORK)}
          darkMode={settings?.darkMode}
        />
        <NavItem
          icon={<CalculatorIcon />}
          label="Pay"
          isActive={activeView === View.PAY}
          onClick={() => setActiveView(View.PAY)}
          darkMode={settings?.darkMode}
        />
        <NavItem
          icon={<ShieldIcon />}
          label="Limits"
          isActive={activeView === View.LAW_LIMITS}
          onClick={() => setActiveView(View.LAW_LIMITS)}
          darkMode={settings?.darkMode}
        />
        <NavItem
          icon={<ChatIcon />}
          label="Chat"
          isActive={activeView === View.CHAT}
          onClick={() => setActiveView(View.CHAT)}
          darkMode={settings?.darkMode}
        />
        <NavItem
          icon={<SettingsIcon />}
          label="Settings"
          isActive={activeView === View.SETTINGS}
          onClick={() => setActiveView(View.SETTINGS)}
          darkMode={settings?.darkMode}
        />
        {isAdmin && (
          <NavItem
            label="Admin"
            isActive={activeView === View.ADMIN}
            onClick={() => setActiveView(View.ADMIN)}
            darkMode={settings?.darkMode}
          />
        )}
      </div>
    </nav>
  );
};

export default BottomNav;
