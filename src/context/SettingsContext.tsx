"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { AppSettings } from "@/types";
import { useAuth } from "@/context/AuthContext";

const defaultSettings: AppSettings = {
    language: "vi",
    defaultView: "workspace",
    notifications: {
        deletionWarnings: true,
        deadlineReminders: true,
    },
};

interface SettingsContextType {
    settings: AppSettings;
    updateSettings: (updates: Partial<AppSettings>) => void;
    updateNotifications: (updates: Partial<AppSettings["notifications"]>) => void;
    clearCache: () => void;
    storageUsage: string;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

function getStorageKey(userId: string) {
    return `settings_${userId}`;
}

function getStorageSize(): string {
    let total = 0;
    for (const key of Object.keys(localStorage)) {
        total += localStorage.getItem(key)?.length || 0;
    }
    if (total < 1024) return `${total} B`;
    if (total < 1024 * 1024) return `${(total / 1024).toFixed(1)} KB`;
    return `${(total / (1024 * 1024)).toFixed(2)} MB`;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
    const { user, isInitialized } = useAuth();
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);
    const [storageUsage, setStorageUsage] = useState("0 B");

    useEffect(() => {
        if (!isInitialized) return;
        if (!user) { setSettings(defaultSettings); return; }

        const key = getStorageKey(user.id);
        const stored = localStorage.getItem(key);
        if (stored) {
            try { setSettings({ ...defaultSettings, ...JSON.parse(stored) }); }
            catch { setSettings(defaultSettings); }
        } else {
            setSettings(defaultSettings);
        }
        setStorageUsage(getStorageSize());
    }, [user, isInitialized]);

    useEffect(() => {
        if (!user || !isInitialized) return;
        localStorage.setItem(getStorageKey(user.id), JSON.stringify(settings));
    }, [settings, user, isInitialized]);

    const updateSettings = (updates: Partial<AppSettings>) => {
        setSettings((prev) => ({ ...prev, ...updates }));
    };

    const updateNotifications = (updates: Partial<AppSettings["notifications"]>) => {
        setSettings((prev) => ({
            ...prev,
            notifications: { ...prev.notifications, ...updates },
        }));
    };

    const clearCache = () => {
        if (!user) return;
        const keysToKeep = ["usersMap", "activeUserId", getStorageKey(user.id)];
        const keysToRemove: string[] = [];
        for (const key of Object.keys(localStorage)) {
            if (!keysToKeep.includes(key)) keysToRemove.push(key);
        }
        keysToRemove.forEach((k) => localStorage.removeItem(k));
        setStorageUsage(getStorageSize());
    };

    return (
        <SettingsContext.Provider value={{ settings, updateSettings, updateNotifications, clearCache, storageUsage }}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    const context = useContext(SettingsContext);
    if (!context) throw new Error("useSettings must be used within a SettingsProvider");
    return context;
}
