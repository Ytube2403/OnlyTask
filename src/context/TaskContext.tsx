"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { Task, Column } from "@/types";
import { arrayMove } from "@dnd-kit/sortable";
import { ReviewModal } from "@/components/ReviewModal";
import { useAuth } from "@/context/AuthContext";
import { useSettings } from "@/context/SettingsContext";
import { supabase } from "@/lib/supabase";

interface TaskContextType {
    tasks: Task[];
    columns: Column[];
    activeTask: Task | null;
    tasksAboutToExpire: Task[];
    setTasks: React.Dispatch<React.SetStateAction<Task[]>>;
    setColumns: React.Dispatch<React.SetStateAction<Column[]>>;
    setActiveTask: React.Dispatch<React.SetStateAction<Task | null>>;
    addTask: (content: string, options?: Partial<Omit<Task, 'id' | 'content'>>) => Promise<void>;
    updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
    moveTask: (activeId: string, overId: string, overColumnId: string) => Promise<void>;
    triggerReview: (task: Task) => void;
}

const defaultCols: Column[] = [
    { id: "todo", title: "To Do" },
    { id: "in_progress", title: "In Progress" },
    { id: "done", title: "Done" },
];

const TaskContext = createContext<TaskContextType | undefined>(undefined);

// ─── Helpers ──────────────────────────────────────────────────
const DAYS_MS = 86400000;
const THREE_MONTHS_MS = 90 * DAYS_MS;
const ONE_YEAR_MS = 365 * DAYS_MS;
const WARNING_WINDOW_MS = 3 * DAYS_MS;

function getRetentionLimit(isPremium: boolean) {
    return isPremium ? ONE_YEAR_MS : THREE_MONTHS_MS;
}

function getTaskDate(task: Task): Date | null {
    if (task.completionDate) return new Date(task.completionDate);
    if (task.deadline) return new Date(task.deadline);
    return null;
}

function findTasksAboutToExpire(tasks: Task[], isPremium: boolean): Task[] {
    const limit = getRetentionLimit(isPremium);
    const now = Date.now();
    return tasks.filter((task) => {
        const d = getTaskDate(task);
        if (!d) return false;
        const age = now - d.getTime();
        return age >= limit - WARNING_WINDOW_MS && age < limit;
    });
}

// Convert DB row to Task
function mapRowToTask(row: any): Task {
    return {
        id: row.id,
        columnId: row.column_id,
        content: row.content,
        description: row.description || undefined,
        tag: row.tag || undefined,
        time: row.time || undefined,
        effort: row.effort || undefined,
        deadline: row.deadline || undefined,
        linkedSopIds: row.linked_sop_ids || [],
        score: row.score || undefined,
        reviewNote: row.review_note || undefined,
        completionDate: row.completion_date || undefined,
        isImportant: row.is_important || false,
        actualTimeSeconds: row.actual_time_seconds || undefined,
    };
}

// Convert Task to DB row
function mapTaskToRow(task: Partial<Task>, userId: string): any {
    const row: any = {};
    if (task.id !== undefined) row.id = task.id;
    if (userId) row.user_id = userId;
    if (task.columnId !== undefined) row.column_id = task.columnId;
    if (task.content !== undefined) row.content = task.content;
    if (task.description !== undefined) row.description = task.description;
    if (task.tag !== undefined) row.tag = task.tag;
    if (task.time !== undefined) row.time = task.time;
    if (task.effort !== undefined) row.effort = task.effort;
    if (task.deadline !== undefined) row.deadline = task.deadline;
    if (task.linkedSopIds !== undefined) row.linked_sop_ids = task.linkedSopIds;
    if (task.score !== undefined) row.score = task.score;
    if (task.reviewNote !== undefined) row.review_note = task.reviewNote;
    if (task.completionDate !== undefined) row.completion_date = task.completionDate;
    if (task.isImportant !== undefined) row.is_important = task.isImportant;
    if (task.actualTimeSeconds !== undefined) row.actual_time_seconds = task.actualTimeSeconds;
    return row;
}

