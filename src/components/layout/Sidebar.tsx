"use client";

import { CheckSquare, Calendar, BookOpen, Settings, LayoutDashboard, Crown } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import { AccountModal } from "@/components/account/AccountModal";

import { useSettings } from "@/context/SettingsContext";

export function Sidebar() {
    const { currentView, setCurrentView } = useApp();
    const { user } = useAuth();
    const { settings } = useSettings();
    const [accountOpen, setAccountOpen] = useState(false);

    const t = settings.language === "vi" ? {
        workspace: "Làm việc",
        calendar: "Lịch",
        notes: "Ghi chú",
        settings: "Cài đặt"
    } : {
        workspace: "Workspace",
        calendar: "Calendar",
        notes: "Notes",
        settings: "Settings"
    };

    const displayChar = user ? (user.displayName?.[0] || user.email[0]).toUpperCase() : "?";
    const avatarGrad = user?.avatarColor || "from-gray-700 to-gray-900";

    return (
        <>
            <div className="w-16 h-full border-r border-gray-200 bg-white flex flex-col items-center py-6 gap-6 flex-shrink-0 z-10 relative">
                <div className="p-2 bg-black text-white rounded-xl mb-4">
                    <LayoutDashboard size={20} />
                </div>
                <NavButton
                    title={t.workspace}
                    icon={<CheckSquare size={20} />}
                    active={currentView === "workspace"}
                    onClick={() => setCurrentView("workspace")} />
                <NavButton
                    title={t.calendar}
                    icon={<Calendar size={20} />}
                    active={currentView === "calendar"}
                    onClick={() => setCurrentView("calendar")} />
                <NavButton
                    title={t.notes}
                    icon={<BookOpen size={20} />}
                    active={currentView === "notes"}
                    onClick={() => setCurrentView("notes")} />
                <div className="mt-auto flex flex-col items-center gap-3">
                    <NavButton
                        title={t.settings}
                        icon={<Settings size={20} />}
                        active={currentView === "settings"}
                        onClick={() => setCurrentView("settings")} />
                    {/* User Avatar */}
                    {user && (
                        <button
                            onClick={() => setAccountOpen(true)}
                            className="relative group outline-none"
                            title={user.displayName || user.email}
                        >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm transition-all group-hover:scale-105 group-hover:shadow-lg ${user.isPremium ? "ring-[3px] ring-amber-400 ring-offset-2" : ""} ${!user.avatarUrl ? `bg-gradient-to-br ${avatarGrad}` : "bg-cover bg-center"}`}
                                style={user.avatarUrl ? { backgroundImage: `url(${user.avatarUrl})` } : {}}
                            >
                                {!user.avatarUrl && displayChar}
                            </div>
                        </button>
                    )}
                </div>
            </div>
            <AccountModal isOpen={accountOpen} onClose={() => setAccountOpen(false)} />
        </>
    );
}

function NavButton({ icon, active, onClick, title }: { icon: React.ReactNode; active?: boolean; onClick?: () => void; title?: string }) {
    return (
        <button
            onClick={onClick}
            title={title || (active ? "Active" : "")}
            className={`p-3 rounded-xl transition-all ${active
                ? "bg-black text-white shadow-md relative"
                : "text-gray-500 hover:bg-gray-100 hover:text-black"
                }`}
        >
            {icon}
        </button>
    );
}
