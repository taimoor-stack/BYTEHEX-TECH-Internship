const express = require("express");
const router = express.Router();

// Temporary in-memory arrays
const assignments = [
  {
    id: 1,
    courseId: 1,
    title: "Build a React Component",
    dueDate: "2026-06-25",
  },
];
const submissions = [];

// 1. GET ALL ASSIGNMENTS FOR A COURSE
router.get("/course/:courseId", (req, res) => {
  const courseId = parseInt(req.params.courseId);
  const courseAssignments = assignments.filter((a) => a.courseId === courseId);
  res.json(courseAssignments);
});

// 2. SUBMIT AN ASSIGNMENT (Student Action)
router.post("/:assignmentId/submit", (req, res) => {
  const assignmentId = parseInt(req.params.assignmentId);
  const { studentId, submissionLink } = req.body;

  if (!studentId || !submissionLink) {
    return res.status(400).send("Student ID and Submission Link are required.");
  }

  const newSubmission = {
    id: submissions.length + 1,
    assignmentId,
    studentId,
    submissionLink,
    status: "Submitted - Pending Grading",
  };

  submissions.push(newSubmission);
  res.status(201).json({
    message: "Assignment submitted successfully!",
    submission: newSubmission,
  });
});

module.exports = router;
