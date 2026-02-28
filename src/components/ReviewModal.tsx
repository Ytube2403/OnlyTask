"use client";

import { X } from "lucide-react";
import { useState } from "react";

interface Props {
    isOpen: boolean;
    onClose: () => void;
    taskTitle: string;
    onSubmit: (score: number, note: string) => void;
}

export function ReviewModal({ isOpen, onClose, taskTitle, onSubmit }: Props) {
    const [score, setScore] = useState<number>(8);
    const [note, setNote] = useState("");

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-[500px] bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col p-8 m-4">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Growth & Review</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-900 rounded-full transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <p className="text-gray-600 mb-6 font-medium">
                    Bạn vừa hoàn thành: <span className="text-black font-semibold">"{taskTitle}"</span>
                </p>

                <div className="mb-6">
                    <label className="block text-sm font-semibold text-gray-900 mb-3">
                        Đánh giá mức độ hài lòng (1-10)
                    </label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min="1"
                            max="10"
                            value={score}
                            onChange={(e) => setScore(Number(e.target.value))}
                            className="w-full accent-black"
                        />
                        <span className="text-xl font-bold w-8 text-center bg-gray-100 rounded-lg py-1">{score}</span>
                    </div>
                </div>

                <div className="mb-8">
                    <label className="block text-sm font-semibold text-gray-900 mb-2">
                        Ghi chú phản tỉnh (Bài học / Khó khăn)
                    </label>
                    <textarea
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl resize-none h-32 focus:ring-2 focus:ring-black outline-none transition-all placeholder:text-gray-400"
                        placeholder="Bạn đã học được gì từ công việc này? Điều gì có thể làm tốt hơn?"
                    />
                </div>

                <div className="flex justify-end gap-3 mt-auto">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 bg-white border border-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-colors"
                    >
                        Bỏ qua
                    </button>
                    <button
                        onClick={() => {
                            onSubmit(score, note);
                            onClose();
                        }}
                        className="px-6 py-3 bg-black text-white rounded-full font-medium hover:bg-gray-800 transition-colors shadow-sm"
                    >
                        Lưu đánh giá
                    </button>
                </div>
            </div>
        </div>
    );
}
