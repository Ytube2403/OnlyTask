"use client";

import { useMemo, useState, useEffect, useRef } from "react";
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

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragEnd={onDragEnd}
        >
            <div className="flex gap-6 h-full w-full overflow-x-auto overflow-y-hidden pb-4">
                <SortableContext items={columnsId} strategy={horizontalListSortingStrategy}>
                    {columns.map((col) => (
                        <KanbanColumn
                            key={col.id}
                            column={col}
                            tasks={tasksByColumn[col.id] || []}
                        />
                    ))}
                </SortableContext>
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
