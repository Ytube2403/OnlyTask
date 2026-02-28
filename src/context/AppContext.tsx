"use client";

import { createContext, useContext, useState, ReactNode } from "react";

type ViewMode = "workspace" | "calendar" | "notes" | "settings";

interface AppContextType {
    currentView: ViewMode;
    setCurrentView: (view: ViewMode) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
    const [currentView, setCurrentView] = useState<ViewMode>("workspace");

    return (
        <AppContext.Provider value={{ currentView, setCurrentView }}>
            {children}
        </AppContext.Provider>
    );
}

export function useApp() {
    const context = useContext(AppContext);
    if (context === undefined) {
        throw new Error("useApp must be used within an AppProvider");
    }
    return context;
}
