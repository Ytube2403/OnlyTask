"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
    DndContext,
    DragOverlay,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverEvent,
    DragEndEvent,
} from "@dnd-kit/core";
import {
    SortableContext,
    horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Task } from "@/types";
import { KanbanColumn } from "./KanbanColumn";
import { KanbanCard } from "./KanbanCard";
import { createPortal } from "react-dom";
import { useTasks } from "@/context/TaskContext";

export function KanbanBoard() {
    const { tasks, columns, activeTask, setActiveTask, moveTask, triggerReview } = useTasks();
    const columnsId = useMemo(() => columns.map((col) => col.id), [columns]);

    const [activeColumn, setActiveColumn] = useState<any>(null); // To fix TS issues quickly
    const [isMounted, setIsMounted] = useState(false);
    const [mobileTab, setMobileTab] = useState<string>(columns[0] ? columns[0].id.toString() : "todo");
    const [dragDirection, setDragDirection] = useState(0);

    const dragStartColumnId = useRef<string | null>(null);

    // Memoize tasks by column to avoid recreating arrays on every render (which triggers sortable context infinite loops)
    const tasksByColumn = useMemo(() => {
        const map: Record<string, Task[]> = {};
        columns.forEach(col => {
            map[col.id] = [];
        });
        tasks.forEach(task => {
            if (map[task.columnId]) {
                map[task.columnId].push(task);
            }
        });
        return map;
    }, [tasks, columns]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: { distance: 3 }, // require 3px movement before drag starts
        }),
        useSensor(KeyboardSensor)
    );

    if (!isMounted) {
        return <div className="flex gap-6 h-full w-full overflow-x-auto" />;
    }

    const t_status = (id: string | number) => {
        if (id === 'todo') return 'Cần làm';
        if (id === 'in_progress') return 'Đang làm';
        if (id === 'done') return 'Hoàn thành';
        return id;
    }

    const handleSwipe = (direction: number) => {
        const currentIndex = columns.findIndex(c => c.id === mobileTab);
        if (direction === 1 && currentIndex > 0) { // Swipe right -> previous tab
            setDragDirection(-1);
            setMobileTab(columns[currentIndex - 1].id.toString());
        } else if (direction === -1 && currentIndex < columns.length - 1) { // Swipe left -> next tab
            setDragDirection(1);
            setMobileTab(columns[currentIndex + 1].id.toString());
        }
    };

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
        >
            <div className="flex flex-col h-full w-full overflow-hidden">
                {/* Mobile Tabs Header */}
                <div className="md:hidden flex gap-2 mb-4 p-1 bg-gray-100/80 rounded-xl overflow-x-auto flex-shrink-0">
                    {columns.map(col => (
                        <button
                            key={col.id}
                            onClick={() => {
                                const currentIndex = columns.findIndex(c => c.id === mobileTab);
                                const newIndex = columns.findIndex(c => c.id === col.id.toString());
                                setDragDirection(newIndex > currentIndex ? 1 : -1);
                                setMobileTab(col.id.toString());
                            }}
                            className={`flex-1 min-w-max py-2 px-3 text-sm font-bold rounded-lg transition-all ${mobileTab === col.id.toString()
                                    ? 'bg-white text-black shadow-sm'
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                        >
                            {t_status(col.id)}
                            <span className="ml-1.5 text-xs font-semibold px-2 py-0.5 bg-gray-100 text-gray-500 rounded-md">
                                {tasksByColumn[col.id]?.length || 0}
                            </span>
                        </button>
                    ))}
                </div>

                {/* DeskTop & Mobile Columns Container */}
                <div
                    className="flex-1 w-full flex overflow-hidden relative"
                    onTouchStart={(e) => {
                        const touch = e.touches[0];
                        dragStartColumnId.current = `${touch.clientX}`;
                    }}
                    onTouchEnd={(e) => {
                        if (!dragStartColumnId.current) return;
                        const startX = parseFloat(dragStartColumnId.current);
                        const endX = e.changedTouches[0].clientX;
                        const diff = endX - startX;

                        if (Math.abs(diff) > 50) {
                            handleSwipe(diff > 0 ? 1 : -1);
                        }
                        dragStartColumnId.current = null;
                    }}
                >
                    <SortableContext items={columnsId} strategy={horizontalListSortingStrategy}>
                        <AnimatePresence initial={false} mode="popLayout" custom={dragDirection}>
                            {columns.map((col) => {
                                const isActiveMobileConfig = mobileTab === col.id.toString();
                                return (
                                    <div
                                        key={col.id}
                                        className={`h-full absolute inset-0 md:relative md:flex-1 md:block transition-opacity duration-300 md:opacity-100 ${isActiveMobileConfig ? 'block z-10 opacity-100' : 'hidden opacity-0'} md:translate-x-0 md:!mr-6 last:!mr-0 overflow-y-auto pb-4`}
                                    >
                                        <motion.div
                                            custom={dragDirection}
                                            initial={{ x: dragDirection > 0 ? 100 : -100, opacity: 0 }}
                                            animate={{ x: 0, opacity: 1 }}
                                            exit={{ x: dragDirection > 0 ? -100 : 100, opacity: 0 }}
                                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            className="h-full w-full"
                                        >
                                            <KanbanColumn
                                                column={col}
                                                tasks={tasksByColumn[col.id] || []}
                                            />
                                        </motion.div>
                                    </div>
                                )
                            })}
                        </AnimatePresence>
                    </SortableContext>
                </div>
            </div>

            {typeof window !== "undefined" &&
                createPortal(
                    <DragOverlay>
                        {activeColumn && (
                            <KanbanColumn
                                column={activeColumn}
                                tasks={tasksByColumn[activeColumn.id] || []}
                            />
                        )}
                        {activeTask && <KanbanCard task={activeTask} />}
                    </DragOverlay>,
                    document.body
                )}
        </DndContext>
    );

    function onDragStart(event: DragStartEvent) {
        if (event.active.data.current?.type === "Column") {
            setActiveColumn(event.active.data.current.column);
            return;
        }

        if (event.active.data.current?.type === "Task") {
            setActiveTask(event.active.data.current.task);
            dragStartColumnId.current = event.active.data.current.task.columnId;
            return;
        }
    }

    function onDragEnd(event: DragEndEvent) {
        const { active, over } = event;
        setActiveColumn(null);
        setActiveTask(null);

        if (!over) {
            dragStartColumnId.current = null;
            return;
        }

        const activeTaskData = tasks.find(t => t.id === active.id.toString());
        if (
            activeTaskData &&
            activeTaskData.columnId === "done" &&
            dragStartColumnId.current !== "done"
        ) {
            triggerReview(activeTaskData);
        }

        dragStartColumnId.current = null;
    }

    function onDragOver(event: DragOverEvent) {
        const { active, over } = event;
        if (!over) return;
        if (active.id === over.id) return;

        const isActiveATask = active.data.current?.type === "Task";
        const isOverAColumn = over.data.current?.type === "Column";
        const isOverATask = over.data.current?.type === "Task";

        if (!isActiveATask) return;

        const activeId = active.id.toString();
        const overId = over.id.toString();

        // Determine the target column based on what we're hovering over
        const activeTaskData = tasks.find(t => t.id === activeId);
        if (!activeTaskData) return;

        let targetColumnId = activeTaskData.columnId;

        if (isOverAColumn) {
            targetColumnId = overId;
        } else if (isOverATask) {
            const overTaskData = tasks.find(t => t.id === overId);
            if (overTaskData) {
                targetColumnId = overTaskData.columnId;
            }
        }

        // Move task physically via context
        moveTask(activeId, overId, targetColumnId.toString());
    }
}
