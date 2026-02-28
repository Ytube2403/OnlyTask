"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Mail, ArrowRight, Lock, User, Eye, EyeOff } from "lucide-react";

export function AuthModal() {
    const { login, register } = useAuth();
    const [mode, setMode] = useState<"login" | "register">("login");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [displayName, setDisplayName] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (mode === "login") {
            const result = await login(email, password);
            if (!result.success) setError(result.error || "Login failed");
        } else {
            const result = await register(email, password, displayName);
            if (!result.success) setError(result.error || "Registration failed");
        }
    };

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-gray-100 via-white to-gray-50 z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl shadow-gray-200/50 relative overflow-hidden animate-in zoom-in-95 duration-300 border border-gray-100">
                {/* Decorative */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 bg-blue-100 rounded-full blur-3xl opacity-40 pointer-events-none" />
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 w-48 h-48 bg-purple-100 rounded-full blur-3xl opacity-40 pointer-events-none" />

                <div className="relative z-10 p-8">
                    {/* Icon */}
                    <div className="w-16 h-16 bg-black text-white rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-black/10">
                        <Mail className="w-8 h-8" />
                    </div>

                    {/* Tabs */}
                    <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
                        <button
                            onClick={() => { setMode("login"); setError(""); }}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === "login" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => { setMode("register"); setError(""); }}
                            className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all ${mode === "register" ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
                        >
                            Create Account
                        </button>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600 font-medium animate-in fade-in duration-200">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-3">
                        {mode === "register" && (
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={displayName}
                                    onChange={(e) => setDisplayName(e.target.value)}
                                    placeholder="Display name (optional)"
                                    className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border-2 border-transparent focus:border-black rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none transition-all text-sm font-medium"
                                />
                            </div>
                        )}
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border-2 border-transparent focus:border-black rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none transition-all text-sm font-medium"
                                required
                            />
                        </div>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Password"
                                className="w-full pl-12 pr-12 py-3.5 bg-gray-50 border-2 border-transparent focus:border-black rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none transition-all text-sm font-medium"
                                required
                                minLength={4}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-black text-white px-5 py-3.5 rounded-xl font-semibold hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-all flex items-center justify-center gap-2 group mt-2"
                        >
                            <span>{mode === "login" ? "Sign In" : "Create Account"}</span>
                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                    </form>

                    <div className="mt-6 text-center text-xs text-gray-400">
                        {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => { setMode(mode === "login" ? "register" : "login"); setError(""); }}
                            className="text-black font-semibold hover:underline"
                        >
                            {mode === "login" ? "Create one" : "Sign in"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
