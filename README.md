<div align="center">

# 📱 WhatsApp Clone Pro

[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socketdotio&logoColor=white)](https://socket.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

<img src="assets/whatsapp_banner.png" alt="WhatsApp Clone Pro Banner" width="100%" style="border-radius: 12px; margin: 20px 0;" />

A modern, production-ready **WhatsApp-inspired real-time messaging application** built with the **MERN Stack** (MongoDB, Express, React, Node.js) and TypeScript. Featuring secure phone number verification, instant socket-driven messaging, group chats, typing indicators, read receipts, media sharing, and a sleek, fully responsive user interface.

[🚀 Explore Features](#-features) • [💻 Tech Stack](#-tech-stack) • [⚙️ Environment Variables](#️-environment-variables) • [🛠️ Getting Started](#-getting-started)

</div>

---

> [!WARNING]  
> **Disclaimer:** This project is inspired by WhatsApp for educational and portfolio purposes only. It is not affiliated with, endorsed by, or associated with WhatsApp, Meta, or any of their partners.

---

## ✨ Features

### 🔐 Authentication & Security
*   **Phone Number Login:** Onboard users seamlessly via their mobile numbers.
*   **Dynamic OTP Verification:** Built-in support for Twilio SMS codes, with auto-fallback to simulated push notifications in development.
*   **Robust Session Management:** Signed **JWT Access Tokens** (24h expiry) and persistent **Refresh Tokens** (30d expiry) stored securely.
*   **Brute-Force Protection:** Automatically locks IP/phone accounts for 15 minutes after 5 consecutive failed OTP entry attempts.

### 💬 Real-Time Messaging & Chat
*   **Instant Message Delivery:** Driven by Socket.io for sub-millisecond real-time communication.
*   **Chat Management:** Start 1-on-1 chats or dynamic group chats, archive chats, pin important chats to the top, and track unread counts.
*   **Status & Feedback:** Real-time **typing indicators**, **delivered receipts** (double checkmarks), and **seen receipts** (blue checkmarks).
*   **Message Controls:** Delete messages for everyone, delete messages for me, forward/reply to messages, star important messages, and react to messages with emojis.

### 🖼️ Rich Media Sharing & Stickers
*   **Any File Type Supported:** Upload images, videos, audio notes, PDFs, Word docs, Excel files, or ZIPs.
*   **Instant Audio Records:** In-app voice message recording and sharing.
*   **Dynamic Sticker Picker:** Animated emoji stickers categorized for fast reaction.

### 👥 Group Conversations
*   **Admin Powers:** Dedicated admin dashboards to add/remove members, promote/demote admins, or update descriptions and group photos.
*   **Member Mentions:** Mention members using `@` tags in group chats.

### 🟢 Status / Stories
*   **Rich Text & Media Stories:** Publish images, videos, or stylized text updates.
*   **24-Hour Auto-Expiry:** Stored statuses expire automatically after 24 hours.
*   **Viewer & Likes Lists:** Keep track of who viewed or liked your status updates.

### 📞 Voice & Video Calls (UI Ready)
*   **WebRTC Ready UI:** Fully-styled calling interfaces including incoming, outgoing, missed call logs, and signal state handshakes.

---

## 💻 Tech Stack

### Frontend Core
*   **Framework:** React 19 (Vite)
*   **Styling:** Tailwind CSS v4 (Glassmorphism & dark mode optimized)
*   **State Management:** Redux Toolkit & React Context
*   **Animations:** Framer Motion / Motion
*   **Networking:** Axios & Socket.io Client

### Backend Core
*   **Runtime & Server:** Node.js, Express, TypeScript (TSX execution)
*   **Database:** Structured JSON file-based database for zero-config fast local runs, mapping mongoose-like schemas.
*   **Security & Encryption:** JWT (jsonwebtoken), Twilio SDK, helmet, cors
*   **Asset Bundling:** ESBuild compiler for production optimization

---

## 📂 Project Architecture

```text
WhatsappClone/
├── assets/                  # Public assets, banners, and logos
├── src/                     # React Frontend Source Code
│   ├── assets/              # Icons, styling, and graphics
│   ├── components/          # Reusable components (ChatWindow, Sidebar, etc.)
│   ├── index.css            # Global styling, Tailwind directives
│   ├── main.tsx             # Application entry point
│   ├── types.ts             # TypeScript interface models
│   └── App.tsx              # Root component & state orchestration
├── server.ts                # Integrated backend API & Socket.io server
├── package.json             # Core dependency manifest
└── .env.example             # Documented local environment settings
```

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory based on the variables below:

```env
# Server Configuration
PORT=3000

# Auth Secrets
JWT_SECRET=super-secret-jwt-key-change-in-production

# Twilio SMS API Credentials (Optional - Bypasses simulated SMS if left empty)
TWILIO_ACCOUNT_SID=your_twilio_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_SENDER_NUMBER=+1234567890
```

---

## 🛠️ Getting Started

### Prerequisites
*   Node.js (v18 or higher)
*   npm (v9 or higher)

### Installation
1.  Clone the repository:
    ```bash
    git clone https://github.com/Adityakumarsahoo/Web-Whatsapp.git
    cd Web-Whatsapp
    ```
2.  Install all dependencies:
    ```bash
    npm install
    ```
3.  Configure your environment:
    Create a `.env` file in the root directory and specify your configurations (or use default mock credentials).

### Running in Development
Start the integrated server (Vite frontend + Express backend):
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡️ Security Best Practices
*   **Lockout Mechanisms:** Protection against automated brute force OTP attacks.
*   **CORS & Helmet:** Strictly configured headers to prevent cross-origin scripting and frame hijacking.
*   **Token Refresh Rotations:** Secure HTTP credentials renewal using access and refresh tokens.

---

## 📄 License
This project is licensed under the **MIT License** - see the LICENSE details.

---

## ✍️ Author
Created with ❤️ by **Aditya Kumar Sahoo**  
*Full Stack Developer | React | Node.js | TypeScript | MERN*
