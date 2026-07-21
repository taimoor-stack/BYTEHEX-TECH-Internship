// --- ENTERPRISE E-COMMERCE BACKEND ---
// node server.js (to run the server)

const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// --- NEW: IMPORTS FOR FILE UPLOAD ---
const multer = require("multer");
const path = require("path");
const fs = require("fs");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// --- NEW: SERVE UPLOADS FOLDER STATICALLY ---
// This acts as a mini web-server just for your images
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- NEW: MULTER STORAGE CONFIGURATION ---
// Automatically create the "uploads" folder if it doesn't exist
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Tell multer where to put files and how to name them securely
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    // Add a unique timestamp so images with the same name don't overwrite each other
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// JWT Secret Key (In a real app, this goes in a hidden .env file)
const JWT_SECRET = "enterprise_mega_secret_key_2026";

// DATABASE CONNECTION
const pool = new Pool({
  user: "avnadmin",
  password: "AVNS_FDfeXOy9pNfF3xZ4zpc",
  host: "pg-11211046-taimsheikh085-b6ce.l.aivencloud.com",
  port: 10359,
  database: "defaultdb",
  ssl: {
    rejectUnauthorized: false,
  },
});

// Test Database Connection
pool.connect((err) => {
  if (err) {
    console.error("Database connection error:", err.message);
  } else {
    console.log("Successfully connected to Aiven PostgreSQL!");
  }
});

app.get("/", (req, res) => {
  res.send("Enterprise E-Commerce API is running...");
});

// ==========================================
// NEW: FILE UPLOAD ROUTE
// ==========================================
app.post("/api/upload", upload.single("image"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "No image file provided" });
  }
  // Construct the URL where the frontend can view this newly saved image
  const imageUrl = `http://localhost:5002/uploads/${req.file.filename}`;
  res.json({ imageUrl });
});

// ==========================================
// PRODUCT MANAGEMENT ROUTES
// ==========================================

app.get("/api/products", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM products ORDER BY created_at DESC",
    );
    res.status(200).json(result.rows);
  } catch (err) {
    console.error("Error fetching products:", err.message);
    res.status(500).json({ error: "Server error fetching products" });
  }
});

app.post("/api/products", async (req, res) => {
  try {
    const { name, description, price, category, stock_quantity, image_url } =
      req.body;
    if (!name || !price) {
      return res
        .status(400)
        .json({ error: "Product name and price are required" });
    }
    const result = await pool.query(
      "INSERT INTO products (name, description, price, category, stock_quantity, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
      [name, description, price, category, stock_quantity || 0, image_url],
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Error adding product:", err.message);
    res.status(500).json({ error: "Server error adding product" });
  }
});

app.put("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, price, category, stock_quantity, image_url } =
      req.body;

    const updateProduct = await pool.query(
      "UPDATE products SET name = $1, description = $2, price = $3, category = $4, stock_quantity = $5, image_url = $6 WHERE id = $7 RETURNING *",
      [name, description, price, category, stock_quantity, image_url, id],
    );
    if (updateProduct.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json(updateProduct.rows[0]);
  } catch (err) {
    console.error("Error updating product:", err.message);
    res.status(500).send("Server Error updating product");
  }
});

app.delete("/api/products/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deleteProduct = await pool.query(
      "DELETE FROM products WHERE id = $1 RETURNING *",
      [id],
    );
    if (deleteProduct.rows.length === 0) {
      return res.status(404).json({ error: "Product not found" });
    }
    res.json({ message: "Product successfully deleted!" });
  } catch (err) {
    console.error("Error deleting product:", err.message);
    res.status(500).send("Server Error deleting product");
  }
});

// ==========================================
// USER AUTHENTICATION ROUTES
// ==========================================

// 1. Register a New User
app.post("/api/auth/register", async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Please provide name, email, and password." });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const userRole = role || "customer";

    const result = await pool.query(
      "INSERT INTO users (name, email, password_hash, role) VALUES ($1, $2, $3, $4) RETURNING id, name, email, role",
      [name, email, passwordHash, userRole],
    );

    // Generate a token right after registration so they are automatically logged in
    const token = jwt.sign(
      { id: result.rows[0].id, role: result.rows[0].role },
      JWT_SECRET,
      { expiresIn: "24h" },
    );

    res.status(201).json({ token, user: result.rows[0] });
  } catch (err) {
    if (err.code === "23505") {
      return res
        .status(400)
        .json({ error: "An account with this email already exists." });
    }
    console.error("Registration error:", err.message);
    res.status(500).json({ error: "Server error creating user account." });
  }
});

// 2. Login Route
app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Please enter all fields" });
    }

    // Check if user exists
    const userResult = await pool.query(
      "SELECT * FROM users WHERE email = $1",
      [email],
    );
    if (userResult.rows.length === 0) {
      return res
        .status(400)
        .json({ error: "Invalid email or password credentials" });
    }

    const user = userResult.rows[0];

    // Validate password against hashed password in database
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res
        .status(400)
        .json({ error: "Invalid email or password credentials" });
    }

    // Generate passport token
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
      expiresIn: "24h",
    });

    // Send back token and user info (excluding password hash)
    res.json({
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    res.status(500).json({ error: "Server error during login." });
  }
});

// Start Server
const PORT = 5002;
app.listen(PORT, () => {
  console.log(`E-Commerce Backend running on port ${PORT}`);
});
