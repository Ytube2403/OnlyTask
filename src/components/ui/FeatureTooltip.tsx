"use client";

import { useEffect, useState } from "react";
import { X, CheckCircle2 } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";
import { AppSettings } from "@/types";

interface FeatureTooltipProps {
    feature: keyof AppSettings["seenFeatures"];
    title: string;
    bullets: string[];
    shortcuts?: { key: string; desc: string }[];
}

export function FeatureTooltip({ feature, title, bullets, shortcuts }: FeatureTooltipProps) {
    const { settings, markFeatureSeen } = useSettings();
    const [visible, setVisible] = useState(false);

    useEffect(() => {
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
        <div className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden relative animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-6 pb-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-full bg-black animate-pulse" />
                        <h3 className="text-xl font-black text-gray-900 tracking-tight">{title}</h3>
                    </div>
                    <button
                        onClick={dismiss}
                        className="text-gray-400 hover:text-black hover:bg-gray-100 transition-colors p-1.5 rounded-xl"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6">
                    <div className="flex flex-col gap-3 mb-6">
                        {bullets.map((bullet, idx) => (
                            <div key={idx} className="flex items-start gap-3">
                                <CheckCircle2 className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                                <span className="text-gray-600 font-medium leading-relaxed">{bullet}</span>
                            </div>
                        ))}
                    </div>

                    {shortcuts && shortcuts.length > 0 && (
                        <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex flex-col gap-2">
                            <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Phím tắt</h4>
                            {shortcuts.map((s) => (
                                <div key={s.key} className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-600">{s.desc}</span>
                                    <kbd className="px-2.5 py-1 bg-white border border-gray-200 shadow-sm rounded-lg text-xs font-bold font-mono text-gray-700">
                                        {s.key}
                                    </kbd>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 pt-0">
                    <button
                        onClick={dismiss}
                        className="w-full py-3.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                    >
                        Đã hiểu, bắt đầu thôi!
                    </button>
                </div>
            </div>
        </div>
    );
}
