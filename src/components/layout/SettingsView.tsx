"use client";

import { useSettings } from "@/context/SettingsContext";
import { useAuth } from "@/context/AuthContext";
import {
    Sun, Moon, Globe, Bell, BellOff, Layout, Database, Trash2,
    Keyboard, Info, Crown, ChevronRight, Monitor
} from "lucide-react";

const KEYBOARD_SHORTCUTS = [
    { key: "C", desc: "Create a new task" },
    { key: "Cmd/Ctrl + Enter", desc: "Save / Create task" },
    { key: "Enter", desc: "Quick add task in column" },
    { key: "Drag & Drop", desc: "Move tasks between columns" },
];

export function SettingsView() {
    const { settings, updateSettings, updateNotifications, clearCache, storageUsage } = useSettings();
    const { user } = useAuth();

    const t = settings.language === "vi" ? {
        title: "Cài đặt",
        appearance: "Giao diện",
        theme: "Chủ đề",
        light: "Sáng",
        dark: "Tối",
        language: "Ngôn ngữ",
        vietnamese: "Tiếng Việt",
        english: "English",
        notifications: "Thông báo",
        deletionWarnings: "Cảnh báo xoá task",
        deletionDesc: "Thông báo trước 3 ngày khi task sắp bị xoá",
        deadlineReminders: "Nhắc nhở deadline",
        deadlineDesc: "Hiển thị cảnh báo khi task gần đến hạn",
        preferences: "Tuỳ chỉnh",
        defaultView: "Màn hình mặc định",
        workspace: "Workspace",
        calendar: "Calendar",
        notes: "Notes",
        data: "Dữ liệu",
        storageUsed: "Dung lượng sử dụng",
        clearCache: "Xoá bộ nhớ đệm",
        clearCacheDesc: "Xoá dữ liệu tạm (giữ lại tài khoản và cài đặt)",
        shortcuts: "Phím tắt",
        about: "Thông tin",
        version: "Phiên bản",
        plan: "Gói sử dụng",
        free: "Miễn phí",
        premium: "Premium",
    } : {
        title: "Settings",
        appearance: "Appearance",
        theme: "Theme",
        light: "Light",
        dark: "Dark",
        language: "Language",
        vietnamese: "Tiếng Việt",
        english: "English",
        notifications: "Notifications",
        deletionWarnings: "Deletion Warnings",
        deletionDesc: "Notify 3 days before tasks are deleted",
        deadlineReminders: "Deadline Reminders",
        deadlineDesc: "Show warnings when tasks approach their deadline",
        preferences: "Preferences",
        defaultView: "Default View",
        workspace: "Workspace",
        calendar: "Calendar",
        notes: "Notes",
        data: "Data Management",
        storageUsed: "Storage Used",
        clearCache: "Clear Cache",
        clearCacheDesc: "Remove temporary data (keeps account and settings)",
        shortcuts: "Keyboard Shortcuts",
        about: "About",
        version: "Version",
        plan: "Plan",
        free: "Free",
        premium: "Premium",
    };

    return (
        <div className="flex-1 h-full overflow-y-auto bg-neutral-50 ">
            <div className="max-w-2xl mx-auto py-10 px-6">
                <h1 className="text-3xl font-bold text-gray-900  mb-8 tracking-tight">{t.title}</h1>

                {/* Appearance */}
                <Section title={t.appearance}>
                    {/* Language */}
                    <SettingRow icon={<Globe size={18} />} label={t.language}>
                        <div className="flex bg-gray-100  rounded-xl p-1 gap-1">
                            <ToggleButton
                                active={settings.language === "vi"}
                                onClick={() => updateSettings({ language: "vi" })}
                                label={t.vietnamese}
                            />
                            <ToggleButton
                                active={settings.language === "en"}
                                onClick={() => updateSettings({ language: "en" })}
                                label={t.english}
                            />
                        </div>
                    </SettingRow>
                </Section>

                {/* Notifications */}
                <Section title={t.notifications}>
                    <SettingRow icon={<Bell size={18} />} label={t.deletionWarnings} desc={t.deletionDesc}>
                        <ToggleSwitch
                            checked={settings.notifications.deletionWarnings}
                            onChange={(v) => updateNotifications({ deletionWarnings: v })}
                        />
                    </SettingRow>
                    <SettingRow icon={<BellOff size={18} />} label={t.deadlineReminders} desc={t.deadlineDesc}>
                        <ToggleSwitch
                            checked={settings.notifications.deadlineReminders}
                            onChange={(v) => updateNotifications({ deadlineReminders: v })}
                        />
                    </SettingRow>
                </Section>

                {/* Preferences */}
                <Section title={t.preferences}>
                    <SettingRow icon={<Layout size={18} />} label={t.defaultView}>
                        <select
                            value={settings.defaultView}
                            onChange={(e) => updateSettings({ defaultView: e.target.value as "workspace" | "calendar" | "notes" })}
                            className="bg-gray-100  border-0 rounded-xl px-4 py-2 text-sm font-medium text-gray-700  focus:outline-none focus:ring-2 focus:ring-black  cursor-pointer"
                        >
                            <option value="workspace">{t.workspace}</option>
                            <option value="calendar">{t.calendar}</option>
                            <option value="notes">{t.notes}</option>
                        </select>
                    </SettingRow>
                </Section>

                {/* Data */}
                <Section title={t.data}>
                    <SettingRow icon={<Database size={18} />} label={t.storageUsed}>
                        <span className="text-sm font-mono font-semibold text-gray-700  bg-gray-100  px-3 py-1.5 rounded-lg">{storageUsage}</span>
                    </SettingRow>
                    <SettingRow icon={<Trash2 size={18} />} label={t.clearCache} desc={t.clearCacheDesc}>
                        <button
                            onClick={clearCache}
                            className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-sm font-semibold hover:bg-red-100 transition-all   "
                        >
                            {t.clearCache}
                        </button>
                    </SettingRow>
                </Section>

                {/* Shortcuts */}
                <Section title={t.shortcuts}>
                    <div className="divide-y divide-gray-50 ">
                        {KEYBOARD_SHORTCUTS.map((s) => (
                            <div key={s.key} className="flex items-center justify-between px-5 py-4">
                                <span className="text-sm font-medium text-gray-800 ">{s.desc}</span>
                                <kbd className="px-3 py-1.5 bg-gray-100  border border-gray-200  rounded-lg text-xs font-mono font-semibold text-gray-700 ">{s.key}</kbd>
                            </div>
                        ))}
                    </div>
                </Section>

                {/* About */}
                <Section title={t.about}>
                    <SettingRow icon={<Info size={18} />} label={t.version}>
                        <span className="text-sm font-mono text-gray-500">1.0.0</span>
                    </SettingRow>
                    <SettingRow icon={<Monitor size={18} />} label={t.plan}>
                        <span className={`text-sm font-semibold flex items-center gap-1.5 ${user?.isPremium ? "text-amber-600" : "text-gray-500"}`}>
                            {user?.isPremium && <Crown size={14} />}
                            {user?.isPremium ? t.premium : t.free}
                        </span>
                    </SettingRow>
                </Section>

                <div className="text-center text-xs text-gray-400  mt-8 pb-4 flex items-center justify-center gap-1">
                    OnlyTask by Quaan
                </div>
            </div>
        </div>
    );
}

