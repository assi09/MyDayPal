import { useEffect, useRef, useState } from "react";
import { useStore } from "./store";
import { checkAndNotify } from "./notifications";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import KanbanBoard from "./components/KanbanBoard";
import ListView from "./components/ListView";
import CalendarView from "./components/CalendarView";
import RoadmapView from "./components/RoadmapView";
import SplashScreen from "./components/SplashScreen";
import Onboarding, { hasOnboarded } from "./components/Onboarding";

function App() {
  const { theme, viewMode, tasks } = useStore();
  const notifyRef = useRef(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  // Run notification check on load and every 5 minutes
  useEffect(() => {
    const run = () => checkAndNotify(tasks);
    if (!notifyRef.current) {
      notifyRef.current = true;
      run();
    }
    const id = setInterval(run, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [tasks]);

  function handleSplashDone() {
    setShowSplash(false);
    if (!hasOnboarded()) {
      setShowOnboarding(true);
    }
  }

  return (
    <>
    {showSplash && <SplashScreen onDone={handleSplashDone} />}
    {showOnboarding && <Onboarding onDone={() => setShowOnboarding(false)} />}
    <div
      style={{
        display: "flex",
        height: "100vh",
        overflow: "hidden",
        background: "var(--bg)",
        color: "var(--text-primary)",
      }}
    >
      <Sidebar />
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        <Header />
        {viewMode === "kanban"   && <KanbanBoard />}
        {viewMode === "list"     && <ListView />}
        {viewMode === "calendar" && <CalendarView />}
        {viewMode === "roadmap"  && <RoadmapView />}
      </div>
    </div>
    </>
  );
}

export default App;
