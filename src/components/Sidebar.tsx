import React, { useState, useEffect } from "react";
import {
  MessageSquarePlus,
  Users,
  Settings,
  ShieldCheck,
  Search,
  Pin,
  Archive,
  PhoneCall,
  Bell,
  MoreVertical,
  LogOut,
  Image as ImageIcon
} from "lucide-react";
import { Chat, User, Message } from "../types";
import { motion, AnimatePresence } from "motion/react";
import UserAvatar from "./UserAvatar";

interface SidebarProps {
  currentUser: User;
  chats: Chat[];
  users: User[];
  activeChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  onToggleView: (view: 'chats' | 'status' | 'calls' | 'settings' | 'admin') => void;
  onLogout: () => void;
}

export default function Sidebar({
  currentUser,
  chats,
  users,
  activeChat,
  onSelectChat,
  onToggleView,
  onLogout
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<'all' | 'groups' | 'archived' | 'pinned'>('all');

  // New Chat Modal / Form State
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [showNewGroupModal, setShowNewGroupModal] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  // Calculate unread totals
  const totalUnreads = chats.reduce((acc, chat) => {
    return acc + (chat.unreadCounts?.[currentUser.id] || 0);
  }, 0);

  // Helper: Get Recipient Profile for 1-to-1 chats
  const getRecipientInfo = (chat: Chat) => {
    const recId = chat.members.find(m => m !== currentUser.id) || "";
    const recUser = users.find(u => u.id === recId);
    return {
      name: recUser?.name || "WhatsApp Contact",
      avatar: recUser?.avatar || "data:image/svg+xml;utf8,<svg viewBox='0 0 100 100' fill='gray'><rect width='100' height='100'/></svg>",
      bio: recUser?.bio || "",
      online: recUser?.online || false
    };
  };

  // Filter chats based on tab and search query
  const filteredChats = chats.filter((chat) => {
    // 1. Filter by Tab
    if (activeTab === "groups" && !chat.isGroup) return false;
    if (activeTab === "archived" && !chat.archivedBy.includes(currentUser.id)) return false;
    if (activeTab === "pinned" && !chat.pinnedBy.includes(currentUser.id)) return false;

    // Normalizing non-archived behavior: do not show archived chats in 'all' / 'groups' / 'pinned'
    if (activeTab !== "archived" && chat.archivedBy.includes(currentUser.id)) return false;

    // 2. Filter by Search Query
    if (!searchQuery.trim()) return true;

    const q = searchQuery.toLowerCase();
    if (chat.isGroup) {
      return chat.name?.toLowerCase().includes(q) || chat.description?.toLowerCase().includes(q);
    } else {
      const info = getRecipientInfo(chat);
      return info.name.toLowerCase().includes(q) || chat.lastMessage?.text?.toLowerCase().includes(q);
    }
  });

  // Sort chats (Pinned at the top, then sorted by lastMessage date)
  const sortedChats = [...filteredChats].sort((a, b) => {
    const aPinned = a.pinnedBy.includes(currentUser.id);
    const bPinned = b.pinnedBy.includes(currentUser.id);

    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;

    const aTime = new Date(a.lastMessage?.createdAt || a.createdAt).getTime();
    const bTime = new Date(b.lastMessage?.createdAt || b.createdAt).getTime();
    return bTime - aTime;
  });

  // Create single chat
  const handleStartChat = async (contactId: string) => {
    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isGroup: false,
          members: [currentUser.id, contactId]
        })
      });
      const data = await res.json();
      if (res.ok) {
        onSelectChat(data);
        setShowNewChatModal(false);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Create group chat
  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim() || selectedContacts.length === 0) return;

    try {
      const res = await fetch("/api/chats", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          isGroup: true,
          name: groupName,
          description: groupDesc,
          members: [currentUser.id, ...selectedContacts],
          adminId: currentUser.id
        })
      });
      const data = await res.json();
      if (res.ok) {
        onSelectChat(data);
        setShowNewGroupModal(false);
        // Reset states
        setGroupName("");
        setGroupDesc("");
        setSelectedContacts([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleSelectContact = (id: string) => {
    if (selectedContacts.includes(id)) {
      setSelectedContacts(selectedContacts.filter(cId => cId !== id));
    } else {
      setSelectedContacts([...selectedContacts, id]);
    }
  };

  return (
    <div id="app-sidebar" className="w-full md:w-[380px] h-full border-r border-[#222e35] bg-[#111b21] flex flex-col relative shrink-0">
      {/* Top Profile Header */}
      <div className="h-[60px] bg-[#202c33] px-4 flex items-center justify-between select-none">
        <div
          onClick={() => onToggleView("settings")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <UserAvatar
            src={currentUser.avatar}
            name={currentUser.name}
            className="w-10 h-10 border border-[#222e35] group-hover:opacity-85 transition-opacity"
          />
          <div className="hidden sm:block">
            <h3 className="text-xs font-semibold text-[#e9edef] max-w-[120px] truncate leading-tight">
              {currentUser.name}
            </h3>
            <span className="text-[10px] text-[#00a884] font-semibold">Online</span>
          </div>
        </div>

        {/* Toolbar Icons */}
        <div className="flex items-center gap-3">
          {/* Admin Icon */}
          {currentUser.role === "admin" && (
            <button
              onClick={() => onToggleView("admin")}
              title="Admin Dashboard"
              className="p-2 text-[#8696a0] hover:text-[#00a884] hover:bg-[#2a3942] rounded-full transition-all"
            >
              <ShieldCheck className="w-5 h-5" />
            </button>
          )}

          {/* New Chat */}
          <button
            onClick={() => setShowNewChatModal(true)}
            title="New Chat"
            className="p-2 text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] rounded-full transition-all cursor-pointer"
          >
            <MessageSquarePlus className="w-5 h-5" />
          </button>

          {/* Group creator */}
          <button
            onClick={() => setShowNewGroupModal(true)}
            title="Create Group"
            className="p-2 text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] rounded-full transition-all cursor-pointer"
          >
            <Users className="w-5 h-5" />
          </button>

          {/* Settings / Status */}
          <button
            onClick={() => onToggleView("status")}
            title="WhatsApp Status"
            className="p-2 text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] rounded-full transition-all cursor-pointer"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Call logs */}
          <button
            onClick={() => onToggleView("calls")}
            title="Call logs"
            className="p-2 text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942] rounded-full transition-all cursor-pointer"
          >
            <PhoneCall className="w-5 h-5" />
          </button>

          {/* Logout */}
          <button
            onClick={onLogout}
            title="Secure Logout"
            className="p-2 text-[#8696a0] hover:text-red-400 hover:bg-[#2a3942] rounded-full transition-all cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* System Banner */}
      {totalUnreads > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-3.5 my-2 bg-gradient-to-r from-[#005c4b]/30 to-[#128c7e]/10 backdrop-blur-md p-3 rounded-2xl border border-emerald-500/20 flex items-center gap-3.5 select-none relative overflow-hidden shadow-[0_12px_30px_rgba(0,0,0,0.5)] cursor-pointer hover:border-emerald-500/40 transition-all"
        >
          <div className="absolute inset-0 bg-radial-gradient from-emerald-500/10 via-transparent to-transparent opacity-60 pointer-events-none" />
          <div className="bg-[#00a884]/20 p-2 rounded-xl text-[#00a884] border border-[#00a884]/30 relative z-10 animate-pulse">
            <Bell className="w-4 h-4 animate-swing" />
          </div>
          <div className="relative z-10">
            <h4 className="text-xs font-bold text-[#e9edef] tracking-wide">Unread Conversations</h4>
            <span className="text-[10px] text-[#8696a0] font-medium leading-tight block">
              You have <strong className="text-[#00a884] font-mono font-black">{totalUnreads}</strong> new {totalUnreads === 1 ? "chat thread" : "chat threads"} awaiting your review.
            </span>
          </div>
        </motion.div>
      )}

      {/* Search Input Box */}
      <div className="p-2.5 border-b border-[#222e35] bg-[#111b21] flex items-center gap-2">
        <div className="bg-[#202c33] flex items-center gap-3 w-full px-3 py-2 rounded-xl border border-[#222e35] focus-within:border-[#00a884] transition-all">
          <Search className="text-[#8696a0] w-4 h-4 shrink-0" />
          <input
            type="text"
            placeholder="Search or start a new chat"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent text-xs text-[#e9edef] placeholder-[#8696a0] outline-none w-full font-sans"
          />
        </div>
      </div>

      {/* Quick Filters / Tabs */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-b border-[#222e35]/60 overflow-x-auto">
        {(["all", "pinned", "groups", "archived"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-xs px-3.5 py-1.5 rounded-full font-semibold transition-all capitalize select-none cursor-pointer shrink-0 ${
              activeTab === tab
                ? "bg-[#005c4b] text-[#e9edef] border border-[#00a884]"
                : "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Active Conversation / Chat list */}
      <div className="flex-1 overflow-y-auto bg-[#111b21]">
        {sortedChats.length > 0 ? (
          sortedChats.map((chat) => {
            const isSelected = activeChat?.id === chat.id;
            const isGroup = chat.isGroup;
            const info = isGroup
              ? { name: chat.name || "Group", avatar: chat.avatar, online: false }
              : getRecipientInfo(chat);

            const hasLastMessage = !!chat.lastMessage;
            const unreads = chat.unreadCounts?.[currentUser.id] || 0;
            const isPinned = chat.pinnedBy.includes(currentUser.id);

            return (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, x: -5 }}
                animate={{ opacity: 1, x: 0 }}
                whileHover={{ x: 2, backgroundColor: isSelected ? "#2a3942" : "rgba(32, 44, 51, 0.6)" }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={() => onSelectChat(chat)}
                className={`flex items-center gap-3 px-4.5 py-3 border-b border-[#222e35]/30 cursor-pointer transition-all ${
                  isSelected ? "bg-[#2a3942]" : ""
                }`}
              >
                {/* Avatar with dynamic online indicator */}
                <div className="relative shrink-0">
                  <UserAvatar
                    src={info.avatar}
                    name={info.name}
                    className="w-12 h-12 border border-[#222e35]/40"
                  />
                  {!isGroup && info.online && (
                    <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-[#00a884] border-2 border-[#111b21] rounded-full shadow-md" />
                  )}
                </div>

                {/* Metadata & Previews */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-semibold text-[#e9edef] truncate font-sans">
                      {info.name}
                    </h4>
                    <span className="text-[10px] text-[#8696a0] font-mono shrink-0">
                      {hasLastMessage
                        ? new Date(chat.lastMessage!.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit"
                          })
                        : ""}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <p className="text-xs text-[#8696a0] truncate font-sans max-w-[200px]">
                      {hasLastMessage ? chat.lastMessage!.text : chat.description || "Start chatting..."}
                    </p>

                    <div className="flex items-center gap-1.5 shrink-0 ml-1">
                      {isPinned && <Pin className="w-3.5 h-3.5 text-[#8696a0]" />}
                      {unreads > 0 && (
                        <span className="bg-[#00a884] text-[#111b21] text-[10px] font-bold h-4.5 min-w-[18px] px-1 rounded-full flex items-center justify-center select-none font-mono">
                          {unreads}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-48 text-[#8696a0] select-none text-xs p-8 text-center font-sans">
            <span className="text-base mb-1">💬</span>
            No conversations found. Use the "+" button to start chatting with your friends!
          </div>
        )}
      </div>

      {/* Drawer: New 1-to-1 Chat */}
      <AnimatePresence>
        {showNewChatModal && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.22 }}
            className="absolute inset-0 z-50 bg-[#111b21] flex flex-col shadow-2xl"
          >
            <div className="h-[60px] bg-[#202c33] px-4 flex items-center gap-4 border-b border-[#222e35]/60">
              <button
                onClick={() => setShowNewChatModal(false)}
                className="text-[#e9edef] hover:text-[#00a884] transition-colors p-1 hover:bg-[#2a3942] rounded-full"
              >
                ← Back
              </button>
              <h3 className="text-sm font-semibold text-[#e9edef] font-sans">New Chat</h3>
            </div>

            <div className="p-3 bg-[#111b21] border-b border-[#222e35]">
              <div className="bg-[#202c33] flex items-center gap-3 px-3 py-1.5 rounded-xl border border-[#222e35] focus-within:border-[#00a884] transition-all">
                <Search className="text-[#8696a0] w-4 h-4 shrink-0" />
                <input
                  type="text"
                  placeholder="Search contact"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  className="bg-transparent text-xs text-[#e9edef] placeholder-[#8696a0] outline-none w-full"
                />
              </div>
            </div>

            {/* Contacts List */}
            <div className="flex-1 overflow-y-auto">
              {users
                .filter(u => u.id !== currentUser.id && u.name.toLowerCase().includes(contactSearch.toLowerCase()))
                .map((contact) => (
                  <motion.div
                    whileHover={{ backgroundColor: "rgba(32, 44, 51, 0.6)" }}
                    key={contact.id}
                    onClick={() => handleStartChat(contact.id)}
                    className="flex items-center gap-3 px-4.5 py-3.5 border-b border-[#222e35]/30 cursor-pointer transition-all"
                  >
                    <UserAvatar
                      src={contact.avatar}
                      name={contact.name}
                      className="w-10 h-10 border border-[#222e35]/40"
                    />
                    <div>
                      <h4 className="text-xs font-semibold text-[#e9edef]">{contact.name}</h4>
                      <span className="text-[10px] text-[#8696a0] truncate block max-w-[200px]">{contact.bio}</span>
                    </div>
                  </motion.div>
                ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drawer: Create Group Chat */}
      <AnimatePresence>
        {showNewGroupModal && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", ease: "easeInOut", duration: 0.22 }}
            className="absolute inset-0 z-50 bg-[#111b21] flex flex-col shadow-2xl"
          >
            <div className="h-[60px] bg-[#202c33] px-4 flex items-center gap-4 border-b border-[#222e35]/60">
              <button
                onClick={() => setShowNewGroupModal(false)}
                className="text-[#e9edef] hover:text-[#00a884] transition-colors p-1 hover:bg-[#2a3942] rounded-full"
              >
                ← Back
              </button>
              <h3 className="text-sm font-semibold text-[#e9edef] font-sans">Create Group</h3>
            </div>

            <form onSubmit={handleCreateGroup} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 space-y-4 bg-[#111b21] border-b border-[#222e35]">
                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="Group Name (required)"
                    required
                    value={groupName}
                    onChange={(e) => setGroupName(e.target.value)}
                    className="w-full bg-[#202c33] border border-[#222e35] text-xs text-[#e9edef] placeholder-[#8696a0] p-3 rounded-xl outline-none focus:border-[#00a884] transition-all"
                  />
                </div>

                <div className="space-y-1.5">
                  <input
                    type="text"
                    placeholder="Group Description (optional)"
                    value={groupDesc}
                    onChange={(e) => setGroupDesc(e.target.value)}
                    className="w-full bg-[#202c33] border border-[#222e35] text-xs text-[#e9edef] placeholder-[#8696a0] p-3 rounded-xl outline-none focus:border-[#00a884] transition-all"
                  />
                </div>

                <div className="text-[10px] font-semibold text-[#8696a0] uppercase tracking-wider">
                  Select Participants ({selectedContacts.length} selected)
                </div>
              </div>

              {/* Contacts Scroll list to select multiple */}
              <div className="flex-1 overflow-y-auto bg-[#111b21] p-2 space-y-1">
                {users
                  .filter(u => u.id !== currentUser.id)
                  .map((contact) => {
                    const isChecked = selectedContacts.includes(contact.id);
                    return (
                      <motion.div
                        whileHover={{ backgroundColor: "rgba(32, 44, 51, 0.4)" }}
                        key={contact.id}
                        onClick={() => toggleSelectContact(contact.id)}
                        className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all ${
                          isChecked ? "bg-[#005c4b]/20 border border-[#00a884]/60" : "hover:bg-[#202c33] border border-transparent"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            src={contact.avatar}
                            name={contact.name}
                            className="w-9 h-9 border border-[#222e35]/40"
                          />
                          <div>
                            <h4 className="text-xs font-semibold text-[#e9edef]">{contact.name}</h4>
                          </div>
                        </div>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => {}} // handled by div click
                          className="w-4 h-4 accent-[#00a884] cursor-pointer rounded"
                        />
                      </motion.div>
                    );
                  })}
              </div>

              {/* Actions button */}
              <div className="p-4 bg-[#202c33]/80 border-t border-[#222e35]">
                <button
                  type="submit"
                  disabled={!groupName.trim() || selectedContacts.length === 0}
                  className="w-full bg-[#00a884] hover:bg-[#008f72] text-[#111b21] text-xs font-bold p-3.5 rounded-xl transition-all disabled:opacity-40 cursor-pointer shadow-lg shadow-emerald-500/10 active:scale-[0.98]"
                >
                  Create Group
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
