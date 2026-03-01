"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { User, PremiumEvent } from "@/types";
import { supabase } from "@/lib/supabase";

interface AuthContextType {
    user: User | null;
    login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
    register: (email: string, password: string, displayName?: string) => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    upgradePremium: () => Promise<void>;
    cancelPremium: () => Promise<void>;
    updateProfile: (updates: Partial<Pick<User, "displayName" | "email" | "avatarColor" | "avatarUrl">>) => Promise<{ success: boolean; error?: string }>;
    changePassword: (oldPassword: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
    deleteAccount: () => Promise<void>;
    isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AVATAR_COLORS = [
    "from-gray-700 to-gray-900",
    "from-blue-500 to-blue-700",
    "from-emerald-500 to-emerald-700",
    "from-purple-500 to-purple-700",
    "from-rose-500 to-rose-700",
    "from-cyan-500 to-cyan-700",
    "from-orange-500 to-orange-700",
    "from-indigo-500 to-indigo-700",
];
export { AVATAR_COLORS };

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isInitialized, setIsInitialized] = useState(false);

    useEffect(() => {
        const initializeAuth = async () => {
            try {
                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    console.warn("Auth session error (handled):", error.message);
                    await supabase.auth.signOut();
                } else if (session?.user) {
                    await loadUserProfile(session.user.id, session.user.email!);
                }
            } catch (err) {
                console.warn("Error getting auth session (handled):", err);
            } finally {
                setIsInitialized(true);
            }

            // Listen for auth changes
            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_IN' && session?.user) {
                    // Check if email is confirmed 
                    if (session.user.email_confirmed_at) {
                        await loadUserProfile(session.user.id, session.user.email!);
                    } else {
                        // If signed in but not confirmed (can happen if supabase auto-signs in)
                        // we sign out to be safe
                        await supabase.auth.signOut();
                    }
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                }
            });

            return () => {
                subscription.unsubscribe();
            };
        };

        initializeAuth();
    }, []);

    const loadUserProfile = async (userId: string, email: string) => {
        try {
            // Check auth again to ensure email_confirmed_at is present
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser && !authUser.email_confirmed_at) {
                console.warn("Attempted to load profile for unconfirmed user.");
                setUser(null);
                return;
            }

            const { data: profile, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error && error.code !== 'PGRST116') { // PGRST116 is not found
                console.error("Error loading profile:", error);
                return;
            }

            if (profile) {
                setUser({
                    id: profile.id,
                    email: profile.email || email,
                    password: '', // We don't store passwords in state anymore
                    displayName: profile.display_name,
                    avatarColor: profile.avatar_color,
                    avatarUrl: profile.avatar_url,
                    isPremium: profile.is_premium,
                    premiumHistory: profile.premium_history || [],
                    createdAt: profile.created_at,
                });
            } else {
                // If profile doesn't exist yet but user is authenticated (e.g. just signed up and trigger hasn't fired or sync issue)
                setUser({
                    id: userId,
                    email: email,
                    password: '',
                    displayName: '',
                    avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
                    isPremium: false,
                    premiumHistory: [],
                    createdAt: new Date().toISOString(),
                });
            }
        } catch (err) {
            console.error("Unexpected error loading profile:", err);
        }
    };

    const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
        if (!email.trim() || !password) return { success: false, error: "Email and password are required" };

        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            if (error.message.toLowerCase().includes("email not confirmed")) {
                return { success: false, error: "Please verify your email address before logging in." };
            }
            if (error.message === "Invalid login credentials") {
                // Supabase obscures unconfirmed emails behind "Invalid login credentials" by default.
                // We do a fast check just for the error message UX. We use a public `profiles` call.
                // If the user exists in profiles, but login failed, they either typed wrong pass or are unconfirmed.
                // We'll give a more helpful combined error just in case.
                return { success: false, error: "Invalid credentials. If you just registered, please verify your email first." };
            }
            return { success: false, error: error.message };
        }
        return { success: true };
    };

    const register = async (email: string, password: string, displayName?: string): Promise<{ success: boolean; error?: string }> => {
        if (!email.trim() || !password || password.length < 6) {
            return { success: false, error: "Email required and password must be at least 6 characters" };
        }

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    display_name: displayName || '',
                },
                emailRedirectTo: typeof window !== 'undefined' ? `${window.location.origin}/` : undefined,
            }
        });

        if (error) return { success: false, error: error.message };

        // If data.user is returned but session is null, it usually means email confirmation is required
        // OR if session exists but email is not confirmed, we want to force sign out to prevent auto-login
        if (data.user) {
            const isConfirmed = !!data.user.email_confirmed_at;

            if (!isConfirmed) {
                // If Supabase auto-logged in (data.session exists) but email is not verified, 
                // we must sign out immediately to prevent the app from entering authorized state.
                if (data.session) {
                    await supabase.auth.signOut();
                }
                return { success: true, error: "Registration successful! Please check your email to verify your account." };
            }
        }

        // Wait a slight moment for the database trigger to create the profile
        if (data.user) {
            await loadUserProfile(data.user.id, data.user.email!);

            // If the trigger didn't catch it, manually insert initial profile data
            // Non-blocking in case of RLS policy restricting public insertion
            try {
                const { error: profileError } = await supabase.from('profiles').upsert({
                    id: data.user.id,
                    email: data.user.email,
                    display_name: displayName || '',
                    avatar_color: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
                    is_premium: false
                }, { onConflict: 'id' }).select().single();

                if (profileError) {
                    console.warn("Could not upsert profile directly (Likely RLS blocking, relying on DB Trigger):", profileError.message);
                }
            } catch (err) {
                console.warn("Error during manual profile creation fallback:", err);
            }
        }

        return { success: true, error: "Registration successful! Please check your email to verify your account." };
    };

    const logout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error("Error signing out:", error);
        } finally {
            setUser(null);
            window.location.href = '/';
        }
    };

    const upgradePremium = async () => {
        if (!user) return;

        const event: PremiumEvent = { type: "activated", date: new Date().toISOString() };
        const newHistory = [...(user.premiumHistory || []), event];

        const { error } = await supabase
            .from('profiles')
            .update({
                is_premium: true,
                premium_history: newHistory
            })
            .eq('id', user.id);

        if (!error) {
            setUser({ ...user, isPremium: true, premiumHistory: newHistory });
        } else {
            console.error("Failed to upgrade premium:", error);
        }
    };

    const cancelPremium = async () => {
        if (!user) return;
        const event: PremiumEvent = { type: "cancelled", date: new Date().toISOString() };
        const newHistory = [...(user.premiumHistory || []), event];

        const { error } = await supabase
            .from('profiles')
            .update({
                is_premium: false,
                premium_history: newHistory
            })
            .eq('id', user.id);

        if (!error) {
            setUser({ ...user, isPremium: false, premiumHistory: newHistory });
        } else {
            console.error("Failed to cancel premium:", error);
        }
    };

    const updateProfile = async (updates: Partial<Pick<User, "displayName" | "email" | "avatarColor" | "avatarUrl">>): Promise<{ success: boolean; error?: string }> => {
        if (!user) return { success: false, error: "Not logged in" };

        let dbUpdates: any = {};
        let authUpdates: any = {};

        if (updates.email && updates.email !== user.email) {
            // Note: Changing email in Supabase sends a confirmation email standard.
            authUpdates.email = updates.email;
            dbUpdates.email = updates.email;
        }

        if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
        if (updates.avatarColor !== undefined) dbUpdates.avatar_color = updates.avatarColor;
        if (updates.avatarUrl !== undefined) dbUpdates.avatar_url = updates.avatarUrl;

        // Update Auth if needed
        if (Object.keys(authUpdates).length > 0) {
            const { error: authError } = await supabase.auth.updateUser(authUpdates);
            if (authError) return { success: false, error: authError.message };
        }

        // Update Profiles table
        if (Object.keys(dbUpdates).length > 0) {
            const { error: dbError } = await supabase
                .from('profiles')
                .update(dbUpdates)
                .eq('id', user.id);

            if (dbError) return { success: false, error: dbError.message };
        }

        setUser({ ...user, ...updates });
        return { success: true };
    };

    const changePassword = async (oldPassword: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
        if (!user) return { success: false, error: "Not logged in" };
        if (!newPassword || newPassword.length < 6) return { success: false, error: "New password must be at least 6 characters" };

        // Supabase updateUser only requires the new password if the user is already signed in and has a valid session
        const { error } = await supabase.auth.updateUser({ password: newPassword });

        if (error) return { success: false, error: error.message };
        return { success: true };
    };

    const deleteAccount = async () => {
        if (!user) return;

        // Due to security, deleting a user auth account entirely often requires edge functions or admin privileges.
        // However, we can delete the profile and sign out.
        // With RLS and cascade delete, deleting the profile or using an RPC call would be needed.
        // For standard client:
        const { error } = await supabase.rpc('delete_user'); // Requires setting up an RPC or handling it via backend
        if (error) {
            console.error("Client cannot delete auth user without RPC. Falling back to profile deletion.");
            await supabase.from('profiles').delete().eq('id', user.id);
        }

        await supabase.auth.signOut();
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, register, logout, upgradePremium, cancelPremium, updateProfile, changePassword, deleteAccount, isInitialized }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) throw new Error("useAuth must be used within an AuthProvider");
    return context;
}

