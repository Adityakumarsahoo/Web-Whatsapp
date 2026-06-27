import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { motion, AnimatePresence } from "motion/react";
import { Chat, User, Message, Status, Call } from "./types";
import AuthScreen from "./components/AuthScreen";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import ProfileSettings from "./components/ProfileSettings";
import StatusView from "./components/StatusView";
import CallView from "./components/CallView";
import AdminDashboard from "./components/AdminDashboard";
import { ShieldCheck, Laptop, AlertCircle } from "lucide-react";

export default function App() {
  // Session states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // App data states
  const [chats, setChats] = useState<Chat[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [callHistory, setCallHistory] = useState<Call[]>([]);

  // Navigation drawer view
  const [sidebarView, setSidebarView] = useState<'chats' | 'status' | 'calls' | 'settings' | 'admin'>('chats');

  // WebRTC / Socket states
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeCall, setActiveCall] = useState<any | null>(null);
  const [typingUsers, setTypingUsers] = useState<{ [chatId: string]: string[] }>({});

  const [systemError, setSystemError] = useState<string | null>(null);

  // Load session on startup
  useEffect(() => {
    try {
      const savedUser = localStorage.getItem("wa_user");
      const savedToken = localStorage.getItem("wa_token");
      if (savedUser && savedToken) {
        setCurrentUser(JSON.parse(savedUser));
        setToken(savedToken);
      }
    } catch (e) {
      console.error("Failed to restore session", e);
    }
  }, []);

  // Sync users list and contacts periodically or on load
  useEffect(() => {
    if (!currentUser) return;

    // Fetch users (contacts)
    fetch("/api/users")
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(e => console.error("Error loading contacts", e));

    // Fetch user chats
    fetch(`/api/chats/user/${currentUser.id}`)
      .then(res => res.json())
      .then(data => setChats(data))
      .catch(e => console.error("Error loading chats", e));

    // Fetch statuses
    fetch("/api/status")
      .then(res => res.json())
      .then(data => setStatuses(data))
      .catch(e => console.error("Error loading statuses", e));
  }, [currentUser]);

  // Load messages when active chat changes
  useEffect(() => {
    if (!currentUser || !activeChat) return;

    fetch(`/api/chats/${activeChat.id}/messages`)
      .then(res => res.json())
      .then(data => setMessages(data))
      .catch(e => console.error("Error loading messages", e));
  }, [activeChat, currentUser]);

  // Establish Socket.io connection when authenticated
  useEffect(() => {
    if (!currentUser) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Connect to same origin serving port 3000
    const newSocket = io(window.location.origin);
    setSocket(newSocket);

    newSocket.on("connect", () => {
      newSocket.emit("register", currentUser.id);
      // Mark delivered to this user
      newSocket.emit("mark-delivered", { userId: currentUser.id });
    });

    // Receive message
    newSocket.on("message-received", (msg: Message) => {
      // If it belongs to active chat, append
      if (activeChat && msg.chatId === activeChat.id) {
        setMessages(prev => {
          // Prevent duplicates
          if (prev.some(m => m.id === msg.id)) return prev;
          return [...prev, msg];
        });
        // Emit mark-seen to server
        newSocket.emit("mark-seen", { chatId: activeChat.id, userId: currentUser.id });
      }

      // Update chats list unreads & previews
      setChats(prev => prev.map(chat => {
        if (chat.id === msg.chatId) {
          const isMsgFromMe = msg.senderId === currentUser.id;
          const updatedUnreads = { ...chat.unreadCounts };
          if (!isMsgFromMe && (!activeChat || activeChat.id !== chat.id)) {
            updatedUnreads[currentUser.id] = (updatedUnreads[currentUser.id] || 0) + 1;
          }
          return {
            ...chat,
            lastMessage: {
              text: msg.text,
              senderId: msg.senderId,
              createdAt: msg.createdAt
            },
            unreadCounts: updatedUnreads
          };
        }
        return chat;
      }));
    });

    // Seen acknowledgment
    newSocket.on("messages-marked-seen", ({ chatId, userId }: { chatId: string; userId: string }) => {
      if (userId !== currentUser.id) {
        if (activeChat && activeChat.id === chatId) {
          setMessages(prev => prev.map(m => m.senderId === currentUser.id ? { ...m, status: "seen" } : m));
        }
      }
    });

    // Typing activities indicators
    newSocket.on("typing-status", ({ chatId, userId, isTyping }: { chatId: string; userId: string; isTyping: boolean }) => {
      setTypingUsers(prev => {
        const currentList = prev[chatId] || [];
        if (isTyping) {
          if (currentList.includes(userId)) return prev;
          return { ...prev, [chatId]: [...currentList, userId] };
        } else {
          return { ...prev, [chatId]: currentList.filter(id => id !== userId) };
        }
      });
    });

    // Chat created updates
    newSocket.on("chat-created", (newChat: Chat) => {
      if (newChat.members.includes(currentUser.id)) {
        setChats(prev => {
          if (prev.some(c => c.id === newChat.id)) return prev;
          return [newChat, ...prev];
        });
        newSocket.emit("join-chat-rooms", [newChat.id]);
      }
    });

    newSocket.on("chat-updated", (updatedChat: Chat) => {
      if (updatedChat.members.includes(currentUser.id)) {
        setChats(prev => prev.map(c => c.id === updatedChat.id ? updatedChat : c));
      }
    });

    // User status (online/offline) changes
    newSocket.on("user-status-changed", ({ userId, online, lastSeen }: { userId: string; online: boolean; lastSeen: string }) => {
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, online, lastSeen } : u));
    });

    // Status (WhatsApp Statuses) changes
    newSocket.on("status-created", (st: Status) => {
      setStatuses(prev => {
        if (prev.some(s => s.id === st.id)) return prev;
        return [st, ...prev];
      });
    });

    newSocket.on("status-updated", (st: Status) => {
      setStatuses(prev => prev.map(s => s.id === st.id ? st : s));
    });

    // Call Signallings
    newSocket.on("incoming-call", (payload: any) => {
      setActiveCall({
        id: payload.callId,
        callerId: payload.callerId,
        callerName: payload.callerName,
        callerAvatar: payload.callerAvatar,
        receiverId: currentUser.id,
        receiverName: currentUser.name,
        receiverAvatar: currentUser.avatar,
        type: payload.type,
        status: "incoming"
      });
    });

    newSocket.on("call-accepted", () => {
      setActiveCall(prev => prev ? { ...prev, status: "connected" } : null);
    });

    newSocket.on("call-rejected", () => {
      setActiveCall(null);
    });

    newSocket.on("call-ended", () => {
      setActiveCall(null);
    });

    // Account Suspension triggers
    newSocket.on("account-suspended", () => {
      setSystemError("Your account was suspended by an administrator for safety guidelines violations.");
      handleLogout();
    });

    return () => {
      newSocket.disconnect();
    };
  }, [currentUser, activeChat?.id]);

  const handleAuthSuccess = (user: User, userToken: string, isNewUser?: boolean) => {
    setCurrentUser(user);
    setToken(userToken);
    localStorage.setItem("wa_user", JSON.stringify(user));
    localStorage.setItem("wa_token", userToken);
    setSystemError(null);
    if (isNewUser) {
      setSidebarView('settings');
    } else {
      setSidebarView('chats');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setToken(null);
    setChats([]);
    setMessages([]);
    setActiveChat(null);
    setSidebarView("chats");
    localStorage.removeItem("wa_user");
    localStorage.removeItem("wa_token");
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/profile/delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id })
      });
      if (res.ok) {
        handleLogout();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // REST API trigger: Send message
  const handleSendMessage = async (text: string, media?: { url: string; type: any; name: string; size: number }) => {
    if (!currentUser || !activeChat) return;

    const newMessage: Message = {
      id: "msg_" + Math.random().toString(36).substring(2, 9),
      chatId: activeChat.id,
      senderId: currentUser.id,
      text,
      isEncrypted: true,
      mediaUrl: media?.url,
      mediaType: media?.type,
      mediaName: media?.name,
      mediaSize: media?.size,
      status: "sent",
      reactions: [],
      createdAt: new Date().toISOString()
    };

    // Optimistically update message thread locally
    setMessages(prev => [...prev, newMessage]);

    // Update chats thread local state
    setChats(prev => prev.map(c => {
      if (c.id === activeChat.id) {
        return {
          ...c,
          lastMessage: {
            text: newMessage.text,
            senderId: newMessage.senderId,
            createdAt: newMessage.createdAt
          }
        };
      }
      return c;
    }));

    // Socket emit
    if (socket) {
      socket.emit("send-message", newMessage);
    }
  };

  // REST API trigger: Delete message
  const handleDeleteMessage = async (msgId: string, deleteType: 'me' | 'everyone') => {
    try {
      const res = await fetch(`/api/messages/${msgId}/delete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser?.id, type: deleteType })
      });
      if (res.ok) {
        if (deleteType === "everyone") {
          setMessages(prev => prev.map(m => m.id === msgId ? { ...m, isDeletedForAll: true, text: "This message was deleted.", mediaUrl: undefined } : m));
        } else {
          setMessages(prev => prev.filter(m => m.id !== msgId));
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // REST API trigger: Toggle message actions (reactions, stars, pins)
  const handleToggleMessageAction = async (msgId: string, action: 'star' | 'unstar' | 'pin' | 'unpin' | 'react', reactionEmoji?: string) => {
    try {
      const res = await fetch(`/api/messages/${msgId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser?.id, action, reactionEmoji })
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(prev => prev.map(m => m.id === msgId ? data.message : m));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // REST API trigger: Update Profile settings
  const handleUpdateProfile = async (updates: Partial<User>) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, ...updates })
      });
      const data = await res.json();
      if (res.ok) {
        setCurrentUser(data.user);
        localStorage.setItem("wa_user", JSON.stringify(data.user));
      }
    } catch (e) {
      console.error(e);
    }
  };

  // REST API trigger: Upload Status
  const handleUploadStatus = async (type: 'photo' | 'video' | 'text', content: string, caption?: string, bgColor?: string) => {
    if (!currentUser) return;
    try {
      const res = await fetch("/api/status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: currentUser.id,
          userName: currentUser.name,
          userAvatar: currentUser.avatar,
          type,
          content,
          caption,
          backgroundColor: bgColor
        })
      });
      const data = await res.json();
      if (res.ok) {
        setStatuses(prev => [data, ...prev]);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleLikeStatus = async (statusId: string, action: 'like' | 'unlike') => {
    try {
      await fetch(`/api/status/${statusId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser?.id, action })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleViewStatus = async (statusId: string) => {
    try {
      await fetch(`/api/status/${statusId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser?.id, action: "view" })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleReplyStatus = async (statusId: string, replyText: string) => {
    try {
      await fetch(`/api/status/${statusId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser?.id, action: "reply", replyText })
      });
    } catch (e) {
      console.error(e);
    }
  };

  // Call Initiation Handler
  const handleInitiateCall = async (type: 'voice' | 'video') => {
    if (!currentUser || !activeChat) return;

    const recId = activeChat.members.find(id => id !== currentUser.id) || "";
    const recUser = users.find(u => u.id === recId) || { name: activeChat.name || "User", avatar: activeChat.avatar || "" };

    const callId = "call_" + Math.random().toString(36).substring(2, 9);

    // Save call history entry
    const res = await fetch("/api/calls", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        callerId: currentUser.id,
        callerName: currentUser.name,
        callerAvatar: currentUser.avatar,
        receiverId: recId,
        receiverName: recUser.name,
        receiverAvatar: recUser.avatar,
        type,
        status: "ringing"
      })
    });
    const data = await res.json();

    setActiveCall({
      id: data.id,
      callerId: currentUser.id,
      callerName: currentUser.name,
      callerAvatar: currentUser.avatar,
      receiverId: recId,
      receiverName: recUser.name,
      receiverAvatar: recUser.avatar,
      type,
      status: "ringing"
    });

    if (socket) {
      socket.emit("call-initiate", {
        callId: data.id,
        callerId: currentUser.id,
        callerName: currentUser.name,
        callerAvatar: currentUser.avatar,
        receiverId: recId,
        type
      });
    }
  };

  const handleAnswerCall = () => {
    if (!socket || !activeCall) return;

    fetch(`/api/calls/${activeCall.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "connected" })
    });

    socket.emit("call-accept", { callId: activeCall.id, callerId: activeCall.callerId });
    setActiveCall(prev => prev ? { ...prev, status: "connected" } : null);
  };

  const handleRejectCall = () => {
    if (!socket || !activeCall) return;

    fetch(`/api/calls/${activeCall.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "rejected" })
    });

    socket.emit("call-reject", { callId: activeCall.id, callerId: activeCall.callerId });
    setActiveCall(null);
  };

  const handleHangupCall = () => {
    if (!socket || !activeCall) return;

    fetch(`/api/calls/${activeCall.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ended" })
    });

    const peerId = activeCall.callerId === currentUser?.id ? activeCall.receiverId : activeCall.callerId;
    socket.emit("call-hangup", { callId: activeCall.id, peerId });
    setActiveCall(null);
  };

  // Pin / Archive chats triggers
  const handleChatAction = async (chatId: string, action: 'pin' | 'unpin' | 'archive' | 'unarchive') => {
    if (!currentUser) return;
    try {
      const res = await fetch(`/api/chats/${chatId}/action`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: currentUser.id, action })
      });
      const data = await res.json();
      if (res.ok) {
        setChats(prev => prev.map(c => c.id === chatId ? data.chat : c));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectChat = (chat: Chat) => {
    setActiveChat(chat);
    // Clear unreads optimistically
    setChats(prev => prev.map(c => {
      if (c.id === chat.id) {
        const counts = { ...c.unreadCounts };
        if (currentUser) counts[currentUser.id] = 0;
        return { ...c, unreadCounts: counts };
      }
      return c;
    }));
  };

  if (!currentUser) {
    return <AuthScreen onAuthSuccess={handleAuthSuccess} />;
  }

  return (
    <div id="whatsapp-root" className="h-screen w-screen flex bg-[#0b141a] md:p-3 lg:p-4.5 overflow-hidden select-none relative font-sans chat-bg-pattern">
      {/* Background glow spots for a premium touch */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-[#00a884] rounded-full filter blur-[150px] opacity-[0.06] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-[#2563eb] rounded-full filter blur-[150px] opacity-[0.05] pointer-events-none" />

      {/* Visual active calling overlay */}
      {activeCall && (
        <CallView
          currentCall={activeCall}
          onAnswerCall={handleAnswerCall}
          onRejectCall={handleRejectCall}
          onHangupCall={handleHangupCall}
        />
      )}

      {/* Drawer navigation panels */}
      <div className="flex h-full w-full max-w-[1700px] mx-auto overflow-hidden md:rounded-2xl border border-white/5 md:border-[#222e35]/80 shadow-[0_25px_65px_rgba(0,0,0,0.85)] bg-[#111b21]">
        {/* Left Sidebars Area */}
        <div className={`shrink-0 h-full relative ${activeChat ? "hidden md:flex" : "w-full md:w-[380px]"}`}>
          <Sidebar
            currentUser={currentUser}
            chats={chats}
            users={users}
            activeChat={activeChat}
            onSelectChat={handleSelectChat}
            onToggleView={(view) => setSidebarView(view)}
            onLogout={handleLogout}
          />

          {/* Sliding drawers */}
          <AnimatePresence mode="wait">
            {sidebarView === "settings" && (
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="absolute inset-0 z-40"
              >
                <ProfileSettings
                  currentUser={currentUser}
                  users={users}
                  onUpdateProfile={handleUpdateProfile}
                  onDeleteAccount={handleDeleteAccount}
                  onClose={() => setSidebarView("chats")}
                />
              </motion.div>
            )}

            {sidebarView === "status" && (
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="absolute inset-0 z-40"
              >
                <StatusView
                  currentUser={currentUser}
                  users={users}
                  statuses={statuses}
                  onUploadStatus={handleUploadStatus}
                  onLikeStatus={handleLikeStatus}
                  onViewStatus={handleViewStatus}
                  onReplyStatus={handleReplyStatus}
                  onClose={() => setSidebarView("chats")}
                />
              </motion.div>
            )}

            {sidebarView === "admin" && currentUser.role === "admin" && (
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                className="absolute inset-0 z-40"
              >
                <AdminDashboard
                  currentUser={currentUser}
                  onClose={() => setSidebarView("chats")}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Active Chat Workspace Window */}
        {activeChat ? (
          <ChatWindow
            currentUser={currentUser}
            activeChat={activeChat}
            users={users}
            messages={messages}
            onSendMessage={handleSendMessage}
            onDeleteMessage={handleDeleteMessage}
            onToggleMessageAction={handleToggleMessageAction}
            onInitiateCall={handleInitiateCall}
            onChatAction={handleChatAction}
            typingUsers={typingUsers[activeChat.id] || []}
            socket={socket}
            onBack={() => setActiveChat(null)}
          />
        ) : (
          <div className="hidden md:flex flex-1 h-full bg-[#222e35]/10 flex flex-col items-center justify-center border-l border-[#222e35] p-8 select-none text-center relative chat-bg-pattern">
            {/* Minimalist Visual Illustration */}
            <div className="max-w-md space-y-6 flex flex-col items-center relative z-10">
              <div className="p-8 bg-[#202c33]/80 rounded-full text-[#00a884] shadow-2xl border border-[#222e35]/60 animate-pulse">
                <Laptop className="w-16 h-16" />
              </div>
              <div className="space-y-2.5">
                <h2 className="text-xl font-bold font-display text-[#e9edef]">
                  WhatsApp Web Premium
                </h2>
                <p className="text-xs text-[#8696a0] leading-relaxed max-w-sm">
                  Send and receive end-to-end encrypted messages with military-grade privacy. Link up to 4 companion devices simultaneously without keeping your main line online.
                </p>
              </div>

              <div className="border-t border-[#222e35]/60 pt-4.5 flex items-center gap-2 text-[10px] text-[#8696a0] font-mono justify-center uppercase tracking-wider">
                <ShieldCheck className="w-4 h-4 text-[#00a884]" />
                <span>End-to-End Encrypted Handshakes Verified</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Account Suspended Alert Overlay */}
      {systemError && (
        <div className="fixed inset-0 z-[200] bg-black/85 flex items-center justify-center p-4">
          <div className="max-w-sm bg-[#111b21] border border-red-500/20 p-6 rounded-3xl text-center space-y-4">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto animate-bounce" />
            <h3 className="text-base font-bold text-white">Security Halt</h3>
            <p className="text-xs text-[#8696a0] leading-relaxed">
              {systemError}
            </p>
            <button
              onClick={() => setSystemError(null)}
              className="w-full bg-red-600 text-white font-bold py-2.5 rounded-xl text-xs hover:bg-red-700 cursor-pointer"
            >
              Acknowledge
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
