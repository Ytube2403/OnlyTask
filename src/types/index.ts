export type Id = string | number;

export type Column = {
    id: Id;
    title: string;
};

export type Task = {
    id: Id;
    columnId: Id;
    content: string;
    description?: string;
    tag?: string;
    time?: string;
    effort?: number;
    deadline?: string; // ISO date string
    linkedSopIds?: string[];
    score?: number;
    reviewNote?: string;
    completionDate?: string; // ISO date string
    isImportant?: boolean;
    actualTimeSeconds?: number;
};

export type SOP = {
    id: string;
    title: string;
    content: string; // HTML or JSON string depending on tiptap output
    tags: string[];
    folder?: string;
    linkedTaskIds?: string[];
    updatedAt: string; // ISO date string
};

export type PremiumEvent = {
    type: "activated" | "cancelled";
    date: string; // ISO date string
};

export type User = {
    id: string;
    email: string;
    password: string;
    displayName?: string;
    avatarColor?: string;
    avatarUrl?: string;
    isPremium: boolean;
    premiumHistory?: PremiumEvent[];
    createdAt: string;
};

export type AppSettings = {
    language: "vi" | "en";
    defaultView: "workspace" | "calendar" | "notes";
    notifications: {
        deletionWarnings: boolean;
        deadlineReminders: boolean;
    };
    seenFeatures: {
        workspace: boolean;
        calendar: boolean;
        notes: boolean;
        sops: boolean;
    };
};
