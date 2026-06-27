import { useState, useEffect, useRef } from "react";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Volume2, User, Play } from "lucide-react";
import { motion } from "motion/react";
import UserAvatar from "./UserAvatar";

interface CallViewProps {
  currentCall: {
    id: string;
    callerId: string;
    callerName: string;
    callerAvatar: string;
    receiverId: string;
    receiverName: string;
    receiverAvatar: string;
    type: 'voice' | 'video';
    status: 'ringing' | 'connected' | 'missed' | 'ended' | 'rejected' | 'incoming';
  };
  onAnswerCall: () => void;
  onRejectCall: () => void;
  onHangupCall: () => void;
}

export default function CallView({ currentCall, onAnswerCall, onRejectCall, onHangupCall }: CallViewProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isCamOff, setIsCamOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    if (currentCall.status === "connected") {
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [currentCall.status]);

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const isIncoming = currentCall.status === "incoming";
  const isRinging = currentCall.status === "ringing";
  const isConnected = currentCall.status === "connected";

  // WebRTC / camera video element simulator
  const localVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (isConnected && currentCall.type === "video" && !isCamOff) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        })
        .catch(e => console.error("Could not load WebRTC video stream for simulation", e));
    } else {
      if (localVideoRef.current) {
        const stream = localVideoRef.current.srcObject as MediaStream;
        stream?.getTracks().forEach(t => t.stop());
        localVideoRef.current.srcObject = null;
      }
    }
  }, [isConnected, isCamOff, currentCall.type]);

  return (
    <div className="fixed inset-0 z-[100] bg-gradient-to-b from-[#0e161a] to-[#0a0f12] flex flex-col justify-between items-center text-white select-none overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/5 rounded-full filter blur-[120px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/5 rounded-full filter blur-[120px] pointer-events-none animate-pulse" style={{ animationDelay: "1s" }} />

      {/* Encryption Badge */}
      <div className="py-3 px-6 bg-[#111b21]/70 backdrop-blur-md w-full text-center flex items-center justify-center gap-2 border-b border-[#00a884]/20 z-10">
        <span className="flex h-2 w-2 relative shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-widest font-sans">
          🔒 End-to-End Encrypted Secure Web Call Pipeline Active
        </span>
      </div>

      {/* Profile/Identity Panel */}
      <div className="flex-1 flex flex-col items-center justify-center space-y-6 z-10 w-full px-6">
        {isConnected && currentCall.type === "video" && !isCamOff ? (
          <div className="relative w-full max-w-[340px] aspect-[3/4] rounded-[32px] overflow-hidden border border-[#00a884]/30 shadow-[0_20px_50px_rgba(0,0,0,0.6)] bg-black/40 backdrop-blur-sm">
            <video
              ref={localVideoRef}
              autoPlay
              muted
              className="w-full h-full object-cover scale-x-[-1]"
            />
            {/* Overlay peer representation */}
            <div className="absolute top-4 right-4 w-24 h-32 bg-gray-950/80 rounded-2xl border border-white/10 overflow-hidden shadow-xl flex items-center justify-center">
              <UserAvatar
                src={isIncoming ? currentCall.callerAvatar : currentCall.receiverAvatar}
                name={isIncoming ? currentCall.callerName : currentCall.receiverName}
                className="w-full h-full"
              />
            </div>
            <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-md px-3.5 py-1.5 rounded-full text-[10px] font-semibold font-mono tracking-wider border border-white/5">
              {formatDuration(callDuration)}
            </div>
          </div>
        ) : (
          <>
            <div className="relative flex items-center justify-center">
              {/* Concentric pulsing rings */}
              <motion.div
                animate={{ scale: [1, 1.4, 1], opacity: [0.15, 0, 0.15] }}
                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                className="absolute w-44 h-44 bg-emerald-500/20 rounded-full filter blur-md"
              />
              <motion.div
                animate={{ scale: [1, 1.25, 1], opacity: [0.3, 0.1, 0.3] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                className="absolute w-36 h-36 bg-emerald-500/25 rounded-full filter blur-sm"
              />
              <UserAvatar
                src={isIncoming ? currentCall.callerAvatar : currentCall.receiverAvatar}
                name={isIncoming ? currentCall.callerName : currentCall.receiverName}
                className="w-28 h-28 border-4 border-[#00a884] shadow-2xl relative z-10"
              />
            </div>

            <div className="text-center space-y-2 relative z-10">
              <h2 className="text-2xl font-black font-sans tracking-tight text-[#e9edef]">
                {isIncoming ? currentCall.callerName : currentCall.receiverName}
              </h2>
              <div className="inline-flex items-center gap-1.5 bg-[#202c33]/80 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/5 shadow-md">
                <span className="text-[10px] text-[#00a884] font-black uppercase tracking-wider font-mono">
                  {isIncoming
                    ? "Incoming Secure Call"
                    : isRinging
                    ? "Ringing Route"
                    : isConnected
                    ? `Active • ${formatDuration(callDuration)}`
                    : "Securing Path"}
                </span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Control Buttons panel */}
      <div className="p-8 bg-[#111b21]/90 backdrop-blur-xl w-full flex flex-col items-center gap-6 border-t border-[#222e35]/60 z-10 shadow-[0_-15px_40px_rgba(0,0,0,0.4)]">
        <div className="flex items-center gap-6">
          {/* Mute micro */}
          {isConnected && (
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-4 rounded-full transition-all cursor-pointer shadow-md ${
                isMuted
                  ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/10"
                  : "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]"
              }`}
            >
              {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          {/* Accept / Reject incoming */}
          {isIncoming ? (
            <div className="flex items-center gap-6">
              <button
                onClick={onAnswerCall}
                className="p-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition-transform hover:scale-105 cursor-pointer shadow-lg shadow-emerald-500/20 active:scale-95 flex items-center justify-center"
              >
                <Phone className="w-6 h-6" />
              </button>
              <button
                onClick={onRejectCall}
                className="p-5 bg-rose-600 hover:bg-rose-500 text-white rounded-full transition-transform hover:scale-105 cursor-pointer shadow-lg shadow-rose-500/20 active:scale-95 flex items-center justify-center"
              >
                <PhoneOff className="w-6 h-6" />
              </button>
            </div>
          ) : (
            <button
              onClick={onHangupCall}
              className="p-5 bg-rose-600 hover:bg-rose-500 text-white rounded-full transition-all hover:scale-105 cursor-pointer shadow-xl shadow-rose-500/25 active:scale-95 flex items-center justify-center"
              title="Hangup Call"
            >
              <PhoneOff className="w-6 h-6" />
            </button>
          )}

          {/* Toggle Cam */}
          {isConnected && currentCall.type === "video" && (
            <button
              onClick={() => setIsCamOff(!isCamOff)}
              className={`p-4 rounded-full transition-all cursor-pointer shadow-md ${
                isCamOff
                  ? "bg-amber-600 hover:bg-amber-700 text-white shadow-amber-500/10"
                  : "bg-[#202c33] text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]"
              }`}
            >
              {isCamOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
