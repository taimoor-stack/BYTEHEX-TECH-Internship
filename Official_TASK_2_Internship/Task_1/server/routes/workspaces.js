import express from "express";
import { query } from "../db.js";

const router = express.Router();

// Helper to safely parse integer IDs
const parseId = (val) => {
  const parsed = parseInt(val, 10);
  return isNaN(parsed) ? null : parsed;
};

// 1. Get ALL workspaces for shared collaboration
router.get("/", async (req, res) => {
  try {
    const result = await query(
      `SELECT id, title, content, owner_id AS "ownerId", 
              updated_at AS "updatedAt", created_at AS "createdAt" 
       FROM workspaces 
       ORDER BY updated_at DESC`,
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Fetch Workspaces Error:", err);
    res
      .status(500)
      .json({ message: "Error fetching workspaces", error: err.message });
  }
});

// 2. Get a SINGLE workspace by ID
router.get("/:id", async (req, res) => {
  const workspaceId = parseId(req.params.id);
  if (!workspaceId) {
    return res.status(400).json({ message: "Invalid workspace ID" });
  }

  try {
    const result = await query(
      `SELECT id, title, content, owner_id AS "ownerId", 
              updated_at AS "updatedAt", created_at AS "createdAt" 
       FROM workspaces 
       WHERE id = $1`,
      [workspaceId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Fetch Workspace By ID Error:", err);
    res
      .status(500)
      .json({ message: "Error fetching workspace", error: err.message });
  }
});

// 3. Create a new workspace (Fail-safe against Foreign Key errors)
router.post("/", async (req, res) => {
  const { title, ownerId } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: "Workspace title is required" });
  }

  let safeOwnerId = parseId(ownerId);

  try {
    // Check if the user actually exists in PostgreSQL before linking foreign key
    if (safeOwnerId) {
      const userCheck = await query("SELECT id FROM users WHERE id = $1", [
        safeOwnerId,
      ]);
      if (userCheck.rows.length === 0) {
        safeOwnerId = null; // Fallback to null if user doesn't exist in DB
      }
    }

    const result = await query(
      `INSERT INTO workspaces (title, content, owner_id) 
       VALUES ($1, $2, $3) 
       RETURNING id, title, content, owner_id AS "ownerId", 
                 updated_at AS "updatedAt", created_at AS "createdAt"`,
      [title.trim(), "", safeOwnerId],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("❌ Create Workspace Error:", err.message);
    res
      .status(500)
      .json({ message: "Error creating workspace", error: err.message });
  }
});

// 4. Update Workspace (Handles Title, Content, or Both)
router.put("/:id", async (req, res) => {
  const workspaceId = parseId(req.params.id);
  const { title, content } = req.body;

  if (!workspaceId) {
    return res.status(400).json({ message: "Invalid workspace ID" });
  }

  try {
    let result;
    if (title && content !== undefined) {
      // Update both
      result = await query(
        `UPDATE workspaces 
         SET title = $1, content = $2, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $3 
         RETURNING id, title, content, owner_id AS "ownerId", 
                   updated_at AS "updatedAt", created_at AS "createdAt"`,
        [title.trim(), content, workspaceId],
      );
    } else if (title) {
      // Update title only
      result = await query(
        `UPDATE workspaces 
         SET title = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING id, title, content, owner_id AS "ownerId", 
                   updated_at AS "updatedAt", created_at AS "createdAt"`,
        [title.trim(), workspaceId],
      );
    } else if (content !== undefined) {
      // Update content only
      result = await query(
        `UPDATE workspaces 
         SET content = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING id, title, content, owner_id AS "ownerId", 
                   updated_at AS "updatedAt", created_at AS "createdAt"`,
        [content, workspaceId],
      );
    } else {
      return res.status(400).json({ message: "Nothing to update" });
    }

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update Workspace Error:", err);
    res
      .status(500)
      .json({ message: "Error updating workspace", error: err.message });
  }
});

// 5. Delete a workspace
router.delete("/:id", async (req, res) => {
  const workspaceId = parseId(req.params.id);

  if (!workspaceId) {
    return res.status(400).json({ message: "Invalid workspace ID" });
  }

  try {
    const result = await query(
      "DELETE FROM workspaces WHERE id = $1 RETURNING id",
      [workspaceId],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Workspace not found" });
    }
    res.json({ message: "Workspace deleted successfully", id: workspaceId });
  } catch (err) {
    console.error("Delete Workspace Error:", err);
    res
      .status(500)
      .json({ message: "Error deleting workspace", error: err.message });
  }
});

export default router;
