"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { SOP } from "@/types";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";

interface SOPContextType {
    sops: SOP[];
    searchQuery: string;
    selectedTag: string | null;
    setSearchQuery: (query: string) => void;
    setSelectedTag: (tag: string | null) => void;
    addSOP: (sop: Omit<SOP, 'id' | 'updatedAt'>) => Promise<SOP | null>;
    updateSOP: (id: string, updates: Partial<SOP>) => Promise<void>;
    deleteSOP: (id: string) => Promise<void>;
}

const SOPContext = createContext<SOPContextType | undefined>(undefined);

// Helper mappings
function mapRowToSOP(row: any): SOP {
    return {
        id: row.id,
        title: row.title,
        content: row.content,
        tags: row.tags || [],
        folder: row.folder || undefined,
        linkedTaskIds: row.linked_task_ids || [],
        updatedAt: row.updated_at,
    };
}

function mapSOPToRow(sop: Partial<SOP>, userId: string): any {
    const row: any = {};
    if (sop.id !== undefined) row.id = sop.id;
    if (userId) row.user_id = userId;
    if (sop.title !== undefined) row.title = sop.title;
    if (sop.content !== undefined) row.content = sop.content;
    if (sop.tags !== undefined) row.tags = sop.tags;
    if (sop.folder !== undefined) row.folder = sop.folder;
    if (sop.linkedTaskIds !== undefined) row.linked_task_ids = sop.linkedTaskIds;
    if (sop.updatedAt !== undefined) row.updated_at = sop.updatedAt;
    return row;
}

export function SOPProvider({ children }: { children: ReactNode }) {
    const { user, isInitialized } = useAuth();

    const [sops, setSops] = useState<SOP[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedTag, setSelectedTag] = useState<string | null>(null);

    // Fetch SOPs
    useEffect(() => {
        if (!isInitialized) return;
        if (!user) {
            setSops([]);
            return;
        }

        const fetchSOPs = async () => {
            const { data, error } = await supabase
                .from('sop_notes')
                .select('*')
                .eq('user_id', user.id)
                .order('updated_at', { ascending: false });

            if (error) {
                console.error("Error fetching SOPs:", error);
                return;
            }

            if (data) {
                setSops(data.map(mapRowToSOP));
            }
        };

        fetchSOPs();
    }, [user, isInitialized]);

    const addSOP = async (sopData: Omit<SOP, 'id' | 'updatedAt'>) => {
        if (!user) return null;

        const newSOP: SOP = {
            ...sopData,
            id: crypto.randomUUID(),
            updatedAt: new Date().toISOString(),
        };

        // Optimistic UI
        setSops(prev => [newSOP, ...prev]);

        // DB Update
        const { error } = await supabase
            .from('sop_notes')
            .insert(mapSOPToRow(newSOP, user.id));

        if (error) {
            console.error("Error adding SOP:", error);
        }
        return newSOP;
    };

    const updateSOP = async (id: string, updates: Partial<SOP>) => {
        if (!user) return;

        const now = new Date().toISOString();

        // Optimistic UI
        setSops(prev => prev.map(sop =>
            sop.id === id
                ? { ...sop, ...updates, updatedAt: now }
                : sop
        ));

        // DB Update
        const rowUpdates = mapSOPToRow({ ...updates, updatedAt: now }, '');
        const { error } = await supabase
            .from('sop_notes')
            .update(rowUpdates)
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error("Error updating SOP:", error);
        }
    };

    const deleteSOP = async (id: string) => {
        if (!user) return;

        // Optimistic UI
        setSops(prev => prev.filter(sop => sop.id !== id));

        // DB Update
        const { error } = await supabase
            .from('sop_notes')
            .delete()
            .eq('id', id)
            .eq('user_id', user.id);

        if (error) {
            console.error("Error deleting SOP:", error);
        }
    };

    return (
        <SOPContext.Provider value={{
            sops,
            searchQuery,
            selectedTag,
            setSearchQuery,
            setSelectedTag,
            addSOP,
            updateSOP,
            deleteSOP
        }}>
            {children}
        </SOPContext.Provider>
    );
}

export function useSOPs() {
    const context = useContext(SOPContext);
    if (!context) {
        throw new Error("useSOPs must be used within a SOPProvider");
    }
    return context;
}
