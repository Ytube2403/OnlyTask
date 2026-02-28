import { FileText, X } from "lucide-react";
import { SOPEditor } from "./SOPEditor";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
}

export function SOPPanel({ isOpen, onClose, title = "Checklist tạo ảnh nhân vật với phong cách quy định" }: Props) {
    if (!isOpen) return null;

    return (
        <div className="w-full md:w-[400px] h-full absolute right-0 top-0 bottom-0 bg-white border-l border-gray-200 flex flex-col shadow-2xl z-[100] animate-in slide-in-from-right-8 duration-300">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-gray-900 font-semibold">
                    <FileText size={18} />
                    <span>Standard Operating Procedure</span>
                </div>
                <button
                    onClick={onClose}
                    className="p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-lg transition-colors"
                >
                    <X size={18} />
                </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 h-full">
                <h2 className="text-xl font-bold text-gray-900 mb-4">{title}</h2>
                <div className="h-[calc(100%-40px)]">
                    <SOPEditor />
                </div>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                <button
                    onClick={onClose}
                    className="px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                >
                    Đóng (Close)
                </button>
            </div>
        </div>
    );
}
