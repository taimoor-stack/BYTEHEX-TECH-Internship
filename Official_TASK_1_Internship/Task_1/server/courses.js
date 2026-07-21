const express = require("express");
const router = express.Router();

// Temporary in-memory array to hold our course data
const courses = [
  {
    id: 1,
    title: "Introduction to Full Stack Development",
    instructor: "ByteHex Mentor",
    lessons: [
      { id: 101, title: "HTML & CSS Basics", duration: "15 mins" },
      { id: 102, title: "JavaScript Fundamentals", duration: "25 mins" },
    ],
  },
];

// 1. GET ALL COURSES (Course Management)
router.get("/", (req, res) => {
  res.json(courses);
});

// 2. CREATE A NEW COURSE (Admin/Instructor Panel requirement)
router.post("/", (req, res) => {
  const { title, instructor } = req.body;

  if (!title || !instructor) {
    return res.status(400).send("Course title and instructor are required.");
  }

  const newCourse = {
    id: courses.length + 1,
    title,
    instructor,
    lessons: [], // Starts with an empty lesson array
  };

  courses.push(newCourse);
  res
    .status(201)
    .json({ message: "Course created successfully!", course: newCourse });
});

// 3. ADD A LESSON TO A COURSE (Lesson Management)
router.post("/:courseId/lessons", (req, res) => {
  const courseId = parseInt(req.params.courseId);
  const { title, duration } = req.body;

  const course = courses.find((c) => c.id === courseId);
  if (!course) {
    return res.status(404).send("Course not found.");
  }

  const newLesson = {
    id: course.lessons.length + 101, // Quick temporary ID generator
    title,
    duration,
  };

  course.lessons.push(newLesson);
  res.status(201).json({ message: "Lesson added successfully!", course });
});

module.exports = router;