// ─── Provider ─────────────────────────────────────────────────
export function TaskProvider({ children }: { children: ReactNode }) {
    const { user, isInitialized } = useAuth();
    const { settings } = useSettings();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [columns, setColumns] = useState<Column[]>(defaultCols);
    const [activeTask, setActiveTask] = useState<Task | null>(null);
    const [tasksAboutToExpire, setTasksAboutToExpire] = useState<Task[]>([]);

    const [reviewModalOpen, setReviewModalOpen] = useState(false);
    const [completedTask, setCompletedTask] = useState<Task | null>(null);

    // Sync columns with language
    useEffect(() => {
        setColumns(prev => prev.map(col => {
            if (col.id === 'todo') return { ...col, title: settings.language === 'vi' ? 'Cần làm' : 'To Do' };
            if (col.id === 'in_progress') return { ...col, title: settings.language === 'vi' ? 'Đang làm' : 'In Progress' };
            if (col.id === 'done') return { ...col, title: settings.language === 'vi' ? 'Đã xong' : 'Done' };
            return col;
        }));
    }, [settings.language]);

    // Fetch tasks on load
    useEffect(() => {
        if (!isInitialized) return;
        if (!user) {
            setTasks([]);
            setTasksAboutToExpire([]);
            return;
        }

        const fetchTasks = async () => {
            const { data, error } = await supabase
                .from('tasks')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error("Error fetching tasks:", error);
                return;
            }

            if (data) {
                // Check retention logic
                const limit = getRetentionLimit(user.isPremium);
                const now = Date.now();
                const validTasks: Task[] = [];
                const expiredIds: string[] = [];

                data.forEach(row => {
                    const task = mapRowToTask(row);
                    const d = getTaskDate(task);
                    if (d && now - d.getTime() >= limit) {
                        expiredIds.push(task.id.toString());
                    } else {
                        validTasks.push(task);
                    }
                });

                if (expiredIds.length > 0) {
                    await supabase.from('tasks').delete().in('id', expiredIds);
                }

                setTasks(validTasks);
            }
        };

        fetchTasks();
    }, [user, isInitialized]);

    // Update expiration warnings
    useEffect(() => {
        if (user) {
            setTasksAboutToExpire(findTasksAboutToExpire(tasks, user.isPremium));
        }
    }, [tasks, user]);

    const triggerReview = (task: Task) => {
        setCompletedTask(task);
        setReviewModalOpen(true);
    };

    const addTask = useCallback(async (content: string, options?: Partial<Omit<Task, 'id' | 'content'>>) => {
        if (!user) return;
        const tempId = crypto.randomUUID();
        const newTask: Task = {
            id: tempId,
            columnId: options?.columnId || "todo",
            content,
            ...options
        };

        // Optimistic update
        setTasks((prev) => [newTask, ...prev]);

        // DB Update
        const { error } = await supabase
            .from('tasks')
            .insert(mapTaskToRow(newTask, user.id));

        if (error) {
            console.error("Error adding task:", error);
            // Rollback could be implemented here
        }
    }, [user]);

    const updateTask = useCallback(async (id: string, updates: Partial<Task>) => {
        if (!user) return;

        // Optimistic update
        setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, ...updates } : t)));
        setActiveTask((prev) => (prev && prev.id === id ? { ...prev, ...updates } : prev));

        // DB Update
        const { error } = await supabase
            .from('tasks')
            .update(mapTaskToRow(updates, ''))
            .eq('id', id)
            .eq('user_id', user.id); // Extra safety

        if (error) {
            console.error("Error updating task:", error);
        }
    }, [user]);

    const moveTask = useCallback(async (activeId: string, overId: string, overColumnId: string) => {
        if (!user) return;

        // Perform optimistic reorder locally
        let reorderedTasks: Task[] = [];
        let updatedTaskLocally: Task | undefined;

        setTasks((prev) => {
            const activeIndex = prev.findIndex((t) => t.id === activeId);
            const overIndex = prev.findIndex((t) => t.id === overId);

            if (activeIndex === -1) {
                reorderedTasks = prev;
                return prev;
            }

            let newTasks = [...prev];
            const originalTask = newTasks[activeIndex];

            // If column changed
            if (originalTask.columnId !== overColumnId) {
                updatedTaskLocally = { ...originalTask, columnId: overColumnId };
                newTasks[activeIndex] = updatedTaskLocally;

                if (overIndex !== -1) {
                    reorderedTasks = arrayMove(newTasks, activeIndex, overIndex - 1);
                } else {
                    reorderedTasks = arrayMove(newTasks, activeIndex, activeIndex);
                }
            } else if (overIndex !== -1 && activeIndex !== overIndex) {
                // Order changed within same column
                reorderedTasks = arrayMove(prev, activeIndex, overIndex);
            } else {
                reorderedTasks = prev;
            }

            return reorderedTasks;
        });

        // DB Update for column change (if it happened)
        if (updatedTaskLocally) {
            const { error } = await supabase
                .from('tasks')
                .update({ column_id: overColumnId })
                .eq('id', activeId)
                .eq('user_id', user.id);

            if (error) console.error("Error moving task:", error);
        }

        // Note: Full ordering persistence in DB would require an 'order' column.
        // For simplicity in this demo, exact ordering across refreshes might rely on created_at or we could add an order index later.
    }, [user]);

    return (
        <TaskContext.Provider
            value={{
                tasks,
                columns,
                activeTask,
                tasksAboutToExpire,
                setTasks,
                setColumns,
                setActiveTask,
                addTask,
                updateTask,
                moveTask,
                triggerReview,
            }}
        >
            {children}
            {completedTask && (
                <ReviewModal
                    isOpen={reviewModalOpen}
                    onClose={() => setReviewModalOpen(false)}
                    taskTitle={completedTask.content}
                    onSubmit={async (score, note) => {
                        await updateTask(completedTask.id.toString(), {
                            score,
                            reviewNote: note,
                            completionDate: new Date().toISOString()
                        });
                        setCompletedTask(null);
                    }}
                />
            )}
        </TaskContext.Provider>
    );
}

export function useTasks() {
    const context = useContext(TaskContext);
    if (context === undefined) {
        throw new Error("useTasks must be used within a TaskProvider");
    }
    return context;
}
