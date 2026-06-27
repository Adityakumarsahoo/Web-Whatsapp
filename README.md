# WhatsApp Clone Pro

A modern, production-ready **WhatsApp-inspired real-time messaging application** built with the **MERN Stack**. It provides secure phone number authentication, instant messaging, media sharing, group chats, real-time notifications, and a premium responsive user interface.

> **Disclaimer:** This project is inspired by WhatsApp for educational and portfolio purposes only. It is not affiliated with, endorsed by, or associated with WhatsApp or Meta.

---

# Features

## Authentication

* Phone Number Login
* Real SMS OTP Verification (Firebase Authentication / Twilio / MSG91)
* JWT Authentication
* Refresh Tokens
* Auto Login
* Secure Logout
* Session Persistence

---

## User Profile

* Profile Picture
* Display Name
* About/Bio
* Online Status
* Last Seen
* Read Receipts
* Privacy Settings
* Block Users
* Delete Account

---

## Real-Time Chat

* One-to-One Messaging
* Instant Message Delivery
* Typing Indicator
* Seen Status
* Delivered Status
* Reply to Messages
* Forward Messages
* Delete for Everyone
* Delete for Me
* Pin Messages
* Starred Messages
* Search Messages

---

## Media Sharing

* Images
* Videos
* Voice Messages
* Audio Files
* PDF Documents
* Word Files
* Excel Files
* ZIP Files
* Any Supported File Type
* Image Preview
* Video Preview

---

## Stickers & Emojis

* Emoji Picker
* Animated Stickers
* Favorite Stickers
* Recent Stickers
* Sticker Categories

---

## Group Chat

* Create Groups
* Group Admin Controls
* Add Members
* Remove Members
* Group Description
* Group Photo
* Mentions
* Group Notifications

---

## Status

* Text Status
* Image Status
* Video Status
* 24-Hour Expiry
* Viewers List
* Reply to Status

---

## Notifications

* Real-Time Notifications
* Browser Notifications
* Message Alerts
* Group Alerts
* Mention Notifications

---

## Calls (UI Ready)

* Voice Call Interface
* Video Call Interface
* Incoming Calls
* Outgoing Calls
* Missed Calls

---

## Search

* Search Users
* Search Chats
* Search Messages
* Search Groups
* Search Files

---

## Settings

* Light Theme
* Dark Theme
* Chat Wallpaper
* Notification Settings
* Language
* Font Size
* Storage Usage

---

# Tech Stack

## Frontend

* React.js (Vite)
* Tailwind CSS
* Redux Toolkit
* React Router DOM
* Axios
* Socket.io Client
* Framer Motion
* React Hook Form
* React Hot Toast

## Backend

* Node.js
* Express.js
* MongoDB
* Mongoose
* Socket.io
* JWT
* Bcrypt
* Multer
* Cloudinary
* Firebase Authentication
* Nodemailer

---

# Project Structure

```text
WhatsappClone/

│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── layouts/
│   │   ├── hooks/
│   │   ├── context/
│   │   ├── redux/
│   │   ├── services/
│   │   ├── utils/
│   │   ├── routes/
│   │   ├── styles/
│   │   └── App.jsx
│
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/
│   ├── sockets/
│   ├── uploads/
│   ├── utils/
│   └── server.js
│
├── README.md
└── .env
```

---

# Security

* JWT Authentication
* Refresh Tokens
* Password Hashing
* HTTPS Ready
* Helmet
* CORS
* Express Rate Limiter
* Input Validation
* XSS Protection
* MongoDB Sanitization
* Secure Cookies

---

# Performance

* Lazy Loading
* Infinite Scrolling
* Optimized Database Queries
* Image Optimization
* Pagination
* Code Splitting
* Production Build Optimization

---

# Deployment

## Frontend

* Vercel

## Backend

* Render

## Database

* MongoDB Atlas

## Media Storage

* Cloudinary

## Authentication

* Firebase Authentication

---

# Environment Variables

## Backend

```env
PORT=
MONGO_URI=
JWT_SECRET=
JWT_REFRESH_SECRET=
FIREBASE_API_KEY=
FIREBASE_PROJECT_ID=
FIREBASE_APP_ID=
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLIENT_URL=
```

## Frontend

```env
VITE_API_URL=
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

---

# Future Enhancements

* End-to-End Encryption
* Voice & Video Calling (WebRTC)
* AI Chat Assistant
* AI Message Translation
* Message Scheduling
* Auto Reply
* Multi-Device Synchronization
* Chat Backup & Restore
* Desktop Application (Electron)
* Progressive Web App (PWA)

---

# License

This project is licensed under the **MIT License**.

---

# Author

**Aditya Kumar Sahoo**

**Full Stack Developer | MERN Stack | Java | Spring Boot | React | Node.js | MongoDB**

Built with ❤️ for learning, portfolio, and production-level development.