// ─── Sub-components ───────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div className="mb-8">
            <h2 className="text-xs font-bold text-gray-400  uppercase tracking-widest mb-3 px-1">{title}</h2>
            <div className="bg-white  rounded-2xl border border-gray-100  divide-y divide-gray-50  shadow-sm">
                {children}
            </div>
        </div>
    );
}

function SettingRow({ icon, label, desc, children }: { icon: React.ReactNode; label: string; desc?: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between px-5 py-4 gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="text-gray-400  flex-shrink-0">{icon}</div>
                <div className="min-w-0">
                    <span className="text-sm font-medium text-gray-800  block">{label}</span>
                    {desc && <span className="text-xs text-gray-400  block mt-0.5">{desc}</span>}
                </div>
            </div>
            <div className="flex-shrink-0">{children}</div>
        </div>
    );
}

function ToggleButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon?: React.ReactNode; label: string }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${active
                ? "bg-white  shadow-sm text-gray-900 "
                : "text-gray-500  hover:text-gray-700"
                }`}
        >
            {icon}
            {label}
        </button>
    );
}

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
    return (
        <button
            onClick={() => onChange(!checked)}
            className={`relative w-11 h-6 rounded-full transition-all ${checked ? "bg-black " : "bg-gray-200 "}`}
        >
            <div className={`absolute top-0.5 w-5 h-5 rounded-full transition-all shadow-sm ${checked
                ? "left-[22px] bg-white "
                : "left-0.5 bg-white "
                }`} />
        </button>
    );
}
