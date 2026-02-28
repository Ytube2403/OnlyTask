"use client";

import { KanbanBoard } from "../kanban/KanbanBoard";
import { SOPEditor } from "../SOPEditor";
import { StatisticsDashboard } from "../StatisticsDashboard";
import { Star } from "lucide-react";
import { useState, useEffect } from "react";
import { useTasks } from "@/context/TaskContext";
import { useSOPs } from "@/context/SOPContext";
import { useSettings } from "@/context/SettingsContext";

export function Workspace() {
    const { activeTask, setActiveTask, moveTask, triggerReview, updateTask } = useTasks();
    const { sops } = useSOPs();
    const { settings } = useSettings();
    const [sopOpen, setSopOpen] = useState(false);
    const [statsOpen, setStatsOpen] = useState(false);
    const [timerRunning, setTimerRunning] = useState(false);
    const [time, setTime] = useState(0);

    const linkedSop = activeTask?.linkedSopIds?.[0] ? sops.find(s => s.id === activeTask.linkedSopIds![0]) : null;

    // Reset timer when active task changes
    useEffect(() => {
        setTimerRunning(false);
        setTime(0);
    }, [activeTask?.id]);

    // Accurate timer logic resistant to background tab throttling
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timerRunning) {
            // Note: time is the accumulated seconds so far. We capture it exactly ONCE when the timer starts.
            const logicalStartTime = Date.now() - (time * 1000);
            interval = setInterval(() => {
                setTime(Math.floor((Date.now() - logicalStartTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timerRunning]); // intentionally omitting 'time' so it acts as initial state for the interval run

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStopTimer = () => {
        if (activeTask && time > 0) {
            updateTask(activeTask.id.toString(), {
                actualTimeSeconds: (activeTask.actualTimeSeconds || 0) + time
            });
        }
        setTimerRunning(false);
        setTime(0);
    };

    const t = settings.language === "vi" ? {
        focus: "Đang tập trung",
        noTask: "Chưa chọn công việc",
        selectTask: "Hãy chọn một công việc từ bảng bên dưới hoặc Lịch để bắt đầu tính giờ.",
        sopLink: "Quy trình (SOP)",
        noSop: "Chưa gắn SOP",
        complete: "Hoàn thành",
        startTimer: "Bắt đầu",
        stopTimer: "Dừng"
    } : {
        focus: "Active Focus",
        noTask: "No active task selected",
        selectTask: "Select a task from your inbox or calendar to start working.",
        sopLink: "Linked SOP:",
        noSop: "No SOP linked",
        complete: "Complete Task",
        startTimer: "Start Timer",
        stopTimer: "Stop Timer"
    };

    return (
        <div className="flex-1 h-full bg-neutral-50 p-6 sm:p-10 overflow-y-auto flex flex-col relative w-full">
            {/* Top Banner (Hero Section for Star Task & Timer) */}
            <div className="w-full bg-white border border-gray-200 rounded-3xl p-8 mb-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 flex-shrink-0">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-4">
                        <span className="px-3 py-1.5 bg-lime-200 text-lime-900 rounded-lg text-sm font-bold uppercase tracking-wider">
                            {t.focus}
                        </span>
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-black text-gray-900 mb-2 tracking-tight">
                        {activeTask ? activeTask.content : t.noTask}
                    </h1>
                    <p className="text-gray-500 font-medium">
                        {activeTask
                            ? (linkedSop ? <span className="flex items-center gap-2 text-blue-600 cursor-pointer hover:underline" onClick={() => setSopOpen(true)}>{t.sopLink} {linkedSop.title}</span> : t.noSop)
                            : t.selectTask}
                    </p>
                </div>

                <div className="flex flex-col items-start md:items-end gap-5 min-w-[240px]">
                    <div className="flex items-center gap-4">
                        <div className="text-5xl font-black tabular-nums tracking-tighter text-gray-900 min-w-[140px] text-right">
                            {formatTime(time)}
                        </div>
                        {activeTask && (
                            <button
                                onClick={() => activeTask && triggerReview(activeTask)}
                                className="p-3 bg-gray-100 text-gray-700 hover:bg-lime-200 hover:text-lime-900 rounded-2xl transition-all shadow-sm group"
                                title={t.complete}
                            >
                                <Star className="group-hover:fill-current" size={24} />
                            </button>
                        )}
                    </div>
                    <div className="flex gap-2 w-full">
                        <button
                            onClick={() => {
                                setSopOpen(false);
                                setStatsOpen(!statsOpen);
                            }}
                            className={`flex-1 py-3 px-4 rounded-2xl text-sm font-bold shadow-sm transition-all ${statsOpen ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                            Stats
                        </button>
                        <button
                            onClick={() => {
                                setStatsOpen(false);
                                setSopOpen(!sopOpen);
                            }}
                            className={`flex-1 py-3 px-4 rounded-2xl text-sm font-bold shadow-sm transition-all ${sopOpen ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}`}>
                            SOP
                        </button>
                        <button
                            disabled={!activeTask}
                            onClick={() => {
                                if (timerRunning) {
                                    handleStopTimer();
                                } else {
                                    setTimerRunning(true);
                                }
                            }}
                            className={`flex-[2] flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-sm font-bold shadow-sm transition-all ${timerRunning
                                ? "bg-red-500 text-white hover:bg-red-600 shadow-red-500/20"
                                : "bg-black text-white hover:bg-gray-800"
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                            {timerRunning && <div className="w-2.5 h-2.5 rounded-full bg-white animate-pulse" />}
                            {!timerRunning && <div className="w-2.5 h-2.5 rounded-full bg-green-400" />}
                            {timerRunning ? t.stopTimer : t.startTimer}
                        </button>
                    </div>
                </div>
            </div>

            {/* Bottom Section (Kanban Board & Panels Split View) */}
            <div className="flex-1 relative min-h-[500px] flex overflow-hidden gap-6">
                <div className={`transition-all duration-300 ${sopOpen || statsOpen ? 'w-[55%]' : 'w-full'} overflow-x-auto`}>
                    <KanbanBoard />
                </div>

                {/* SOP Editor Panel */}
                {
                    sopOpen && (
                        <div className="w-[45%] h-full animate-in slide-in-from-right-8 duration-300 relative rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                            <SOPEditor
                                sopId={linkedSop?.id}
                                initialTitle={linkedSop?.title || "Start writing..."}
                                initialContent={linkedSop?.content || ""}
                                onClose={() => setSopOpen(false)}
                            />
                        </div>
                    )
                }

                {/* Statistics Dashboard Panel */}
                {
                    statsOpen && (
                        <div className="w-[45%] h-full animate-in slide-in-from-right-8 duration-300 relative">
                            <StatisticsDashboard />
                        </div>
                    )
                }
            </div >

            {/* Focus Mode Fullscreen Overlay */}
            {
                timerRunning && (
                    <div className="fixed inset-0 z-50 bg-neutral-950 text-white flex flex-col p-6 sm:p-12 overflow-y-auto animate-in fade-in duration-300">
                        <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col">

                            {/* Top Section */}
                            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12">
                                <div className="flex-1">
                                    <span className="px-3 py-1.5 bg-neutral-800 text-neutral-300 rounded-lg text-sm font-bold uppercase tracking-wider mb-4 inline-block">
                                        {activeTask ? activeTask.columnId.toString().replace('_', ' ') : "Focus Mode"}
                                    </span>
                                    <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-tight text-white">
                                        {activeTask?.content}
                                    </h1>
                                </div>

                                <div className="flex flex-col items-start xl:items-end w-full xl:w-auto">
                                    <div className="text-[6rem] sm:text-[8rem] font-black tracking-tighter tabular-nums leading-none text-lime-400 drop-shadow-[0_0_40px_rgba(163,230,53,0.15)]">
                                        {formatTime(time)}
                                    </div>
                                    <div className="flex gap-4 mt-6 w-full sm:w-auto">
                                        <button
                                            onClick={handleStopTimer}
                                            className="flex-1 sm:flex-none px-8 py-4 bg-neutral-800 text-white rounded-2xl text-base font-bold hover:bg-neutral-700 transition-all focus:outline-none"
                                        >
                                            Pause & Save
                                        </button>
                                        <button
                                            onClick={() => {
                                                const finalTime = time;
                                                handleStopTimer();

                                                if (activeTask && activeTask.columnId !== "done") {
                                                    moveTask(activeTask.id.toString(), "", "done");
                                                    // Make sure to pass along the accumulated time too
                                                    const updatedTask = {
                                                        ...activeTask,
                                                        columnId: "done",
                                                        actualTimeSeconds: (activeTask.actualTimeSeconds || 0) + finalTime
                                                    };
                                                    setActiveTask(updatedTask);
                                                    triggerReview(updatedTask);
                                                }
                                            }}
                                            className="flex-[2] sm:flex-none px-8 py-4 bg-lime-400 text-black rounded-2xl text-base font-bold hover:bg-lime-500 transition-all focus:outline-none"
                                        >
                                            Finish Task
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Content Section */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                                {/* SOP / Notes panel in dark mode */}
                                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 flex flex-col">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-xl font-bold text-neutral-100 flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-400">📝</span>
                                            SOP & Notes
                                        </h3>
                                    </div>
                                    <div className="prose prose-invert prose-neutral prose-sm max-w-none text-neutral-400 flex-1">
                                        {linkedSop ? (
                                            <div dangerouslySetInnerHTML={{ __html: linkedSop.content }} />
                                        ) : (
                                            <>
                                                <p className="text-base text-neutral-300">Hướng dẫn chi tiết lúc đang tập trung:</p>
                                                <ul className="space-y-2 mt-4 text-base">
                                                    <li>Tắt hết các tab không liên quan.</li>
                                                    <li>Cắm tai nghe nếu cần sự yên tĩnh tối đa.</li>
                                                    <li>Chỉ đổi trạng thái "Done" khi đã kiểm tra chất lượng ít nhất 1 lần (QA).</li>
                                                </ul>
                                            </>
                                        )}
                                    </div>
                                </div>

                                {/* Subtasks */}
                                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 flex flex-col">
                                    <div className="flex items-center justify-between mb-8">
                                        <h3 className="text-xl font-bold text-neutral-100 flex items-center gap-3">
                                            <span className="w-8 h-8 rounded-lg bg-neutral-800 flex items-center justify-center text-neutral-400">✅</span>
                                            Checklist
                                        </h3>
                                        <span className="px-3 py-1 bg-neutral-800 text-neutral-300 rounded-lg text-sm font-bold">1 / 3</span>
                                    </div>

                                    <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-2">
                                        {/* Mocked Checklists */}
                                        <div className="flex items-start gap-4 p-4 rounded-2xl bg-neutral-800 border border-neutral-700 cursor-pointer group">
                                            <div className="w-6 h-6 rounded-full bg-lime-400 flex items-center justify-center mt-0.5 flex-shrink-0">
                                                <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                            </div>
                                            <span className="text-neutral-400 font-medium line-through">Chuẩn bị tài nguyên và input</span>
                                        </div>

                                        {['Triển khai theo yêu cầu', 'Kiểm tra chất lượng Output'].map((task, i) => (
                                            <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-neutral-900 border border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800/50 transition-all cursor-pointer group">
                                                <div className="w-6 h-6 rounded-full border-2 border-neutral-600 flex items-center justify-center mt-0.5 flex-shrink-0 group-hover:border-lime-400 transition-colors">
                                                </div>
                                                <span className="text-neutral-200 font-medium">{task}</span>
                                            </div>
                                        ))}

                                        <div className="mt-4 flex items-center gap-3">
                                            <button className="flex items-center gap-3 text-sm font-bold text-neutral-400 hover:text-white transition-colors bg-transparent border-none p-2 w-full text-left">
                                                <span className="w-8 h-8 rounded-full border border-dashed border-neutral-600 flex items-center justify-center">+</span>
                                                Add Subtask...
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    </div>
                )
            }
        </div >
    );
}
