"use client";

import { Plus, Search, Filter, ChevronLeft, ChevronRight, Star } from "lucide-react";
import { useTasks } from "@/context/TaskContext";
import { useApp } from "@/context/AppContext";
import { useState, useMemo, useEffect } from "react";
import { isAfter, isPast, isToday } from "date-fns";
import { TaskDetailsModal } from "../TaskDetailsModal";
import { Task } from "@/types";
import { DeletionWarningBanner } from "@/components/notifications/DeletionWarningBanner";
import { useSettings } from "@/context/SettingsContext";

export function Inbox() {
    const { tasks, addTask, activeTask, setActiveTask, updateTask } = useTasks();
    const { currentView } = useApp();
    const { settings } = useSettings();
    const [adding, setAdding] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState("");

    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);

    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => {
            const isMob = window.innerWidth < 768;
            setIsMobile(isMob);
            setIsCollapsed(isMob);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const [isCollapsed, setIsCollapsed] = useState(false);
    const [showFilters, setShowFilters] = useState(false);

    // --- Filter States ---
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [importanceFilter, setImportanceFilter] = useState<"all" | "yes" | "no">("all");
    const [deadlineFilter, setDeadlineFilter] = useState<"all" | "overdue" | "today" | "upcoming">("all");
    const [tagFilter, setTagFilter] = useState<string>("all");
    const [sortOrder, setSortOrder] = useState<"default" | "deadline" | "effort" | "importance">("default");

    const t = settings.language === "vi" ? {
        allTasks: "Tất cả công việc",
        quickAdd: "Thêm nhanh",
        collapse: "Thu gọn",
        search: "Tìm việc...",
        filter: "Lọc",
        sortBy: "Sắp xếp theo:",
        status: "Trạng thái",
        all: "Tất cả",
        todo: "Cần làm",
        inProgress: "Đang làm",
        done: "Đã xong",
        deadline: "Hạn chót",
        overdue: "Quá hạn",
        today: "Hôm nay",
        upcoming: "Sắp tới",
        tag: "Thẻ",
        clearFilters: "Xoá bộ lọc",
        importance: "Quan trọng",
        yes: "Có",
        no: "Không",
        addTaskPlaceholder: "Thêm việc mới... (Nhấn Enter)",
        noTaskMatching: "Không có công việc nào khớp.",
        defaultSort: "Mặc định (Mới nhất)",
        effort: "Khối lượng",
        emptySummary: "Gọn gàng quá! Bạn chưa có việc nào.",
        emptyDesc: "Thêm việc mới để bắt đầu ngay.",
        expand: "Mở rộng"
    } : {
        allTasks: "All Tasks",
        quickAdd: "Quick Add Task",
        collapse: "Collapse Panel",
        search: "Search tasks...",
        filter: "Filter",
        sortBy: "Sort by:",
        status: "Status",
        all: "All",
        todo: "To Do",
        inProgress: "In Progress",
        done: "Done",
        deadline: "Deadline",
        overdue: "Overdue",
        today: "Today",
        upcoming: "Upcoming",
        tag: "Tag",
        clearFilters: "Clear all filters",
        importance: "Importance",
        yes: "Yes",
        no: "No",
        addTaskPlaceholder: "Add a new task... (Press Enter)",
        noTaskMatching: "No tasks matching your criteria.",
        defaultSort: "Default (Newest)",
        effort: "Effort",
        emptySummary: "All clear! You don't have any tasks.",
        emptyDesc: "Add a task above to get started.",
        expand: "Expand Panel"
    };

    // Retrieve unique tags from all tasks
    const uniqueTags = useMemo(() => {
        const tags = new Set<string>();
        tasks.forEach(t => { if (t.tag) tags.add(t.tag); });
        return Array.from(tags);
    }, [tasks]);

    // Chain Filter & Sort Logic
    const filteredTasks = useMemo(() => {
        let result = [...tasks];

        // 1. Keyword search (title + desc)
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            result = result.filter(t =>
                t.content.toLowerCase().includes(q) ||
                (t.description?.toLowerCase().includes(q))
            );
        }

        // 2. Status filter
        if (statusFilter !== "all") {
            result = result.filter(t => t.columnId === statusFilter);
        }

        // 3. Importance Filter
        if (importanceFilter === "yes") {
            result = result.filter(t => t.isImportant);
        } else if (importanceFilter === "no") {
            result = result.filter(t => !t.isImportant);
        }

        // 4. Deadline Filter
        if (deadlineFilter !== "all") {
            const now = new Date();
            result = result.filter(t => {
                if (!t.deadline) return false;
                const deadlineDate = new Date(t.deadline);
                if (deadlineFilter === "overdue") {
                    return isPast(deadlineDate) && !isToday(deadlineDate);
                } else if (deadlineFilter === "today") {
                    return isToday(deadlineDate);
                } else if (deadlineFilter === "upcoming") {
                    return isAfter(deadlineDate, now) && !isToday(deadlineDate);
                }
                return true;
            });
        }

        // 5. Tag Filter
        if (tagFilter !== "all") {
            result = result.filter(t => t.tag === tagFilter);
        }

        // 6. Sorting
        if (sortOrder === "deadline") {
            result.sort((a, b) => {
                if (!a.deadline && !b.deadline) return 0;
                if (!a.deadline) return 1;
                if (!b.deadline) return -1;
                return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
            });
        } else if (sortOrder === "effort") {
            const parseTime = (tString?: string) => {
                if (!tString) return 0;
                const hMatch = tString.match(/([\d.]+)h/);
                const mMatch = tString.match(/([\d.]+)m/);
                let mins = 0;
                if (hMatch) mins += parseFloat(hMatch[1]) * 60;
                if (mMatch) mins += parseFloat(mMatch[1]);
                return mins;
            };
            result.sort((a, b) => parseTime(a.time) - parseTime(b.time));
        } else if (sortOrder === "importance") {
            result.sort((a, b) => (b.isImportant ? 1 : 0) - (a.isImportant ? 1 : 0));
        }

        return result;
    }, [tasks, searchQuery, statusFilter, importanceFilter, deadlineFilter, tagFilter, sortOrder]);

    const handleAdd = async () => {
        if (newTaskTitle.trim()) {
            await addTask(newTaskTitle);
            setNewTaskTitle("");
            setAdding(false);
        }
    }

    // FAB click handler
    const handleFabClick = () => {
        if (isCollapsed) {
            setIsCollapsed(false);
        }
        setAdding(true);
        // Scroll to top or handle focus
        setTimeout(() => {
            const input = document.getElementById('mobile-quick-add');
            if (input) input.focus();
        }, 100);
    };

    if (isCollapsed) {
        return (
            <>
                {/* Mobile Collapsed Bar */}
                <div className="flex md:hidden w-full p-4 border-b border-gray-200 bg-white items-center justify-between flex-shrink-0 z-10 shadow-sm relative">
                    <h2 className="text-lg font-semibold text-gray-900 tracking-tight">{t.allTasks}</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setIsCollapsed(false)}
                            title={t.expand}
                            className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors shadow-sm"
                        >
                            <ChevronRight size={16} className="rotate-90 md:rotate-0" />
                        </button>
                    </div>
                </div>
                {adding && (
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0 md:hidden z-10 relative">
                        <input
                            id="mobile-quick-add"
                            type="text"
                            autoFocus
                            placeholder={t.addTaskPlaceholder}
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                            className="w-full px-4 py-2 border border-blue-200 rounded-xl text-sm focus:outline-none shadow-sm"
                        />
                    </div>
                )}
                {/* Desktop Collapsed Sidebar */}
                <div className="hidden md:flex w-16 h-full border-r border-gray-200 bg-white flex-col items-center py-6 flex-shrink-0">
                    <button
                        onClick={() => setIsCollapsed(false)}
                        title={t.expand}
                        className="p-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors shadow-sm"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </>
        );
    }

    return (
        <div className={`border-gray-200 bg-white flex-col flex-shrink-0 transition-all duration-300 flex z-10 ${isMobile && !isCollapsed
                ? 'fixed inset-x-0 top-0 bottom-[72px] z-50'
                : 'w-full md:w-80 h-full border-b md:border-b-0 md:border-r relative'
            }`}>
            {isMobile && !isCollapsed && (
                <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                    <span className="font-bold text-gray-700">{t.allTasks}</span>
                    <button
                        onClick={() => setIsCollapsed(true)}
                        className="p-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300"
                    >
                        <ChevronLeft size={16} className="rotate-90" />
                    </button>
                </div>
            )}
            <div className="p-6 border-b border-gray-100 flex-shrink-0">
                <div className={`flex items-center justify-between mb-4 ${isMobile && !isCollapsed ? 'hidden' : ''}`}>
                    <h2 className="text-xl font-semibold text-gray-900 tracking-tight">{t.allTasks}</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setAdding(!adding)}
                            title={t.quickAdd}
                            className="hidden md:flex p-2 bg-black text-white rounded-full hover:bg-gray-800 transition-colors shadow-sm">
                            <Plus size={16} />
                        </button>
                        <button
                            onClick={() => setIsCollapsed(true)}
                            title={t.collapse}
                            className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition-colors shadow-sm">
                            <ChevronLeft size={16} className="-rotate-90 md:rotate-0" />
                        </button>
                    </div>
                </div>

                {adding && (
                    <div className="mb-4">
                        <input
                            type="text"
                            autoFocus
                            placeholder={t.addTaskPlaceholder}
                            value={newTaskTitle}
                            onChange={(e) => setNewTaskTitle(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
                            className="w-full px-4 py-2 border border-black rounded-xl text-sm focus:outline-none shadow-sm"
                        />
                    </div>
                )}

                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder={t.search}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-2 bg-gray-100 border-none rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-black transition-all"
                        />
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        title={t.filter}
                        className={`p-2 rounded-xl border transition-all ${showFilters ? 'bg-black text-white border-black' : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}`}
                    >
                        <Filter size={16} />
                    </button>
                </div>

                {/* FILTER PANEL */}
                {showFilters && (
                    <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col gap-3 text-xs animate-in slide-in-from-top-2 duration-200">
                        {/* Sort */}
                        <div className="flex items-center justify-between">
                            <span className="font-semibold text-gray-500">{t.sortBy}</span>
                            <select
                                value={sortOrder}
                                onChange={(e) => setSortOrder(e.target.value as any)}
                                className="bg-white border-gray-200 rounded-md px-2 py-1 outline-none focus:ring-1 focus:ring-black"
                            >
                                <option value="default">{t.defaultSort}</option>
                                <option value="deadline">{t.deadline}</option>
                                <option value="importance">{t.importance}</option>
                                <option value="effort">{t.effort}</option>
                            </select>
                        </div>

                        {/* Status */}
                        <div>
                            <span className="font-semibold text-gray-500 block mb-1">{t.status}</span>
                            <div className="flex flex-wrap gap-1">
                                {[{ id: 'all', label: t.all }, { id: 'todo', label: t.todo }, { id: 'in_progress', label: t.inProgress }, { id: 'done', label: t.done }].map(stat => (
                                    <button
                                        key={stat.id}
                                        onClick={() => setStatusFilter(stat.id as any)}
                                        className={`px-2 py-1 rounded-md transition-colors ${statusFilter === stat.id ? 'bg-black text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                                    >{stat.label}</button>
                                ))}
                            </div>
                        </div>

                        {/* Deadline */}
                        <div>
                            <span className="font-semibold text-gray-500 block mb-1">{t.deadline}</span>
                            <div className="flex flex-wrap gap-1">
                                {[{ id: 'all', label: t.all }, { id: 'overdue', label: t.overdue }, { id: 'today', label: t.today }, { id: 'upcoming', label: t.upcoming }].map(dl => (
                                    <button
                                        key={dl.id}
                                        onClick={() => setDeadlineFilter(dl.id as any)}
                                        className={`px-2 py-1 rounded-md transition-colors ${deadlineFilter === dl.id ? 'bg-black text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                                    >{dl.label}</button>
                                ))}
                            </div>
                        </div>

                        {/* Importance */}
                        <div>
                            <span className="font-semibold text-gray-500 block mb-1">{t.importance}</span>
                            <div className="flex flex-wrap gap-1">
                                {[{ id: 'all', label: t.all }, { id: 'yes', label: t.yes }, { id: 'no', label: t.no }].map(imp => (
                                    <button
                                        key={imp.id}
                                        onClick={() => setImportanceFilter(imp.id as any)}
                                        className={`px-2 py-1 rounded-md transition-colors ${importanceFilter === imp.id ? 'bg-black text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                                    >{imp.label}</button>
                                ))}
                            </div>
                        </div>

                        {/* Tag */}
                        {uniqueTags.length > 0 && (
                            <div>
                                <span className="font-semibold text-gray-500 block mb-1">{t.tag}</span>
                                <div className="flex flex-wrap gap-1">
                                    <button
                                        onClick={() => setTagFilter("all")}
                                        className={`px-2 py-1 rounded-md transition-colors ${tagFilter === "all" ? 'bg-black text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                                    >{t.all}</button>
                                    {uniqueTags.map(tag => (
                                        <button
                                            key={tag}
                                            onClick={() => setTagFilter(tag)}
                                            className={`px-2 py-1 rounded-md transition-colors ${tagFilter === tag ? 'bg-black text-white' : 'bg-gray-200 text-gray-600 hover:bg-gray-300'}`}
                                        >{tag}</button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {(statusFilter !== "all" || deadlineFilter !== "all" || importanceFilter !== "all" || tagFilter !== "all" || sortOrder !== "default") && (
                            <button
                                onClick={() => {
                                    setStatusFilter("all"); setDeadlineFilter("all"); setImportanceFilter("all"); setTagFilter("all"); setSortOrder("default");
                                }}
                                className="mt-2 text-center text-red-500 hover:text-red-700 font-medium py-1 bg-red-50 rounded-md"
                            >
                                {t.clearFilters}
                            </button>
                        )}
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                <DeletionWarningBanner />
                {filteredTasks.length === 0 && (
                    <div className="text-center p-8 text-gray-400 text-sm font-medium">{t.noTaskMatching}</div>
                )}
                {filteredTasks.map((task) => (
                    <div
                        key={task.id}
                        onClick={() => setActiveTask(task)}
                        onDoubleClick={(e) => {
                            e.stopPropagation();
                            setSelectedTask(task);
                            setIsModalOpen(true);
                        }}
                    >
                        <TaskItem
                            title={task.content}
                            tag={task.tag || "Task"}
                            time={task.time || "--"}
                            active={activeTask?.id === task.id}
                            isImportant={task.isImportant}
                            onToggleStar={(e) => {
                                e.stopPropagation();
                                updateTask(task.id.toString(), { isImportant: !task.isImportant });
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Floating Action Button (FAB) for Mobile */}
            <button
                onClick={handleFabClick}
                className="md:hidden absolute bottom-6 right-6 w-14 h-14 bg-black text-white rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-center justify-center hover:scale-105 active:scale-95 transition-all z-50 flex-shrink-0"
            >
                <Plus size={24} />
            </button>

            {/* Modal */}
            {isModalOpen && selectedTask && (
                <TaskDetailsModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    task={selectedTask}
                />
            )}
        </div>
    );
}

function TaskItem({
    title, tag, time, active, isImportant, onToggleStar
}: {
    title: string; tag: string; time: string; active?: boolean; isImportant?: boolean; onToggleStar?: (e: React.MouseEvent) => void
}) {
    return (
        <div
            className={`p-4 rounded-2xl cursor-pointer transition-all border ${active
                ? "border-black bg-white shadow-sm ring-1 ring-black"
                : isImportant
                    ? "bg-yellow-50 border-yellow-200 hover:border-yellow-300"
                    : "border-gray-100 bg-white hover:border-gray-200 hover:shadow-sm"
                }`}
        >
            <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="font-medium text-gray-900 truncate leading-tight flex-1 pr-2">{title}</h3>
                <button
                    onClick={onToggleStar}
                    className={`p-1.5 rounded-lg transition-colors flex-shrink-0 mt-0.5 ${isImportant ? 'text-yellow-500 hover:bg-yellow-100' : 'text-gray-300 hover:text-yellow-500 hover:bg-gray-100 opacity-0 group-hover:opacity-100'}`}
                >
                    <Star className="w-4 h-4" fill={isImportant ? "currentColor" : "none"} />
                </button>
            </div>

            <div className="flex items-center justify-between text-xs">
                <span className="px-2.5 py-1 bg-white/50 text-neutral-700 rounded-md font-medium border border-neutral-200">#{tag}</span>
                <span className="text-gray-500 font-medium">{time}</span>
            </div>
        </div>
    );
}
