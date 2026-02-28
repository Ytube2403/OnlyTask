import { useSOPs } from "@/context/SOPContext";
import { Search, Folder, Hash, Plus, FileText, Trash2, FilePlus } from "lucide-react";
import { useState } from "react";
import { SOPEditor } from "../SOPEditor";
import { FeatureTooltip } from "@/components/ui/FeatureTooltip";

export function NotesView() {
    const { sops, searchQuery, setSearchQuery, selectedTag, setSelectedTag, addSOP, deleteSOP } = useSOPs();
    const [editingSopId, setEditingSopId] = useState<string | null>(null);

    // Lấy danh sách tags unique
    const allTags = Array.from(new Set(sops.flatMap(sop => sop.tags)));

    const filteredSOPs = sops.filter(sop => {
        const matchesSearch = sop.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            sop.content.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTag = selectedTag ? sop.tags.includes(selectedTag) : true;
        return matchesSearch && matchesTag;
    });

    const handleCreateNew = async () => {
        const newSop = await addSOP({ title: "New Document", content: "", tags: [] });
        if (newSop) setEditingSopId(newSop.id);
    };

    const handleDeleteSOP = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation(); // Ngăn mở card khi click nút xóa
        if (window.confirm("Bạn có chắc chắn muốn xóa tài liệu này không?")) {
            await deleteSOP(id);
        }
    };

    if (editingSopId) {
        const editingSop = sops.find(s => s.id === editingSopId);
        return (
            <div className="flex-1 h-full bg-neutral-50 p-6 flex flex-col items-center">
                <div className="w-full max-w-4xl h-full shadow-lg rounded-2xl overflow-hidden ring-1 ring-black/5">
                    <SOPEditor
                        sopId={editingSop?.id}
                        initialTitle={editingSop?.title}
                        initialContent={editingSop?.content}
                        initialTags={editingSop?.tags}
                        onClose={() => setEditingSopId(null)}
                    />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="flex-1 h-full bg-neutral-50 flex overflow-hidden w-full">
                {/* Notes Sidebar */}
                <div className="w-64 border-r border-gray-200 bg-white p-6 flex flex-col gap-6 flex-shrink-0">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">Library</h2>

                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input
                            type="text"
                            placeholder="Search docs..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-black outline-none transition-all placeholder:text-gray-400"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <button
                            onClick={() => setSelectedTag(null)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${!selectedTag ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                        >
                            <Folder size={16} /> All Documents
                        </button>
                        {allTags.map(tag => (
                            <button
                                key={tag}
                                onClick={() => setSelectedTag(tag)}
                                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${selectedTag === tag ? 'bg-gray-100 text-gray-900' : 'text-gray-600 hover:bg-gray-50'}`}
                            >
                                <Hash size={16} /> {tag}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Notes Grid */}
                <div className="flex-1 p-8 overflow-y-auto">
                    <div className="flex items-center justify-between mb-8 max-w-6xl mx-auto">
                        <div>
                            <h1 className="text-3xl font-extrabold text-gray-900">{selectedTag ? `#${selectedTag}` : "All Documents"}</h1>
                            <p className="text-gray-500 mt-2">{filteredSOPs.length} documents found</p>
                        </div>
                        <button
                            onClick={handleCreateNew}
                            className="flex items-center gap-2 bg-black text-white px-5 py-2.5 rounded-xl text-sm font-bold shadow-sm hover:bg-gray-800 transition-all">
                            <Plus size={16} /> New Document
                        </button>
                    </div>

                    {filteredSOPs.length === 0 ? (
                        <div className="max-w-6xl mx-auto flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-dashed border-gray-300 min-h-[400px]">
                            <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                                <FilePlus className="text-gray-300 w-10 h-10" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Thư viện của bạn đang trống</h3>
                            <p className="text-gray-500 mb-8 max-w-sm text-center">
                                Chưa có tài liệu nào ở đây. Bắt đầu xây dựng cơ sở tri thức và quy trình làm việc của bạn bằng cách tạo tài liệu đầu tiên.
                            </p>
                            <button
                                onClick={handleCreateNew}
                                className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-bold shadow-sm hover:bg-gray-800 transition-all hover:-translate-y-0.5"
                            >
                                <Plus size={18} /> Tạo tài liệu mới ngay
                            </button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
                            {filteredSOPs.map(sop => (
                                <div
                                    key={sop.id}
                                    onClick={() => setEditingSopId(sop.id)}
                                    className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all cursor-pointer group flex flex-col h-48 relative overflow-hidden"
                                >
                                    <div className="flex items-start justify-between mb-3 relative z-10">
                                        <div className="flex items-center gap-2 bg-neutral-100 px-2.5 py-1 rounded-md text-xs font-semibold text-neutral-600">
                                            <FileText size={14} /> SOP
                                        </div>
                                        <button
                                            onClick={(e) => handleDeleteSOP(e, sop.id)}
                                            className="text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-red-50 hover:text-red-500 rounded-lg"
                                            title="Xóa tài liệu"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 leading-snug z-10">{sop.title}</h3>

                                    <div className="mt-auto flex flex-col gap-3 z-10">
                                        {sop.tags && sop.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1.5">
                                                {sop.tags.map(tag => (
                                                    <span key={tag} className="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">#{tag}</span>
                                                ))}
                                            </div>
                                        )}
                                        <div className="text-xs text-gray-400 font-medium">
                                            Cập nhật: {new Date(sop.updatedAt).toLocaleDateString("vi-VN", {
                                                day: '2-digit', month: '2-digit', year: 'numeric'
                                            })}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <FeatureTooltip
                feature="notes"
                title="Thư viện tài liệu (Library)"
                bullets={[
                    "Nơi quản lý toàn bộ các tiêu chuẩn, quy trình, và ghi chú của bạn.",
                    "Dễ dàng phân loại, thanh lọc bằng hệ thống tag và tìm kiếm nội dung.",
                    "Tạo trước tài liệu ở đây để gắn trực tiếp vào các task lúc làm việc.",
                ]}
            />
        </>
    );
}
