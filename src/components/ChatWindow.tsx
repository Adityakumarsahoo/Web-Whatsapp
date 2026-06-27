import React, { useState, useEffect, useRef } from "react";
import {
  Send,
  Paperclip,
  Smile,
  Mic,
  Camera,
  Search,
  MoreVertical,
  Pin,
  Star,
  Trash2,
  Copy,
  Undo2,
  FileText,
  FileArchive,
  Play,
  Pause,
  AlertCircle,
  X,
  Phone,
  Video,
  Check,
  CheckCheck,
  ShieldAlert,
  Download,
  Flame,
  UserCheck,
  Archive,
  ArrowLeft
} from "lucide-react";
import { Chat, User, Message } from "../types";
import EmojiPicker from "./EmojiPicker";
import StickerPicker from "./StickerPicker";
import { motion, AnimatePresence } from "motion/react";
import UserAvatar from "./UserAvatar";

interface ChatWindowProps {
  currentUser: User;
  activeChat: Chat;
  users: User[];
  messages: Message[];
  onSendMessage: (text: string, media?: { url: string; type: any; name: string; size: number }) => void;
  onDeleteMessage: (msgId: string, deleteType: 'me' | 'everyone') => void;
  onToggleMessageAction: (msgId: string, action: 'star' | 'unstar' | 'pin' | 'unpin' | 'react', emoji?: string) => void;
  onInitiateCall: (type: 'voice' | 'video') => void;
  onChatAction: (chatId: string, action: 'pin' | 'unpin' | 'archive' | 'unarchive') => void;
  typingUsers: string[];
  socket: any;
  onBack?: () => void;
}

