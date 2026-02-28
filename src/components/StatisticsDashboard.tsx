"use client";

import { useMemo, useState } from "react";
import { useTasks } from "@/context/TaskContext";
import { isAfter, subDays, startOfWeek, startOfMonth } from "date-fns";
import { CheckCircle2, Clock, Star } from "lucide-react";
import { useSettings } from "@/context/SettingsContext";

type TimePreset = "7_days" | "this_week" | "this_month";

export function StatisticsDashboard() {
    const { tasks } = useTasks();
    const { settings } = useSettings();
    const [preset, setPreset] = useState<TimePreset>("7_days");

    // Filter tasks based on preset
    const filteredTasks = useMemo(() => {
        const now = new Date();
        const cutoffDate = (() => {
            switch (preset) {
                case "7_days":
                    return subDays(now, 7);
                case "this_week":
                    return startOfWeek(now, { weekStartsOn: 1 }); // Monday start
                case "this_month":
                    return startOfMonth(now);
                default:
                    return subDays(now, 7);
            }
        })();

        return tasks.filter(task => {
            if (task.columnId !== "done" || !task.completionDate) return false;
            return isAfter(new Date(task.completionDate), cutoffDate);
        });
    }, [tasks, preset]);

    // Calculate metrics
    const metrics = useMemo(() => {
        const _completed = filteredTasks.length;

        let _estMinutes = 0;
        let _actualSeconds = 0;
        let _totalScore = 0;
        let _scoreCount = 0;

        filteredTasks.forEach(task => {
            // Estimated time parse
            if (task.time) {
                const isHours = task.time.includes('h');
                const isMinutes = task.time.includes('m');
                const val = parseFloat(task.time);
                if (!isNaN(val)) {
                    if (isHours) _estMinutes += val * 60;
                    else if (isMinutes) _estMinutes += val;
                }
            }

            // Actual time parse
            if (task.actualTimeSeconds) {
                _actualSeconds += task.actualTimeSeconds;
            }

            if (task.score) {
                _totalScore += task.score;
                _scoreCount++;
            }
        });

        const _avgScore = _scoreCount > 0 ? (_totalScore / _scoreCount).toFixed(1) : "0.0";

        // Finalize Est
        const _estH = Math.floor(_estMinutes / 60);
        const _estM = Math.round(_estMinutes % 60);
        const _estStr = _estH > 0 ? `${_estH}h ${_estM}m` : `${_estM}m`;

        // Finalize Actual
        const _actH = Math.floor(_actualSeconds / 3600);
        const _actM = Math.floor((_actualSeconds % 3600) / 60);
        const _actStr = _actH > 0 ? `${_actH}h ${_actM}m` : `${_actM}m`;

        return {
            completed: _completed,
            estSpent: _estStr,
            actualSpent: _actStr,
            avgScore: _avgScore
        };
    }, [filteredTasks]);

    // Calculate Tag Distribution for Donut Chart
    const tagDistribution = useMemo(() => {
        const map: Record<string, number> = {};
        filteredTasks.forEach(t => {
            const tagName = t.tag || "Untagged";
            map[tagName] = (map[tagName] || 0) + 1;
        });

        // Convert map to array and sort
        const sorted = Object.entries(map)
            .map(([name, count]) => ({ name, count }))
            .sort((a, b) => b.count - a.count);

        return sorted;
    }, [filteredTasks]);

    // Basic Color Palette for Tags
    const getColorForTag = (index: number) => {
        const colors = [
            "#a3e635", // lime-400
            "#f472b6", // rose-400
            "#38bdf8", // blue-400
            "#facc15", // yellow-400
            "#c084fc", // sky-400
            "#a78bfa", // purple-400
        ];
        return colors[index % colors.length];
    };

    // Calculate Conic Gradient String
    const conicGradient = useMemo(() => {
        if (tagDistribution.length === 0) return "conic-gradient(#f3f4f6 0% 100%)";

        let gradientStr = [];
        let currentPercent = 0;
        const total = tagDistribution.reduce((acc, curr) => acc + curr.count, 0);

        for (let i = 0; i < tagDistribution.length; i++) {
            const item = tagDistribution[i];
            const percentage = (item.count / total) * 100;
            const color = getColorForTag(i);
            gradientStr.push(`${color} ${currentPercent}% ${currentPercent + percentage}%`);
            currentPercent += percentage;
        }

        return `conic-gradient(${gradientStr.join(", ")})`;
    }, [tagDistribution]);

    const t = settings.language === "vi" ? {
        title: "Tổng quan hiệu suất",
        p7days: "7 Ngày qua",
        pThisWeek: "Tuần này",
        pThisMonth: "Tháng này",
        tasksDone: "Hoàn thành",
        actualHours: "Giờ thực tế",
        avgScore: "Điểm TB",
        charts: "Biểu đồ hiệu suất",
        yLabel: "Hoàn thành",
    } : {
        title: "Performance Overview",
        p7days: "Last 7 Days",
        pThisWeek: "This Week",
        pThisMonth: "This Month",
        tasksDone: "Tasks Done",
        actualHours: "Actual Hours",
        avgScore: "Avg Score",
        charts: "Performance Charts",
        yLabel: "Completed",
    };

    return (
        <div className="w-full h-full bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <h2 className="text-xl font-bold text-gray-900">{t.title}</h2>
                <div className="flex bg-gray-100 p-1 rounded-xl">
                    <button
                        onClick={() => setPreset("7_days")}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${preset === "7_days" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        {t.p7days}
                    </button>
                    <button
                        onClick={() => setPreset("this_week")}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${preset === "this_week" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        {t.pThisWeek}
                    </button>
                    <button
                        onClick={() => setPreset("this_month")}
                        className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${preset === "this_month" ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                    >
                        {t.pThisMonth}
                    </button>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
                {/* Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 shrink-0">
                    <div className="bg-gradient-to-br from-lime-50 to-lime-100 p-6 rounded-2xl border border-lime-200/50 flex flex-col items-center justify-center text-center">
                        <CheckCircle2 className="text-lime-600 mb-3" size={28} />
                        <span className="text-blue-900 font-medium text-sm mb-1">{t.tasksDone}</span>
                        <span className="text-3xl font-black text-lime-950">{metrics.completed}</span>
                    </div>
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-2xl border border-blue-200/50 flex flex-col items-center justify-center text-center">
                        <Clock className="text-blue-600 mb-3" size={28} />
                        <span className="text-blue-900 font-medium text-sm mb-1">{t.actualHours}</span>
                        <span className="text-3xl font-black text-blue-950">{metrics.actualSpent}</span>
                    </div>
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl border border-yellow-200/50 flex flex-col items-center justify-center text-center">
                        <Star className="text-yellow-600 mb-3" size={28} />
                        <span className="text-yellow-900 font-medium text-sm mb-1">{t.avgScore}</span>
                        <span className="text-3xl font-black text-yellow-950">{metrics.avgScore}<span className="text-xl font-bold text-yellow-800 ml-1">/10</span></span>
                    </div>
                </div>

                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 flex-1 min-h-0 flex flex-col">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-6 text-center">Focus Distribution</h3>
                    <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 min-h-[200px]">
                        {/* Donut Visual */}
                        <div className="relative w-56 h-56 flex-shrink-0">
                            {/* The Colorful Ring */}
                            <div
                                className="absolute inset-0 rounded-full"
                                style={{ background: conicGradient }}
                            />
                            {/* The Inner Cutout (Mask) */}
                            <div className="absolute inset-5 rounded-full bg-gray-50 flex items-center justify-center">
                                <div className="flex flex-col items-center">
                                    <span className="text-2xl font-black text-gray-900">{metrics.completed}</span>
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tasks</span>
                                </div>
                            </div>
                        </div>

                        {/* Chart Legend */}
                        <div className="flex flex-col gap-3 w-full lg:w-auto">
                            {tagDistribution.length === 0 ? (
                                <p className="text-sm text-gray-400 px-4 text-center">No tasks completed in this period.</p>
                            ) : (
                                tagDistribution.map((item, idx) => (
                                    <div key={item.name} className="flex items-center justify-between gap-6 px-2">
                                        <div className="flex items-center gap-2">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: getColorForTag(idx) }} />
                                            <span className="text-sm font-semibold text-gray-700">{item.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-gray-400 tabular-nums">
                                            {Math.round((item.count / metrics.completed) * 100)}%
                                        </span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>

                {/* Charts Area Placeholder */}
                <div className="flex-1 min-h-[250px] bg-gray-50 rounded-2xl border border-gray-100 p-6 flex flex-col">
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest mb-4 text-center">{t.charts}</h3>
                    <div className="flex-1 flex flex-col lg:flex-row items-center justify-center gap-8 min-h-[200px]">
                        {filteredTasks.length === 0 ? (
                            <div className="text-center text-gray-400 font-medium">No data in this period.</div>
                        ) : (
                            <div className="flex items-end gap-3 h-40 w-full max-w-lg mx-auto">
                                {/* Simple Bar Chart visualization based on mock data */}
                                <div className="flex-1 bg-lime-200 rounded-t-lg relative group transition-all hover:bg-lime-300" style={{ height: '100%' }}>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        {metrics.completed} {t.tasksDone}
                                    </div>
                                    <div className="absolute -bottom-6 w-full text-center text-xs font-bold text-gray-500">To Do</div>
                                </div>
                                <div className="flex-1 bg-blue-200 rounded-t-lg relative group transition-all hover:bg-blue-300" style={{ height: '70%' }}>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        {metrics.actualSpent}
                                    </div>
                                    <div className="absolute -bottom-6 w-full text-center text-xs font-bold text-gray-500">In Progress</div>
                                </div>
                                <div className="flex-1 bg-yellow-200 rounded-t-lg relative group transition-all hover:bg-yellow-300" style={{ height: '85%' }}>
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-xs py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                                        {metrics.avgScore}/10 Score
                                    </div>
                                    <div className="absolute -bottom-6 w-full text-center text-xs font-bold text-gray-500">Done</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}
