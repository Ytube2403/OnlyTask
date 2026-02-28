import { X, Search } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { Task } from "@/types";
import { useTasks } from "@/context/TaskContext";
import { useSOPs } from "@/context/SOPContext";
import { createPortal } from "react-dom";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    task?: Task | null; // If null, means creating new task.
    defaultColumnId?: string; // Used when creating new from column header
}

export function TaskDetailsModal({ isOpen, onClose, task, defaultColumnId }: Props) {
    const { addTask, updateTask } = useTasks();
    const { sops, addSOP } = useSOPs();
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [tag, setTag] = useState("");
    const [deadline, setDeadline] = useState("");
    const [time, setTime] = useState("");
    const [linkedSopIds, setLinkedSopIds] = useState<string[]>([]);

    // SOP Search state
    const [sopSearch, setSopSearch] = useState("");
    const [showSopDropdown, setShowSopDropdown] = useState(false);
    const sopInputRef = useRef<HTMLInputElement>(null);

    // Filter available SOPs
    const availableSops = sops.filter(sop => !linkedSopIds.includes(sop.id));
    const filteredSops = availableSops.filter(sop =>
        sop.title.toLowerCase().includes(sopSearch.toLowerCase())
    );

    // Handle global keyboard shortcuts within the modal
    useEffect(() => {
        if (!isOpen) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            // Save on Cmd/Ctrl + Enter
            if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                e.preventDefault();
                if (title.trim()) {
                    handleSave();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, title, description, tag, deadline, time, linkedSopIds]);

    useEffect(() => {
        if (task) {
            setTitle(task.content || "");
            setDescription(task.description || "");
            setTag(task.tag || "");
            setDeadline(task.deadline ? new Date(task.deadline).toISOString().slice(0, 16) : "");
            setTime(task.time || "");
            setLinkedSopIds(task.linkedSopIds || []);
        } else {
            setTitle("");
            setDescription("");
            setTag("");
            setDeadline("");
            setTime("");
            setLinkedSopIds([]);
        }
    }, [task, isOpen]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!title.trim()) return;

        if (task) {
            await updateTask(task.id.toString(), {
                content: title,
                description,
                tag,
                deadline: deadline ? new Date(deadline).toISOString() : undefined,
                time: time.trim() || undefined,
                linkedSopIds,
            });
        } else {
            await addTask(title, {
                description,
                tag,
                deadline: deadline ? new Date(deadline).toISOString() : undefined,
                time: time.trim() || undefined,
                columnId: defaultColumnId,
                linkedSopIds,
            });
        }
        onClose();
    };

    const modalContent = (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden max-h-[85vh] md:max-h-[90vh]">
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <h2 className="text-xl font-bold text-gray-900">
                        {task ? "Edit Task" : "Create Task"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-xl transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 flex-1 overflow-y-auto flex flex-col gap-6">
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Title</label>
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Task title..."
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-base focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                        />
                    </div>

                    <div className="relative">
                        <div className="flex justify-between items-center mb-2">
                            <label className="block text-sm font-semibold text-gray-700">Description</label>
                            {description.trim() && (
                                <button
                                    onClick={async () => {
                                        const newSop = await addSOP({ title: `SOP: ${title}`, content: `<p>${description}</p>`, tags: tag ? [tag] : [] });
                                        if (newSop) {
                                            setLinkedSopIds(prev => [...prev, newSop.id]);
                                            alert("Converted description to new SOP successfully!");
                                        }
                                    }}
                                    className="text-xs font-bold text-lime-600 bg-lime-100 hover:bg-lime-200 px-2 py-1 rounded-md transition-colors"
                                >
                                    ✨ Clone to new SOP
                                </button>
                            )}
                        </div>
                        <textarea
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Add details, links, or notes..."
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all placeholder:text-gray-400 resize-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Linked SOPs</label>

                        {/* Selected SOP Pills */}
                        {linkedSopIds.length > 0 && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {linkedSopIds.map(id => {
                                    const sop = sops.find(s => s.id === id);
                                    if (!sop) return null;
                                    return (
                                        <div key={id} className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg text-sm font-medium text-gray-700">
                                            <span className="truncate max-w-[200px]">{sop.title}</span>
                                            <button
                                                onClick={() => setLinkedSopIds(prev => prev.filter(sId => sId !== id))}
                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Searchable Combobox */}
                        <div className="relative">
                            <div className="relative flex items-center">
                                <Search size={16} className="absolute left-3 text-gray-400" />
                                <input
                                    ref={sopInputRef}
                                    type="text"
                                    value={sopSearch}
                                    onChange={(e) => {
                                        setSopSearch(e.target.value);
                                        setShowSopDropdown(true);
                                    }}
                                    onFocus={() => setShowSopDropdown(true)}
                                    placeholder="Search and select SOPs..."
                                    className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-black outline-none transition-all"
                                />
                            </div>

                            {/* Dropdown Results */}
                            {showSopDropdown && (
                                <>
                                    <div
                                        className="fixed inset-0 z-10"
                                        onClick={() => setShowSopDropdown(false)}
                                    />
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-100 rounded-xl shadow-lg z-20 max-h-48 overflow-y-auto">
                                        {filteredSops.length === 0 ? (
                                            <div className="p-4 text-sm text-gray-500 text-center">No SOPs found.</div>
                                        ) : (
                                            <div className="p-1">
                                                {filteredSops.map(sop => (
                                                    <button
                                                        key={sop.id}
                                                        className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-between"
                                                        onClick={() => {
                                                            setLinkedSopIds(prev => [...prev, sop.id]);
                                                            setSopSearch("");
                                                            // Keep dropdown open to add more or close it based on preference. Closing it here:
                                                            setShowSopDropdown(false);
                                                        }}
                                                    >
                                                        <span className="truncate font-medium">{sop.title}</span>
                                                        {sop.tags && sop.tags[0] && (
                                                            <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                                                                {sop.tags[0]}
                                                            </span>
                                                        )}
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Tag</label>
                            <input
                                type="text"
                                value={tag}
                                onChange={(e) => setTag(e.target.value)}
                                placeholder="e.g. Design, Dev"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-2">Est. Time</label>
                            <input
                                type="text"
                                value={time}
                                onChange={(e) => setTime(e.target.value)}
                                placeholder="e.g. 2h, 30m"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all placeholder:text-gray-400"
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">Deadline</label>
                        <input
                            type="datetime-local"
                            value={deadline}
                            onChange={(e) => setDeadline(e.target.value)}
                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-black focus:border-transparent outline-none transition-all text-gray-700"
                        />
                    </div>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-xl text-sm font-bold hover:bg-gray-50 transition-colors shadow-sm"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!title.trim()}
                        className="px-6 py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {task ? "Save Changes" : "Create Task"}
                    </button>
                </div>
            </div>
        </div>
    );

    if (typeof window === 'undefined') return null;

    return createPortal(modalContent, document.body);
}
