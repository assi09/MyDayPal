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
import SettingsPanel from "./components/Settings";

function App() {
  const { theme, viewMode, tasks, accentColor } = useStore();
  const notifyRef = useRef(false);
  const [showSplash, setShowSplash] = useState(true);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty('--accent', accentColor);
    // Compute hover (slightly darker) and soft/glow versions
    r.setProperty('--accent-hover', accentColor + 'DD');
    r.setProperty('--accent-soft', accentColor + '16');
    r.setProperty('--accent-glow', accentColor + '38');
  }, [accentColor]);

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

  // Auto-archive and overdue escalation: run on mount + every hour
  useEffect(() => {
    function runAutoMaintenance() {
      const { projects, tasks: currentTasks, settings, updateTask, archiveProject } = useStore.getState();
      const now = new Date();
      const todayMs = now.getTime();

      // Auto-archive completed projects (all tasks done)
      if (settings.autoArchiveProjects !== 'never') {
        const days = settings.autoArchiveProjects === '7days' ? 7 : 30;
        const thresholdMs = days * 24 * 60 * 60 * 1000;
        projects.forEach(p => {
          if (!p.archived) {
            const projTasks = currentTasks.filter(t => t.projectId === p.id);
            if (projTasks.length > 0 && projTasks.every(t => t.status === 'done')) {
              const lastUpdated = Math.max(...projTasks.map(t => new Date(t.updatedAt).getTime()));
              if (todayMs - lastUpdated > thresholdMs) {
                archiveProject(p.id);
              }
            }
          }
        });
      }

      // Overdue escalation
      if (settings.overdueEscalationEnabled) {
        const thresholdMs = settings.overdueEscalationDays * 24 * 60 * 60 * 1000;
        currentTasks.forEach(t => {
          if (t.status !== 'done' && t.dueDate && t.priority !== 'critical') {
            const dueMs = new Date(t.dueDate + 'T00:00:00').getTime();
            if (todayMs - dueMs > thresholdMs) {
              const newPriority = t.priority === 'low' ? 'medium' : t.priority === 'medium' ? 'high' : 'high';
              if (newPriority !== t.priority) updateTask(t.id, { priority: newPriority });
            }
          }
        });
      }
    }

    runAutoMaintenance();
    const id = setInterval(runAutoMaintenance, 60 * 60 * 1000);
    return () => clearInterval(id);
  }, []);

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
        {viewMode !== 'settings' && <Header />}
        {viewMode === "kanban"   && <KanbanBoard />}
        {viewMode === "list"     && <ListView />}
        {viewMode === "calendar" && <CalendarView />}
        {viewMode === "roadmap"  && <RoadmapView />}
        {viewMode === "settings" && <SettingsPanel />}
      </div>
    </div>
    </>
  );
}

export default App;
