const express = require("express");
const { Pool } = require("pg");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

// ==========================================
// 🛡️ SSL CERTIFICATE & SAFETY FALLBACKS
// ==========================================
// Forces Node.js to trust Aiven's self-signed certificate chain
process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

// Bulletproof fallback: If .env fails, use this key so the app never crashes
const SECRET_KEY =
  process.env.JWT_SECRET || "super_secret_collaboration_key_99";

const app = express();
app.use(cors());
app.use(express.json());

// ==========================================
// 🔌 DATABASE CONNECTION
// ==========================================
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Required to bypass Aiven's TLS requirements
  },
});

const PORT = process.env.PORT || 5003;

// ==========================================
// 🛠️ DATABASE INITIALIZATION MODULE
// ==========================================
const initDB = async () => {
  try {
    // 1. Verify connection and log which database we are secretly connected to
    const checkRes = await pool.query(
      "SELECT current_database(), current_schema();",
    );
    console.log(
      "🔍 Successfully connected to Aiven database:",
      checkRes.rows[0].current_database,
    );

    // 2. Auto-create tables if they don't exist
    await pool.query(`
      CREATE TABLE IF NOT EXISTS collab_users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS workspaces (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        owner_id INTEGER REFERENCES collab_users(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS workspace_members (
        id SERIAL PRIMARY KEY,
        workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES collab_users(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS projects (
        id SERIAL PRIMARY KEY,
        workspace_id INTEGER REFERENCES workspaces(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        status VARCHAR(50) DEFAULT 'To Do',
        assigned_to INTEGER REFERENCES collab_users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("✅ Database tables successfully verified/created.");
  } catch (err) {
    console.error("❌ Database initialization failed:", err.message);
  }
};
initDB();

// ==========================================
// 🛡️ MIDDLEWARE
// ==========================================
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token)
    return res.status(401).json({ error: "Access denied. Token missing." });

  // Using our bulletproof SECRET_KEY here
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err)
      return res.status(403).json({ error: "Invalid or expired token." });
    req.user = user;
    next();
  });
};

// ==========================================
// 🔐 AUTHENTICATION MODULE
// ==========================================

// Register User
app.post("/api/auth/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ error: "All fields are required." });

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO collab_users (name, email, password_hash) VALUES ($1, $2, $3) RETURNING id, name, email, created_at",
      [name, email.toLowerCase().trim(), passwordHash],
    );
    res
      .status(201)
      .json({ message: "Registration successful!", user: result.rows[0] });
  } catch (err) {
    if (err.code === "23505")
      return res.status(400).json({ error: "Email is already registered." });
    console.error("Registration Error:", err);
    res.status(500).json({ error: "Server Database error." });
  }
});

// Login User
app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query(
      "SELECT * FROM collab_users WHERE email = $1",
      [email.toLowerCase().trim()],
    );
    if (result.rows.length === 0)
      return res.status(400).json({ error: "Invalid credentials." });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch)
      return res.status(400).json({ error: "Invalid credentials." });

    // Using our bulletproof SECRET_KEY here to prevent the crash
    const token = jwt.sign(
      { id: user.id, name: user.name, email: user.email },
      SECRET_KEY,
      { expiresIn: "24h" },
    );
    res.json({
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("Login Error:", err);
    res.status(500).json({ error: "Server Database error." });
  }
});

// ==========================================
// 🏢 WORKSPACE MANAGEMENT MODULE
// ==========================================

// Create a Workspace (Sets creator as Owner)
app.post("/api/workspaces", authenticateToken, async (req, res) => {
  const { name, description } = req.body;
  if (!name)
    return res.status(400).json({ error: "Workspace name is required." });

  try {
    const wsResult = await pool.query(
      "INSERT INTO workspaces (name, description, owner_id) VALUES ($1, $2, $3) RETURNING *",
      [name, description, req.user.id],
    );
    const workspace = wsResult.rows[0];

    await pool.query(
      "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)",
      [workspace.id, req.user.id, "owner"],
    );

    res.status(201).json(workspace);
  } catch (err) {
    console.error("Workspace Error:", err);
    res.status(500).json({ error: "Database error while creating workspace." });
  }
});

// Fetch all Workspaces current user belongs to
app.get("/api/workspaces", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT w.*, wm.role FROM workspaces w 
       JOIN workspace_members wm ON w.id = wm.workspace_id 
       WHERE wm.user_id = $1`,
      [req.user.id],
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch Workspaces Error:", err);
    res
      .status(500)
      .json({ error: "Database error while fetching workspaces." });
  }
});

