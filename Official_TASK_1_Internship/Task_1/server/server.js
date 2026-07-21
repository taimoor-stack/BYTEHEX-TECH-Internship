//node server.js (starts backend)
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

// Import your existing route files
const authRoutes = require("./auth");
const courseRoutes = require("./courses");
const studentRoutes = require("./students");
const assignmentRoutes = require("./assignments");
const quizRoutes = require("./quizzes");
const progressRoutes = require("./progress");

const app = express();
app.use(cors());
app.use(express.json());

// Aiven PostgreSQL Database Connection
const pool = new Pool({
  host: "pg-11211046-taimsheikh085-b6ce.l.aivencloud.com",
  user: "avnadmin",
  password: "AVNS_FDfeXOy9pNfF3xZ4zpc",
  database: "defaultdb",
  port: 10359,
  ssl: { rejectUnauthorized: false },
});

// Test connection
pool.connect((err) => {
  if (err) console.error("Database connection error:", err.message);
  else console.log("Successfully connected to Aiven PostgreSQL!");
});

// ---------------------------------------------
// GET ROUTE: Dashboard Stats
// ---------------------------------------------
app.get("/api/stats", async (req, res) => {
  try {
    // Count rows in different tables
    const coursesCount = await pool.query("SELECT COUNT(*) FROM courses");
    // If you have a 'students' table, add a query for it too!
    // const studentsCount = await pool.query("SELECT COUNT(*) FROM students");

    res.json({
      totalCourses: parseInt(coursesCount.rows[0].count),
      // totalStudents: parseInt(studentsCount.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// ASSIGNMENT API ROUTES
// ==========================================

app.get("/api/assignments", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT assignments.*, courses.title AS course_title 
      FROM assignments 
      LEFT JOIN courses ON assignments.course_id = courses.id
      ORDER BY assignments.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error fetching assignments" });
  }
});

app.post("/api/assignments", async (req, res) => {
  try {
    const { title, description, course_id, due_date } = req.body;
    const result = await pool.query(
      "INSERT INTO assignments (title, description, course_id, due_date) VALUES ($1, $2, $3, $4) RETURNING *",
      [title, description, course_id || null, due_date || null],
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error adding assignment" });
  }
});

app.delete("/api/assignments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM assignments WHERE id = $1", [id]);
    res.json({ message: "Assignment deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error deleting assignment" });
  }
});

// ==========================================
// QUIZ API ROUTES
// ==========================================

app.get("/api/quizzes", async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT quizzes.*, courses.title AS course_title 
      FROM quizzes 
      LEFT JOIN courses ON quizzes.course_id = courses.id
      ORDER BY quizzes.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error fetching quizzes" });
  }
});

app.post("/api/quizzes", async (req, res) => {
  try {
    const { title, course_id, total_marks } = req.body;
    const result = await pool.query(
      "INSERT INTO quizzes (title, course_id, total_marks) VALUES ($1, $2, $3) RETURNING *",
      [title, course_id || null, total_marks || 0],
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error adding quiz" });
  }
});

app.delete("/api/quizzes/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM quizzes WHERE id = $1", [id]);
    res.json({ message: "Quiz deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error deleting quiz" });
  }
});

// ==========================================
// STUDENT API ROUTES
// ==========================================

// GET: Fetch all students
app.get("/api/students", async (req, res) => {
  try {
    // We use a JOIN here to also get the name of the course the student is enrolled in
    const result = await pool.query(`
      SELECT students.*, courses.title AS course_title 
      FROM students 
      LEFT JOIN courses ON students.course_id = courses.id
      ORDER BY students.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error fetching students" });
  }
});

// POST: Add a new student
app.post("/api/students", async (req, res) => {
  try {
    const { name, email, course_id } = req.body;
    const result = await pool.query(
      "INSERT INTO students (name, email, course_id) VALUES ($1, $2, $3) RETURNING *",
      [name, email, course_id || null], // If no course is selected, it defaults to null
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error adding student" });
  }
});

// DELETE: Remove a student
app.delete("/api/students/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query("DELETE FROM students WHERE id = $1", [id]);
    res.json({ message: "Student deleted successfully" });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Server error deleting student" });
  }
});

// ---------------------------------------------
// COURSE ROUTES (Connected to Database)
// ---------------------------------------------

app.get("/api/courses", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM courses ORDER BY id ASC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/courses", async (req, res) => {
  const { title, description, instructor } = req.body;
  try {
    const query =
      "INSERT INTO courses (title, description, instructor) VALUES ($1, $2, $3) RETURNING *";
    const result = await pool.query(query, [title, description, instructor]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/courses/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM courses WHERE id = $1", [req.params.id]);
    res.json({ message: "Course deleted successfully!" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/api/courses/:id", async (req, res) => {
  const { title, description, instructor } = req.body;
  try {
    const query =
      "UPDATE courses SET title = $1, description = $2, instructor = $3 WHERE id = $4 RETURNING *";
    const result = await pool.query(query, [
      title,
      description,
      instructor,
      req.params.id,
    ]);
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Other App Routes
app.use("/api/auth", authRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/assignments", assignmentRoutes);
app.use("/api/quizzes", quizRoutes);
app.use("/api/progress", progressRoutes);

const PORT = 5001;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
