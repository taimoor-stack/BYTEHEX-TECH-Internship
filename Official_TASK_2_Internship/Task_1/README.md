# 🚀 CollabSpace — Real-Time Collaborative Workspace Engine

> **ByteHex Tech Summer Camp Internship — Task #1**

CollabSpace is a modern, full-stack collaborative workspace platform built to manage real-time team documents, workspace permissions, user profiles with dynamic avatar rendering, and document version histories.

---

## 📌 Features

### 🔐 Authentication & Security

- **JWT-Based Authentication:** Secure user signup, login, and session persistence.
- **Token Authorization Header Sync:** Seamless authorization token resolution across localStorage and headers.
- **Protected Routes & Actions:** Restricts workspace editing and document manipulation to verified users.

### 📄 Workspace & Document Engine

- **Interactive Workspaces:** Create, view, edit, and organize workspace documents.
- **Version History Tracking:** Modal-driven document versioning to view, inspect, and revert historical changes.
- **Collaborative Sharing:** Workspace sharing modal configured for team collaboration.

### 👥 Team & User Directory

- **Dynamic Team Directory:** Live overview of registered workspace members.
- **Universal User Badges:** Responsive user pills displaying uploaded avatars or clean capitalized fallback initials (`T`, `U`).
- **Profile Management:** Instant avatar uploads (base64/image URLs) with live header and team card updates.

---

## 🛠️ Tech Stack

### Frontend

- **Framework:** React.js (Vite)
- **Styling:** Modular inline styles & CSS-in-JS design system
- **HTTP Client:** Axios (custom API handler with dynamic baseURL resolution)
- **Icons:** Inline UI components & SVG icons

### Backend

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL (with `pg` Pool driver)
- **Authentication:** JSON Web Tokens (`jsonwebtoken`) & `bcrypt` password hashing

---

## 📂 Project Structure

```text
Task_1/
├── client/                     # React Frontend App
│   ├── public/
│   ├── src/
│   │   ├── api.js              # Axios configuration & interceptors
│   │   ├── App.jsx             # Main Shell & UserManagementView
│   │   ├── Auth.jsx            # Authentication views (Login/Register)
│   │   ├── Profile.jsx         # User profile & avatar management
│   │   ├── Workspace.jsx       # Document editor & workspace canvas
│   │   ├── ShareModal.jsx      # Workspace sharing dialog
│   │   └── VersionHistoryModal.jsx # Document version history modal
│   └── package.json
│
└── server/                     # Express Backend API
    ├── index.js                # Server entry point & Express routes
    ├── db.js                   # PostgreSQL connection pool
    ├── .env                    # Environment configuration
    └── package.json
```

## 🗄️ Database Schema Overview

-- Users Table
CREATE TABLE users (
id SERIAL PRIMARY KEY,
name VARCHAR(255) NOT NULL,
email VARCHAR(255) UNIQUE NOT NULL,
password VARCHAR(255) NOT NULL,
avatar TEXT,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Workspaces / Documents Table
CREATE TABLE workspaces (
id SERIAL PRIMARY KEY,
title VARCHAR(255) NOT NULL,
content TEXT,
owner_id INT REFERENCES users(id) ON DELETE CASCADE,
created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
