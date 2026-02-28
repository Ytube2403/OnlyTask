"use client";

import { useTasks } from "@/context/TaskContext";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { AlertTriangle, Sparkles, X } from "lucide-react";
import { useState } from "react";

export function DeletionWarningBanner() {
    const { tasksAboutToExpire } = useTasks();
    const { user, upgradePremium } = useAuth();
    const { settings } = useSettings();
    const [dismissed, setDismissed] = useState(false);

    if (!settings.notifications.deletionWarnings) return null;
    if (!tasksAboutToExpire || tasksAboutToExpire.length === 0 || dismissed) return null;

    return (
        <div className="mx-4 mt-3 mb-1 animate-in slide-in-from-top-2 duration-300">
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 relative">
                <button
                    onClick={() => setDismissed(true)}
                    className="absolute top-3 right-3 p-1 text-amber-400 hover:text-amber-600 rounded-lg hover:bg-amber-100 transition-all"
                >
                    <X size={14} />
                </button>

                <div className="flex items-start gap-3 pr-6">
                    <div className="p-2 bg-amber-100 rounded-xl flex-shrink-0 mt-0.5">
                        <AlertTriangle size={16} className="text-amber-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-amber-800 mb-1">
                            {tasksAboutToExpire.length} task{tasksAboutToExpire.length > 1 ? "s" : ""} will be deleted soon
                        </h4>
                        <p className="text-xs text-amber-700/80 mb-2 leading-relaxed">
                            These older tasks will be removed in the next 3 days because they exceed your storage limit
                            {user?.isPremium ? " (1 year)" : " (3 months)"}.
                        </p>
                        <div className="space-y-1 mb-3 max-h-24 overflow-y-auto">
                            {tasksAboutToExpire.slice(0, 5).map((task) => (
                                <div key={String(task.id)} className="text-xs text-amber-800 truncate flex items-center gap-1.5">
                                    <span className="w-1 h-1 bg-amber-400 rounded-full flex-shrink-0" />
                                    {task.content}
                                </div>
                            ))}
                            {tasksAboutToExpire.length > 5 && (
                                <div className="text-xs text-amber-600 pl-2.5">
                                    +{tasksAboutToExpire.length - 5} more...
                                </div>
                            )}
                        </div>
                        {!user?.isPremium && (
                            <button
                                onClick={upgradePremium}
                                className="inline-flex items-center gap-1.5 bg-gradient-to-r from-amber-400 to-yellow-500 text-white text-xs font-semibold px-4 py-2 rounded-xl hover:from-amber-500 hover:to-yellow-600 transition-all shadow-sm shadow-amber-200/50"
                            >
                                <Sparkles size={12} />
                                Upgrade to Premium — Keep tasks for 1 year
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
