"use client";

import { useState, useRef } from "react";
import { useAuth, AVATAR_COLORS } from "@/context/AuthContext";
import { X, Crown, LogOut, Shield, User, Sparkles, Pencil, Check, Lock, Trash2, History, ChevronDown, ChevronUp, Camera, Loader2, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";

const DEFAULT_AVATARS = [
    "/avatars/Banh-mi.png",
    "/avatars/Beer.png",
    "/avatars/Boba Milk Tea.png",
    "/avatars/Bun-ca.png",
    "/avatars/Coffee.png",
    "/avatars/Com-tam.png",
    "/avatars/Ga-quay.png",
    "/avatars/Goi-cuon.png",
    "/avatars/Pho.png",
    "/avatars/Sandwich.png"
];

interface AccountModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AccountModal({ isOpen, onClose }: AccountModalProps) {
    const { user, logout, upgradePremium, cancelPremium, updateProfile, changePassword, deleteAccount } = useAuth();

    const [editingField, setEditingField] = useState<string | null>(null);
    const [editName, setEditName] = useState("");
    const [editEmail, setEditEmail] = useState("");
    const [oldPassword, setOldPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [fieldError, setFieldError] = useState("");
    const [fieldSuccess, setFieldSuccess] = useState("");
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [isUpgrading, setIsUpgrading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;

        if (file.size > 2 * 1024 * 1024) {
            setFieldError("Image must be less than 2MB");
            return;
        }

        try {
            setUploadingAvatar(true);
            setFieldError("");

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

            const publicUrl = data.publicUrl;

            await updateProfile({ avatarUrl: publicUrl });
            setFieldSuccess("Avatar updated successfully");
            setTimeout(() => setFieldSuccess(""), 2000);
        } catch (error: any) {
            setFieldError(error.message || "Failed to upload avatar");
        } finally {
            setUploadingAvatar(false);
        }
    };

    const [showConfirmLogout, setShowConfirmLogout] = useState(false);
    const [showConfirmDelete, setShowConfirmDelete] = useState(false);
    const [showPremiumHistory, setShowPremiumHistory] = useState(false);

    if (!isOpen || !user) return null;

    const memberSince = new Date(user.createdAt).toLocaleDateString("vi-VN", {
        year: "numeric", month: "long", day: "numeric",
    });

    const displayChar = (user.displayName?.[0] || user.email[0]).toUpperCase();
    const avatarGrad = user.avatarColor || "from-gray-700 to-gray-900";

    const handleSaveName = async () => {
        const result = await updateProfile({ displayName: editName });
        if (result.success) { setEditingField(null); setFieldSuccess("Name updated"); setFieldError(""); setTimeout(() => setFieldSuccess(""), 2000); }
        else { setFieldError(result.error || "Failed"); }
    };

    const handleSaveEmail = async () => {
        const result = await updateProfile({ email: editEmail });
        if (result.success) { setEditingField(null); setFieldSuccess("Email updated"); setFieldError(""); setTimeout(() => setFieldSuccess(""), 2000); }
        else { setFieldError(result.error || "Failed"); }
    };

    const handleChangePassword = async () => {
        const result = await changePassword(oldPassword, newPassword);
        if (result.success) {
            setEditingField(null); setOldPassword(""); setNewPassword("");
            setFieldSuccess("Password changed"); setFieldError("");
            setTimeout(() => setFieldSuccess(""), 2000);
        } else { setFieldError(result.error || "Failed"); }
    };

    const handleColorChange = async (color: string) => {
        await updateProfile({ avatarColor: color, avatarUrl: undefined }); // Setting color removes custom image
    };

    const handleDefaultAvatarChange = async (url: string) => {
        await updateProfile({ avatarUrl: url, avatarColor: undefined });
    };

    const handleUpgrade = async () => {
        try {
            setIsUpgrading(true);

            // ✅ SECURITY FIX (client-side): Lấy JWT token từ session hiện tại
            // và gửi trong header thay vì gửi userId trong body.
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) {
                alert('Vui lòng đăng nhập lại để tiếp tục.');
                return;
            }

            const res = await fetch('/api/create-payment-link', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`,
                },
                // Không gửi userId trong body nữa — server tự xác thực từ token
                body: JSON.stringify({})
            });

            const data = await res.json();

            if (data.checkoutUrl) {
                // Redirect to PayOS checkout page
                window.location.href = data.checkoutUrl;
            } else {
                alert('Có lỗi xảy ra: ' + (data.error || 'Vui lòng thử lại'));
            }
        } catch (error) {
            console.error('Lỗi khi thanh toán:', error);
            alert('Không thể kết nối đến cổng thanh toán. Vui lòng thử lại.');
        } finally {
            setIsUpgrading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto">
                {user.isPremium && <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400 z-10" />}

                <button onClick={onClose} className="absolute top-4 right-4 p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-all z-20">
                    <X size={20} />
                </button>

                {/* Header */}
                <div className="p-8 pb-4">
                    <div className="flex items-center gap-4">
                        <div
                            className="relative group cursor-pointer"
                            onClick={() => {
                                if (user.isPremium) {
                                    fileInputRef.current?.click();
                                }
                            }}
                        >
                            <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg transition-all ${user.isPremium ? "ring-[3px] ring-amber-400 ring-offset-2" : ""} ${!user.avatarUrl ? `bg-gradient-to-br ${avatarGrad}` : "bg-white overflow-hidden"}`}
                            >
                                {user.avatarUrl ? (
                                    <img
                                        src={user.avatarUrl}
                                        alt="Avatar"
                                        className={`w-full h-full ${DEFAULT_AVATARS.includes(user.avatarUrl) ? 'object-contain p-2' : 'object-cover'}`}
                                    />
                                ) : (
                                    displayChar
                                )}
                            </div>
                            <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                {user.isPremium ? <Camera size={20} className="text-white" /> : <Lock size={20} className="text-white" />}
                            </div>
                            {user.isPremium && <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <h2 className="text-lg font-bold text-gray-900 truncate">{user.displayName || user.email}</h2>
                                {user.isPremium && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">PRO</span>}
                            </div>
                            <p className="text-sm text-gray-500 truncate">{user.email}</p>
                            <p className="text-xs text-gray-400">Member since {memberSince}</p>
                        </div>
                    </div>
                </div>

                {/* Success/Error */}
                {fieldSuccess && <div className="mx-8 mb-2 p-2.5 bg-green-50 border border-green-200 rounded-xl text-xs text-green-600 font-medium">{fieldSuccess}</div>}
                {fieldError && <div className="mx-8 mb-2 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600 font-medium">{fieldError}</div>}

                {/* Profile Section */}
                <div className="px-8 pb-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Profile</h3>
                    <div className="space-y-2">
                        {/* Display Name */}
                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-xs text-gray-400 block">Display Name</span>
                                    <span className="text-sm font-medium text-gray-800">{user.displayName || "Not set"}</span>
                                </div>
                                {editingField !== "name" && (
                                    <button onClick={() => { setEditingField("name"); setEditName(user.displayName || ""); setFieldError(""); }}
                                        className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-200 rounded-lg transition-all"><Pencil size={14} /></button>
                                )}
                            </div>
                            {editingField === "name" && (
                                <div className="mt-2 flex gap-2">
                                    <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} placeholder="Your name"
                                        className="flex-1 px-3 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:border-black transition-all" autoFocus />
                                    <button onClick={handleSaveName} className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all"><Check size={14} /></button>
                                    <button onClick={() => setEditingField(null)} className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-all"><X size={14} /></button>
                                </div>
                            )}
                        </div>

                        {/* Email */}
                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-xs text-gray-400 block">Email</span>
                                    <span className="text-sm font-medium text-gray-800">{user.email}</span>
                                </div>
                                {editingField !== "email" && (
                                    <button onClick={() => { setEditingField("email"); setEditEmail(user.email); setFieldError(""); }}
                                        className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-200 rounded-lg transition-all"><Pencil size={14} /></button>
                                )}
                            </div>
                            {editingField === "email" && (
                                <div className="mt-2 flex gap-2">
                                    <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)}
                                        className="flex-1 px-3 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:border-black transition-all" autoFocus />
                                    <button onClick={handleSaveEmail} className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-all"><Check size={14} /></button>
                                    <button onClick={() => setEditingField(null)} className="p-2 bg-gray-200 text-gray-600 rounded-lg hover:bg-gray-300 transition-all"><X size={14} /></button>
                                </div>
                            )}
                        </div>

                        {/* Password */}
                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <span className="text-xs text-gray-400 block">Password</span>
                                    <span className="text-sm font-medium text-gray-800">••••••••</span>
                                </div>
                                {editingField !== "password" && (
                                    <button onClick={() => { setEditingField("password"); setFieldError(""); }}
                                        className="p-1.5 text-gray-400 hover:text-black hover:bg-gray-200 rounded-lg transition-all"><Lock size={14} /></button>
                                )}
                            </div>
                            {editingField === "password" && (
                                <div className="mt-2 space-y-2">
                                    <input type="password" value={oldPassword} onChange={(e) => setOldPassword(e.target.value)} placeholder="Current password"
                                        className="w-full px-3 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:border-black transition-all" autoFocus />
                                    <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="New password (min 4 chars)"
                                        className="w-full px-3 py-2 bg-white border rounded-lg text-sm focus:outline-none focus:border-black transition-all" />
                                    <div className="flex gap-2">
                                        <button onClick={handleChangePassword} className="flex-1 py-2 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-all">Change Password</button>
                                        <button onClick={() => { setEditingField(null); setOldPassword(""); setNewPassword(""); }} className="py-2 px-3 bg-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-300 transition-all">Cancel</button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Avatar Picker */}
                        <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <span className="text-xs text-gray-400 block mb-3 font-semibold uppercase">Avatar</span>

                            {/* Preset Images */}
                            <div className="mb-4">
                                <span className="text-[10px] text-gray-500 font-medium mb-1.5 block">Preset Avatars</span>
                                <div className="flex flex-wrap gap-2">
                                    {DEFAULT_AVATARS.map((url) => (
                                        <button
                                            key={url}
                                            onClick={() => handleDefaultAvatarChange(url)}
                                            className={`w-10 h-10 rounded-xl bg-white border shadow-sm transition-all hover:scale-110 overflow-hidden flex-shrink-0 flex items-center justify-center ${user.avatarUrl === url ? "ring-2 ring-black ring-offset-1 border-black" : "border-gray-200"}`}
                                        >
                                            <img src={url} alt="Preset avatar" className="w-full h-full object-contain p-1" />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Solid Colors */}
                            <div className="mb-4">
                                <span className="text-[10px] text-gray-500 font-medium mb-1.5 block">Solid Colors</span>
                                <div className="flex flex-wrap gap-2">
                                    {AVATAR_COLORS.map((color) => (
                                        <button
                                            key={color}
                                            onClick={() => handleColorChange(color)}
                                            className={`w-8 h-8 rounded-lg bg-gradient-to-br ${color} transition-all hover:scale-110 flex-shrink-0 ${user.avatarColor === color && !user.avatarUrl ? "ring-2 ring-black ring-offset-1" : ""}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Custom Upload */}
                            <div className="pt-3 border-t border-gray-200">
                                <span className="text-[10px] text-gray-500 font-medium mb-2 block">Custom Upload (Premium Only)</span>
                                <button
                                    onClick={() => {
                                        if (user.isPremium) fileInputRef.current?.click();
                                    }}
                                    className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-xs font-semibold transition-all ${user.isPremium ? "bg-white border border-gray-200 text-gray-700 hover:border-gray-300 hover:shadow-sm" : "bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200 border-dashed"}`}
                                >
                                    {uploadingAvatar ? <Loader2 size={14} className="animate-spin" /> : user.isPremium ? <ImageIcon size={14} /> : <Lock size={14} />}
                                    {uploadingAvatar ? "Uploading..." : "Upload from device"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Plan Section */}
                <div className="px-8 pb-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Subscription</h3>
                    <div className={`rounded-2xl p-4 border-2 ${user.isPremium ? "border-amber-200 bg-amber-50" : "border-gray-100 bg-gray-50"}`}>
                        <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                                {user.isPremium ? <Crown size={16} className="text-amber-500" /> : <User size={16} className="text-gray-500" />}
                                <span className="font-semibold text-gray-900 text-sm">{user.isPremium ? "Premium Plan" : "Free Plan"}</span>
                            </div>
                            {user.isPremium && <span className="px-2.5 py-0.5 bg-amber-100 text-amber-700 text-[10px] font-bold rounded-full">ACTIVE</span>}
                        </div>
                        <p className="text-xs text-gray-600 mb-3">
                            {user.isPremium
                                ? "Tasks stored up to 1 year. Thank you for your support!"
                                : "Tasks stored up to 3 months. Upgrade for 1 year retention."}
                        </p>
                        {user.isPremium ? (
                            <button onClick={cancelPremium} className="text-xs text-gray-500 hover:text-red-500 transition-colors underline underline-offset-2">Cancel Premium</button>
                        ) : (
                            <button
                                onClick={handleUpgrade}
                                disabled={isUpgrading}
                                className="w-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white px-4 py-2.5 rounded-xl font-semibold text-sm hover:from-amber-500 hover:to-yellow-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-200/50 disabled:opacity-75"
                            >
                                {isUpgrading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                                {isUpgrading ? "Processing..." : "Upgrade to Premium"}
                            </button>
                        )}

                        {/* Premium History */}
                        {user.premiumHistory && user.premiumHistory.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-amber-200/50">
                                <button onClick={() => setShowPremiumHistory(!showPremiumHistory)}
                                    className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-700 transition-colors">
                                    <History size={12} />
                                    <span>History</span>
                                    {showPremiumHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </button>
                                {showPremiumHistory && (
                                    <div className="mt-2 space-y-1 max-h-32 overflow-y-auto">
                                        {user.premiumHistory.map((event, i) => (
                                            <div key={i} className="text-[11px] text-gray-500 flex items-center gap-2">
                                                <span className={`w-1.5 h-1.5 rounded-full ${event.type === "activated" ? "bg-green-400" : "bg-red-400"}`} />
                                                <span>{event.type === "activated" ? "Activated" : "Cancelled"}</span>
                                                <span className="text-gray-400">{new Date(event.date).toLocaleDateString("vi-VN")}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Security */}
                <div className="px-8 pb-4">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Security & Data</h3>
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <Shield size={14} className="text-green-500 flex-shrink-0" />
                        <span className="text-xs text-gray-700">Data is stored locally on your device</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-8 pb-6 space-y-2">
                    {showConfirmDelete ? (
                        <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                            <p className="text-xs text-red-600 font-medium mb-2">This will permanently delete your account and all data. This cannot be undone.</p>
                            <div className="flex gap-2">
                                <button onClick={() => { deleteAccount(); onClose(); }} className="flex-1 bg-red-500 text-white py-2 rounded-lg text-xs font-semibold hover:bg-red-600 transition-all">Delete Forever</button>
                                <button onClick={() => setShowConfirmDelete(false)} className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg text-xs font-semibold hover:bg-gray-300 transition-all">Keep Account</button>
                            </div>
                        </div>
                    ) : showConfirmLogout ? (
                        <div className="flex items-center gap-2">
                            <button onClick={() => { logout(); onClose(); }} className="flex-1 bg-red-500 text-white py-2.5 rounded-xl text-sm font-medium hover:bg-red-600 transition-all">Confirm Logout</button>
                            <button onClick={() => setShowConfirmLogout(false)} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-200 transition-all">Cancel</button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button onClick={() => setShowConfirmLogout(true)} className="flex-1 flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 py-2.5 rounded-xl transition-all text-sm font-medium">
                                <LogOut size={14} />Sign Out
                            </button>
                            <button onClick={() => setShowConfirmDelete(true)} className="flex items-center justify-center gap-2 text-gray-400 hover:text-red-500 hover:bg-red-50 py-2.5 px-4 rounded-xl transition-all text-sm font-medium">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
