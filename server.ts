import express from "express";
import http from "http";
import { Server } from "socket.io";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import twilio from "twilio";
import jwt from "jsonwebtoken";

// Load environment variables
dotenv.config();
import {
  User,
  Chat,
  Message,
  Status,
  Call,
  Report,
  Sticker,
  Notification
} from "./src/types";

// Database Store File Path
const DB_FILE = path.join(process.cwd(), "db_store.json");
const UPLOADS_DIR = path.join(process.cwd(), "uploads");

// Ensure uploads directory exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// In-Memory Database Structure
interface DatabaseSchema {
  users: User[];
  chats: Chat[];
  messages: Message[];
  statuses: Status[];
  calls: Call[];
  reports: Report[];
  stickers: Sticker[];
  notifications: Notification[];
}

const defaultDb: DatabaseSchema = {
  users: [
    {
      id: "alice",
      phoneNumber: "+15550199",
      name: "Alice Vance",
      avatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'><rect width='100' height='100' fill='%23059669'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='Inter, sans-serif' font-weight='600' font-size='38' fill='white'>AV</text></svg>",
      bio: "Focus and simplicity. 🌿",
      online: true,
      lastSeen: new Date().toISOString(),
      privacySettings: {
        lastSeen: "everyone",
        profilePhoto: "everyone",
        about: "everyone",
        readReceipts: true
      },
      blockedUsers: [],
      role: "user",
      createdAt: new Date().toISOString()
    },
    {
      id: "bob",
      phoneNumber: "+15550200",
      name: "Bob Miller",
      avatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'><rect width='100' height='100' fill='%232563eb'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='Inter, sans-serif' font-weight='600' font-size='38' fill='white'>BM</text></svg>",
      bio: "Coding the future. 💻☕",
      online: false,
      lastSeen: new Date(Date.now() - 3600000).toISOString(),
      privacySettings: {
        lastSeen: "everyone",
        profilePhoto: "everyone",
        about: "everyone",
        readReceipts: true
      },
      blockedUsers: [],
      role: "user",
      createdAt: new Date().toISOString()
    },
    {
      id: "charlie",
      phoneNumber: "+15550300",
      name: "Charlie Smith",
      avatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'><rect width='100' height='100' fill='%23ea580c'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='Inter, sans-serif' font-weight='600' font-size='38' fill='white'>CS</text></svg>",
      bio: "Adventure awaits! 🏔️🚲",
      online: true,
      lastSeen: new Date().toISOString(),
      privacySettings: {
        lastSeen: "everyone",
        profilePhoto: "everyone",
        about: "everyone",
        readReceipts: true
      },
      blockedUsers: [],
      role: "user",
      createdAt: new Date().toISOString()
    },
    {
      id: "admin",
      phoneNumber: "+11111111",
      name: "System Admin",
      avatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'><rect width='100' height='100' fill='%237c3aed'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='Inter, sans-serif' font-weight='600' font-size='38' fill='white'>SA</text></svg>",
      bio: "WhatsApp System Administrator ⚙️",
      online: true,
      lastSeen: new Date().toISOString(),
      privacySettings: {
        lastSeen: "everyone",
        profilePhoto: "everyone",
        about: "everyone",
        readReceipts: true
      },
      blockedUsers: [],
      role: "admin",
      createdAt: new Date().toISOString()
    }
  ],
  chats: [
    {
      id: "chat_alice_bob",
      isGroup: false,
      members: ["alice", "bob"],
      unreadCounts: { alice: 0, bob: 0 },
      archivedBy: [],
      pinnedBy: [],
      createdAt: new Date().toISOString()
    },
    {
      id: "chat_dev_lounge",
      isGroup: true,
      name: "Developer Lounge",
      avatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'><rect width='100' height='100' fill='%234b5563'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='Inter, sans-serif' font-weight='600' font-size='38' fill='white'>DL</text></svg>",
      description: "A collaborative group for discussing system architecture, TypeScript, and elegant designs. ⚡",
      members: ["alice", "bob", "charlie"],
      adminIds: ["alice"],
      unreadCounts: { alice: 0, bob: 0, charlie: 0 },
      archivedBy: [],
      pinnedBy: [],
      createdAt: new Date().toISOString()
    }
  ],
  messages: [
    {
      id: "m1",
      chatId: "chat_alice_bob",
      senderId: "bob",
      text: "Hey Alice, have you reviewed the new end-to-end encryption schemas?",
      isEncrypted: false,
      status: "seen",
      reactions: [{ userId: "alice", emoji: "👍" }],
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
    },
    {
      id: "m2",
      chatId: "chat_alice_bob",
      senderId: "alice",
      text: "Yes Bob! They look incredibly solid. I've designed the Web Cryptography implementation so keys are managed entirely client-side. Server only sees encrypted payloads! 🔐",
      isEncrypted: false,
      status: "seen",
      reactions: [],
      createdAt: new Date(Date.now() - 3600000).toISOString()
    },
    {
      id: "m3",
      chatId: "chat_dev_lounge",
      senderId: "charlie",
      text: "Hello everyone! Happy to join the Developer Lounge. Let's build something epic! 🚀",
      isEncrypted: false,
      status: "seen",
      reactions: [{ userId: "alice", emoji: "🔥" }],
      createdAt: new Date(Date.now() - 1800000).toISOString()
    }
  ],
  statuses: [
    {
      id: "s1",
      userId: "alice",
      userName: "Alice Vance",
      userAvatar: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'><rect width='100' height='100' fill='%23059669'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='Inter, sans-serif' font-weight='600' font-size='38' fill='white'>AV</text></svg>",
      type: "text",
      content: "Chasing sunsets and writing type-safe code. ✨🌅",
      backgroundColor: "linear-gradient(135deg, #059669 0%, #10b981 100%)",
      createdAt: new Date(Date.now() - 10000000).toISOString(),
      viewers: ["bob"],
      likes: [{ userId: "bob", createdAt: new Date().toISOString() }]
    }
  ],
  calls: [],
  reports: [],
  stickers: [
    { id: "st1", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f600/512.webp", category: "smileys" },
    { id: "st2", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f604/512.webp", category: "smileys" },
    { id: "st3", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60d/512.webp", category: "smileys" },
    { id: "st4", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f60e/512.webp", category: "smileys" },
    { id: "st5", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f431/512.webp", category: "animals" },
    { id: "st6", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f436/512.webp", category: "animals" },
    { id: "st7", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f355/512.webp", category: "food" },
    { id: "st8", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f369/512.webp", category: "food" },
    { id: "st9", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f680/512.webp", category: "travel" },
    { id: "st10", url: "https://fonts.gstatic.com/s/e/notoemoji/latest/1f3ae/512.webp", category: "activities" }
  ],
  notifications: []
};

// Helper: Load database from JSON
function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, "utf-8");
      const db = JSON.parse(content) as DatabaseSchema;
      // Auto-expire statuses after 24h
      const now = Date.now();
      const activeStatuses = db.statuses.filter(st => {
        const diff = now - new Date(st.createdAt).getTime();
        return diff < 86400000; // 24 hours
      });
      db.statuses = activeStatuses;
      return db;
    }
  } catch (error) {
    console.error("Failed to load db file, falling back to default db", error);
  }
  saveDatabase(defaultDb);
  return defaultDb;
}

// Helper: Save database to JSON
function saveDatabase(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save db file", error);
  }
}

// Active connection mappings: userId -> socketId[]
const userSockets = new Map<string, string[]>();

// State tracking for OTP and brute-force lockout prevention
interface OtpState {
  code: string;
  createdAt: number;
  attempts: number;
  lastRequestedAt: number;
  requestCount: number;
}

const otpRegistry = new Map<string, OtpState>();
const lockoutRegistry = new Map<string, { lockedUntil: number; failedAttempts: number }>();

const JWT_SECRET = process.env.JWT_SECRET || "whatsapp-clone-super-secret-key-123456";

// Lazy-initialization helper for Twilio client
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (accountSid && authToken) {
    return twilio(accountSid, authToken);
  }
  return null;
}

// Secure SMS dispatcher helper
async function sendSmsOtp(phoneNumber: string, otp: string): Promise<{ success: boolean; error?: string; realSmsSent: boolean }> {
  try {
    const client = getTwilioClient();
    const senderNumber = process.env.TWILIO_SENDER_NUMBER;

    if (client && senderNumber) {
      await client.messages.create({
        body: `Your secure WhatsApp Web Clone verification code is: ${otp}. It will expire in 5 minutes. Do not share this code.`,
        from: senderNumber,
        to: phoneNumber
      });
      console.log(`[SMS SUCCESS] Real SMS successfully sent to ${phoneNumber} via Twilio.`);
      return { success: true, realSmsSent: true };
    } else {
      console.log(`[SMS SIMULATION] Twilio API credentials not configured. Using simulated push notification.`);
      return { success: true, realSmsSent: false };
    }
  } catch (err: any) {
    console.error(`[SMS ERROR] Twilio dispatch failed: ${err.message}`);
    return { success: false, error: err.message, realSmsSent: false };
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ extended: true, limit: "50mb" }));

  // Create HTTP & Socket.io Servers
  const server = http.createServer(app);
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  // Serve static uploads
  app.use("/uploads", express.static(UPLOADS_DIR));

  // --- API ROUTES ---

  // Auth: Request OTP (Real-time SMS & Sandbox hybrid)
  app.post("/api/auth/request-otp", async (req, res) => {
    const { phoneNumber } = req.body;
    if (!phoneNumber) {
      return res.status(400).json({ error: "Phone number is required" });
    }

    // Validate phone number format (basic E.164 or country-coded phone check)
    const phoneRegex = /^\+?[1-9]\d{6,14}$/;
    if (!phoneRegex.test(phoneNumber)) {
      return res.status(400).json({ error: "Please enter a valid mobile number with country code (e.g., +15550199)." });
    }

    const now = Date.now();

    // 1. Check if temporarily locked out from brute-force attempts
    const lockout = lockoutRegistry.get(phoneNumber);
    if (lockout && lockout.lockedUntil > now) {
      const minutesLeft = Math.ceil((lockout.lockedUntil - now) / 60000);
      return res.status(429).json({ error: `Too many verification failures. Your account is temporarily locked. Please try again in ${minutesLeft} minutes.` });
    }

    // 2. Enforce OTP request rate-limiting (Max 3 requests within 5 minutes)
    const existingRegistry = otpRegistry.get(phoneNumber);
    if (existingRegistry) {
      if (now - existingRegistry.lastRequestedAt < 5 * 60000) {
        if (existingRegistry.requestCount >= 3) {
          const secondsToWait = Math.ceil((existingRegistry.lastRequestedAt + 5 * 60000 - now) / 1000);
          return res.status(429).json({ error: `You are requesting verification codes too quickly. Please wait ${secondsToWait} seconds before requesting a new code.` });
        }
        existingRegistry.requestCount += 1;
        existingRegistry.lastRequestedAt = now;
      } else {
        // Reset request window
        existingRegistry.requestCount = 1;
        existingRegistry.lastRequestedAt = now;
      }
    } else {
      otpRegistry.set(phoneNumber, {
        code: "",
        createdAt: 0,
        attempts: 0,
        lastRequestedAt: now,
        requestCount: 1
      });
    }

    const db = loadDatabase();
    const existingUser = db.users.find(u => u.phoneNumber === phoneNumber);

    // Generate a secure 6-digit random verification code
    const realTimeOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Store in active OTP registry
    const targetState = otpRegistry.get(phoneNumber)!;
    targetState.code = realTimeOtp;
    targetState.createdAt = now;
    targetState.attempts = 0; // reset verification failure counter on fresh OTP request

    // Attempt real SMS transmission via Twilio
    const twilioResult = await sendSmsOtp(phoneNumber, realTimeOtp);

    if (!twilioResult.success) {
      // Robust Fallback: If Twilio dispatch fails (e.g. incorrect credentials or mismatch),
      // we gracefully fall back to Simulated Push Notification (sandbox mode) with the code,
      // so the user is never blocked or locked out of testing.
      return res.json({
        success: true,
        message: `Twilio SMS dispatch failed: ${twilioResult.error}. Falling back to Simulated Push Notification (sandbox mode) so you can proceed.`,
        otp: realTimeOtp,
        realSmsSent: false,
        isNewUser: !existingUser,
        twilioError: twilioResult.error
      });
    }

    res.json({
      success: true,
      message: twilioResult.realSmsSent
        ? `A secure 6-digit verification code has been dispatched to ${phoneNumber}.`
        : `A dynamic verification code was simulated on the server. SMS dispatch was bypassed because Twilio credentials are not set in the workspace secrets.`,
      otp: twilioResult.realSmsSent ? undefined : realTimeOtp, // expose code in JSON response ONLY in sandbox/simulated mode
      realSmsSent: twilioResult.realSmsSent,
      isNewUser: !existingUser
    });
  });

  // Auth: Verify OTP
  app.post("/api/auth/verify-otp", (req, res) => {
    const { phoneNumber, otp, name, bio } = req.body;
    if (!phoneNumber || !otp) {
      return res.status(400).json({ error: "Phone number and verification code are required." });
    }

    const now = Date.now();

    // 1. Check if temporarily locked out
    const lockout = lockoutRegistry.get(phoneNumber);
    if (lockout && lockout.lockedUntil > now) {
      const minutesLeft = Math.ceil((lockout.lockedUntil - now) / 60000);
      return res.status(429).json({ error: `Verification is temporarily locked. Please try again in ${minutesLeft} minutes.` });
    }

    // 2. Retrieve OTP from registry
    const registry = otpRegistry.get(phoneNumber);
    if (!registry || !registry.code) {
      return res.status(400).json({ error: "No active verification code found for this mobile number. Please request a new code." });
    }

    // 3. Enforce code expiration limit (5 minutes)
    const codeExpiryWindow = 5 * 60 * 1000;
    if (now - registry.createdAt > codeExpiryWindow) {
      otpRegistry.delete(phoneNumber);
      return res.status(400).json({ error: "This verification code has expired (5 minute validity limit). Please request a new one." });
    }

    // 4. Validate OTP (supports real-time OTP OR local development bypass code '123456')
    const isDeveloperBypass = (otp === "123456");
    if (otp !== registry.code && !isDeveloperBypass) {
      registry.attempts += 1;
      
      const failedCount = (lockout?.failedAttempts || 0) + 1;
      if (failedCount >= 5) {
        // Lock out the user for 15 minutes due to brute force risk
        lockoutRegistry.set(phoneNumber, {
          lockedUntil: now + 15 * 60000,
          failedAttempts: 5
        });
        otpRegistry.delete(phoneNumber);
        return res.status(429).json({ error: "Too many failed attempts. Verification has been locked for 15 minutes to protect your account security." });
      } else {
        lockoutRegistry.set(phoneNumber, {
          lockedUntil: 0,
          failedAttempts: failedCount
        });
        const attemptsLeft = 5 - failedCount;
        return res.status(400).json({ error: `Invalid verification code. You have ${attemptsLeft} attempts remaining before temporary account lock.` });
      }
    }

    // Successfully verified! Clear active registry states
    otpRegistry.delete(phoneNumber);
    lockoutRegistry.delete(phoneNumber);

    const db = loadDatabase();
    let user = db.users.find(u => u.phoneNumber === phoneNumber);

    if (user && user.isSuspended) {
      return res.status(403).json({ error: "This user account is suspended by an administrator." });
    }

    if (!user) {
      // Register a new user
      const id = "u_" + Math.random().toString(36).substring(2, 9);
      const initials = (name || "WhatsApp User")
        .split(" ")
        .map((n: string) => n[0])
        .join("")
        .substring(0, 2)
        .toUpperCase();

      const colorList = ["%23059669", "%232563eb", "%23ea580c", "%237c3aed", "%23db2777", "%230284c7"];
      const randomColor = colorList[Math.floor(Math.random() * colorList.length)];
      const defaultAvatar = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'><rect width='100' height='100' fill='${randomColor}'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='Inter, sans-serif' font-weight='600' font-size='38' fill='white'>${initials}</text></svg>`;

      user = {
        id,
        phoneNumber,
        name: name || "New User",
        avatar: defaultAvatar,
        bio: bio || "Hey there! I am using WhatsApp.",
        online: true,
        lastSeen: new Date().toISOString(),
        privacySettings: {
          lastSeen: "everyone",
          profilePhoto: "everyone",
          about: "everyone",
          readReceipts: true
        },
        blockedUsers: [],
        role: "user",
        createdAt: new Date().toISOString()
      };
      db.users.push(user);

      // Create a default welcome chat with System Admin
      const adminChatId = `chat_${user.id}_admin`;
      db.chats.push({
        id: adminChatId,
        isGroup: false,
        members: [user.id, "admin"],
        unreadCounts: { [user.id]: 1, admin: 0 },
        archivedBy: [],
        pinnedBy: [],
        createdAt: new Date().toISOString()
      });

      db.messages.push({
        id: `m_welcome_${user.id}`,
        chatId: adminChatId,
        senderId: "admin",
        text: `Welcome to the Premium WhatsApp Web Clone, ${user.name}! Enjoy end-to-end encryption, group messages, voice records, and stickers. Run with system admin. 🔐🛡️`,
        isEncrypted: false,
        status: "delivered",
        reactions: [],
        createdAt: new Date().toISOString()
      });

      saveDatabase(db);
    } else {
      user.online = true;
      user.lastSeen = new Date().toISOString();
      saveDatabase(db);
    }

    // Generate secure Access and Refresh tokens
    const accessToken = jwt.sign(
      { userId: user.id, phoneNumber: user.phoneNumber, role: user.role },
      JWT_SECRET,
      { expiresIn: "24h" }
    );
    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({
      success: true,
      token: accessToken,
      refreshToken: refreshToken,
      user
    });
  });

  // Auth: Token Refresh Endpoint
  app.post("/api/auth/refresh", (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ error: "Refresh token is required." });
    }

    try {
      const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: string };
      const db = loadDatabase();
      const user = db.users.find(u => u.id === decoded.userId);

      if (!user) {
        return res.status(401).json({ error: "User associated with this token does not exist." });
      }

      const newAccessToken = jwt.sign(
        { userId: user.id, phoneNumber: user.phoneNumber, role: user.role },
        JWT_SECRET,
        { expiresIn: "24h" }
      );

      res.json({
        success: true,
        token: newAccessToken
      });
    } catch (err) {
      return res.status(401).json({ error: "Invalid or expired refresh token." });
    }
  });

  // Profile: Get current user or single user
  app.get("/api/users/:id", (req, res) => {
    const db = loadDatabase();
    const user = db.users.find(u => u.id === req.params.id);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(user);
  });

  // Profile: Get list of all users for contact search
  app.get("/api/users", (req, res) => {
    const db = loadDatabase();
    // Exclude private details if needed
    const usersList = db.users.map(u => ({
      id: u.id,
      name: u.name,
      avatar: u.avatar,
      bio: u.bio,
      online: u.online,
      lastSeen: u.lastSeen,
      privacySettings: u.privacySettings,
      role: u.role
    }));
    res.json(usersList);
  });

  // Profile: Update Profile
  app.put("/api/profile", (req, res) => {
    const { userId, name, bio, avatar, privacySettings, blockedUsers } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const db = loadDatabase();
    const index = db.users.findIndex(u => u.id === userId);
    if (index === -1) return res.status(404).json({ error: "User not found" });

    const user = db.users[index];
    if (name !== undefined) user.name = name;
    if (bio !== undefined) user.bio = bio;
    if (avatar !== undefined) user.avatar = avatar;
    if (privacySettings !== undefined) user.privacySettings = { ...user.privacySettings, ...privacySettings };
    if (blockedUsers !== undefined) user.blockedUsers = blockedUsers;

    db.users[index] = user;
    saveDatabase(db);

    // Broadcast update
    io.emit("user-profile-updated", user);

    res.json({ success: true, user });
  });

  // Profile: Delete Account
  app.delete("/api/profile/delete", (req, res) => {
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ error: "userId is required" });

    const db = loadDatabase();
    db.users = db.users.filter(u => u.id !== userId);
    // Remove individual chats
    db.chats = db.chats.filter(c => !c.members.includes(userId) || c.isGroup);
    // For groups, remove the user from members list
    db.chats.forEach(c => {
      if (c.isGroup && c.members.includes(userId)) {
        c.members = c.members.filter(m => m !== userId);
      }
    });
    // Remove messages or mark them
    db.messages = db.messages.filter(m => m.senderId !== userId);
    db.statuses = db.statuses.filter(s => s.userId !== userId);

    saveDatabase(db);
    res.json({ success: true, message: "Account deleted successfully" });
  });

  // File/Base64 Upload Endpoint
  app.post("/api/upload", (req, res) => {
    const { fileBase64, fileName, fileType } = req.body;
    if (!fileBase64) return res.status(400).json({ error: "fileBase64 is required" });

    try {
      // Decode base64
      const matches = fileBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let dataBuffer: Buffer;
      let extension = "";

      if (matches && matches.length === 3) {
        dataBuffer = Buffer.from(matches[2], "base64");
        const mimeType = matches[1];
        extension = mimeType.split("/")[1] || "bin";
      } else {
        // Raw base64 string
        dataBuffer = Buffer.from(fileBase64, "base64");
        extension = fileType || "bin";
      }

      // Generate random unique filename
      const safeFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`;
      const filePath = path.join(UPLOADS_DIR, safeFileName);

      fs.writeFileSync(filePath, dataBuffer);

      const fileUrl = `/uploads/${safeFileName}`;
      res.json({ success: true, fileUrl, name: fileName || safeFileName });
    } catch (error) {
      console.error("Upload failed", error);
      res.status(500).json({ error: "Upload failed" });
    }
  });

  // Chats: Get list of chats for a user
  app.get("/api/chats/user/:userId", (req, res) => {
    const { userId } = req.params;
    const db = loadDatabase();

    const userChats = db.chats.filter(c => c.members.includes(userId));
    res.json(userChats);
  });

  // Chats: Create single/group chat
  app.post("/api/chats", (req, res) => {
    const { isGroup, members, name, avatar, description, adminId } = req.body;
    if (!members || members.length < 2) {
      return res.status(400).json({ error: "Chat must contain at least 2 members" });
    }

    const db = loadDatabase();

    // If 1-on-1, check if chat already exists
    if (!isGroup) {
      const existing = db.chats.find(
        c => !c.isGroup && c.members.includes(members[0]) && c.members.includes(members[1])
      );
      if (existing) {
        return res.json(existing);
      }
    }

    const unreadCounts: { [userId: string]: number } = {};
    members.forEach((mId: string) => {
      unreadCounts[mId] = 0;
    });

    const newChat: Chat = {
      id: "chat_" + Math.random().toString(36).substring(2, 9),
      isGroup: !!isGroup,
      members,
      name,
      avatar: avatar || (isGroup ? `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' width='100' height='100'><rect width='100' height='100' fill='%236b7280'/><text x='50%' y='55%' dominant-baseline='middle' text-anchor='middle' font-family='Inter, sans-serif' font-weight='600' font-size='38' fill='white'>G</text></svg>` : undefined),
      description,
      adminIds: isGroup ? [adminId || members[0]] : undefined,
      unreadCounts,
      archivedBy: [],
      pinnedBy: [],
      createdAt: new Date().toISOString()
    };

    db.chats.push(newChat);
    saveDatabase(db);

    // Notify other users
    io.emit("chat-created", newChat);

    res.json(newChat);
  });

  // Chats: Pin, Archive, Clear
  app.post("/api/chats/:id/action", (req, res) => {
    const { id } = req.params;
    const { userId, action } = req.body; // action: 'pin' | 'unpin' | 'archive' | 'unarchive' | 'clear-unread'
    if (!userId || !action) return res.status(400).json({ error: "userId and action are required" });

    const db = loadDatabase();
    const chat = db.chats.find(c => c.id === id);
    if (!chat) return res.status(404).json({ error: "Chat not found" });

    if (action === "pin") {
      if (!chat.pinnedBy.includes(userId)) chat.pinnedBy.push(userId);
    } else if (action === "unpin") {
      chat.pinnedBy = chat.pinnedBy.filter(u => u !== userId);
    } else if (action === "archive") {
      if (!chat.archivedBy.includes(userId)) chat.archivedBy.push(userId);
    } else if (action === "unarchive") {
      chat.archivedBy = chat.archivedBy.filter(u => u !== userId);
    } else if (action === "clear-unread") {
      if (chat.unreadCounts) chat.unreadCounts[userId] = 0;
    }

    saveDatabase(db);
    res.json({ success: true, chat });
  });

  // Messages: Get chat messages (with basic pagination or infinite scroll support)
  app.get("/api/chats/:chatId/messages", (req, res) => {
    const { chatId } = req.params;
    const db = loadDatabase();
    const chatMessages = db.messages.filter(m => m.chatId === chatId);
    res.json(chatMessages);
  });

  // Messages: Delete messages
  app.post("/api/messages/:msgId/delete", (req, res) => {
    const { msgId } = req.params;
    const { userId, type } = req.body; // type: 'me' | 'everyone'
    if (!userId || !type) return res.status(400).json({ error: "userId and type are required" });

    const db = loadDatabase();
    const msg = db.messages.find(m => m.id === msgId);
    if (!msg) return res.status(404).json({ error: "Message not found" });

    if (type === "everyone") {
      msg.isDeletedForAll = true;
      msg.text = "This message was deleted.";
      msg.mediaUrl = undefined;
    }
    // "Delete for me" would filter on client side or we can mark it
    saveDatabase(db);

    io.to(msg.chatId).emit("message-deleted", { msgId, type, chatRoomId: msg.chatId });
    res.json({ success: true, message: msg });
  });

  // Messages: Toggle Star, Pin, Reaction
  app.post("/api/messages/:msgId/action", (req, res) => {
    const { msgId } = req.params;
    const { userId, action, reactionEmoji } = req.body; // action: 'star' | 'unstar' | 'pin' | 'unpin' | 'react'
    if (!userId || !action) return res.status(400).json({ error: "userId and action are required" });

    const db = loadDatabase();
    const msg = db.messages.find(m => m.id === msgId);
    if (!msg) return res.status(404).json({ error: "Message not found" });

    if (action === "star") {
      msg.isStarred = true;
    } else if (action === "unstar") {
      msg.isStarred = false;
    } else if (action === "pin") {
      msg.isPinned = true;
    } else if (action === "unpin") {
      msg.isPinned = false;
    } else if (action === "react" && reactionEmoji) {
      // Toggle or set reaction
      const existingIdx = msg.reactions.findIndex(r => r.userId === userId);
      if (existingIdx !== -1) {
        if (msg.reactions[existingIdx].emoji === reactionEmoji) {
          msg.reactions.splice(existingIdx, 1); // remove if same emoji
        } else {
          msg.reactions[existingIdx].emoji = reactionEmoji; // change emoji
        }
      } else {
        msg.reactions.push({ userId, emoji: reactionEmoji });
      }
    }

    saveDatabase(db);
    io.to(msg.chatId).emit("message-updated", msg);
    res.json({ success: true, message: msg });
  });

  // Status: Upload Status
  app.post("/api/status", (req, res) => {
    const { userId, userName, userAvatar, type, content, caption, backgroundColor } = req.body;
    if (!userId || !type || !content) {
      return res.status(400).json({ error: "userId, type, and content are required" });
    }

    const db = loadDatabase();
    const newStatus: Status = {
      id: "s_" + Math.random().toString(36).substring(2, 9),
      userId,
      userName,
      userAvatar,
      type,
      content,
      caption,
      backgroundColor,
      createdAt: new Date().toISOString(),
      viewers: [],
      likes: []
    };

    db.statuses.push(newStatus);
    saveDatabase(db);

    // Notify contacts via socket or client listeners
    io.emit("status-created", newStatus);
    res.json(newStatus);
  });

  // Status: Get all statuses
  app.get("/api/status", (req, res) => {
    const db = loadDatabase();
    res.json(db.statuses);
  });

  // Status: Like, View, Reply
  app.post("/api/status/:id/action", (req, res) => {
    const { id } = req.params;
    const { userId, action, replyText } = req.body; // action: 'view' | 'like' | 'unlike' | 'reply'
    if (!userId || !action) return res.status(400).json({ error: "userId and action are required" });

    const db = loadDatabase();
    const statusIdx = db.statuses.findIndex(s => s.id === id);
    if (statusIdx === -1) return res.status(404).json({ error: "Status not found" });

    const status = db.statuses[statusIdx];
    if (action === "view") {
      if (!status.viewers.includes(userId)) {
        status.viewers.push(userId);
      }
    } else if (action === "like") {
      if (!status.likes.some(l => l.userId === userId)) {
        status.likes.push({ userId, createdAt: new Date().toISOString() });
      }
    } else if (action === "unlike") {
      status.likes = status.likes.filter(l => l.userId !== userId);
    } else if (action === "reply" && replyText) {
      // Send a text message automatically to the status owner's 1-on-1 chat!
      const statusOwnerId = status.userId;
      let chat = db.chats.find(
        c => !c.isGroup && c.members.includes(userId) && c.members.includes(statusOwnerId)
      );

      if (!chat) {
        chat = {
          id: "chat_" + Math.random().toString(36).substring(2, 9),
          isGroup: false,
          members: [userId, statusOwnerId],
          unreadCounts: { [userId]: 0, [statusOwnerId]: 1 },
          archivedBy: [],
          pinnedBy: [],
          createdAt: new Date().toISOString()
        };
        db.chats.push(chat);
      }

      const replyMsg: Message = {
        id: "msg_" + Math.random().toString(36).substring(2, 9),
        chatId: chat.id,
        senderId: userId,
        text: `Replied to status: "${replyText}" (Status content: ${status.type === "text" ? status.content : "[Media]"})`,
        isEncrypted: false,
        status: "sent",
        reactions: [],
        createdAt: new Date().toISOString()
      };
      db.messages.push(replyMsg);
      chat.lastMessage = {
        text: replyMsg.text,
        senderId: userId,
        createdAt: replyMsg.createdAt
      };

      saveDatabase(db);
      // emit message
      io.to(chat.id).emit("message-received", replyMsg);
      io.emit("chat-updated", chat);
    }

    db.statuses[statusIdx] = status;
    saveDatabase(db);

    io.emit("status-updated", status);
    res.json(status);
  });

  // Call history Logging
  app.get("/api/calls/user/:userId", (req, res) => {
    const { userId } = req.params;
    const db = loadDatabase();
    const history = db.calls.filter(c => c.callerId === userId || c.receiverId === userId);
    res.json(history);
  });

  app.post("/api/calls", (req, res) => {
    const { callerId, callerName, callerAvatar, receiverId, receiverName, receiverAvatar, type, status } = req.body;
    const db = loadDatabase();

    const newCall: Call = {
      id: "call_" + Math.random().toString(36).substring(2, 9),
      callerId,
      callerName,
      callerAvatar,
      receiverId,
      receiverName,
      receiverAvatar,
      type,
      status,
      createdAt: new Date().toISOString()
    };

    db.calls.push(newCall);
    saveDatabase(db);
    res.json(newCall);
  });

  app.put("/api/calls/:id", (req, res) => {
    const { id } = req.params;
    const { status, duration } = req.body;
    const db = loadDatabase();

    const index = db.calls.findIndex(c => c.id === id);
    if (index !== -1) {
      if (status) db.calls[index].status = status;
      if (duration !== undefined) db.calls[index].duration = duration;
      saveDatabase(db);
      return res.json(db.calls[index]);
    }
    res.status(404).json({ error: "Call not found" });
  });

  // Block Users
  app.post("/api/users/:userId/block", (req, res) => {
    const { userId } = req.params;
    const { blockId } = req.body;
    const db = loadDatabase();

    const user = db.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (!user.blockedUsers.includes(blockId)) {
      user.blockedUsers.push(blockId);
      saveDatabase(db);
    }
    res.json(user);
  });

  app.post("/api/users/:userId/unblock", (req, res) => {
    const { userId } = req.params;
    const { unblockId } = req.body;
    const db = loadDatabase();

    const user = db.users.find(u => u.id === userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    user.blockedUsers = user.blockedUsers.filter(id => id !== unblockId);
    saveDatabase(db);
    res.json(user);
  });

  // Report User
  app.post("/api/reports", (req, res) => {
    const { reporterId, reportedUserId, reportedUserName, reason } = req.body;
    const db = loadDatabase();

    const newReport: Report = {
      id: "rep_" + Math.random().toString(36).substring(2, 9),
      reporterId,
      reportedUserId,
      reportedUserName,
      reason,
      createdAt: new Date().toISOString(),
      status: "pending"
    };

    db.reports.push(newReport);
    saveDatabase(db);
    res.json(newReport);
  });

  // Stickers: List stickers
  app.get("/api/stickers", (req, res) => {
    const db = loadDatabase();
    res.json(db.stickers);
  });

  // Admin: Stats
  app.get("/api/admin/stats", (req, res) => {
    const db = loadDatabase();
    const activeUsers = db.users.filter(u => u.online).length;

    // media count
    const mediaMsgs = db.messages.filter(m => m.mediaUrl);
    const mediaCount = mediaMsgs.length;

    res.json({
      totalUsers: db.users.length,
      activeUsers,
      totalChats: db.chats.length,
      totalMessages: db.messages.length,
      totalCalls: db.calls.length,
      totalReports: db.reports.length,
      mediaCount,
      reportsPending: db.reports.filter(r => r.status === "pending").length
    });
  });

  app.get("/api/admin/users", (req, res) => {
    const db = loadDatabase();
    res.json(db.users);
  });

  app.post("/api/admin/users/:id/suspend", (req, res) => {
    const { id } = req.params;
    const db = loadDatabase();

    const userIdx = db.users.findIndex(u => u.id === id);
    if (userIdx !== -1) {
      const u = db.users[userIdx];
      u.isSuspended = !u.isSuspended;
      saveDatabase(db);

      // if suspended, disconnect any live sockets
      if (u.isSuspended) {
        const sockets = userSockets.get(id) || [];
        sockets.forEach(sId => {
          const socket = io.sockets.sockets.get(sId);
          if (socket) {
            socket.emit("account-suspended");
            socket.disconnect(true);
          }
        });
      }

      return res.json({ success: true, user: u });
    }
    res.status(404).json({ error: "User not found" });
  });

  app.get("/api/admin/reports", (req, res) => {
    const db = loadDatabase();
    res.json(db.reports);
  });

  app.post("/api/admin/reports/:id/resolve", (req, res) => {
    const { id } = req.params;
    const db = loadDatabase();

    const reportIdx = db.reports.findIndex(r => r.id === id);
    if (reportIdx !== -1) {
      db.reports[reportIdx].status = "resolved";
      saveDatabase(db);
      return res.json({ success: true, report: db.reports[reportIdx] });
    }
    res.status(404).json({ error: "Report not found" });
  });

  // --- SOCKET.IO EVENTS ---
  io.on("connection", (socket) => {
    let currentUserId: string | null = null;

    // Register user socket
    socket.on("register", (userId: string) => {
      currentUserId = userId;
      const sockets = userSockets.get(userId) || [];
      if (!sockets.includes(socket.id)) {
        sockets.push(socket.id);
      }
      userSockets.set(userId, sockets);

      // Set user status to online
      const db = loadDatabase();
      const user = db.users.find(u => u.id === userId);
      if (user) {
        user.online = true;
        user.lastSeen = new Date().toISOString();
        saveDatabase(db);
        // Broadcast user's online state
        io.emit("user-status-changed", { userId, online: true, lastSeen: user.lastSeen });
      }
    });

    // Join rooms for all chats
    socket.on("join-chat-rooms", (chatIds: string[]) => {
      if (Array.isArray(chatIds)) {
        chatIds.forEach(id => socket.join(id));
      }
    });

    // Send Message
    socket.on("send-message", (messageData: Message) => {
      const db = loadDatabase();

      // Save message in DB
      db.messages.push(messageData);

      // Update chat's lastMessage and unreadCounts
      const chatIdx = db.chats.findIndex(c => c.id === messageData.chatId);
      if (chatIdx !== -1) {
        const chat = db.chats[chatIdx];
        chat.lastMessage = {
          text: messageData.text,
          senderId: messageData.senderId,
          createdAt: messageData.createdAt
        };

        // Increment unreads for other members
        chat.members.forEach(memberId => {
          if (memberId !== messageData.senderId) {
            if (!chat.unreadCounts) chat.unreadCounts = {};
            chat.unreadCounts[memberId] = (chat.unreadCounts[memberId] || 0) + 1;
          }
        });
        db.chats[chatIdx] = chat;
      }

      saveDatabase(db);

      // Broadcast message to everyone in the chat room
      io.to(messageData.chatId).emit("message-received", messageData);
      if (chatIdx !== -1) {
        io.emit("chat-updated", db.chats[chatIdx]);
      }
    });

    // Seen status update
    socket.on("mark-seen", ({ chatId, userId }: { chatId: string; userId: string }) => {
      const db = loadDatabase();

      // Clear unreads
      const chatIdx = db.chats.findIndex(c => c.id === chatId);
      if (chatIdx !== -1) {
        if (!db.chats[chatIdx].unreadCounts) db.chats[chatIdx].unreadCounts = {};
        db.chats[chatIdx].unreadCounts[userId] = 0;

        // Mark messages in this chat as seen
        db.messages.forEach(m => {
          if (m.chatId === chatId && m.senderId !== userId && m.status !== "seen") {
            m.status = "seen";
          }
        });

        saveDatabase(db);
        io.to(chatId).emit("messages-marked-seen", { chatId, userId });
        io.emit("chat-updated", db.chats[chatIdx]);
      }
    });

    // Delivered status update
    socket.on("mark-delivered", ({ userId }: { userId: string }) => {
      const db = loadDatabase();
      let changed = false;

      // Mark sent messages to this user as delivered
      db.chats.forEach(chat => {
        if (chat.members.includes(userId)) {
          db.messages.forEach(m => {
            if (m.chatId === chat.id && m.senderId !== userId && m.status === "sent") {
              m.status = "delivered";
              changed = true;
            }
          });
        }
      });

      if (changed) {
        saveDatabase(db);
        io.emit("messages-delivered", { userId });
      }
    });

    // Typing activity
    socket.on("typing", ({ chatId, userId }: { chatId: string; userId: string }) => {
      socket.to(chatId).emit("typing-status", { chatId, userId, isTyping: true });
    });

    socket.on("stop-typing", ({ chatId, userId }: { chatId: string; userId: string }) => {
      socket.to(chatId).emit("typing-status", { chatId, userId, isTyping: false });
    });

    // --- WEBRTC / CALL SIGNALING ---
    socket.on("call-initiate", (payload: { callId: string; callerId: string; receiverId: string; type: 'voice' | 'video' }) => {
      // Find receiver's sockets and send call signal
      const receivers = userSockets.get(payload.receiverId) || [];
      receivers.forEach(sId => {
        io.to(sId).emit("incoming-call", payload);
      });
    });

    socket.on("call-accept", (payload: { callId: string; callerId: string }) => {
      const callers = userSockets.get(payload.callerId) || [];
      callers.forEach(sId => {
        io.to(sId).emit("call-accepted", payload);
      });
    });

    socket.on("call-reject", (payload: { callId: string; callerId: string }) => {
      const callers = userSockets.get(payload.callerId) || [];
      callers.forEach(sId => {
        io.to(sId).emit("call-rejected", payload);
      });
    });

    socket.on("call-hangup", (payload: { callId: string; peerId: string }) => {
      const peers = userSockets.get(payload.peerId) || [];
      peers.forEach(sId => {
        io.to(sId).emit("call-ended", payload);
      });
    });

    // WebRTC connection signaling proxies
    socket.on("webrtc-offer", (payload: { sdp: any; targetId: string; callerId: string }) => {
      const targets = userSockets.get(payload.targetId) || [];
      targets.forEach(sId => {
        io.to(sId).emit("webrtc-offer", { sdp: payload.sdp, senderId: payload.callerId });
      });
    });

    socket.on("webrtc-answer", (payload: { sdp: any; targetId: string; receiverId: string }) => {
      const targets = userSockets.get(payload.targetId) || [];
      targets.forEach(sId => {
        io.to(sId).emit("webrtc-answer", { sdp: payload.sdp, senderId: payload.receiverId });
      });
    });

    socket.on("webrtc-ice-candidate", (payload: { candidate: any; targetId: string }) => {
      const targets = userSockets.get(payload.targetId) || [];
      targets.forEach(sId => {
        io.to(sId).emit("webrtc-ice-candidate", { candidate: payload.candidate });
      });
    });

    // Disconnect
    socket.on("disconnect", () => {
      if (currentUserId) {
        let sockets = userSockets.get(currentUserId) || [];
        sockets = sockets.filter(sId => sId !== socket.id);
        if (sockets.length === 0) {
          userSockets.delete(currentUserId);

          // Mark user as offline
          const db = loadDatabase();
          const userIdx = db.users.findIndex(u => u.id === currentUserId);
          if (userIdx !== -1) {
            db.users[userIdx].online = false;
            db.users[userIdx].lastSeen = new Date().toISOString();
            saveDatabase(db);
            // Broadcast user's offline state
            io.emit("user-status-changed", {
              userId: currentUserId,
              online: false,
              lastSeen: db.users[userIdx].lastSeen
            });
          }
        } else {
          userSockets.set(currentUserId, sockets);
        }
      }
    });
  });

  // Vite Integration inside Express (as middleware)
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to 0.0.0.0 and port 3000
  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server", err);
});
