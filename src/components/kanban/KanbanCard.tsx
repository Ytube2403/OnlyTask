import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Task } from "@/types";
import { formatDistanceToNow, addDays, isAfter } from "date-fns";
import { useState } from "react";
import { TaskDetailsModal } from "../TaskDetailsModal";
import { Star } from "lucide-react";
import { useTasks } from "@/context/TaskContext";

interface Props {
    task: Task;
}

export function KanbanCard({ task }: Props) {
    const { updateTask, setActiveTask } = useTasks();
    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: task.id,
        data: {
            type: "Task",
            task,
        },
    });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    };

    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    // Calculate if deadline is further than 2 days
    const isFaded = task.deadline && isAfter(new Date(task.deadline), addDays(new Date(), 2)) && task.columnId !== "done";

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="opacity-30 bg-gray-50 border-2 border-dashed border-gray-300 rounded-2xl p-4 h-24"
            />
        );
    }

    return (
        <>
            <div
                ref={setNodeRef}
                style={style}
                {...attributes}
                {...listeners}
                onClick={(e) => {
                    // Prevent drag events from triggering click
                    if ((e.target as HTMLElement).closest('[data-no-dnd="true"]')) {
                        return;
                    }
                    setActiveTask(task);
                }}
                onDoubleClick={(e) => {
                    if ((e.target as HTMLElement).closest('[data-no-dnd="true"]')) {
                        return;
                    }
                    setIsDetailsOpen(true);
                }}
                className={`p-4 rounded-2xl border cursor-grab active:cursor-grabbing transition-all group relative ${isFaded ? "opacity-40 grayscale hover:opacity-100 hover:grayscale-0 border-gray-100 shadow-sm" :
                    task.isImportant ? "bg-yellow-50 border-yellow-200 shadow-sm hover:shadow-md hover:border-yellow-300" :
                        "bg-white border-gray-200 shadow-sm hover:border-gray-300 hover:shadow-md"
                    }`}
            >
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover:bg-gray-200 rounded-l-2xl transition-colors" />
                <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="font-medium text-gray-900 pr-2 leading-tight flex-1">{task.content}</h3>
                    <button
                        data-no-dnd="true"
                        onClick={(e) => {
                            e.stopPropagation();
                            updateTask(task.id.toString(), { isImportant: !task.isImportant });
                        }}
                        className={`p-1.5 rounded-lg transition-colors flex-shrink-0 ${task.isImportant ? 'text-yellow-500 hover:bg-yellow-100' : 'text-gray-300 hover:text-yellow-500 hover:bg-gray-100 opacity-0 group-hover:opacity-100'}`}
                    >
                        <Star className="w-4 h-4" fill={task.isImportant ? "currentColor" : "none"} />
                    </button>
                </div>

                {task.deadline && (
                    <div className="text-[10px] text-gray-400 mb-2 font-medium flex items-center gap-1">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {formatDistanceToNow(new Date(task.deadline), { addSuffix: true })}
                    </div>
                )}

                <div className="flex items-center justify-between text-xs mt-auto pt-2">
                    <span className="px-2.5 py-1 bg-neutral-100 text-neutral-700 rounded-md font-medium border border-neutral-200">
                        #{task.tag || "Task"}
                    </span>
                    <span className="text-gray-500 font-medium">{task.time || "--:--"}</span>
                </div>
            </div>

            <TaskDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                task={task}
            />
        </>
    );
}
