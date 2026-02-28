"use client";

import { useState, useMemo } from "react";
import {
    format,
    addMonths,
    subMonths,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    isSameMonth,
    isToday,
    compareAsc
} from "date-fns";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useTasks } from "@/context/TaskContext";
import { useApp } from "@/context/AppContext";
import { Task } from "@/types";
import { useSettings } from "@/context/SettingsContext";
import { vi, enUS } from 'date-fns/locale';
import { FeatureTooltip } from "@/components/ui/FeatureTooltip";

export function CalendarView() {
    const { tasks, setActiveTask, updateTask } = useTasks();
    const { setCurrentView } = useApp();
    const { settings } = useSettings();
    const [currentDate, setCurrentDate] = useState(new Date());

    const t = settings.language === "vi" ? {
        monthFormat: "MMMM yyyy",
        days: ['CN', 'Hai', 'Ba', 'Tư', 'Năm', 'Sáu', 'Bảy'],
        locale: vi
    } : {
        monthFormat: "MMMM yyyy",
        days: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
        locale: enUS
    };

    const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));
    const prevMonth = () => setCurrentDate(subMonths(currentDate, 1));
    const goToToday = () => setCurrentDate(new Date());

    // Generate Calendar Days Grid
    const days = useMemo(() => {
        const monthStart = startOfMonth(currentDate);
        const monthEnd = endOfMonth(monthStart);
        const startDate = startOfWeek(monthStart, { weekStartsOn: 1 }); // Monday start
        const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });

        return eachDayOfInterval({
            start: startDate,
            end: endDate
        });
    }, [currentDate]);

    // Fast mapping tasks by day (ignoring exact time)
    const tasksByDay = useMemo(() => {
        const map = new Map<string, Task[]>();

        // Filter out tasks without deadlines, then sort them sequentially 
        const tasksWithDeadline = tasks
            .filter(t => t.deadline)
            .sort((a, b) => compareAsc(new Date(a.deadline!), new Date(b.deadline!)));

        tasksWithDeadline.forEach(task => {
            let localDateKey = "";
            if (task.deadline) {
                // If it is stored cleanly from datetime-local input it looks like "2024-10-15T14:30"
                const datePart = task.deadline.split('T')[0];
                localDateKey = datePart;
            }

            if (localDateKey) {
                const tList = map.get(localDateKey) || [];
                tList.push(task);
                map.set(localDateKey, tList);
            }
        });

        return map;
    }, [tasks]);

    const handleTaskClick = (e: React.MouseEvent, task: Task) => {
        e.stopPropagation();
        setActiveTask(task);
        setCurrentView("workspace");
    };

    const toggleStar = (e: React.MouseEvent, task: Task) => {
        e.stopPropagation();
        updateTask(task.id.toString(), { isImportant: !task.isImportant });
    };

    return (
        <>
            <div className="flex-1 flex flex-col bg-[#F9F9F9] overflow-hidden">
                {/* Header Toolbar */}
                <div className="h-16 border-b border-gray-200 flex flex-col justify-center px-8 bg-white flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold tracking-tight text-gray-900">
                            Daily Task Management
                        </h1>
                    </div>
                </div>

                {/* Sub-header with Month Picker */}
                <div className="h-14 border-b border-gray-200 flex items-center justify-between px-8 bg-white flex-shrink-0">
                    <h2 className="text-lg font-bold text-gray-800">
                        {format(currentDate, t.monthFormat, { locale: t.locale })}
                    </h2>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={prevMonth}
                            className="p-1 text-gray-400 hover:text-black rounded transition-colors"
                        >
                            <ChevronLeft size={16} />
                        </button>
                        <button
                            onClick={goToToday}
                            className="px-2 py-1 text-sm font-medium text-gray-600 hover:text-black rounded transition-colors"
                        >
                            Today
                        </button>
                        <button
                            onClick={nextMonth}
                            className="p-1 text-gray-400 hover:text-black rounded transition-colors"
                        >
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>

                {/* Calendar Grid Container */}
                <div className="flex-1 flex flex-col overflow-auto bg-white p-2 sm:p-6 w-full">
                    <div className="border border-gray-200 rounded-xl overflow-hidden flex-1 flex flex-col shadow-sm bg-white min-w-[340px] md:min-w-[700px] lg:min-w-0">

                        {/* Days of Week Header */}
                        <div className="grid grid-cols-7 border-b border-gray-200 bg-white flex-shrink-0">
                            {t.days.map((day, idx) => (
                                <div key={day} className={`py-2 text-center text-[10px] md:text-xs font-semibold text-gray-400 tracking-wide ${idx !== 6 ? 'border-r border-gray-200' : ''}`}>
                                    {day}
                                </div>
                            ))}
                        </div>

                        {/* Matrix */}
                        <div className="grid grid-cols-7 flex-1 auto-rows-[minmax(140px,1fr)]">
                            {days.map((day, idx) => {
                                const dateKey = format(day, 'yyyy-MM-dd');
                                const dayTasks = tasksByDay.get(dateKey) || [];
                                const isCurrentMonth = isSameMonth(day, currentDate);
                                const isCurrentDay = isToday(day);

                                const rightBorder = (idx + 1) % 7 !== 0 ? 'border-r border-gray-200' : '';
                                const bottomBorder = idx < days.length - 7 ? 'border-b border-gray-200' : '';

                                return (
                                    <div
                                        key={day.toString()}
                                        className={`relative p-2.5 flex flex-col transition-colors group ${rightBorder} ${bottomBorder} ${!isCurrentMonth ? 'bg-gray-50/50' : 'bg-white'}`}
                                    >
                                        {/* Date Number */}
                                        <div className="flex justify-end mb-1 md:mb-2">
                                            <div className={`w-5 h-5 md:w-6 md:h-6 flex items-center justify-center rounded-full text-[10px] md:text-xs font-semibold transition-all
                                            ${isCurrentDay
                                                    ? 'bg-rose-500 text-white shadow-sm'
                                                    : isCurrentMonth ? 'text-gray-700 group-hover:bg-gray-100' : 'text-gray-400'
                                                }`}
                                            >
                                                {format(day, 'd')}
                                            </div>
                                        </div>

                                        {/* Task Cards */}
                                        <div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1 no-scrollbar pb-1">
                                            {dayTasks.map(task => {
                                                // Configuration for Notion-style pills
                                                let statusColor = "bg-gray-400";
                                                let statusBg = "bg-gray-100";
                                                let statusTextRender = "Not Started";

                                                if (task.columnId === "in_progress") {
                                                    statusColor = "bg-blue-500";
                                                    statusBg = "bg-blue-100";
                                                    statusTextRender = "Doing";
                                                } else if (task.columnId === "done") {
                                                    statusColor = "bg-emerald-500";
                                                    statusBg = "bg-emerald-100";
                                                    statusTextRender = "Done";
                                                }

                                                const isImp = task.isImportant;

                                                return (
                                                    <div
                                                        key={task.id}
                                                        onClick={(e) => handleTaskClick(e, task)}
                                                        className={`p-2.5 rounded-lg border transition-all cursor-pointer bg-white relative flex flex-col gap-2
                                                        ${isImp && task.columnId !== 'done'
                                                                ? 'border-yellow-300 shadow-[0_0_10px_rgba(253,224,71,0.4)] hover:shadow-[0_0_15px_rgba(253,224,71,0.6)] ring-1 ring-yellow-400'
                                                                : 'border-gray-200 shadow-sm hover:border-gray-300 hover:shadow'
                                                            }
                                                    `}
                                                    >
                                                        {/* Top Row: Title & Time */}
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex items-start gap-1.5 flex-1 min-w-0">
                                                                <button
                                                                    onClick={(e) => toggleStar(e, task)}
                                                                    className="mt-0.5 hover:scale-110 transition-transform flex-shrink-0"
                                                                >
                                                                    <Star className={`w-3.5 h-3.5 ${isImp ? 'text-yellow-500 fill-yellow-500' : 'text-gray-300 hover:text-yellow-400'}`} />
                                                                </button>
                                                                <h4 className="font-semibold text-gray-900 text-[10px] md:text-xs leading-snug truncate">
                                                                    {task.content}
                                                                </h4>
                                                            </div>
                                                            <span className="text-[10px] text-gray-400 font-medium flex-shrink-0 mt-0.5">
                                                                {task.time ? task.time : '--:--'}
                                                            </span>
                                                        </div>

                                                        {/* Bottom Row: Status & Tag */}
                                                        <div className="flex items-center gap-1.5 mt-auto flex-wrap">
                                                            {/* Status Badge */}
                                                            <div className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-md ${statusBg}`}>
                                                                <div className={`w-1.5 h-1.5 rounded-full ${statusColor}`} />
                                                                <span className="text-[10px] font-medium text-gray-600">{statusTextRender}</span>
                                                            </div>

                                                            {/* Tag Badge */}
                                                            {task.tag && (
                                                                <div className="px-1.5 py-0.5 rounded-md bg-stone-100 border border-stone-200 hidden md:block">
                                                                    <span className="text-[10px] font-medium text-stone-600 truncate max-w-[60px] block">
                                                                        {task.tag}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                    </div>
                </div>
            </div>
            <FeatureTooltip
                feature="calendar"
                title="Lịch công việc (Calendar)"
                bullets={[
                    "Tất cả công việc có thiết lập Deadline sẽ tự động hiển thị ở đây.",
                    "Giúp bạn có cái nhìn tổng quan khối lượng việc trong cả tháng.",
                    "Click trực tiếp vào task để nhảy ngay vào Focus Mode giải quyết.",
                ]}
            />
        </>
    );
}
