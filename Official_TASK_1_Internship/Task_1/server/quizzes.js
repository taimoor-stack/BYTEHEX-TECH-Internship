const express = require("express");
const router = express.Router();

// Temporary in-memory data for quizzes and student attempts
const quizzes = [
  {
    id: 1,
    courseId: 1,
    title: "React Basics Quiz",
    questions: [
      { id: 101, question: "What is React?", answer: "A JavaScript library" },
      { id: 102, question: "What is JSX?", answer: "A syntax extension" },
    ],
  },
];

const attempts = [];

// 1. GET ALL QUIZZES FOR A COURSE
router.get("/course/:courseId", (req, res) => {
  const courseId = parseInt(req.params.courseId);
  const courseQuizzes = quizzes.filter((q) => q.courseId === courseId);
  res.json(courseQuizzes);
});

// 2. SUBMIT A QUIZ ATTEMPT (Student Action)
router.post("/:quizId/attempt", (req, res) => {
  const quizId = parseInt(req.params.quizId);
  const { studentId, score } = req.body;

  if (!studentId || score === undefined) {
    return res.status(400).send("Student ID and score are required.");
  }

  const newAttempt = {
    id: attempts.length + 1,
    quizId,
    studentId,
    score,
    date: new Date().toISOString(),
  };

  attempts.push(newAttempt);
  res.status(201).json({
    message: "Quiz submitted successfully!",
    result: newAttempt,
  });
});

module.exports = router;
