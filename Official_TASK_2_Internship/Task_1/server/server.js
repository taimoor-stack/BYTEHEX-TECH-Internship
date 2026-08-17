import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import http from "http";
import { Server } from "socket.io";
import { query } from "./db.js";

import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import workspaceRoutes from "./routes/workspaces.js";

dotenv.config();

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

// Essential Middlewares
// 1. Fixed CORS issue: cannot use origin "*" with credentials: true
app.use(cors({ origin: true, credentials: true }));

// 2. Fixed JSON payload limit for Base64 profile avatar uploads
app.use(express.json({ limit: "10mb" }));

// Route Mounts
app.use("/api/auth", authRoutes);
app.use("/api/workspaces", workspaceRoutes);
app.use("/api/users", userRoutes);

// Socket.IO Setup
const io = new Server(server, {
  cors: { origin: "*", methods: ["GET", "POST"] },
});

const activeWorkspaceUsers = new Map();

io.on("connection", (socket) => {
  let currentWorkspaceId = null;

  socket.on("join-workspace", ({ workspaceId, user }) => {
    if (!workspaceId) return;

    if (currentWorkspaceId && currentWorkspaceId !== workspaceId) {
      socket.leave(`workspace-${currentWorkspaceId}`);
      removeUserFromWorkspace(currentWorkspaceId, socket.id);
      broadcastWorkspaceUsers(currentWorkspaceId);
    }

    currentWorkspaceId = workspaceId;
    socket.join(`workspace-${workspaceId}`);

    if (!activeWorkspaceUsers.has(workspaceId)) {
      activeWorkspaceUsers.set(workspaceId, new Map());
    }

    activeWorkspaceUsers.get(workspaceId).set(socket.id, {
      socketId: socket.id,
      userId: user?.id || user?._id || null,
      name: user?.name || "Anonymous",
      email: user?.email || "",
    });

    broadcastWorkspaceUsers(workspaceId);
  });

  socket.on("send-content-change", ({ workspaceId, content }) => {
    if (workspaceId) {
      socket
        .to(`workspace-${workspaceId}`)
        .emit("receive-content-change", content);
    }
  });

  socket.on("send-cursor-position", ({ workspaceId, cursor }) => {
    if (workspaceId) {
      socket.to(`workspace-${workspaceId}`).emit("receive-cursor-position", {
        socketId: socket.id,
        cursor,
      });
    }
  });

  socket.on("save-document", async ({ workspaceId, content }) => {
    if (!workspaceId) return;
    try {
      await query(
        `UPDATE workspaces SET content = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [content, workspaceId],
      );
    } catch (err) {
      console.error("Auto-save error:", err.message);
    }
  });

  socket.on("disconnect", () => {
    if (currentWorkspaceId) {
      removeUserFromWorkspace(currentWorkspaceId, socket.id);
      broadcastWorkspaceUsers(currentWorkspaceId);
    }
  });

  function removeUserFromWorkspace(workspaceId, socketId) {
    const roomUsers = activeWorkspaceUsers.get(workspaceId);
    if (roomUsers) {
      roomUsers.delete(socketId);
      if (roomUsers.size === 0) activeWorkspaceUsers.delete(workspaceId);
    }
  }

  function broadcastWorkspaceUsers(workspaceId) {
    const roomUsers = activeWorkspaceUsers.get(workspaceId);
    const usersList = roomUsers ? Array.from(roomUsers.values()) : [];
    io.to(`workspace-${workspaceId}`).emit(
      "workspace-users-updated",
      usersList,
    );
  }
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
