import React from "react";
import { View } from "../types";
import { BriefcaseIcon, ChatIcon } from "./icons";

interface BottomNavProps {
  activeView: View;
  setActiveView: (view: View) => void;
}

const NavItem: React.FC<{
  icon: React.ReactNode;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`p-3 rounded-lg transition-colors ${
      isActive ? "text-[#003D5B]" : "text-slate-500 hover:text-[#003D5B]"
    }`}
  >
    {icon}
  </button>
);

const BottomNav: React.FC<BottomNavProps> = ({ activeView, setActiveView }) => {
  return (
    <nav className="flex-shrink-0 bg-[#FAF7F0]/95 backdrop-blur-sm border-t border-slate-200/80 pb-safe">
      <div className="flex justify-around items-center h-16 px-4 pb-safe">
        <NavItem
          icon={
            <ChatIcon
              className={`h-7 w-7 ${
                activeView === View.CHAT ? "text-teal-600" : "text-slate-500"
              }`}
            />
          }
          isActive={activeView === View.CHAT}
          onClick={() => setActiveView(View.CHAT)}
        />
        <NavItem
          icon={<BriefcaseIcon className="h-7 w-7" />}
          isActive={activeView === View.WORK}
          onClick={() => setActiveView(View.WORK)}
        />
      </div>
    </nav>
  );
};

export default BottomNav;
