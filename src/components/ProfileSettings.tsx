import React, { useState, useRef } from "react";
import { Eye, EyeOff, Trash2, Camera, Shield, Check, X, AlertTriangle } from "lucide-react";
import { motion } from "motion/react";
import { User } from "../types";
import UserAvatar from "./UserAvatar";

interface ProfileSettingsProps {
  currentUser: User;
  users: User[];
  onUpdateProfile: (updates: Partial<User>) => void;
  onDeleteAccount: () => void;
  onClose: () => void;
}

export default function ProfileSettings({
  currentUser,
  users,
  onUpdateProfile,
  onDeleteAccount,
  onClose
}: ProfileSettingsProps) {
  const [name, setName] = useState(currentUser.name);
  const [bio, setBio] = useState(currentUser.bio);
  const [avatar, setAvatar] = useState(currentUser.avatar);

  // Privacy dropdown selectors
  const [lastSeen, setLastSeen] = useState(currentUser.privacySettings.lastSeen);
  const [profilePhoto, setProfilePhoto] = useState(currentUser.privacySettings.profilePhoto);
  const [about, setAbout] = useState(currentUser.privacySettings.about);
  const [readReceipts, setReadReceipts] = useState(currentUser.privacySettings.readReceipts);

  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File picker handler
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileBase64: base64, fileName: file.name })
        });
        const data = await res.json();
        if (res.ok) {
          setAvatar(data.fileUrl);
          onUpdateProfile({ avatar: data.fileUrl });
        }
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onUpdateProfile({
        name,
        bio,
        privacySettings: {
          lastSeen,
          profilePhoto,
          about,
          readReceipts
        }
      });
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const getBlockedUserNames = () => {
    return currentUser.blockedUsers.map(id => {
      const u = users.find(user => user.id === id);
      return { id, name: u?.name || "Blocked User" };
    });
  };

  const handleUnblock = (id: string) => {
    const updated = currentUser.blockedUsers.filter(bId => bId !== id);
    onUpdateProfile({ blockedUsers: updated });
  };

  return (
    <div id="profile-settings-panel" className="w-[380px] h-full bg-[#111b21] border-r border-[#222e35] flex flex-col shrink-0 z-40 relative">
      {/* Settings Header */}
      <div className="h-[60px] bg-[#202c33] px-4 flex items-center gap-4 border-b border-[#222e35] select-none shrink-0">
        <button
          onClick={onClose}
          className="text-[#8696a0] hover:text-[#00a884] p-1.5 rounded-full hover:bg-[#2a3942] transition-all"
        >
          ← Back
        </button>
        <h3 className="text-sm font-semibold text-[#e9edef] font-sans">Settings & Profile</h3>
      </div>

      {/* Main Form content */}
      <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Avatar custom snapping picker */}
        <div className="flex flex-col items-center select-none">
          <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
            <UserAvatar
              src={avatar}
              name={name || "You"}
              className="w-28 h-28 border-2 border-[#00a884] shadow-xl group-hover:opacity-85 transition-opacity"
            />
            <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera className="w-6 h-6 text-white" />
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleAvatarChange}
              className="hidden"
              accept="image/*"
            />
          </div>
          <span className="text-[10px] text-[#8696a0] mt-2 font-bold uppercase tracking-wider">
            Click photo to update
          </span>
        </div>

        {/* Display details */}
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] text-[#8696a0] font-bold uppercase tracking-wider">Your Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-[#202c33]/60 border border-[#222e35] text-xs text-[#e9edef] p-3 rounded-xl outline-none focus:border-[#00a884] transition-all font-sans font-medium"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] text-[#8696a0] font-bold uppercase tracking-wider">Your About / Bio</label>
            <input
              type="text"
              required
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full bg-[#202c33]/60 border border-[#222e35] text-xs text-[#e9edef] p-3 rounded-xl outline-none focus:border-[#00a884] transition-all font-sans"
            />
          </div>
        </div>

        {/* Privacy details */}
        <div className="bg-[#202c33]/30 border border-[#222e35]/60 p-4 rounded-2xl space-y-4">
          <div className="flex items-center gap-2 border-b border-[#222e35] pb-2.5 mb-2">
            <Shield className="w-4 h-4 text-[#00a884]" />
            <h4 className="text-xs font-bold text-[#e9edef] uppercase tracking-wider">Privacy Settings</h4>
          </div>

          {/* Last Seen dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] text-[#8696a0] font-semibold">Who can see my Last Seen</label>
            <select
              value={lastSeen}
              onChange={(e) => setLastSeen(e.target.value as any)}
              className="w-full bg-[#111b21] border border-[#222e35] text-xs text-[#e9edef] p-2.5 rounded-xl outline-none focus:border-[#00a884] cursor-pointer"
            >
              <option value="everyone" className="bg-[#111b21]">Everyone</option>
              <option value="contacts" className="bg-[#111b21]">My Contacts</option>
              <option value="nobody" className="bg-[#111b21]">Nobody</option>
            </select>
          </div>

          {/* Profile Photo dropdown */}
          <div className="space-y-1">
            <label className="text-[10px] text-[#8696a0] font-semibold">Who can see my Profile Photo</label>
            <select
              value={profilePhoto}
              onChange={(e) => setProfilePhoto(e.target.value as any)}
              className="w-full bg-[#111b21] border border-[#222e35] text-xs text-[#e9edef] p-2.5 rounded-xl outline-none focus:border-[#00a884] cursor-pointer"
            >
              <option value="everyone" className="bg-[#111b21]">Everyone</option>
              <option value="contacts" className="bg-[#111b21]">My Contacts</option>
              <option value="nobody" className="bg-[#111b21]">Nobody</option>
            </select>
          </div>

          {/* Read receipts checkbox toggler */}
          <div className="flex items-center justify-between py-1.5 border-t border-[#222e35] mt-1 select-none">
            <span className="text-[10px] font-bold text-[#8696a0] uppercase tracking-wider">Read receipts (Blue ticks)</span>
            <input
              type="checkbox"
              checked={readReceipts}
              onChange={(e) => setReadReceipts(e.target.checked)}
              className="w-4 h-4 accent-[#00a884] cursor-pointer rounded"
            />
          </div>
        </div>

        {/* Blocked Users Section */}
        {currentUser.blockedUsers.length > 0 && (
          <div className="space-y-2 select-none">
            <label className="text-[10px] text-[#8696a0] font-bold uppercase tracking-wider">Blocked Contacts</label>
            <div className="bg-[#202c33]/30 border border-[#222e35]/60 rounded-xl overflow-hidden divide-y divide-[#222e35] text-xs">
              {getBlockedUserNames().map((b) => (
                <div key={b.id} className="flex items-center justify-between p-2.5 px-3.5">
                  <span className="text-[#e9edef] font-medium">{b.name}</span>
                  <button
                    type="button"
                    onClick={() => handleUnblock(b.id)}
                    className="text-red-400 font-bold hover:underline text-[10px] cursor-pointer"
                  >
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action button */}
        <div className="space-y-3">
          <button
            type="submit"
            disabled={saving}
            className="w-full bg-[#00a884] hover:bg-[#008f72] text-white text-xs font-bold p-3.5 rounded-xl transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-500/10"
          >
            {saving ? "Saving Changes..." : "Save Configuration"}
          </button>

          {/* Delete Account trigger */}
          {!showDeleteConfirm ? (
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full bg-red-950/20 border border-red-900/30 hover:bg-red-950/40 text-red-400 hover:text-red-300 text-xs font-semibold p-3.5 rounded-xl transition-all cursor-pointer"
            >
              Delete My Account
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-red-950/30 border border-red-900/60 p-4 rounded-2xl space-y-3 text-center"
            >
              <AlertTriangle className="w-6 h-6 text-red-400 mx-auto animate-pulse" />
              <h4 className="text-xs font-bold text-red-200">Are you absolutely sure?</h4>
              <p className="text-[10px] text-red-400/80 leading-relaxed">
                This will instantly wipe your messages, profile avatar, status histories, and chats from the secure database. This action is completely irreversible.
              </p>
              <div className="flex gap-2.5">
                <button
                  type="button"
                  onClick={onDeleteAccount}
                  className="flex-1 bg-red-600 hover:bg-red-700 text-white text-xs font-bold py-2 rounded-lg cursor-pointer"
                >
                  Yes, Delete
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  className="flex-1 bg-[#202c33] border border-[#222e35] text-[#8696a0] hover:text-[#e9edef] text-xs font-bold py-2 rounded-lg cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          )}
        </div>
      </form>
    </div>
  );
}
