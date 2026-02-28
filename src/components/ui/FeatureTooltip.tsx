"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { AppSettings } from "@/types";

interface FeatureTooltipProps {
    feature: keyof AppSettings["seenFeatures"];
    title: string;
    description: string;
    shortcuts?: { key: string; desc: string }[];
}

export function FeatureTooltip({ feature, title, description, shortcuts }: FeatureTooltipProps) {
    const { settings, markFeatureSeen } = useSettings();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        // Slight delay so the view renders first before the tooltip pops in
        const t = setTimeout(() => {
            if (!settings.seenFeatures[feature]) setVisible(true);
        }, 600);
        return () => clearTimeout(t);
    }, [feature, settings.seenFeatures]);

    const dismiss = () => {
        setVisible(false);
        markFeatureSeen(feature);
    };

    if (!visible) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[100] w-80 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="bg-gray-900 text-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-start justify-between p-4 pb-2">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
                        <span className="text-xs font-bold uppercase tracking-widest text-lime-400">
                            Mẹo sử dụng
                        </span>
                    </div>
                    <button
                        onClick={dismiss}
                        className="text-gray-500 hover:text-white transition-colors p-0.5 rounded-lg hover:bg-gray-700"
                    >
                        <X size={14} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-4 pb-4">
                    <h3 className="text-sm font-bold text-white mb-1">{title}</h3>
                    <p className="text-xs text-gray-400 leading-relaxed">{description}</p>

                    {shortcuts && shortcuts.length > 0 && (
                        <div className="mt-3 flex flex-col gap-1.5">
                            {shortcuts.map((s) => (
                                <div key={s.key} className="flex items-center justify-between">
                                    <span className="text-xs text-gray-400">{s.desc}</span>
                                    <kbd className="px-2 py-0.5 bg-gray-800 border border-gray-700 rounded text-xs font-mono text-gray-300">
                                        {s.key}
                                    </kbd>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 pb-4">
                    <button
                        onClick={dismiss}
                        className="w-full py-2 bg-lime-400 text-black rounded-xl text-xs font-bold hover:bg-lime-500 transition-all"
                    >
                        Đã hiểu, bắt đầu thôi!
                    </button>
                </div>
            </div>
        </div>
    );
}
