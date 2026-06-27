import React, { useState, useEffect, useRef } from "react";
import { Plus, Image as ImageIcon, Sparkles, Heart, Eye, ArrowLeft, Send, X, CheckCheck } from "lucide-react";
import { Status, User } from "../types";
import { motion, AnimatePresence } from "motion/react";
import UserAvatar from "./UserAvatar";

interface StatusViewProps {
  currentUser: User;
  users: User[];
  statuses: Status[];
  onUploadStatus: (type: 'photo' | 'video' | 'text', content: string, caption?: string, bgColor?: string) => void;
  onLikeStatus: (statusId: string, action: 'like' | 'unlike') => void;
  onViewStatus: (statusId: string) => void;
  onReplyStatus: (statusId: string, replyText: string) => void;
  onClose: () => void;
}

const BG_GRADIENTS = [
  "linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)", // Navy Deep
  "linear-gradient(135deg, #1e1b4b 0%, #311042 100%)", // Purple/Violet
  "linear-gradient(135deg, #10b981 0%, #059669 100%)", // Emerald
  "linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)", // Ocean Blue
  "linear-gradient(135deg, #ec4899 0%, #be185d 100%)", // Coral Pink
  "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)"  // Golden Sunshine
];

export default function StatusView({
  currentUser,
  users,
  statuses,
  onUploadStatus,
  onLikeStatus,
  onViewStatus,
  onReplyStatus,
  onClose
}: StatusViewProps) {
  const [activeViewStatus, setActiveViewStatus] = useState<Status | null>(null);
  const [statusTimer, setStatusTimer] = useState<number>(0);

  // Status creation states
  const [showCreator, setShowCreator] = useState(false);
  const [creatorType, setCreatorType] = useState<'text' | 'media'>('text');
  const [textContent, setTextContent] = useState("");
  const [bgIndex, setBgIndex] = useState(0);
  const [caption, setCaption] = useState("");
  const [mediaFile, setMediaFile] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'photo' | 'video'>('photo');

  // Status Reply input
  const [replyInput, setReplyInput] = useState("");
  const [replySent, setReplySent] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const statusProgressRef = useRef<any>(null);

  // Auto-progress timer for full screen viewing
  useEffect(() => {
    if (activeViewStatus) {
      onViewStatus(activeViewStatus.id); // mark viewed
      setStatusTimer(0);
      setReplyInput("");
      setReplySent(false);

      statusProgressRef.current = setInterval(() => {
        setStatusTimer((prev) => {
          if (prev >= 100) {
            handleCloseStatusView();
            return 100;
          }
          return prev + 1;
        });
      }, 50); // 5 seconds total status (100 * 50ms)
    }
    return () => clearInterval(statusProgressRef.current);
  }, [activeViewStatus]);

  const handleCloseStatusView = () => {
    clearInterval(statusProgressRef.current);
    setActiveViewStatus(null);
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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
          setMediaFile(data.fileUrl);
          setMediaType(file.type.startsWith("video/") ? "video" : "photo");
          setCreatorType("media");
        }
      } catch (err) {
        console.error(err);
      }
    };
    reader.readAsDataURL(file);
  };

  const handlePublishStatus = () => {
    if (creatorType === "text" && textContent.trim()) {
      onUploadStatus("text", textContent, undefined, BG_GRADIENTS[bgIndex]);
      setTextContent("");
      setShowCreator(false);
    } else if (creatorType === "media" && mediaFile) {
      onUploadStatus(mediaType, mediaFile, caption);
      setMediaFile(null);
      setCaption("");
      setShowCreator(false);
    }
  };

  const handleReplySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyInput.trim() || !activeViewStatus) return;

    onReplyStatus(activeViewStatus.id, replyInput);
    setReplyInput("");
    setReplySent(true);
    setTimeout(() => {
      setReplySent(false);
    }, 2000);
  };

  // Group statuses by user
  const groupedStatuses = statuses.reduce<{ [userId: string]: Status[] }>((acc, st) => {
    if (!acc[st.userId]) acc[st.userId] = [];
    acc[st.userId].push(st);
    return acc;
  }, {});

  // Separate my statuses from contacts
  const myUserStatuses = groupedStatuses[currentUser.id] || [];
  const contactStatuses = Object.keys(groupedStatuses)
    .filter(id => id !== currentUser.id)
    .map(id => groupedStatuses[id]);

  const toggleLike = () => {
    if (!activeViewStatus) return;
    const isLiked = activeViewStatus.likes.some(l => l.userId === currentUser.id);
    if (isLiked) {
      onLikeStatus(activeViewStatus.id, "unlike");
    } else {
      onLikeStatus(activeViewStatus.id, "like");
    }
    // Update local visual active status
    const currentIdx = statuses.findIndex(s => s.id === activeViewStatus.id);
    if (currentIdx !== -1) {
      setActiveViewStatus({
        ...activeViewStatus,
        likes: isLiked
          ? activeViewStatus.likes.filter(l => l.userId !== currentUser.id)
          : [...activeViewStatus.likes, { userId: currentUser.id, createdAt: new Date().toISOString() }]
      });
    }
  };

  return (
    <div id="status-panel" className="w-[380px] h-full bg-[#111b21] border-r border-[#222e35] flex flex-col shrink-0 relative z-40">
      {/* Header */}
      <div className="h-[60px] bg-[#202c33] px-4 flex items-center gap-4 border-b border-[#222e35] select-none shrink-0">
        <button
          onClick={onClose}
          className="text-[#8696a0] hover:text-[#00a884] p-1.5 rounded-full hover:bg-[#2a3942] transition-all"
        >
          ← Back
        </button>
        <h3 className="text-sm font-semibold text-[#e9edef] font-sans">Updates & Status</h3>
      </div>

      <div className="flex-1 overflow-y-auto bg-[#111b21] p-4.5 space-y-6 select-none">
        {/* Onboarding tools */}
        <div className="bg-[#202c33]/40 border border-[#222e35]/60 rounded-2xl p-4.5 space-y-4">
          <h4 className="text-xs font-bold text-[#00a884] uppercase tracking-wider">Publish Updates</h4>
          <div className="flex gap-3">
            {/* Text Status Trigger */}
            <button
              onClick={() => {
                setCreatorType("text");
                setShowCreator(true);
              }}
              className="flex-1 bg-[#111b21] hover:bg-[#202c33] p-3 rounded-xl border border-[#222e35] flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs font-semibold text-[#e9edef]"
            >
              <Sparkles className="w-5 h-5 text-yellow-500" />
              <span>Text Status</span>
            </button>

            {/* Media Status Trigger */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex-1 bg-[#111b21] hover:bg-[#202c33] p-3 rounded-xl border border-[#222e35] flex flex-col items-center justify-center gap-1.5 transition-colors cursor-pointer text-xs font-semibold text-[#e9edef]"
            >
              <ImageIcon className="w-5 h-5 text-blue-500" />
              <span>Media Status</span>
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleMediaUpload}
              className="hidden"
              accept="image/*,video/*"
            />
          </div>
        </div>

        {/* My Status List */}
        <div className="space-y-2.5">
          <h4 className="text-[10px] text-[#8696a0] font-bold uppercase tracking-wider">My status</h4>
          {myUserStatuses.length > 0 ? (
            myUserStatuses.map((st) => (
              <div
                key={st.id}
                onClick={() => setActiveViewStatus(st)}
                className="flex items-center justify-between p-2 rounded-xl hover:bg-[#202c33]/70 border border-transparent hover:border-[#222e35]/50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="relative p-[2px] bg-[#00a884] rounded-full">
                    <UserAvatar
                      src={currentUser.avatar}
                      name={currentUser.name}
                      className="w-10 h-10 border border-[#111b21]"
                    />
                  </div>
                  <div>
                    <h5 className="text-xs font-semibold text-[#e9edef]">Recent Status Update</h5>
                    <span className="text-[9px] text-[#8696a0] font-mono">
                      {new Date(st.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
                {/* Views Count */}
                <div className="flex items-center gap-1.5 text-[#8696a0] text-xs font-mono">
                  <Eye className="w-3.5 h-3.5" />
                  <span>{st.viewers.length}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-[#8696a0] italic py-2">
              No active updates in the last 24 hours.
            </div>
          )}
        </div>

        {/* Contacts Status Updates */}
        <div className="space-y-3">
          <h4 className="text-[10px] text-[#8696a0] font-bold uppercase tracking-wider">Recent updates</h4>
          {contactStatuses.length > 0 ? (
            contactStatuses.map((stList) => {
              const latest = stList[stList.length - 1];
              return (
                <div
                  key={latest.userId}
                  onClick={() => setActiveViewStatus(latest)}
                  className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[#202c33]/70 border border-transparent hover:border-[#222e35]/50 cursor-pointer transition-colors"
                >
                  <div className="relative p-[2px] bg-[#00a884] rounded-full">
                    <UserAvatar
                      src={latest.userAvatar}
                      name={latest.userName}
                      className="w-10 h-10 border border-[#111b21]"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h5 className="text-xs font-semibold text-[#e9edef] truncate">{latest.userName}</h5>
                    <span className="text-[9px] text-[#8696a0] font-mono block">
                      {new Date(latest.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-xs text-[#8696a0] italic py-2">
              No recent updates from contacts.
            </div>
          )}
        </div>
      </div>

      {/* Slide Drawer: Status Creation Card */}
      {showCreator && (
        <div className="absolute inset-0 z-50 bg-[#111b21] flex flex-col p-4">
          <div className="flex items-center justify-between mb-4 select-none">
            <button
              onClick={() => setShowCreator(false)}
              className="text-[#8696a0] hover:text-[#e9edef] font-semibold text-xs"
            >
              Cancel
            </button>
            <h3 className="text-sm font-semibold text-[#e9edef]">New Status</h3>
            <button
              onClick={handlePublishStatus}
              className="text-[#00a884] font-bold text-xs uppercase tracking-wider hover:text-[#00f2be]"
            >
              Publish
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-between overflow-hidden">
            {/* Visualizer Frame */}
            {creatorType === "text" ? (
              <div
                className="flex-1 rounded-2xl flex flex-col items-center justify-center p-6 text-center relative border border-[#222e35]/40 shadow-inner"
                style={{ background: BG_GRADIENTS[bgIndex] }}
              >
                <textarea
                  placeholder="What's on your mind? ✨✍️"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  maxLength={140}
                  className="bg-transparent text-white text-base md:text-lg font-bold text-center outline-none border-none placeholder-white/50 w-full resize-none font-display max-h-40"
                />
                <span className="text-[10px] text-white/50 font-mono absolute bottom-3 right-4">
                  {textContent.length} / 140
                </span>

                {/* Color Palette toggler */}
                <button
                  onClick={() => setBgIndex((prev) => (prev + 1) % BG_GRADIENTS.length)}
                  className="absolute bottom-3 left-4 p-2 bg-black/20 text-white rounded-full hover:bg-black/40 transition-colors"
                  title="Change Background color"
                >
                  🎨
                </button>
              </div>
            ) : (
              <div className="flex-1 rounded-2xl bg-black border border-[#222e35] relative overflow-hidden flex flex-col items-center justify-center">
                {mediaType === "video" ? (
                  <video src={mediaFile!} controls className="max-w-full max-h-72 object-cover" />
                ) : (
                  <img src={mediaFile!} alt="Publish upload" className="max-w-full max-h-72 object-cover" />
                )}

                {/* Caption inputs */}
                <div className="absolute bottom-3 left-3 right-3 bg-[#111b21]/90 p-2.5 border border-[#222e35] rounded-xl shadow-2xl">
                  <input
                    type="text"
                    placeholder="Add a status caption..."
                    value={caption}
                    onChange={(e) => setCaption(e.target.value)}
                    className="bg-transparent text-white text-xs placeholder-[#8696a0]/60 outline-none w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full-Screen Immersive Status Slide Viewer Player */}
      <AnimatePresence>
        {activeViewStatus && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-50 bg-[#090e11] flex flex-col justify-between"
          >
            {/* Loading Slide Timelines */}
            <div className="h-1 bg-black/40 flex gap-1 p-2 pb-0">
              <div className="h-1 bg-[#00a884] rounded-full transition-all duration-75" style={{ width: `${statusTimer}%` }} />
            </div>

            {/* Profile Info Row Header */}
            <div className="flex items-center justify-between px-4 py-3 select-none">
              <div className="flex items-center gap-3">
                <UserAvatar
                  src={activeViewStatus.userAvatar}
                  name={activeViewStatus.userName}
                  className="w-10 h-10 border border-white/20"
                />
                <div>
                  <h4 className="text-xs font-semibold text-white">{activeViewStatus.userName}</h4>
                  <span className="text-[9px] text-[#8696a0] font-mono">
                    {new Date(activeViewStatus.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              </div>
              <button
                onClick={handleCloseStatusView}
                className="p-1.5 bg-white/10 text-white hover:bg-white/20 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Active Display canvas */}
            <div className="flex-1 flex flex-col justify-center items-center p-6 text-center">
              {activeViewStatus.type === "text" ? (
                <div
                  className="w-full h-80 rounded-2xl p-6 flex flex-col items-center justify-center border border-white/5 shadow-2xl relative"
                  style={{ background: activeViewStatus.backgroundColor || "#00a884" }}
                >
                  <p className="text-white text-base md:text-lg font-bold font-display select-all leading-relaxed">
                    {activeViewStatus.content}
                  </p>
                </div>
              ) : (
                <div className="relative max-w-full max-h-96 rounded-2xl overflow-hidden shadow-2xl border border-white/5">
                  {activeViewStatus.type === "video" ? (
                    <video src={activeViewStatus.content} autoPlay controls className="max-h-96 object-contain" />
                  ) : (
                    <img src={activeViewStatus.content} alt="Status Content" className="max-h-96 object-contain" />
                  )}
                  {activeViewStatus.caption && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/75 p-3 text-center border-t border-white/5">
                      <p className="text-white text-xs select-all">{activeViewStatus.caption}</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer triggers: Liking, Replies, Viewer Counter list */}
            <div className="p-4 bg-black/40 border-t border-white/5 backdrop-blur-md select-none">
              <div className="flex items-center justify-between mb-4">
                {/* Liking toggles */}
                <button
                  onClick={toggleLike}
                  className="flex items-center gap-1.5 p-2 px-4 rounded-xl bg-white/5 text-white hover:bg-white/10 transition-colors cursor-pointer text-xs font-semibold"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      activeViewStatus.likes.some(l => l.userId === currentUser.id)
                        ? "text-red-500 fill-current animate-bounce"
                        : "text-white"
                    }`}
                  />
                  <span>{activeViewStatus.likes.length} Likes</span>
                </button>

                {/* My Viewer counts list if it is my own status */}
                {activeViewStatus.userId === currentUser.id ? (
                  <div className="text-[10px] text-[#8696a0] font-mono flex items-center gap-1.5">
                    <Eye className="w-4 h-4 text-[#00a884]" />
                    <span>Seen by {activeViewStatus.viewers.length} contacts</span>
                  </div>
                ) : (
                  <div className="text-[10px] text-[#8696a0] font-mono flex items-center gap-1">
                    <CheckCheck className="w-4 h-4 text-[#00a884]" />
                    <span>View registered</span>
                  </div>
                )}
              </div>

              {/* Replier box (Only for contacts' status) */}
              {activeViewStatus.userId !== currentUser.id && (
                <form onSubmit={handleReplySubmit} className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder={replySent ? "Reply message sent! 📬" : "Reply to status..."}
                    value={replyInput}
                    onChange={(e) => setReplyInput(e.target.value)}
                    disabled={replySent}
                    className="flex-1 bg-white/5 border border-white/10 text-xs text-white placeholder-white/40 px-4 py-2.5 rounded-xl outline-none focus:border-[#00a884] transition-all"
                  />
                  <button
                    type="submit"
                    disabled={replySent}
                    className="p-2.5 bg-[#00a884] text-[#111b21] rounded-xl hover:bg-[#008f72] transition-colors cursor-pointer"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
