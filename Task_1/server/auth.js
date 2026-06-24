const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// Temporary "in-memory" database for testing
const users = [];

// REGISTER ROUTE
router.post("/register", async (req, res) => {
  const { username, password, role } = req.body;

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = { username, password: hashedPassword, role };
  users.push(newUser);

  res.status(201).send("User registered successfully!");
});

// LOGIN ROUTE
router.post("/login", async (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username);

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(400).send("Invalid credentials");
  }

  // Create a token
  const token = jwt.sign(
    { username: user.username, role: user.role },
    "SECRET_KEY",
  );
  res.json({ token });
});

module.exports = router;