export default function ChatWindow({
  currentUser,
  activeChat,
  users,
  messages,
  onSendMessage,
  onDeleteMessage,
  onToggleMessageAction,
  onInitiateCall,
  onChatAction,
  typingUsers,
  socket,
  onBack
}: ChatWindowProps) {
  const [inputText, setInputText] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showStickerPicker, setShowStickerPicker] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEncryptionModal, setShowEncryptionModal] = useState(false);
  const [searchInChat, setSearchInChat] = useState("");
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showOptionsDropdown, setShowOptionsDropdown] = useState(false);

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef<any>(null);

  // Reply message reference
  const [replyingMessage, setReplyingMessage] = useState<Message | null>(null);

  // Scroll to bottom helper
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Camera screenshot modal
  const [showCameraModal, setShowCameraModal] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    scrollToBottom();
    // Re-check shortly after DOM changes
    const timer = setTimeout(() => {
      scrollToBottom();
    }, 50);

    // Mark seen when active chat changes or messages load
    if (socket) {
      socket.emit("mark-seen", { chatId: activeChat.id, userId: currentUser.id });
    }

    return () => clearTimeout(timer);
  }, [activeChat.id, messages.length]);

  const scrollToBottom = () => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  };

  // Typings notifier
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputText(e.target.value);
    if (!socket) return;
    if (e.target.value.trim().length > 0) {
      socket.emit("typing", { chatId: activeChat.id, userId: currentUser.id });
    } else {
      socket.emit("stop-typing", { chatId: activeChat.id, userId: currentUser.id });
    }
  };

  const handleInputBlur = () => {
    if (socket) {
      socket.emit("stop-typing", { chatId: activeChat.id, userId: currentUser.id });
    }
  };

  const handleSend = () => {
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText("");
    setReplyingMessage(null);
    if (socket) {
      socket.emit("stop-typing", { chatId: activeChat.id, userId: currentUser.id });
    }
  };

  // Sticker sending
  const handleStickerSend = (url: string) => {
    onSendMessage(`[Sticker]`, {
      url,
      type: "sticker",
      name: "Sticker.webp",
      size: 0
    });
    setShowStickerPicker(false);
  };

  // Helper: File Uploading
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, customType?: 'image' | 'video' | 'audio' | 'document') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowAttachmentMenu(false);

    // Read file as Base64
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Content = reader.result as string;
      try {
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileBase64: base64Content,
            fileName: file.name,
            fileType: file.name.split(".").pop()
          })
        });
        const data = await res.json();
        if (res.ok) {
          // Determine mediaType
          let mediaType: any = "document";
          if (file.type.startsWith("image/")) mediaType = "image";
          else if (file.type.startsWith("video/")) mediaType = "video";
          else if (file.type.startsWith("audio/")) mediaType = "audio";

          if (customType) mediaType = customType;

          onSendMessage(`[Attachment: ${file.name}]`, {
            url: data.fileUrl,
            type: mediaType,
            name: file.name,
            size: file.size
          });
        }
      } catch (err) {
        console.error("Upload failed", err);
      }
    };
    reader.readAsDataURL(file);
  };

  // Camera Snap Handler
  const startCamera = async () => {
    setShowCameraModal(true);
    setShowAttachmentMenu(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access failed", err);
    }
  };

  const capturePhoto = async () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const base64Snap = canvas.toDataURL("image/jpeg");

        // Stop camera tracks
        const stream = video.srcObject as MediaStream;
        stream?.getTracks().forEach(track => track.stop());

        // Upload
        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fileBase64: base64Snap,
            fileName: "SnapCamera.jpg",
            fileType: "jpg"
          })
        });
        const data = await res.json();
        if (res.ok) {
          onSendMessage("[Camera Snapshot]", {
            url: data.fileUrl,
            type: "image",
            name: "CameraSnapshot.jpg",
            size: 0
          });
        }
        setShowCameraModal(false);
      }
    }
  };

  const closeCameraModal = () => {
    if (videoRef.current) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream?.getTracks().forEach(track => track.stop());
    }
    setShowCameraModal(false);
  };

  // Voice recording mock/real triggers
  const startRecording = () => {
    setIsRecording(true);
    setRecordingSeconds(0);
    recordingTimerRef.current = setInterval(() => {
      setRecordingSeconds(prev => prev + 1);
    }, 1000);
  };

  const stopAndSendRecording = async () => {
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);

    // Mock an audio note URL (usually uploaded raw audio, here we send a nice audio asset or customized base64 note)
    const simulatedAudioNoteUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
    onSendMessage(`[Voice Message ${recordingSeconds}s]`, {
      url: simulatedAudioNoteUrl,
      type: "voice",
      name: `VoiceNote_${Date.now()}.mp3`,
      size: recordingSeconds * 1240
    });
  };

  const cancelRecording = () => {
    clearInterval(recordingTimerRef.current);
    setIsRecording(false);
  };

  // Chat window metadata calculations
  const isGroup = activeChat.isGroup;
  const chatMembers = activeChat.members;

  // Active recipient info
  const recId = chatMembers.find(m => m !== currentUser.id) || "";
  const recipient = users.find(u => u.id === recId) || {
    name: activeChat.name || "Group",
    avatar: activeChat.avatar || "",
    bio: activeChat.description || "",
    online: false,
    lastSeen: ""
  };

  const getSenderName = (senderId: string) => {
    if (senderId === currentUser.id) return "You";
    const user = users.find(u => u.id === senderId);
    return user ? user.name : "User";
  };

  // Filter messages by search in chat
  const filteredMessages = messages.filter((m) => {
    if (!searchInChat.trim()) return true;
    return m.text.toLowerCase().includes(searchInChat.toLowerCase());
  });

  return (
    <div id="active-chat-window" className="flex-1 h-full flex flex-col bg-[#0b141a] chat-bg-pattern relative">
      {/* Header Panel */}
      <div className="h-[60px] bg-[#202c33] px-4 flex items-center justify-between border-b border-[#222e35]/40 select-none z-10 shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="md:hidden p-1.5 hover:bg-[#2a3942] rounded-full text-[#8696a0] hover:text-[#e9edef] transition-colors -ml-1 shrink-0"
              title="Back to Chats"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <UserAvatar
            src={isGroup ? activeChat.avatar : recipient.avatar}
            name={isGroup ? (activeChat.name || "Group") : (recipient.name || "User")}
            className="w-10 h-10"
          />
          <div>
            <h3 className="text-sm font-semibold text-[#e9edef]">
              {isGroup ? activeChat.name : recipient.name}
            </h3>
            <span className="text-[10px] text-[#8696a0] font-medium block">
              {isGroup ? (
                <>Group with {chatMembers.length} members</>
              ) : recipient.online ? (
                <span className="text-[#00a884] font-semibold">Online</span>
              ) : recipient.lastSeen ? (
                <>Last seen {new Date(recipient.lastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</>
              ) : (
                "Offline"
              )}
            </span>
          </div>
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-4">
          {/* Call triggers */}
          <button
            onClick={() => onInitiateCall("voice")}
            className="p-2 text-[#8696a0] hover:text-[#e9edef] rounded-full hover:bg-[#2a3942] transition-colors"
            title="Audio Call"
          >
            <Phone className="w-4.5 h-4.5" />
          </button>
          <button
            onClick={() => onInitiateCall("video")}
            className="p-2 text-[#8696a0] hover:text-[#e9edef] rounded-full hover:bg-[#2a3942] transition-colors"
            title="Video Call"
          >
            <Video className="w-4.5 h-4.5" />
          </button>

          {/* Search */}
          <button
            onClick={() => setShowSearchBar(!showSearchBar)}
            className="p-2 text-[#8696a0] hover:text-[#e9edef] rounded-full hover:bg-[#2a3942] transition-colors"
            title="Search Messages"
          >
            <Search className="w-4.5 h-4.5" />
          </button>

          {/* Options Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowOptionsDropdown(!showOptionsDropdown)}
              className="p-2 text-[#8696a0] hover:text-[#e9edef] rounded-full hover:bg-[#2a3942] transition-colors"
            >
              <MoreVertical className="w-4.5 h-4.5" />
            </button>

            {showOptionsDropdown && (
              <div className="absolute right-0 top-11 bg-[#233138] border border-[#2f3b43] py-2 rounded-xl shadow-xl w-44 z-50 text-xs text-[#e9edef]">
                <button
                  onClick={() => {
                    const isPinned = activeChat.pinnedBy.includes(currentUser.id);
                    onChatAction(activeChat.id, isPinned ? "unpin" : "pin");
                    setShowOptionsDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#182229] transition-colors flex items-center gap-2"
                >
                  <Pin className="w-3.5 h-3.5" />
                  {activeChat.pinnedBy.includes(currentUser.id) ? "Unpin Chat" : "Pin Chat"}
                </button>
                <button
                  onClick={() => {
                    onChatAction(activeChat.id, "archive");
                    setShowOptionsDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#182229] transition-colors flex items-center gap-2"
                >
                  <Archive className="w-3.5 h-3.5" />
                  Archive Chat
                </button>
                <button
                  onClick={() => {
                    setShowEncryptionModal(true);
                    setShowOptionsDropdown(false);
                  }}
                  className="w-full text-left px-4 py-2.5 hover:bg-[#182229] transition-colors flex items-center gap-2 text-[#00a884] font-semibold"
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  Encryption Key
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sub-search Bar */}
      {showSearchBar && (
        <div className="bg-[#111b21] p-3 border-b border-[#222e35] flex items-center justify-between shrink-0 transition-all z-10">
          <div className="bg-[#202c33] flex items-center gap-3 px-3 py-1.5 rounded-xl border border-[#222e35] w-full max-w-md">
            <Search className="text-[#8696a0] w-4 h-4 shrink-0" />
            <input
              type="text"
              placeholder="Search text in messages"
              value={searchInChat}
              onChange={(e) => setSearchInChat(e.target.value)}
              className="bg-transparent text-xs text-[#e9edef] placeholder-[#8696a0] outline-none w-full"
            />
          </div>
          <button
            onClick={() => {
              setSearchInChat("");
              setShowSearchBar(false);
            }}
            className="text-[#8696a0] hover:text-[#e9edef] p-1.5 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Encryption Banner */}
      <div className="bg-[#182229] py-2 px-4 flex items-center justify-center gap-2 select-none shrink-0 border-b border-[#222e35]/30">
        <span className="text-[10px] text-[#00a884] font-mono flex items-center gap-1">
          🔒 End-to-End Encrypted. Messages are locked securely.
        </span>
        <button
          onClick={() => setShowEncryptionModal(true)}
          className="text-[10px] text-[#8696a0] underline hover:text-[#00a884]"
        >
          Verify code
        </button>
      </div>

      {/* Messages Thread list */}
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 flex flex-col relative">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            const hasMedia = !!msg.mediaUrl;
            const isStarred = msg.isStarred;
            const isPinned = msg.isPinned;

            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                className={`flex flex-col max-w-[70%] group relative ${
                  isMe ? "self-end items-end" : "self-start items-start"
                }`}
              >
                {/* Sender Tag for groups */}
                {isGroup && !isMe && (
                  <span className="text-[10px] text-[#00a884] font-semibold ml-2 mb-0.5 select-none font-sans">
                    {getSenderName(msg.senderId)}
                  </span>
                )}

                {/* Main Message Bubble */}
                <div
                  className={`p-3.5 rounded-2xl shadow-md border ${
                    isMe
                      ? "bg-[#005c4b] border-[#005c4b] text-white rounded-tr-none"
                      : "bg-[#202c33] border-[#222e35] text-[#e9edef] rounded-tl-none"
                  }`}
                >
                  {/* Referenced/Replying Message Preview block */}
                  {msg.replyToId && (
                    <div className="mb-2 bg-[#111b21]/40 border-l-4 border-[#00a884] p-1.5 rounded text-xs text-[#8696a0] max-w-full truncate font-sans">
                      Replying to thread...
                    </div>
                  )}

                  {/* Media Rendering Module */}
                  {hasMedia && (
                    <div className="mb-2 rounded-xl overflow-hidden max-w-xs relative bg-[#111b21]/20">
                      {msg.mediaType === "image" && (
                        <div className="relative group">
                          <img
                            src={msg.mediaUrl}
                            alt="Sent media"
                            className="w-full max-h-60 object-cover hover:scale-105 transition-transform cursor-pointer"
                          />
                          <a
                            href={msg.mediaUrl}
                            download={msg.mediaName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      )}

                      {msg.mediaType === "video" && (
                        <div className="relative group">
                          <video
                            src={msg.mediaUrl}
                            controls
                            className="w-full max-h-60 object-cover"
                          />
                          <div className="absolute top-2 left-2 bg-black/50 text-white text-[9px] px-2 py-0.5 rounded-md font-mono select-none">
                            Video Preview
                          </div>
                        </div>
                      )}

                      {msg.mediaType === "audio" && (
                        <div className="p-3 bg-[#111b21]/60 rounded-xl flex items-center gap-3">
                          <div className="p-2 bg-[#00a884] rounded-full text-white cursor-pointer hover:scale-105 transition-all">
                            <Play className="w-4.5 h-4.5" />
                          </div>
                          <div>
                            <span className="text-[11px] font-semibold block text-[#e9edef] truncate max-w-[150px]">
                              {msg.mediaName}
                            </span>
                            <span className="text-[9px] text-[#8696a0] font-mono">
                              {(msg.mediaSize / 1024).toFixed(1)} KB
                            </span>
                          </div>
                        </div>
                      )}

                      {msg.mediaType === "voice" && (
                        <div className="p-3.5 bg-[#111b21]/60 rounded-xl flex items-center gap-3 w-56 select-none">
                          <div className="p-2 bg-[#00a884] rounded-full text-white cursor-pointer">
                            <Mic className="w-4 h-4" />
                          </div>
                          {/* Animated voice wave visualizer representation */}
                          <div className="flex-1 flex items-center gap-0.5 h-6">
                            {[4, 8, 2, 6, 9, 3, 5, 7, 2, 6, 8, 4].map((h, i) => (
                              <div
                                key={i}
                                className="w-0.5 bg-[#00a884] rounded-full transition-all"
                                style={{ height: `${h * 10}%` }}
                              />
                            ))}
                          </div>
                        </div>
                      )}

                      {msg.mediaType === "sticker" && (
                        <img
                          src={msg.mediaUrl}
                          alt="sticker"
                          className="w-24 h-24 object-contain animate-bounce"
                        />
                      )}

                      {msg.mediaType === "document" && (
                        <div className="p-3 bg-[#111b21]/60 rounded-xl flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            {msg.mediaName?.endsWith(".zip") ? (
                              <FileArchive className="w-8 h-8 text-[#f59e0b] shrink-0" />
                            ) : (
                              <FileText className="w-8 h-8 text-[#ef4444] shrink-0" />
                            )}
                            <div className="min-w-0">
                              <span className="text-[11px] font-semibold text-[#e9edef] block truncate max-w-[150px]">
                                {msg.mediaName}
                              </span>
                              <span className="text-[9px] text-[#8696a0] font-mono">
                                {(msg.mediaSize / 1024).toFixed(1)} KB
                              </span>
                            </div>
                          </div>
                          <a
                            href={msg.mediaUrl}
                            download={msg.mediaName}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 hover:bg-[#202c33] rounded-full transition-colors text-[#8696a0] hover:text-[#e9edef]"
                          >
                            <Download className="w-4 h-4" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Message Text */}
                  <p className="text-xs leading-relaxed font-sans select-text break-words">
                    {msg.text}
                  </p>

                  {/* Metadata inside bubble */}
                  <div className="mt-1 flex items-center justify-end gap-1 select-none">
                    {isStarred && <Star className="w-3 h-3 text-yellow-400 fill-current" />}
                    {isPinned && <Pin className="w-3 h-3 text-[#8696a0] rotate-45" />}
                    <span className="text-[9px] text-[#8696a0] font-mono">
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                    {isMe && (
                      <span className="shrink-0">
                        {msg.status === "sent" ? (
                          <Check className="w-3 h-3 text-[#8696a0]" />
                        ) : msg.status === "delivered" ? (
                          <CheckCheck className="w-3.5 h-3.5 text-[#8696a0]" />
                        ) : (
                          <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb]" />
                        )}
                      </span>
                    )}
                  </div>
                </div>

                {/* Message Actions Float bar on Hover */}
                <div className={`absolute top-1/2 -translate-y-1/2 hidden group-hover:flex items-center gap-1 bg-[#1f2c34] border border-[#2f3b43] p-1.5 rounded-lg shadow-lg z-10 ${
                  isMe ? "right-[102%]" : "left-[102%]"
                }`}>
                  <button
                    onClick={() => onToggleMessageAction(msg.id, isStarred ? "unstar" : "star")}
                    className="p-1 hover:bg-[#2a373f] text-[#8696a0] hover:text-yellow-400 rounded transition-all"
                    title="Star message"
                  >
                    <Star className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onToggleMessageAction(msg.id, isPinned ? "unpin" : "pin")}
                    className="p-1 hover:bg-[#2a373f] text-[#8696a0] hover:text-[#e9edef] rounded transition-all"
                    title="Pin message"
                  >
                    <Pin className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setReplyingMessage(msg)}
                    className="p-1 hover:bg-[#2a373f] text-[#8696a0] hover:text-[#e9edef] rounded transition-all"
                    title="Reply"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(msg.text);
                    }}
                    className="p-1 hover:bg-[#2a373f] text-[#8696a0] hover:text-[#e9edef] rounded transition-all"
                    title="Copy Text"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onDeleteMessage(msg.id, isMe ? "everyone" : "me")}
                    className="p-1 hover:bg-[#2a373f] text-[#8696a0] hover:text-red-400 rounded transition-all"
                    title="Delete message"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-[#8696a0] p-8 text-center select-none font-sans mt-12">
            <span className="text-2xl mb-2">💬</span>
            <h4 className="font-semibold text-sm text-[#e9edef] mb-1">Secure Encryption Tunnel Active</h4>
            <p className="text-xs text-[#8696a0] max-w-sm">
              Your communications are armored with custom client-side key generations. No intermediate node can decipher the packet payload.
            </p>
          </div>
        )}

        {/* Typing indicator floating badge */}
        {typingUsers.length > 0 && (
          <div className="absolute bottom-4 left-4 bg-[#202c33]/90 text-[10px] text-[#00a884] font-semibold px-3 py-1.5 rounded-full border border-[#00a884]/20 flex items-center gap-1.5 animate-pulse select-none">
            <span className="w-1.5 h-1.5 bg-[#00a884] rounded-full animate-ping" />
            {getSenderName(typingUsers[0])} is typing...
          </div>
        )}
      </div>

      {/* Input Action Panel */}
      <div className="p-3 bg-[#202c33] border-t border-[#222e35]/40 flex items-center gap-3 shrink-0 relative select-none z-20">
        {/* Reply Message reference bar */}
        {replyingMessage && (
          <div className="absolute top-0 left-0 right-0 -translate-y-full bg-[#1e2a30] border-t border-[#00a884] px-4 py-2 flex items-center justify-between text-xs z-50">
            <div className="border-l-2 border-[#00a884] pl-2">
              <span className="text-[#00a884] font-semibold block text-[10px]">
                Replying to {getSenderName(replyingMessage.senderId)}
              </span>
              <p className="text-[#8696a0] truncate max-w-xs">{replyingMessage.text}</p>
            </div>
            <button
              onClick={() => setReplyingMessage(null)}
              className="p-1 hover:bg-[#202c33] rounded-full text-[#8696a0] hover:text-[#e9edef]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Sticker toggle / Emoji Toggle */}
        <div className="flex items-center gap-2">
          {/* Emoji */}
          <button
            onClick={() => {
              setShowEmojiPicker(!showEmojiPicker);
              setShowStickerPicker(false);
              setShowAttachmentMenu(false);
            }}
            className={`p-2 rounded-full transition-all cursor-pointer ${
              showEmojiPicker ? "text-[#00a884] bg-[#2a3942]" : "text-[#8696a0] hover:text-[#e9edef]"
            }`}
            title="Emojis"
          >
            <Smile className="w-5 h-5" />
          </button>

          {/* Stickers */}
          <button
            onClick={() => {
              setShowStickerPicker(!showStickerPicker);
              setShowEmojiPicker(false);
              setShowAttachmentMenu(false);
            }}
            className={`p-2 rounded-full transition-all cursor-pointer text-xs font-bold font-sans ${
              showStickerPicker ? "text-[#00a884] bg-[#2a3942]" : "text-[#8696a0] hover:text-[#e9edef]"
            }`}
            title="Stickers"
          >
            <Flame className="w-5 h-5" />
          </button>

          {/* Attachment Toggle */}
          <div className="relative">
            <button
              onClick={() => {
                setShowAttachmentMenu(!showAttachmentMenu);
                setShowEmojiPicker(false);
                setShowStickerPicker(false);
              }}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                showAttachmentMenu ? "text-[#00a884] bg-[#2a3942]" : "text-[#8696a0] hover:text-[#e9edef]"
              }`}
              title="Attach File"
            >
              <Paperclip className="w-5 h-5" />
            </button>

            {/* Attachment Dropdown Panel */}
            <AnimatePresence>
              {showAttachmentMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.92, y: 8 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.92, y: 8 }}
                  transition={{ type: "spring", stiffness: 350, damping: 25 }}
                  className="absolute bottom-12 left-0 bg-[#233138] border border-[#2f3b43] p-2 rounded-xl shadow-xl w-44 z-50 text-xs text-[#e9edef] space-y-1 origin-bottom-left"
                >
                  {/* Documents */}
                  <label className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-[#182229] transition-colors rounded-lg cursor-pointer">
                    <FileText className="w-4 h-4 text-[#ef4444]" />
                    <span>Document File</span>
                    <input
                      type="file"
                      onChange={(e) => handleFileUpload(e, "document")}
                      className="hidden"
                    />
                  </label>

                  {/* Images/Videos */}
                  <label className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-[#182229] transition-colors rounded-lg cursor-pointer">
                    <Play className="w-4 h-4 text-[#3b82f6]" />
                    <span>Photos & Videos</span>
                    <input
                      type="file"
                      accept="image/*,video/*"
                      onChange={(e) => handleFileUpload(e)}
                      className="hidden"
                    />
                  </label>

                  {/* Camera snapshot */}
                  <button
                    onClick={startCamera}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-[#182229] transition-colors rounded-lg text-left cursor-pointer"
                  >
                    <Camera className="w-4 h-4 text-[#ec4899]" />
                    <span>Snap Photo</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Input Text field */}
        <div className="flex-1">
          <input
            type="text"
            placeholder={isRecording ? "Voice note recording..." : "Type a message"}
            value={inputText}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSend();
            }}
            disabled={isRecording}
            className="w-full bg-[#2a3942] border border-[#2a3942] text-xs text-[#e9edef] placeholder-[#8696a0] px-4.5 py-2.5 rounded-xl outline-none focus:border-[#00a884] transition-all"
          />
        </div>

        {/* Audio mic recording trigger / Send Button */}
        <div className="shrink-0 flex items-center gap-1.5">
          {inputText.trim().length > 0 ? (
            <button
              onClick={handleSend}
              className="p-2.5 bg-[#00a884] hover:bg-[#008f72] text-[#111b21] rounded-full transition-all cursor-pointer shadow-lg active:scale-95"
            >
              <Send className="w-4 h-4" />
            </button>
          ) : isRecording ? (
            <div className="flex items-center gap-2 bg-[#005c4b] text-white py-1.5 px-3.5 rounded-full border border-[#00a884] shrink-0 animate-pulse font-mono text-xs">
              <span>🎙️ {recordingSeconds}s</span>
              <button
                onClick={stopAndSendRecording}
                className="text-xs text-[#53bdeb] font-semibold hover:underline"
              >
                Send
              </button>
              <button
                onClick={cancelRecording}
                className="text-xs text-red-400 font-semibold hover:underline"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={startRecording}
              className="p-2.5 hover:bg-[#2a3942] rounded-full text-[#8696a0] hover:text-[#e9edef] transition-all cursor-pointer"
              title="Record Voice Note"
            >
              <Mic className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Floating popover pickers */}
        {showEmojiPicker && (
          <div className="absolute bottom-14 left-4 z-50 w-72">
            <EmojiPicker onSelectEmoji={(emoji) => setInputText(prev => prev + emoji)} />
          </div>
        )}

        {showStickerPicker && (
          <div className="absolute bottom-14 left-16 z-50 w-72">
            <StickerPicker onSelectSticker={handleStickerSend} />
          </div>
        )}
      </div>

      {/* Floating Modal: Camera Photo Snapper */}
      {showCameraModal && (
        <div className="absolute inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4">
          <div className="relative max-w-md w-full bg-[#111b21] rounded-3xl p-6 border border-[#222e35] flex flex-col items-center">
            <button
              onClick={closeCameraModal}
              className="absolute top-4 right-4 p-2 text-[#8696a0] hover:text-white hover:bg-[#202c33] rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-sm font-semibold text-white mb-4">Capture Snapshot</h3>
            <video
              ref={videoRef}
              autoPlay
              className="w-full h-64 object-cover rounded-2xl bg-black border border-[#222e35] mb-4"
            />
            <button
              onClick={capturePhoto}
              className="px-6 py-3 bg-[#00a884] hover:bg-[#008f72] text-[#111b21] font-bold text-xs rounded-xl shadow-lg transition-transform active:scale-95"
            >
              Snap & Send
            </button>
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>
      )}

      {/* Floating Modal: E2E Encryption Details */}
      {showEncryptionModal && (
        <div className="absolute inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#111b21] rounded-3xl p-6 border border-[#00a884]/30 flex flex-col relative shadow-2xl">
            <button
              onClick={() => setShowEncryptionModal(false)}
              className="absolute top-4 right-4 p-2 text-[#8696a0] hover:text-white rounded-full hover:bg-[#202c33]"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="whatsapp-gradient p-3.5 rounded-2xl self-start mb-4 text-[#111b21]">
              <CheckCheck className="w-6 h-6" />
            </div>

            <h3 className="text-base font-semibold text-white mb-2">End-to-End Encryption</h3>
            <p className="text-xs text-[#8696a0] leading-relaxed mb-4">
              Messages and calls are secured with end-to-end encryption. No one outside of this chat, not even the server, can read or listen to them.
            </p>

            {/* Custom generated key validation codes */}
            <div className="bg-[#182229] border border-[#222e35] p-4 rounded-2xl text-center space-y-1.5">
              <span className="text-[10px] text-[#8696a0] uppercase tracking-wider font-semibold block">Encryption Fingerprint Key</span>
              <div className="grid grid-cols-4 gap-2 text-xs font-mono text-[#00a884] select-all font-semibold">
                <span>49204</span>
                <span>85920</span>
                <span>10485</span>
                <span>99201</span>
                <span>83902</span>
                <span>11048</span>
                <span>48502</span>
                <span>73901</span>
              </div>
            </div>

            <p className="text-[10px] text-[#8696a0] text-center mt-4">
              To verify security, compare these numbers with the recipient's device.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
