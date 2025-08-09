import React from "react";

interface NavItemProps {
  icon?: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
  darkMode?: boolean;
}

export const NavItem: React.FC<NavItemProps> = ({
  icon,
  label,
  isActive,
  onClick,
  darkMode = false,
}) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center py-2 px-1 transition-all duration-200 flex-1 relative group ${
      isActive
        ? darkMode
          ? "text-white"
          : "text-gray-800"
        : darkMode
        ? "text-gray-400 hover:text-gray-200"
        : "text-slate-500 hover:text-slate-700"
    }`}
  >
    {/* Icon - only render if provided */}
    {icon && (
      <div
        className={`mb-1 transition-transform duration-200 ${
          isActive ? "scale-110" : "group-hover:scale-105"
        }`}
      >
        {icon}
      </div>
    )}

    {/* Label */}
    <span
      className={`text-xs font-medium transition-colors duration-200 ${
        isActive ? "font-semibold" : ""
      }`}
    >
      {label}
    </span>

    {/* Active indicator */}
    {isActive && (
      <div
        className={`absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full ${
          darkMode ? "bg-white" : "bg-gray-800"
        }`}
      />
    )}
  </button>
);
