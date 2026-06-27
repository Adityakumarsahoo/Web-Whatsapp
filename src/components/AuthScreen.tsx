import React, { useState, useEffect } from "react";
import { Phone, Key, ShieldCheck, User as UserIcon, FileText, Globe, AlertCircle } from "lucide-react";
import { motion } from "motion/react";
import { User } from "../types";

interface AuthScreenProps {
  onAuthSuccess: (user: User, token: string, isNewUser?: boolean) => void;
}

const COUNTRIES = [
  { name: "United States", code: "+1", flag: "🇺🇸" },
  { name: "India", code: "+91", flag: "🇮🇳" },
  { name: "United Kingdom", code: "+44", flag: "🇬🇧" },
  { name: "Germany", code: "+49", flag: "🇩🇪" },
  { name: "Brazil", code: "+55", flag: "🇧🇷" },
  { name: "Japan", code: "+81", flag: "🇯🇵" },
  { name: "United Arab Emirates", code: "+971", flag: "🇦🇪" },
  { name: "Australia", code: "+61", flag: "🇦🇺" }
];

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const [countryCode, setCountryCode] = useState<string>("+1");
  const [phoneNumber, setPhoneNumber] = useState<string>("");
  const [otpCode, setOtpCode] = useState<string>("");
  const [step, setStep] = useState<"phone" | "otp" | "register">("phone");
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  // New user onboarding fields
  const [name, setName] = useState<string>("");
  const [bio, setBio] = useState<string>("Hey there! I am using WhatsApp.");

  const [resendTimer, setResendTimer] = useState<number>(30);

  // Simulated notification toast state for real-time dynamic OTP code
  const [simulatedNotification, setSimulatedNotification] = useState<{
    visible: boolean;
    otp: string;
    phoneNumber: string;
  } | null>(null);

  useEffect(() => {
    let interval: any;
    if (step === "otp" && resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, resendTimer]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      setError("Please enter your phone number");
      return;
    }

    setLoading(true);
    setError(null);
    setInfoMsg(null);

    const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, "")}`;

    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: fullPhone })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Failed to send OTP");

      setInfoMsg(data.message);
      setStep("otp");
      setResendTimer(30);

      if (data.otp) {
        setSimulatedNotification({
          visible: true,
          otp: data.otp,
          phoneNumber: fullPhone
        });
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setError("Please enter the 6-digit verification code");
      return;
    }

    setLoading(true);
    setError(null);

    const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, "")}`;

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: fullPhone,
          otp: otpCode,
          name,
          bio
        })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to verify OTP");
      }

      // If existing user, we immediately log them in. If they are a new user,
      // wait, the server registers new users with default names. But we can onboard them first.
      // Let's check if the user is new. The OTP request response told us if it's a new user.
      // If we need to capture user name and bio, let's ask for them!
      // To keep onboarding pristine: if the user needs register info, we can let them input it on "register" step
      // or we can detect they are new, show a Register Onboarding card, and then call verify-otp with the details!
      // Let's implement that. If they are new, let's switch to 'register' step so they can fill Name and Bio,
      // and when they click "Onboard", we verify and submit!
      // Wait, how do we know if they are new before verifying? The request-otp response returns `isNewUser`.
      // Let's save `isNewUser` in a state!
      onAuthSuccess(data.user, data.token, data.isNewUser);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    setResendTimer(30);
    setError(null);
    setInfoMsg(null);
    const fullPhone = `${countryCode}${phoneNumber.replace(/\D/g, "")}`;
    try {
      const res = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber: fullPhone })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setInfoMsg(data.message);

      if (data.otp) {
        setSimulatedNotification({
          visible: true,
          otp: data.otp,
          phoneNumber: fullPhone
        });
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div id="auth-screen" className="flex items-center justify-center min-h-screen bg-[#0b141a] chat-bg-pattern p-4 relative overflow-hidden">
      {/* Dynamic Simulated Push Notification (SMS) */}
      {simulatedNotification && simulatedNotification.visible && (
        <motion.div
          initial={{ y: -100, opacity: 0, x: "-50%" }}
          animate={{ y: 0, opacity: 1, x: "-50%" }}
          exit={{ y: -100, opacity: 0, x: "-50%" }}
          transition={{ type: "spring", stiffness: 120, damping: 15 }}
          className="absolute top-4 left-1/2 z-50 w-[92%] max-w-sm bg-[#111b21]/95 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-4 shadow-[0_15px_40px_rgba(0,0,0,0.6)] flex flex-col gap-2.5 font-sans"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 bg-emerald-950/60 rounded-lg flex items-center justify-center border border-emerald-500/30">
                <svg className="w-3.5 h-3.5 text-emerald-400 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12c0 1.84.5 3.56 1.37 5.03l-1.35 4.93c-.11.41.28.79.69.69l4.93-1.35C9.1 21.84 10.5 22.31 12 22.31c5.52 0 10-4.48 10-10S17.52 2 12 2zm4.18 13.91c-.2.56-.99 1.07-1.37 1.15-.38.08-.88.16-2.59-.55-2.18-.9-3.58-3.12-3.69-3.27-.11-.15-.89-1.18-.89-2.26 0-1.08.56-1.61.76-1.83.2-.22.45-.28.59-.28.14 0 .28.01.4.02.13.01.3.01.46.39.17.41.59 1.45.64 1.56.05.11.08.24 0 .39-.08.15-.12.24-.24.39-.12.14-.25.32-.36.43-.12.13-.25.27-.11.51.14.24.61.99 1.3 1.61.89.79 1.64 1.04 1.88 1.15.24.11.38.09.52-.08.14-.17.59-.69.75-.92.16-.23.32-.19.54-.11.22.08 1.39.66 1.63.78.24.12.4.18.46.28.06.1.06.56-.14 1.12z" />
                </svg>
              </div>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-wider">SECURE LINK • now</span>
            </div>
            <button
              onClick={() => setSimulatedNotification(prev => prev ? { ...prev, visible: false } : null)}
              className="text-[#8696a0] hover:text-[#e9edef] text-xs font-semibold p-1"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-bold text-[#e9edef]">WhatsApp Security Center</p>
            <p className="text-[11px] text-[#8696a0] leading-normal">
              Your real-time 6-digit verification code is <span className="font-mono font-black text-[#00a884] text-xs px-1.5 py-0.5 bg-emerald-950/60 rounded border border-emerald-500/30">{simulatedNotification.otp}</span>. Do not share this code.
            </p>
          </div>
          <div className="flex gap-2 border-t border-[#222e35] pt-2.5 mt-0.5 justify-end">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(simulatedNotification.otp);
                setInfoMsg("Verification code copied to clipboard!");
              }}
              className="px-2.5 py-1 text-[10px] font-bold text-[#00a884] hover:text-[#00f2be] bg-emerald-950/40 rounded-lg hover:bg-emerald-950/80 border border-emerald-500/20 transition-colors cursor-pointer"
            >
              Copy Code
            </button>
            <button
              type="button"
              onClick={() => {
                setOtpCode(simulatedNotification.otp);
                setInfoMsg("Verification code auto-filled successfully!");
              }}
              className="px-2.5 py-1 text-[10px] font-bold text-white bg-[#00a884] hover:bg-[#008f72] rounded-lg hover:shadow-md border border-emerald-400/20 transition-all cursor-pointer"
            >
              Auto-Fill
            </button>
          </div>
        </motion.div>
      )}

      {/* Visual background decorations - Beautiful Premium Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-[#00a884] rounded-full filter blur-[150px] opacity-[0.12] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-[#2563eb] rounded-full filter blur-[150px] opacity-[0.10]" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-[#111b21]/80 backdrop-blur-2xl border border-[#222e35]/80 rounded-3xl overflow-hidden shadow-[0_30px_80px_rgba(0,0,0,0.8)] relative z-10 p-8 flex flex-col items-center"
      >
        {/* WhatsApp Logo Emblem */}
        <div className="bg-gradient-to-tr from-[#00a884] to-[#128c7e] p-5 rounded-3xl shadow-xl shadow-emerald-500/10 mb-6 relative border border-emerald-400/20">
          <svg
            className="w-10 h-10 text-white fill-current"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.458 5.704 1.459h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.825 0 00-3.48-8.413z" />
          </svg>
        </div>

        <h1 className="text-2xl font-bold font-display text-[#e9edef] text-center mb-1">
          WhatsApp Web
        </h1>
        <p className="text-xs text-[#8696a0] text-center mb-8 uppercase tracking-widest font-semibold">
          End-to-End Encrypted Secure Web Portal
        </p>

        {/* Dynamic Alerts */}
        {error && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full bg-red-950/40 border border-red-800/60 text-red-400 p-3.5 rounded-2xl mb-6 flex items-start gap-2.5 text-xs font-sans"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        {infoMsg && (
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full bg-emerald-950/40 border border-emerald-800/60 text-emerald-400 p-3.5 rounded-2xl mb-6 flex items-start gap-2.5 text-xs font-sans"
          >
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{infoMsg}</span>
          </motion.div>
        )}

        {/* Form Modules */}
        {step === "phone" && (
          <form onSubmit={handleSendOtp} className="w-full space-y-5">
            {/* Country Selector */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#8696a0] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-[#00a884]" /> Country / Region
              </label>
              <div className="relative">
                <select
                  value={countryCode}
                  onChange={(e) => setCountryCode(e.target.value)}
                  className="w-full bg-[#202c33]/75 border border-[#222e35] text-sm text-[#e9edef] p-3.5 rounded-xl outline-none focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884]/30 transition-all appearance-none cursor-pointer"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.code} value={c.code} className="bg-[#111b21] text-[#e9edef]">
                      {c.flag} {c.name} ({c.code})
                    </option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[#8696a0] pointer-events-none">
                  ▼
                </div>
              </div>
            </div>

            {/* Mobile Input */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#8696a0] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-[#00a884]" /> Phone Number
              </label>
              <div className="flex gap-2">
                <div className="bg-[#202c33]/50 border border-[#222e35] text-sm text-[#e9edef] p-3.5 rounded-xl font-mono text-center min-w-[70px] flex items-center justify-center select-none">
                  {countryCode}
                </div>
                <input
                  type="tel"
                  placeholder="e.g. 5550199"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  className="w-full bg-[#202c33]/75 border border-[#222e35] text-sm text-white placeholder-[#8696a0]/60 p-3.5 rounded-xl outline-none focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884]/30 transition-all font-mono"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Onboarding onboarding inputs (to avoid double page steps) */}
            <div className="bg-[#202c33]/30 p-4 border border-[#222e35]/60 rounded-2xl space-y-3.5">
              <span className="text-[10px] font-bold text-[#e9edef] uppercase tracking-wider block">Onboarding Profile (New Users)</span>
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="Your Full Name (e.g. John Doe)"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#111b21]/80 border border-[#222e35] text-xs text-white placeholder-[#8696a0]/50 p-2.5 rounded-xl outline-none focus:border-[#00a884] transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <input
                  type="text"
                  placeholder="Your Bio Status (e.g. Busy Coding)"
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full bg-[#111b21]/80 border border-[#222e35] text-xs text-white placeholder-[#8696a0]/50 p-2.5 rounded-xl outline-none focus:border-[#00a884] transition-all"
                />
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-[#00a884] to-[#128c7e] hover:brightness-110 text-[#111b21] text-sm font-bold p-4 rounded-xl hover:shadow-[0_8px_20px_rgba(0,168,132,0.25)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer text-white"
              disabled={loading}
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>Generate & Dispatched Secure OTP</>
              )}
            </button>
          </form>
        )}

        {step === "otp" && (
          <form onSubmit={handleVerifyOtp} className="w-full space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] text-[#8696a0] font-bold uppercase tracking-wider flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-[#00a884]" /> Verification OTP Code
              </label>
              <input
                type="text"
                maxLength={6}
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                placeholder="Enter 123456"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                className="w-full bg-[#202c33]/75 border border-[#222e35] text-center text-2xl tracking-[0.4em] text-[#00a884] placeholder-[#8696a0]/30 p-4 rounded-xl outline-none focus:border-[#00a884] focus:ring-1 focus:ring-[#00a884]/30 transition-all font-mono font-bold"
                disabled={loading}
              />
              <span className="text-[10px] text-[#8696a0] block text-center mt-1 leading-normal">
                Use the simulated SMS banner above to auto-fill or enter manually. You can also bypass using <strong className="text-[#e9edef] font-mono">123456</strong>.
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-4">
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-[#00a884] to-[#128c7e] hover:brightness-110 text-white text-sm font-bold p-4 rounded-xl hover:shadow-[0_8px_20px_rgba(0,168,132,0.25)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
                disabled={loading}
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>Verify & Launch WhatsApp</>
                )}
              </button>

              <div className="flex items-center justify-between text-xs px-1 border-t border-[#222e35] pt-3.5">
                <button
                  type="button"
                  onClick={() => setStep("phone")}
                  className="text-[#8696a0] hover:text-[#e9edef] transition-colors font-semibold flex items-center gap-1"
                >
                  ← Edit Phone
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  className={`transition-colors font-bold ${
                    resendTimer > 0 ? "text-gray-600 cursor-not-allowed" : "text-[#00a884] hover:text-[#00f2be] cursor-pointer"
                  }`}
                  disabled={resendTimer > 0}
                >
                  {resendTimer > 0 ? `Resend (${resendTimer}s)` : "Resend Code"}
                </button>
              </div>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
