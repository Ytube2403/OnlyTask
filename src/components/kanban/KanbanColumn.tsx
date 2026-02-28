import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Column, Task } from "@/types";
import { KanbanCard } from "./KanbanCard";
import { useMemo, useState } from "react";
import { GripVertical, Plus } from "lucide-react";
import { TaskDetailsModal } from "../TaskDetailsModal";

interface Props {
    column: Column;
    tasks: Task[];
}

export function KanbanColumn({ column, tasks }: Props) {
    const tasksIds = useMemo(() => tasks.map((t) => t.id), [tasks]);
    const [isCreatingTask, setIsCreatingTask] = useState(false);

    const { setNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
        id: column.id,
        data: {
            type: "Column",
            column,
        },
    });

    const style = {
        transition,
        transform: CSS.Transform.toString(transform),
    };

    if (isDragging) {
        return (
            <div
                ref={setNodeRef}
                style={style}
                className="bg-gray-50 opacity-40 border-2 border-dashed border-gray-300 w-[320px] h-[500px] max-h-[500px] rounded-3xl flex flex-col flex-shrink-0"
            />
        );
    }

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="bg-neutral-100/50 w-[320px] rounded-3xl flex flex-col flex-shrink-0"
        >
            {/* Column Header */}
            <div
                {...attributes}
                {...listeners}
                className="p-4 flex items-center justify-between cursor-grab active:cursor-grabbing rounded-t-3xl group"
            >
                <div className="flex items-center gap-2">
                    <GripVertical size={16} className="text-gray-400 group-hover:text-gray-600 transition-colors" />
                    <h2 className="font-semibold text-gray-900">{column.title}</h2>
                    <span className="bg-white text-gray-500 text-xs font-bold px-2 py-0.5 rounded-full border border-gray-200">
                        {tasks.length}
                    </span>
                </div>
                <button
                    onClick={() => setIsCreatingTask(true)}
                    className="text-gray-400 hover:text-black transition-colors rounded-full hover:bg-gray-200 p-1">
                    <Plus size={16} />
                </button>
            </div>

            {/* Column Content */}
            <div className="p-3 flex flex-grow flex-col gap-3 overflow-x-hidden overflow-y-auto min-h-[150px]">
                <SortableContext items={tasksIds} strategy={verticalListSortingStrategy}>
                    {tasks.map((task) => (
                        <KanbanCard key={task.id} task={task} />
                    ))}
                </SortableContext>
            </div>
            <TaskDetailsModal
                isOpen={isCreatingTask}
                onClose={() => setIsCreatingTask(false)}
                defaultColumnId={column.id.toString()}
            />
        </div>
    );
}