// 🔥 NEW: Update Workspace details (Only accessible by Owner)
app.put("/api/workspaces/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name)
    return res.status(400).json({ error: "Workspace name is required." });

  try {
    const roleCheck = await pool.query(
      "SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
      [id, req.user.id],
    );

    if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== "owner") {
      return res
        .status(403)
        .json({ error: "Only the workspace owner can modify details." });
    }

    const updatedWorkspace = await pool.query(
      "UPDATE workspaces SET name = $1, description = $2 WHERE id = $3 RETURNING *",
      [name, description, id],
    );

    res.json(updatedWorkspace.rows[0]);
  } catch (err) {
    console.error("Update Workspace Error:", err.message);
    res.status(500).json({ error: "Failed to update workspace." });
  }
});

// 🔥 NEW: Delete an entire Workspace (Only accessible by Owner)
app.delete("/api/workspaces/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const roleCheck = await pool.query(
      "SELECT role FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
      [id, req.user.id],
    );

    if (roleCheck.rows.length === 0 || roleCheck.rows[0].role !== "owner") {
      return res
        .status(403)
        .json({ error: "Only the workspace owner can delete this workspace." });
    }

    await pool.query("DELETE FROM workspaces WHERE id = $1", [id]);
    res.json({ success: true, message: "Workspace successfully deleted." });
  } catch (err) {
    console.error("Delete Workspace Error:", err.message);
    res.status(500).json({ error: "Failed to delete workspace." });
  }
});

// ==========================================
// 👥 TEAM & MEMBER MANAGEMENT MODULE
// ==========================================

// Create a Team within a Workspace
app.post(
  "/api/workspaces/:workspaceId/teams",
  authenticateToken,
  async (req, res) => {
    const { workspaceId } = req.params;
    const { name } = req.body;

    try {
      const memberCheck = await pool.query(
        "SELECT * FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
        [workspaceId, req.user.id],
      );
      if (memberCheck.rows.length === 0)
        return res
          .status(403)
          .json({ error: "Unauthorized access to this workspace." });

      const teamResult = await pool.query(
        "INSERT INTO teams (workspace_id, name) VALUES ($1, $2) RETURNING *",
        [workspaceId, name],
      );
      res.status(201).json(teamResult.rows[0]);
    } catch (err) {
      console.error("Team Creation Error:", err);
      res.status(500).json({ error: "Database error while creating team." });
    }
  },
);

// Invite a user to a workspace by their email
app.post(
  "/api/workspaces/:workspaceId/invite",
  authenticateToken,
  async (req, res) => {
    const { workspaceId } = req.params;
    const { email, role } = req.body;

    try {
      // 1. Verify caller has access
      const authCheck = await pool.query(
        "SELECT * FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
        [workspaceId, req.user.id],
      );
      if (authCheck.rows.length === 0)
        return res.status(403).json({ error: "Unauthorized." });

      // 2. Find the target user by email
      const userResult = await pool.query(
        "SELECT id FROM collab_users WHERE email = $1",
        [email.toLowerCase().trim()],
      );
      if (userResult.rows.length === 0)
        return res
          .status(404)
          .json({ error: "User with this email not found." });
      const targetUserId = userResult.rows[0].id;

      // 3. Prevent duplicate invites
      const duplicateCheck = await pool.query(
        "SELECT * FROM workspace_members WHERE workspace_id = $1 AND user_id = $2",
        [workspaceId, targetUserId],
      );
      if (duplicateCheck.rows.length > 0)
        return res
          .status(400)
          .json({ error: "User is already in this workspace." });

      // 4. Add them to the workspace
      await pool.query(
        "INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, $3)",
        [workspaceId, targetUserId, role || "member"],
      );

      res.json({
        success: true,
        message: "User successfully added to the workspace!",
      });
    } catch (err) {
      console.error("Invite Error:", err);
      res.status(500).json({ error: "Failed to invite user." });
    }
  },
);

