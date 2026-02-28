"use client";

import { useState } from "react";
import { useSettings } from "@/context/SettingsContext";
import { ArrowRight, ArrowLeft, Check, Sparkles, Layout, Zap, Lock } from "lucide-react";

export function OnboardingOverlay() {
    const { settings, updateSettings } = useSettings();
    const [step, setStep] = useState(0);

    // Only show if user has not seen onboarding
    if (settings.hasSeenOnboarding) return null;

    const completeOnboarding = () => {
        updateSettings({ hasSeenOnboarding: true });
    };

    const isVi = settings.language === "vi";

    const STEPS = [
        {
            id: "welcome",
            icon: <Sparkles className="w-12 h-12 text-black mb-6" />,
            title: isVi ? "Chào mừng đến với OnlyTask" : "Welcome to OnlyTask",
            description: isVi
                ? "Theo dõi công việc, chuẩn hoá quy trình và tối đa hoá sự tập trung, tất cả trong một không gian duy nhất."
                : "Track tasks, standardize processes, and maximize focus, all in a single clear workspace."
        },
        {
            id: "quick_add",
            icon: <Zap className="w-12 h-12 text-black mb-6" />,
            title: isVi ? "Thêm việc siêu tốc" : "Lightning Fast Entry",
            description: isVi
                ? "Bấm phím 'C' ở bất cứ đâu để tạo nhanh một việc mới. Dùng Cmd/Ctrl + Enter để lưu ngay lập tức mà không cần chạm chuột."
                : "Press 'C' anywhere to quickly add a new task. Use Cmd/Ctrl + Enter to save instantly without touching your mouse."
        },
        {
            id: "focus_mode",
            icon: <Layout className="w-12 h-12 text-black mb-6" />,
            title: isVi ? "Chế độ tập trung & SOPs" : "Focus Mode & SOPs",
            description: isVi
                ? "Chọn một công việc và bật bộ đếm giờ (Timer). Bạn có thể xem ngay tài liệu hướng dẫn (SOP) song song với công việc đang làm để tăng hiệu suất."
                : "Select a task and start the timer. You can view your Standard Operating Procedures (SOPs) side-by-side to boost your workflow."
        },
        {
            id: "data_privacy",
            icon: <Lock className="w-12 h-12 text-black mb-6" />,
            title: isVi ? "Dữ liệu riêng tư & Đồng bộ" : "Privacy & Sync",
            description: isVi
                ? "Phiên bản cơ bản lưu trữ dữ liệu của bạn ngay trên trình duyệt (đảm bảo riêng tư). Nâng cấp Premium để đồng bộ lên máy chủ đám mây an toàn."
                : "The free tier stores data locally on your browser for ultimate privacy. Upgrade to Premium for secure cross-device cloud sync."
        }
    ];

    const currentStep = STEPS[step];
    const isLastStep = step === STEPS.length - 1;

    return (
        <div className="fixed inset-0 z-[200] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-500">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden relative">

                {/* Decorative BG */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-lime-100 rounded-full blur-3xl opacity-50 pointer-events-none" />

                <div className="p-10 flex flex-col items-center text-center relative z-10 min-h-[360px] justify-center">

                    {/* Step Content */}
                    <div className="animate-in slide-in-from-right-4 fade-in duration-300 flex flex-col items-center" key={currentStep.id}>
                        {currentStep.icon}
                        <h2 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">
                            {currentStep.title}
                        </h2>
                        <p className="text-gray-500 font-medium text-base leading-relaxed max-w-sm">
                            {currentStep.description}
                        </p>
                    </div>

                </div>

                {/* Footer Controls */}
                <div className="flex items-center justify-between p-6 border-t border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-2">
                        {STEPS.map((_, i) => (
                            <div
                                key={i}
                                className={`h-2 rounded-full transition-all duration-300 ${i === step ? "w-6 bg-black" : "w-2 bg-gray-200"}`}
                            />
                        ))}
                    </div>

                    <div className="flex items-center gap-3">
                        {step > 0 ? (
                            <button
                                onClick={() => setStep(s => s - 1)}
                                className="p-3 text-gray-400 hover:text-black hover:bg-gray-100 rounded-xl transition-all"
                            >
                                <ArrowLeft size={20} />
                            </button>
                        ) : (
                            <button
                                onClick={completeOnboarding}
                                className="px-4 py-3 text-sm font-semibold text-gray-400 hover:text-gray-600 transition-all"
                            >
                                {isVi ? "Bỏ qua" : "Skip"}
                            </button>
                        )}

                        <button
                            onClick={() => {
                                if (isLastStep) completeOnboarding();
                                else setStep(s => s + 1);
                            }}
                            className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
                        >
                            {isLastStep ? (isVi ? "Bắt đầu ngay" : "Get Started") : (isVi ? "Tiếp tục" : "Next")}
                            {isLastStep ? <Check size={16} /> : <ArrowRight size={16} />}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
