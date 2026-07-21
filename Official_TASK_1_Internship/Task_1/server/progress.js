const express = require("express");
const router = express.Router();

// Temporary in-memory progress data
const studentProgress = [
  {
    studentId: 1,
    courseId: 1,
    completedLessons: 2,
    totalLessons: 5,
    completionPercentage: 40,
  },
];

// 1. GET STUDENT PROGRESS
router.get("/student/:studentId", (req, res) => {
  const studentId = parseInt(req.params.studentId);
  const progress = studentProgress.filter((p) => p.studentId === studentId);
  res.json(progress);
});

// 2. UPDATE PROGRESS
router.put("/student/:studentId/course/:courseId", (req, res) => {
  const studentId = parseInt(req.params.studentId);
  const courseId = parseInt(req.params.courseId);
  const { completedLessons, totalLessons } = req.body;

  // Calculate percentage safely
  if (totalLessons === 0)
    return res.status(400).send("Total lessons cannot be zero.");
  const completionPercentage = Math.round(
    (completedLessons / totalLessons) * 100,
  );

  // Look for existing progress
  let progressRecord = studentProgress.find(
    (p) => p.studentId === studentId && p.courseId === courseId,
  );

  if (progressRecord) {
    // Update existing record
    progressRecord.completedLessons = completedLessons;
    progressRecord.totalLessons = totalLessons;
    progressRecord.completionPercentage = completionPercentage;
  } else {
    // Create new record
    progressRecord = {
      studentId,
      courseId,
      completedLessons,
      totalLessons,
      completionPercentage,
    };
    studentProgress.push(progressRecord);
  }

  res.status(200).json({
    message: "Progress updated successfully!",
    progress: progressRecord,
  });
});

module.exports = router;
