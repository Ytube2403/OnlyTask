"use client";

import { KanbanBoard } from "../kanban/KanbanBoard";
import { SOPEditor } from "../SOPEditor";
import { StatisticsDashboard } from "../StatisticsDashboard";
import { Star, Trash2 } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { useTasks } from "@/context/TaskContext";
import { useSOPs } from "@/context/SOPContext";
import { useSettings } from "@/context/SettingsContext";
import { FeatureTooltip } from "@/components/ui/FeatureTooltip";
import { ChevronDown } from "lucide-react";

export function Workspace() {
    const { activeTask, setActiveTask, moveTask, triggerReview, updateTask } = useTasks();
    const { sops } = useSOPs();
    const { settings } = useSettings();
    const [sopOpen, setSopOpen] = useState(false);
    const [statsOpen, setStatsOpen] = useState(false);
    const [timerRunning, setTimerRunning] = useState(false);
    const [time, setTime] = useState(0);
    const [mounted, setMounted] = useState(false);

    // Subtask States
    const [subtaskInput, setSubtaskInput] = useState("");
    const [isAddingSubtask, setIsAddingSubtask] = useState(false);
    const subtaskInputRef = useRef<HTMLInputElement>(null);

    const linkedSop = activeTask?.linkedSopIds?.[0] ? sops.find(s => s.id === activeTask.linkedSopIds![0]) : null;

    useEffect(() => {
        setMounted(true);
    }, []);

    // Focus subtask input
    useEffect(() => {
        if (isAddingSubtask && subtaskInputRef.current) {
            subtaskInputRef.current.focus();
        }
    }, [isAddingSubtask]);

    // Subtask Handlers
    const handleAddSubtask = () => {
        if (!activeTask || !subtaskInput.trim()) {
            setIsAddingSubtask(false);
            return;
        }
        const newSubtask = { id: window.crypto.randomUUID(), title: subtaskInput.trim(), completed: false };
        updateTask(activeTask.id.toString(), {
            subtasks: [...(activeTask.subtasks || []), newSubtask]
        });
        setSubtaskInput("");
        setIsAddingSubtask(false);
    };

    const toggleSubtask = (subtaskId: string) => {
        if (!activeTask) return;
        const updated = (activeTask.subtasks || []).map(st =>
            st.id === subtaskId ? { ...st, completed: !st.completed } : st
        );
        updateTask(activeTask.id.toString(), { subtasks: updated });
    };

    const deleteSubtask = (subtaskId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!activeTask) return;
        const updated = (activeTask.subtasks || []).filter(st => st.id !== subtaskId);
        updateTask(activeTask.id.toString(), { subtasks: updated });
    };

    // Restore timer if it was running before reload
    useEffect(() => {
        if (!activeTask) {
            setTimerRunning(false);
            setTime(0);
            return;
        }

        const savedStart = localStorage.getItem(`timer_start_${activeTask.id}`);
        if (savedStart) {
            const logicalStartTime = parseInt(savedStart, 10);
            const elapsed = Math.floor((Date.now() - logicalStartTime) / 1000);
            setTime(Math.max(0, elapsed));
            setTimerRunning(true);
        } else {
            setTimerRunning(false);
            setTime(activeTask.actualTimeSeconds || 0);
        }
    }, [activeTask?.id]);

    // Accurate timer logic resistant to background tab throttling
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (timerRunning && activeTask) {
            let logicalStartTime = parseInt(localStorage.getItem(`timer_start_${activeTask.id}`) || "0", 10);
            if (!logicalStartTime) {
                logicalStartTime = Date.now() - (time * 1000);
                localStorage.setItem(`timer_start_${activeTask.id}`, logicalStartTime.toString());
            }

            interval = setInterval(() => {
                setTime(Math.floor((Date.now() - logicalStartTime) / 1000));
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [timerRunning, activeTask?.id]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    };

    const handleStopTimer = () => {
        if (activeTask && time > 0) {
            updateTask(activeTask.id.toString(), {
                actualTimeSeconds: time
            });
            localStorage.removeItem(`timer_start_${activeTask.id}`);
        }
        setTimerRunning(false);
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
        <>
            <div className="flex-1 h-[calc(100vh-72px)] md:h-full bg-neutral-50 p-2 md:p-4 sm:p-6 md:p-10 overflow-y-auto flex-col relative w-full flex">

                {/* Desktop Top Banner (Hero Section for Star Task & Timer) */}
                <div className="hidden md:flex w-full bg-white border border-gray-200 rounded-3xl p-6 md:p-8 mb-6 md:mb-8 shadow-sm flex-col xl:flex-row items-start xl:items-center justify-between gap-6 flex-shrink-0">
                    <div className="flex-1 w-full">
                        <div className="flex items-center gap-2 mb-4">
                            <button onClick={() => setActiveTask(null)} className="md:hidden px-3 py-1.5 bg-gray-200 text-gray-800 rounded-lg text-sm font-bold tracking-wider flex items-center justify-center">
                                ← Back
                            </button>
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

                    <div className="flex flex-col items-start xl:items-end gap-5 w-full xl:w-auto min-w-[240px]">
                        <div className="flex items-center justify-between xl:justify-end w-full gap-4">
                            <div className="text-5xl font-black tabular-nums tracking-tighter text-gray-900 min-w-[140px] text-left xl:text-right">
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
                <div className="flex-1 relative h-full min-h-[500px] flex flex-col lg:flex-row overflow-hidden gap-6">
                    <div className={`transition-all duration-300 ${sopOpen || statsOpen ? 'hidden lg:block lg:w-[55%]' : 'w-full'} overflow-x-auto overflow-y-hidden pb-4 md:pb-0 h-full`}>
                        <KanbanBoard />
                    </div>

                    {/* SOP Editor Panel */}
                    {
                        sopOpen && (
                            <div className="w-full lg:w-[45%] h-[500px] lg:h-full animate-in slide-in-from-bottom-8 lg:slide-in-from-right-8 duration-300 relative rounded-xl border border-gray-200 overflow-hidden shadow-sm flex-shrink-0">
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
                            <div className="hidden lg:flex w-full lg:w-[45%] h-[500px] lg:h-full animate-in slide-in-from-bottom-8 lg:slide-in-from-right-8 duration-300 relative flex-shrink-0">
                                <StatisticsDashboard />
                            </div>
                        )
                    }
                </div >

                {/* Mobile Bottom Sheet for Workspace Details (Only Client-Side) */}
                {mounted && !!activeTask && (
                    <div
                        className="md:hidden fixed inset-0 z-50 bg-black/40 animate-in fade-in duration-200"
                        onClick={() => {
                            if (!timerRunning) {
                                setTimeout(() => setActiveTask(null), 300);
                            }
                        }}
                    >
                        <div
                            className="absolute bottom-0 left-0 w-full h-[82vh] bg-white rounded-t-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-full duration-300"
                            onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
                        >
                            <div className="w-full flex justify-center py-3"
                                onClick={() => {
                                    if (!timerRunning) {
                                        setTimeout(() => setActiveTask(null), 300);
                                    }
                                }}>
                                <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
                            </div>

                            {/* Sticky Timer Area in Bottom Sheet */}
                            <div className="sticky top-0 bg-white/90 backdrop-blur-md px-6 pb-4 border-b border-gray-100 z-10 flex flex-col">
                                <h1 className="text-xl font-bold text-gray-900 mb-1 tracking-tight line-clamp-1">
                                    {activeTask?.content}
                                </h1>
                                <p className="text-gray-500 font-medium text-sm mb-4 line-clamp-1">
                                    {linkedSop ? <span className="text-blue-600 font-medium">{t.sopLink} {linkedSop.title}</span> : t.noSop}
                                </p>

                                <div className="flex items-center justify-between">
                                    <div className={`text-4xl font-black tabular-nums tracking-tighter transition-colors ${timerRunning ? 'text-lime-500 drop-shadow-[0_0_15px_rgba(163,230,53,0.5)]' : 'text-gray-900'}`}>
                                        {formatTime(time)}
                                    </div>
                                    <button
                                        disabled={!activeTask}
                                        onClick={() => {
                                            if (timerRunning) {
                                                handleStopTimer();
                                            } else {
                                                setTimerRunning(true);
                                            }
                                        }}
                                        className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg transition-all ${timerRunning
                                            ? "bg-red-50 text-red-500 ring-2 ring-red-500 hover:bg-red-100 shadow-red-500/20"
                                            : "bg-black text-white hover:scale-105"
                                            }`}
                                    >
                                        {timerRunning ? <div className="w-4 h-4 bg-red-500 rounded-sm" /> : <div className="w-0 h-0 border-t-[8px] border-t-transparent border-l-[12px] border-l-white border-b-[8px] border-b-transparent ml-1" />}
                                    </button>
                                </div>

                                {timerRunning && (
                                    <button
                                        onClick={() => {
                                            const finalTime = time;
                                            handleStopTimer();

                                            if (activeTask && activeTask.columnId !== "done") {
                                                moveTask(activeTask.id.toString(), "", "done");
                                                const updatedTask = {
                                                    ...activeTask,
                                                    columnId: "done",
                                                    actualTimeSeconds: (activeTask.actualTimeSeconds || 0) + finalTime
                                                };
                                                setActiveTask(updatedTask);
                                                triggerReview(updatedTask);
                                            }
                                        }}
                                        className="mt-4 w-full py-3 bg-lime-400 text-black rounded-xl text-sm font-bold hover:bg-lime-500 transition-all shadow-sm flex items-center justify-center gap-2"
                                    >
                                        <Star size={18} className="fill-black" />
                                        Complete
                                    </button>
                                )}
                            </div>

                            {/* Scrollable SOP Content inside Bottom Sheet */}
                            <div className="flex-1 overflow-y-auto p-6">
                                {linkedSop ? (
                                    <div className="prose prose-sm prose-gray max-w-none">
                                        <div dangerouslySetInnerHTML={{ __html: linkedSop.content }} />
                                    </div>
                                ) : (
                                    <div className="flex flex-col items-center justify-center text-center mt-10">
                                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                            <span className="text-2xl">📝</span>
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 mb-2">No SOP linked</h3>
                                        <p className="text-gray-500 text-sm max-w-[250px]">
                                            Open this task on desktop to link or write Standard Operating Procedures.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Focus Mode Fullscreen Overlay */}
                {
                    timerRunning && (
                        <div className="fixed inset-0 z-50 bg-neutral-950 text-white flex flex-col p-6 sm:p-12 overflow-y-auto animate-in fade-in duration-300">
                            <div className="max-w-7xl w-full mx-auto flex-1 flex flex-col">

                                {/* Top Section */}
                                <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 mb-12">
                                    <div className="flex-1">
                                        <span className="px-3 py-1.5 bg-neutral-800 text-neutral-300 rounded-lg text-sm font-bold uppercase tracking-wider mb-4 inline-block">
                                            {activeTask ? (activeTask.columnId?.toString().replace('_', ' ') || "TO DO") : "Focus Mode"}
                                        </span>
                                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tighter leading-tight text-white">
                                            {activeTask?.content}
                                        </h1>
                                    </div>

                                    <div className="flex flex-col items-start xl:items-end w-full xl:w-auto">
                                        <div className="text-[5rem] sm:text-[8rem] font-black tracking-tighter tabular-nums leading-none text-lime-400 drop-shadow-[0_0_40px_rgba(163,230,53,0.15)]">
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
                                                            actualTimeSeconds: finalTime
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
                                            <span className="px-3 py-1 bg-neutral-800 text-neutral-300 rounded-lg text-sm font-bold">
                                                {activeTask?.subtasks?.filter(s => s.completed).length || 0} / {activeTask?.subtasks?.length || 0}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-2">
                                            {(activeTask?.subtasks || []).map((subtask) => (
                                                <div
                                                    key={subtask.id}
                                                    onClick={() => toggleSubtask(subtask.id)}
                                                    className={`flex items-start gap-4 p-4 rounded-2xl border transition-all cursor-pointer group ${subtask.completed
                                                            ? 'bg-neutral-800 border-neutral-700'
                                                            : 'bg-neutral-900 border-neutral-800 hover:border-neutral-600 hover:bg-neutral-800/50'
                                                        }`}
                                                >
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0 transition-colors ${subtask.completed
                                                            ? 'bg-lime-400'
                                                            : 'border-2 border-neutral-600 group-hover:border-lime-400'
                                                        }`}>
                                                        {subtask.completed && (
                                                            <svg className="w-4 h-4 text-black" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <span className={`flex-1 font-medium ${subtask.completed ? 'text-neutral-400 line-through' : 'text-neutral-200'}`}>
                                                        {subtask.title}
                                                    </span>
                                                    <button
                                                        onClick={(e) => deleteSubtask(subtask.id, e)}
                                                        className="opacity-0 group-hover:opacity-100 text-neutral-500 hover:text-red-400 transition-opacity p-1"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}

                                            {isAddingSubtask ? (
                                                <div className="flex items-center gap-3 p-2 bg-neutral-800 rounded-xl border border-neutral-700 mt-2">
                                                    <input
                                                        ref={subtaskInputRef}
                                                        type="text"
                                                        value={subtaskInput}
                                                        onChange={(e) => setSubtaskInput(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleAddSubtask();
                                                            if (e.key === 'Escape') {
                                                                setIsAddingSubtask(false);
                                                                setSubtaskInput("");
                                                            }
                                                        }}
                                                        onBlur={() => {
                                                            if (subtaskInput.trim() === "") setIsAddingSubtask(false);
                                                        }}
                                                        placeholder="What needs to be done?"
                                                        className="bg-transparent border-none outline-none text-white text-sm w-full font-medium"
                                                    />
                                                </div>
                                            ) : (
                                                <div className="mt-4 flex items-center gap-3">
                                                    <button
                                                        onClick={() => setIsAddingSubtask(true)}
                                                        className="flex items-center gap-3 text-sm font-bold text-neutral-400 hover:text-white transition-colors bg-transparent border-none p-2 w-full text-left"
                                                    >
                                                        <span className="w-8 h-8 rounded-full border border-dashed border-neutral-600 flex items-center justify-center">+</span>
                                                        Add Subtask...
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>
                    )
                }
            </div >
            <FeatureTooltip
                feature="workspace"
                title="Không gian làm việc (Workspace)"
                bullets={[
                    "Kéo thả task giữa các cột để phân loại công việc.",
                    "Chọn một task để bật Focus Mode và đồng hồ đếm ngược.",
                    "Hiển thị nhanh tài liệu SOP song song lúc đang làm việc.",
                ]}
                shortcuts={[
                    { key: "C", desc: "Tạo task mới nhận diện mọi nơi" },
                    { key: "Kéo & Thả", desc: "Di chuyển task qua lại" },
                ]}
            />
        </>
    );
}
