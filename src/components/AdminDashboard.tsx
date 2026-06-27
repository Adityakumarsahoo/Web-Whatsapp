import { useState, useEffect } from "react";
import { Shield, Users, MessageSquare, PhoneCall, AlertOctagon, BarChart3, CheckSquare, X, ShieldAlert } from "lucide-react";
import { User, Report } from "../types";
import { motion, AnimatePresence } from "motion/react";
import UserAvatar from "./UserAvatar";

interface AdminDashboardProps {
  currentUser: User;
  onClose: () => void;
}

interface StatsSchema {
  totalUsers: number;
  activeUsers: number;
  totalChats: number;
  totalMessages: number;
  totalCalls: number;
  totalReports: number;
  mediaCount: number;
  reportsPending: number;
}

export default function AdminDashboard({ currentUser, onClose }: AdminDashboardProps) {
  const [stats, setStats] = useState<StatsSchema | null>(null);
  const [userList, setUserList] = useState<User[]>([]);
  const [reportList, setReportList] = useState<Report[]>([]);
  const [activeTab, setActiveTab] = useState<'stats' | 'users' | 'reports'>('stats');

  useEffect(() => {
    // Fetch stats
    fetch("/api/admin/stats")
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(e => console.error(e));

    // Fetch full user accounts
    fetch("/api/admin/users")
      .then(res => res.json())
      .then(data => setUserList(data))
      .catch(e => console.error(e));

    // Fetch reports
    fetch("/api/admin/reports")
      .then(res => res.json())
      .then(data => setReportList(data))
      .catch(e => console.error(e));
  }, []);

  const handleToggleSuspend = async (userId: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}/suspend`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        // Update local list
        setUserList(prev => prev.map(u => u.id === userId ? { ...u, isSuspended: data.user.isSuspended } : u));
        // Refresh stats
        fetch("/api/admin/stats").then(res => res.json()).then(data => setStats(data));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      const res = await fetch(`/api/admin/reports/${reportId}/resolve`, { method: "POST" });
      const data = await res.json();
      if (res.ok) {
        setReportList(prev => prev.map(r => r.id === reportId ? { ...r, status: "resolved" } : r));
        fetch("/api/admin/stats").then(res => res.json()).then(data => setStats(data));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div id="admin-dashboard-panel" className="w-[380px] h-full bg-[#111b21] border-r border-[#222e35]/60 flex flex-col shrink-0 z-40 relative shadow-2xl">
      {/* Settings Header */}
      <div className="h-[60px] bg-[#202c33] px-4 flex items-center gap-4 border-b border-[#222e35]/80 select-none shrink-0">
        <button
          onClick={onClose}
          className="text-[#e9edef] hover:text-[#00a884] p-1.5 rounded-full hover:bg-[#2a3942] transition-all"
        >
          ← Back
        </button>
        <h3 className="text-sm font-semibold text-[#e9edef] font-sans flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#00a884]" /> Admin Console
        </h3>
      </div>

      {/* Navigation tabs */}
      <div className="flex bg-[#111b21] p-2 border-b border-[#222e35]/40 gap-1 shrink-0 select-none">
        {(['stats', 'users', 'reports'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-[10px] font-extrabold uppercase tracking-widest rounded-xl transition-all cursor-pointer ${
              activeTab === tab
                ? "bg-[#00a884] text-[#111b21] shadow-lg shadow-emerald-500/10"
                : "text-[#8696a0] hover:text-[#e9edef] hover:bg-[#202c33]/60"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Container */}
      <div className="flex-1 overflow-y-auto bg-[#111b21] p-4.5 space-y-4">
        {activeTab === "stats" && stats && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <h4 className="text-[10px] text-[#8696a0] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-[#00a884]" /> System Metrics Analytics
            </h4>

            {/* Bento Grid layout */}
            <div className="grid grid-cols-2 gap-3.5 select-none">
              <div className="bg-[#202c33] p-4 border border-[#222e35]/50 rounded-2xl shadow-md">
                <Users className="w-5 h-5 text-[#00a884] mb-2" />
                <span className="text-[10px] text-[#8696a0] font-medium block">Total Users</span>
                <span className="text-xl font-extrabold font-mono text-[#e9edef]">{stats.totalUsers}</span>
              </div>

              <div className="bg-[#202c33] p-4 border border-[#222e35]/50 rounded-2xl shadow-md relative overflow-hidden">
                <div className="absolute top-2 right-2 flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </div>
                <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full mb-4.5" />
                <span className="text-[10px] text-[#8696a0] font-medium block">Active Online</span>
                <span className="text-xl font-extrabold font-mono text-[#00a884]">{stats.activeUsers}</span>
              </div>

              <div className="bg-[#202c33] p-4 border border-[#222e35]/50 rounded-2xl shadow-md">
                <MessageSquare className="w-5 h-5 text-blue-400 mb-2" />
                <span className="text-[10px] text-[#8696a0] font-medium block">Total Messages</span>
                <span className="text-xl font-extrabold font-mono text-[#e9edef]">{stats.totalMessages}</span>
              </div>

              <div className="bg-[#202c33] p-4 border border-[#222e35]/50 rounded-2xl shadow-md">
                <PhoneCall className="w-5 h-5 text-violet-400 mb-2" />
                <span className="text-[10px] text-[#8696a0] font-medium block">Total Calls</span>
                <span className="text-xl font-extrabold font-mono text-[#e9edef]">{stats.totalCalls}</span>
              </div>
            </div>

            {/* Alert Panel for active reports */}
            {stats.reportsPending > 0 && (
              <motion.div
                initial={{ scale: 0.95 }}
                animate={{ scale: 1 }}
                className="bg-rose-950/20 border border-rose-500/20 rounded-2xl p-4 flex items-start gap-3.5 select-none shadow-md"
              >
                <AlertOctagon className="w-5 h-5 text-rose-500 shrink-0" />
                <div>
                  <h4 className="text-xs font-bold text-rose-400">Abuse Reports Pending</h4>
                  <p className="text-[10px] text-rose-300/80 leading-normal mt-0.5">
                    There are {stats.reportsPending} active user reports. Access the "Reports" tab to investigate, resolve, or suspend offending accounts.
                  </p>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* User Accounts Admin */}
        {activeTab === "users" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h4 className="text-[10px] text-[#8696a0] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <Users className="w-3.5 h-3.5 text-[#00a884]" /> User Registry ({userList.length})
            </h4>

            <div className="space-y-2">
              {userList.map((usr) => (
                <div
                  key={usr.id}
                  className="bg-[#202c33] border border-[#222e35]/50 p-3.5 rounded-2xl flex flex-col gap-3 shadow-md"
                >
                  <div className="flex items-center gap-3 justify-between">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar
                        src={usr.avatar}
                        name={usr.name}
                        className="w-9 h-9 border border-[#222e35]/60"
                      />
                      <div>
                        <h4 className="text-xs font-semibold text-[#e9edef]">{usr.name}</h4>
                        <span className="text-[9px] text-[#8696a0] font-mono block">{usr.phoneNumber}</span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      {usr.role === "admin" ? (
                        <span className="bg-violet-500/10 border border-violet-500/20 text-violet-400 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Admin
                        </span>
                      ) : (
                        <span className="bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          User
                        </span>
                      )}

                      {usr.online ? (
                        <span className="text-[9px] text-emerald-500 font-bold">• Online</span>
                      ) : (
                        <span className="text-[9px] text-[#8696a0]">• Offline</span>
                      )}
                    </div>
                  </div>

                  {/* Actions buttons */}
                  {usr.id !== currentUser.id && (
                    <div className="flex gap-2 border-t border-[#222e35]/60 pt-2.5 mt-0.5">
                      <button
                        onClick={() => handleToggleSuspend(usr.id)}
                        className={`flex-1 py-1.5 px-3 rounded-xl text-[9px] font-black transition-all uppercase tracking-wider cursor-pointer border ${
                          usr.isSuspended
                            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20"
                            : "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
                        }`}
                      >
                        {usr.isSuspended ? "Reactivate Account" : "Suspend Account"}
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Safety Reports Admin */}
        {activeTab === "reports" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            <h4 className="text-[10px] text-[#8696a0] font-bold uppercase tracking-wider flex items-center gap-1.5 mb-2">
              <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Security & Abuse Reports ({reportList.length})
            </h4>

            {reportList.length > 0 ? (
              <div className="space-y-3">
                {reportList.map((rep) => (
                  <div
                    key={rep.id}
                    className="bg-[#202c33] border border-[#222e35]/50 p-3.5 rounded-2xl space-y-3 shadow-md"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-bold font-mono text-[#8696a0] uppercase">
                        Ticket: {rep.id.slice(0, 8)}
                      </span>
                      {rep.status === "resolved" ? (
                        <span className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                          Resolved
                        </span>
                      ) : (
                        <span className="bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                          Pending
                        </span>
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <span className="text-[10px] text-[#8696a0] block font-medium">
                        Reported Target: <b className="text-[#e9edef]">{rep.reportedUserName}</b>
                      </span>
                      <p className="text-xs text-[#e9edef] italic bg-[#111b21] p-3 rounded-xl border border-[#222e35] select-text leading-relaxed">
                        "{rep.reason}"
                      </p>
                    </div>

                    {/* Actions */}
                    {rep.status === "pending" && (
                      <div className="flex gap-2.5 border-t border-[#222e35]/60 pt-2.5">
                        <button
                          onClick={() => handleResolveReport(rep.id)}
                          className="flex-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[9px] font-black py-1.5 rounded-xl hover:bg-emerald-500/20 transition-all uppercase tracking-wider cursor-pointer"
                        >
                          Mark Resolved
                        </button>
                        <button
                          onClick={() => {
                            handleToggleSuspend(rep.reportedUserId);
                            handleResolveReport(rep.id);
                          }}
                          className="flex-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[9px] font-black py-1.5 rounded-xl hover:bg-rose-500/20 transition-all uppercase tracking-wider cursor-pointer"
                        >
                          Suspend User
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-[#8696a0] italic py-8 text-center bg-[#202c33] border border-[#222e35]/40 rounded-2xl select-none">
                No security abuse reports filed yet.
              </div>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}
