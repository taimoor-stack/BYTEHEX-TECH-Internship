const express = require("express");
const router = express.Router();

// Temporary in-memory array to hold student data
const students = [{ id: 1, name: "Taimoor", enrolledCourses: [] }];

// 1. GET ALL STUDENTS
router.get("/", (req, res) => {
  res.json(students);
});

// 2. ENROLL A STUDENT IN A COURSE
router.post("/:id/enroll", (req, res) => {
  const studentId = parseInt(req.params.id);
  const { courseId } = req.body;

  // Find the student
  const student = students.find((s) => s.id === studentId);
  if (!student) {
    return res.status(404).send("Student not found.");
  }

  // Add the course to their enrolled list
  student.enrolledCourses.push(courseId);
  res.status(200).json({
    message: "Successfully enrolled in course!",
    student,
  });
});

module.exports = router;