// ==========================================
// 📁 PROJECT MANAGEMENT MODULE
// ==========================================

// Create a new project inside a workspace
app.post(
  "/api/workspaces/:workspaceId/projects",
  authenticateToken,
  async (req, res) => {
    const { workspaceId } = req.params;
    const { name, description } = req.body;

    try {
      const newProject = await pool.query(
        "INSERT INTO projects (workspace_id, name, description) VALUES ($1, $2, $3) RETURNING *",
        [workspaceId, name, description],
      );
      res.status(201).json(newProject.rows[0]);
    } catch (err) {
      console.error("Create Project Error:", err);
      res.status(500).json({ error: "Failed to create project" });
    }
  },
);

// Get all projects for a workspace
app.get(
  "/api/workspaces/:workspaceId/projects",
  authenticateToken,
  async (req, res) => {
    const { workspaceId } = req.params;
    try {
      const projects = await pool.query(
        "SELECT * FROM projects WHERE workspace_id = $1 ORDER BY created_at DESC",
        [workspaceId],
      );
      res.json(projects.rows);
    } catch (err) {
      console.error("Fetch Projects Error:", err);
      res.status(500).json({ error: "Failed to fetch projects" });
    }
  },
);

// 🔥 NEW: Update an existing project's name or description
app.put("/api/projects/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;

  if (!name)
    return res.status(400).json({ error: "Project name is required." });

  try {
    const result = await pool.query(
      "UPDATE projects SET name = $1, description = $2 WHERE id = $3 RETURNING *",
      [name, description, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found." });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update Project Error:", err.message);
    res.status(500).json({ error: "Failed to update project data." });
  }
});

// Delete a specific project
app.delete("/api/projects/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM projects WHERE id = $1 RETURNING *",
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Project not found." });
    }
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (err) {
    console.error("Delete Project Error:", err.message);
    res
      .status(500)
      .json({ error: "Server database error while deleting project." });
  }
});

// ==========================================
// ✅ TASK MANAGEMENT MODULE
// ==========================================

// 1. Create a Task for a Project
app.post(
  "/api/projects/:projectId/tasks",
  authenticateToken,
  async (req, res) => {
    const { projectId } = req.params;
    const { title, description, status, assigned_to } = req.body;

    try {
      const newTask = await pool.query(
        "INSERT INTO tasks (project_id, title, description, status, assigned_to) VALUES ($1, $2, $3, $4, $5) RETURNING *",
        [projectId, title, description, status || "To Do", assigned_to || null],
      );
      res.status(201).json(newTask.rows[0]);
    } catch (err) {
      console.error("Error creating task:", err.message);
      res.status(500).json({ error: "Failed to create task." });
    }
  },
);

// 2. Get All Tasks for a Specific Project
app.get(
  "/api/projects/:projectId/tasks",
  authenticateToken,
  async (req, res) => {
    const { projectId } = req.params;

    try {
      const tasks = await pool.query(
        "SELECT * FROM tasks WHERE project_id = $1 ORDER BY created_at DESC",
        [projectId],
      );
      res.json(tasks.rows);
    } catch (err) {
      console.error("Error fetching tasks:", err.message);
      res.status(500).json({ error: "Failed to fetch tasks." });
    }
  },
);

// 3. Update a Task's Status (e.g., 'To Do' -> 'In Progress')
app.put("/api/tasks/:taskId/status", authenticateToken, async (req, res) => {
  const { taskId } = req.params;
  const { status } = req.body;

  try {
    const updatedTask = await pool.query(
      "UPDATE tasks SET status = $1 WHERE id = $2 RETURNING *",
      [status, taskId],
    );
    res.json(updatedTask.rows[0]);
  } catch (err) {
    console.error("Error updating task status:", err.message);
    res.status(500).json({ error: "Failed to update task status." });
  }
});

// Delete a specific task
app.delete("/api/tasks/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 RETURNING *",
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Task not found." });
    }
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (err) {
    console.error("Delete Task Error:", err.message);
    res
      .status(500)
      .json({ error: "Server database error while deleting task." });
  }
});

// ==========================================
// 🚀 SERVER START
// ==========================================
app.listen(PORT, () => {
  console.log(`🚀 Task 4 Core Server operating seamlessly on port ${PORT}`);
});
