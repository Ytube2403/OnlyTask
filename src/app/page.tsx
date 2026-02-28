"use client";

import { Sidebar } from "@/components/layout/Sidebar";
import { Inbox } from "@/components/layout/Inbox";
import { Workspace } from "@/components/layout/Workspace";
import { NotesView } from "@/components/layout/NotesView";
import { CalendarView } from "@/components/layout/CalendarView";
import { SettingsView } from "@/components/layout/SettingsView";
import { AuthModal } from "@/components/auth/AuthModal";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { TaskDetailsModal } from "@/components/TaskDetailsModal";
import { useState, useEffect } from "react";

export default function Home() {
  const { currentView } = useApp();
  const { user, isInitialized } = useAuth();
  const [isNewTaskModalOpen, setIsNewTaskModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input, textarea or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.tagName === "SELECT" ||
        target.isContentEditable
      ) {
        return;
      }

      if (e.key.toLowerCase() === 'c') {
        e.preventDefault();
        setIsNewTaskModalOpen(true);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [user]);

  if (!isInitialized) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-white">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-black rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <AuthModal />;
  }

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-white font-sans text-gray-900 selection:bg-gray-200 pb-[72px] md:pb-0">
      <Sidebar />
      <div className={`flex-shrink-0 ${currentView === 'workspace' ? 'flex w-full md:w-auto h-auto md:h-full z-20' : 'hidden md:flex md:w-auto md:h-full'}`}>
        <Inbox />
      </div>
      {currentView === "workspace" && <Workspace />}
      {currentView === "calendar" && <CalendarView />}
      {currentView === "notes" && <NotesView />}
      {currentView === "settings" && <SettingsView />}

      <TaskDetailsModal
        isOpen={isNewTaskModalOpen}
        onClose={() => setIsNewTaskModalOpen(false)}
      />
    </div>
  );
}
