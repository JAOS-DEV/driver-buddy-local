import React from "react";
import { View } from "../types";
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
}

const BottomNav: React.FC<BottomNavProps> = ({ activeView, setActiveView }) => {
  return (
    <nav className="bg-white/80 backdrop-blur-sm border-t border-slate-200/60 shadow-sm">
      <div className="flex items-center justify-around px-2 py-1">
        <NavItem
          icon={<ClockIcon />}
          label="Tracker"
          isActive={activeView === View.WORK}
          onClick={() => setActiveView(View.WORK)}
        />
        <NavItem
          icon={<CalculatorIcon />}
          label="Pay"
          isActive={activeView === View.PAY}
          onClick={() => setActiveView(View.PAY)}
        />
        <NavItem
          icon={<ShieldIcon />}
          label="Limits"
          isActive={activeView === View.LAW_LIMITS}
          onClick={() => setActiveView(View.LAW_LIMITS)}
        />
        <NavItem
          icon={<ChatIcon />}
          label="Chat"
          isActive={activeView === View.CHAT}
          onClick={() => setActiveView(View.CHAT)}
        />
        <NavItem
          icon={<SettingsIcon />}
          label="Settings"
          isActive={activeView === View.SETTINGS}
          onClick={() => setActiveView(View.SETTINGS)}
        />
      </div>
    </nav>
  );
};

export default BottomNav;
