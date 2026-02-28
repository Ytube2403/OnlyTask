"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { useEffect, useState } from "react";
import { useSOPs } from "@/context/SOPContext";
import { FeatureTooltip } from "./ui/FeatureTooltip";
import { X, Trash2 } from "lucide-react";

interface SOPEditorProps {
    sopId?: string;
    initialTitle?: string;
    initialContent?: string;
    initialTags?: string[];
    onClose?: () => void;
}

export function SOPEditor({ sopId, initialTitle = "", initialContent = "", initialTags = [], onClose }: SOPEditorProps) {
    const { updateSOP, deleteSOP } = useSOPs();
    const [title, setTitle] = useState(initialTitle);
    const [tags, setTags] = useState<string[]>(initialTags);
    const [tagInput, setTagInput] = useState("");

    // Auto-save logic
    useEffect(() => {
        const handler = setTimeout(() => {
            if (sopId && (title !== initialTitle || JSON.stringify(tags) !== JSON.stringify(initialTags))) {
                updateSOP(sopId, { title, tags });
            }
        }, 1000);
        return () => clearTimeout(handler);
    }, [title, tags, sopId, initialTitle, initialTags, updateSOP]);
    const editor = useEditor({
        extensions: [
            StarterKit,
            Placeholder.configure({
                placeholder: "Write your Standard Operating Procedure here...",
            }),
        ],
        content: initialContent,
        immediatelyRender: false,
        editorProps: {
            attributes: {
                class: "prose prose-sm sm:prose-base focus:outline-none max-w-none text-gray-700 h-full min-h-[300px]",
            },
        },
        onUpdate: ({ editor }) => {
            if (sopId) {
                // Tiptap update event
                const html = editor.getHTML();
                // Simple debounce inside render might cause multiple renders, better use a ref or useEffect
                // For simplicity here, we'll directly call update on change if fast enough or add debounce wrapper
                // Here we will just perform the update via context (which triggers state update) 
                // A better approach is to use a global debounce, but let's do a simple inline for now.
                updateSOP(sopId, { content: html });
            }
        }
    });

    if (!editor) {
        return null;
    }

    const handleAddTag = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && tagInput.trim() !== "") {
            e.preventDefault();
            const newTag = tagInput.trim().toLowerCase();
            if (!tags.includes(newTag)) {
                setTags([...tags, newTag]);
            }
            setTagInput("");
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(t => t !== tagToRemove));
    };

    const handleDelete = async () => {
        if (sopId && window.confirm("Bạn có chắc chắn muốn xóa tài liệu này không? Hành động này không thể hoàn tác.")) {
            await deleteSOP(sopId);
            if (onClose) onClose();
        }
    };

    return (
        <>
            <div className="flex flex-col h-full bg-white relative rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-1 border-b border-gray-100 p-2 bg-gray-50/50">
                    <button
                        onClick={() => editor.chain().focus().toggleBold().run()}
                        className={`p-2 rounded-lg text-sm font-semibold transition-colors ${editor.isActive("bold") ? "bg-black text-white" : "text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        B
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleItalic().run()}
                        className={`p-2 rounded-lg text-sm italic transition-colors ${editor.isActive("italic") ? "bg-black text-white" : "text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        I
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                        className={`p-2 rounded-lg text-sm font-bold transition-colors ${editor.isActive("heading", { level: 2 }) ? "bg-black text-white" : "text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        H2
                    </button>
                    <button
                        onClick={() => editor.chain().focus().toggleBulletList().run()}
                        className={`p-2 rounded-lg text-sm font-bold transition-colors ${editor.isActive("bulletList") ? "bg-black text-white" : "text-gray-600 hover:bg-gray-200"
                            }`}
                    >
                        • List
                    </button>
                    {onClose && (
                        <div className="ml-auto flex items-center gap-2">
                            {sopId && (
                                <button
                                    onClick={handleDelete}
                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center"
                                    title="Xóa tài liệu"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                            <button
                                onClick={onClose}
                                className="p-2 text-gray-400 hover:text-black hover:bg-gray-200 rounded-lg transition-colors text-sm font-medium"
                            >
                                Đóng
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex-1 overflow-y-auto cursor-text p-0" onClick={(e) => {
                    if ((e.target as HTMLElement).closest('.editor-header-area')) return;
                    editor.commands.focus();
                }}>
                    <div className="px-6 pt-6 pb-4 border-b border-gray-100 mb-4 editor-header-area">
                        <input
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="SOP Title..."
                            className="w-full text-3xl font-bold bg-transparent border-none focus:outline-none text-gray-900 placeholder:text-gray-300 mb-4"
                        />

                        {/* Tags Input Area */}
                        <div className="flex flex-wrap items-center gap-2">
                            {tags.map((tag) => (
                                <span
                                    key={tag}
                                    className="flex items-center gap-1.5 px-2.5 py-1 bg-gray-100 text-gray-700 rounded-md text-xs font-semibold"
                                >
                                    #{tag}
                                    <button
                                        onClick={() => handleRemoveTag(tag)}
                                        className="hover:text-black hover:bg-gray-200 rounded-full p-0.5"
                                    >
                                        <X size={12} />
                                    </button>
                                </span>
                            ))}
                            <input
                                type="text"
                                value={tagInput}
                                onChange={(e) => setTagInput(e.target.value)}
                                onKeyDown={handleAddTag}
                                placeholder={tags.length === 0 ? "Thêm tag (nhấn Enter)..." : "Nhập thêm tag..."}
                                className="text-sm bg-transparent border-none focus:outline-none text-gray-600 placeholder:text-gray-400 min-w-[150px]"
                            />
                        </div>
                    </div>
                    <div className="px-6 pb-6 h-full">
                        <EditorContent editor={editor} />
                    </div>
                </div>
            </div>
            <FeatureTooltip
                feature="sops"
                title="Trình chỉnh sửa SOP"
                bullets={[
                    "Hỗ trợ ghi chú nhanh với các định dạng như In đậm, In nghiêng, Tiêu đề.",
                    "Hệ thống sẽ tự động lưu lại mọi thay đổi của bạn trong tích tắc.",
                    "Sau khi lưu, bạn có thể dễ dàng gắn tài liệu này vào các task cụ thể.",
                ]}
            />
        </>
    );
}
