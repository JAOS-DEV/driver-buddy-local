import React, { useState } from "react";
import { View } from "./types";
import BottomNav from "./components/BottomNav";
import WorkLog from "./components/WorkLog";
import UnionChatbot from "./components/UnionChatbot";

const App: React.FC = () => {
  const [activeView, setActiveView] = useState<View>(View.WORK);

  return (
    <div className="h-[100dvh] w-full flex items-center justify-center bg-[#FAF7F0] overflow-hidden">
      {/* Mobile container - full height on mobile, larger fixed height on desktop */}
      <div className="w-full h-full sm:h-[700px] sm:max-w-md bg-[#FAF7F0] sm:rounded-3xl sm:shadow-2xl sm:border sm:border-slate-200/50 flex flex-col overflow-hidden mx-auto">
        <div className="flex-1 overflow-hidden p-6 pb-0">
          {activeView === View.WORK && <WorkLog />}
          {activeView === View.CHAT && <UnionChatbot />}
        </div>
        <BottomNav activeView={activeView} setActiveView={setActiveView} />
      </div>
    </div>
  );
};

export default App;
