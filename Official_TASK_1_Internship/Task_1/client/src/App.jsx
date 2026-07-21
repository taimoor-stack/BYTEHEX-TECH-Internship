// App.jsx - Main React Component for Learning Management System Dashboard
//npm run dev (starts frontend)

import axios from 'axios';
import { BarChart3, BookOpen, Calendar, CheckSquare, Clock, FileText, GraduationCap, Pencil, Plus, Trash2, TrendingUp, Users, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

function App() {
  const [activeTab, setActiveTab] = useState('overview');
  const [courses, setCourses] = useState([]);
  
  
  // State for Course Form
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [instructor, setInstructor] = useState(''); 
  const [editingId, setEditingId] = useState(null);

  // State for Students
  const [students, setStudents] = useState([]);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentCourseId, setStudentCourseId] = useState('');

  // State for Assignments
  const [assignments, setAssignments] = useState([]);
  const [showAssignmentForm, setShowAssignmentForm] = useState(false);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDesc, setAssignmentDesc] = useState('');
  const [assignmentCourseId, setAssignmentCourseId] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');

  // State for Quizzes
  const [quizzes, setQuizzes] = useState([]);
  const [showQuizForm, setShowQuizForm] = useState(false);
  const [quizTitle, setQuizTitle] = useState('');
  const [quizCourseId, setQuizCourseId] = useState('');
  const [quizMarks, setQuizMarks] = useState('');

  // Fetch all data on initial load to populate the dashboard stats
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [coursesRes, studentsRes, assignmentsRes, quizzesRes] = await Promise.all([
          axios.get('http://localhost:5001/api/courses'),
          axios.get('http://localhost:5001/api/students'),
          axios.get('http://localhost:5001/api/assignments'),
          axios.get('http://localhost:5001/api/quizzes')
        ]);
        setCourses(coursesRes.data);
        setStudents(studentsRes.data);
        setAssignments(assignmentsRes.data);
        setQuizzes(quizzesRes.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  // --- Course Handlers ---
  const handleSaveCourse = (e) => {
    e.preventDefault(); 
    const courseData = { title, description, instructor }; 
    if (editingId) {
      axios.put(`http://localhost:5001/api/courses/${editingId}`, courseData)
        .then(response => {
          setCourses(courses.map(c => c.id === editingId ? response.data : c));
          resetForm();
        }).catch(err => console.error(err));
    } else {
      axios.post('http://localhost:5001/api/courses', courseData)
        .then(response => {
          setCourses([response.data, ...courses]);
          resetForm();
        }).catch(err => console.error(err));
    }
  };

  const handleDeleteCourse = (id) => {
    if (!window.confirm("Delete course? Related students/assignments will be affected.")) return;
    axios.delete(`http://localhost:5001/api/courses/${id}`)
      .then(() => setCourses(courses.filter(course => course.id !== id)))
      .catch(err => console.error(err));
  };

  const handleEditClick = (course) => {
    setEditingId(course.id);
    setTitle(course.title);
    setInstructor(course.instructor || '');
    setDescription(course.description);
    setShowForm(true);
  };

  const resetForm = () => { setTitle(''); setDescription(''); setInstructor(''); setEditingId(null); setShowForm(false); };

  // --- Student Handlers ---
  const handleSaveStudent = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5001/api/students', { name: studentName, email: studentEmail, course_id: studentCourseId || null })
      .then(response => {
        const cTitle = courses.find(c => c.id === parseInt(studentCourseId))?.title;
        setStudents([{ ...response.data, course_title: cTitle }, ...students]);
        resetStudentForm();
      }).catch(err => alert("Error saving student: " + (err.response?.data?.error || err.message)));
  };

  const handleDeleteStudent = (id) => {
    if (!window.confirm("Remove student?")) return;
    axios.delete(`http://localhost:5001/api/students/${id}`)
      .then(() => setStudents(students.filter(s => s.id !== id))).catch(err => console.error(err));
  };

  const resetStudentForm = () => { setStudentName(''); setStudentEmail(''); setStudentCourseId(''); setShowStudentForm(false); };

  // --- Assignment Handlers ---
  const handleSaveAssignment = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5001/api/assignments', { title: assignmentTitle, description: assignmentDesc, course_id: assignmentCourseId || null, due_date: assignmentDueDate || null })
      .then(response => {
        const cTitle = courses.find(c => c.id === parseInt(assignmentCourseId))?.title;
        setAssignments([{ ...response.data, course_title: cTitle }, ...assignments]);
        resetAssignmentForm();
      }).catch(err => console.error(err));
  };

  const handleDeleteAssignment = (id) => {
    if (!window.confirm("Delete assignment?")) return;
    axios.delete(`http://localhost:5001/api/assignments/${id}`)
      .then(() => setAssignments(assignments.filter(a => a.id !== id))).catch(err => console.error(err));
  };

  const resetAssignmentForm = () => { setAssignmentTitle(''); setAssignmentDesc(''); setAssignmentCourseId(''); setAssignmentDueDate(''); setShowAssignmentForm(false); };

  // --- Quiz Handlers ---
  const handleSaveQuiz = (e) => {
    e.preventDefault();
    axios.post('http://localhost:5001/api/quizzes', { title: quizTitle, course_id: quizCourseId || null, total_marks: quizMarks })
      .then(response => {
        const cTitle = courses.find(c => c.id === parseInt(quizCourseId))?.title;
        setQuizzes([{ ...response.data, course_title: cTitle }, ...quizzes]);
        resetQuizForm();
      }).catch(err => console.error(err));
  };

  const handleDeleteQuiz = (id) => {
    if (!window.confirm("Delete quiz?")) return;
    axios.delete(`http://localhost:5001/api/quizzes/${id}`)
      .then(() => setQuizzes(quizzes.filter(q => q.id !== id))).catch(err => console.error(err));
  };

  const resetQuizForm = () => { setQuizTitle(''); setQuizCourseId(''); setQuizMarks(''); setShowQuizForm(false); };

  // --- Helper Data ---
  const instructorData = Object.entries(courses.reduce((acc, c) => {
    acc[c.instructor] = (acc[c.instructor] || 0) + 1;
    return acc;
  }, {})).map(([name, count]) => ({ name, count }));

  const chartColors = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#ef4444'];

  const overviewStats = [
    { id: 'courses', title: 'Total Courses', value: courses.length, icon: <BookOpen size={24} className="text-blue-600"/>, bg: 'bg-blue-100', border: 'hover:border-blue-400' },
    { id: 'students', title: 'Enrolled Students', value: students.length, icon: <Users size={24} className="text-emerald-600"/>, bg: 'bg-emerald-100', border: 'hover:border-emerald-400' },
    { id: 'assignments', title: 'Active Assignments', value: assignments.length, icon: <FileText size={24} className="text-indigo-600"/>, bg: 'bg-indigo-100', border: 'hover:border-indigo-400' },
    { id: 'quizzes', title: 'Total Quizzes', value: quizzes.length, icon: <CheckSquare size={24} className="text-rose-600"/>, bg: 'bg-rose-100', border: 'hover:border-rose-400' }
  ];

  const menuItems = [
    { id: 'overview', label: 'Overview', icon: <BarChart3 size={20} /> },
    { id: 'courses', label: 'Courses', icon: <BookOpen size={20} /> },
    { id: 'students', label: 'Students', icon: <Users size={20} /> },
    { id: 'assignments', label: 'Assignments', icon: <FileText size={20} /> },
    { id: 'quizzes', label: 'Quizzes', icon: <CheckSquare size={20} /> },
  ];

  return (
    <div className="flex h-screen bg-slate-50 font-sans text-slate-800">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white border-r border-slate-200 p-6 flex flex-col shadow-sm z-10">
        <div className="flex items-center gap-3 mb-8 px-2">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-xl shadow-md">
              <GraduationCap className="text-white" size={24}/>
            </div>
            <h1 className="text-2xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700">ByteLearn</h1>
        </div>
        <nav className="space-y-1.5 flex-1 mt-4">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-blue-600 text-white shadow-md shadow-blue-200 font-semibold tracking-wide' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-800 font-medium'}`}>
              {item.icon} {item.label}
            </button>
          ))}
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 overflow-y-auto">
        <header className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black text-slate-800 capitalize tracking-tight">{activeTab}</h2>
          
          {/* Action Buttons */}
          {activeTab === 'courses' && !showForm && (
            <button onClick={() => resetForm() || setShowForm(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"><Plus size={20} /> Add Course</button>
          )}
          {activeTab === 'students' && !showStudentForm && (
            <button onClick={() => resetStudentForm() || setShowStudentForm(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"><Plus size={20} /> Enroll Student</button>
          )}
          {activeTab === 'assignments' && !showAssignmentForm && (
            <button onClick={() => resetAssignmentForm() || setShowAssignmentForm(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"><Plus size={20} /> Add Assignment</button>
          )}
          {activeTab === 'quizzes' && !showQuizForm && (
            <button onClick={() => resetQuizForm() || setShowQuizForm(true)} className="bg-rose-600 hover:bg-rose-700 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5"><Plus size={20} /> Add Quiz</button>
          )}
        </header>
        
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' ? (
          <div className="space-y-8 animate-in fade-in duration-500">
            {/* Welcome Banner */}
            <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div>
                  <h2 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    Welcome back, Instructor! <span className="animate-bounce">👋</span>
                  </h2>
                  <p className="text-blue-100 text-lg max-w-xl">Here is what is happening in your Learning Management System today. You have {courses.length} active courses running.</p>
                </div>
                <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/20 flex items-center gap-4 shadow-inner">
                   <div className="bg-white/20 p-3 rounded-full"><Calendar className="text-white" size={24} /></div>
                   <div>
                     <p className="text-sm text-blue-100 font-medium uppercase tracking-wider">Today's Date</p>
                     <p className="font-bold text-xl">{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</p>
                   </div>
                </div>
              </div>
              {/* Decorative background circles */}
              <div className="absolute top-0 right-0 -mr-16 -mt-16 w-64 h-64 rounded-full bg-white opacity-5 mix-blend-overlay"></div>
              <div className="absolute bottom-0 right-32 -mb-16 w-40 h-40 rounded-full bg-white opacity-10 mix-blend-overlay"></div>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {overviewStats.map((stat) => (
                <div key={stat.id} onClick={() => setActiveTab(stat.id)} className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-100 cursor-pointer hover:shadow-lg ${stat.border} transform hover:-translate-y-1 transition-all duration-300 group`}>
                   <div className="flex justify-between items-start">
                     <div className={`p-4 rounded-2xl ${stat.bg} group-hover:scale-110 transition-transform duration-300`}>
                       {stat.icon}
                     </div>
                     <TrendingUp className="text-slate-300 group-hover:text-slate-400" size={20} />
                   </div>
                   <div className="mt-6">
                     <p className="text-4xl font-black text-slate-800">{stat.value}</p>
                     <h4 className="text-slate-500 font-semibold mt-1">{stat.title}</h4>
                   </div>
                </div>
              ))}
            </div>

            {/* Charts & Activity Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Chart spanning 2 columns */}
              <div className="lg:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-xl font-bold text-slate-800">Courses by Instructor</h3>
                  <span className="text-sm font-medium bg-blue-50 text-blue-600 px-3 py-1 rounded-full">Analytics</span>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={instructorData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 14 }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 14 }} />
                      <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      <Bar dataKey="count" radius={[6, 6, 0, 0]} barSize={40}>
                        {instructorData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Recent Activity spanning 1 column */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-slate-800">Recently Added</h3>
                  <Clock className="text-slate-400" size={20} />
                </div>
                
                <div className="flex-1 space-y-4">
                  {courses.length > 0 ? (
                    courses.slice(0, 4).map((course) => (
                      <div key={course.id} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-slate-50 transition-colors group">
                        <div className="bg-blue-50 p-3 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                          <BookOpen size={20} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-800 truncate">{course.title}</h4>
                          <p className="text-xs text-slate-500 truncate">By {course.instructor}</p>
                        </div>
                        <span className="text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">ID: {course.id}</span>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-3">
                      <BookOpen size={48} className="opacity-20" />
                      <p>No courses added yet.</p>
                    </div>
                  )}
                </div>
                
                {courses.length > 4 && (
                  <button onClick={() => setActiveTab('courses')} className="w-full mt-4 py-3 text-sm font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors">
                    View All Courses
                  </button>
                )}
              </div>
            </div>
          </div>

        // ... THE REST OF YOUR TABS (COURSES, STUDENTS, ASSIGNMENTS, QUIZZES) REMAIN EXACTLY THE SAME BELOW ...
        // I have included them here so you can just copy-paste the whole file easily!

        // COURSES TAB
        ) : activeTab === 'courses' ? (
          <>
            {showForm && (
              <form onSubmit={handleSaveCourse} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 relative">
                <button type="button" onClick={resetForm} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-1"><X size={20} /></button>
                <h3 className="text-xl font-bold mb-4">{editingId ? "Edit Course" : "Create a New Course"}</h3>
                <div className="space-y-4 max-w-xl">
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Title</label><input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Instructor</label><input type="text" required value={instructor} onChange={(e) => setInstructor(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2" /></div>
                  <div><label className="block text-sm font-medium text-slate-700 mb-1">Description</label><textarea required value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2" rows="3" /></div>
                  <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium">{editingId ? "Update" : "Save"}</button>
                </div>
              </form>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((course) => (
                <div key={course.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col relative group">
                  <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditClick(course)} className="text-slate-300 hover:text-blue-500"><Pencil size={18} /></button>
                    <button onClick={() => handleDeleteCourse(course.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
                  </div>
                  <h3 className="text-lg font-bold text-slate-800 pr-16">{course.title}</h3>
                  {course.instructor && <p className="text-sm font-medium text-blue-600 mt-1">Instructor: {course.instructor}</p>}
                  <p className="text-slate-500 text-sm mt-2 flex-1">{course.description}</p>
                </div>
              ))}
            </div>
          </>

        // STUDENTS TAB
        ) : activeTab === 'students' ? (
          <>
            {showStudentForm && (
              <form onSubmit={handleSaveStudent} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 relative">
                <button type="button" onClick={resetStudentForm} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-1"><X size={20} /></button>
                <h3 className="text-xl font-bold mb-4">Enroll Student</h3>
                <div className="space-y-4 max-w-xl">
                  <div><label className="block text-sm font-medium mb-1">Name</label><input type="text" required value={studentName} onChange={(e) => setStudentName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2" /></div>
                  <div><label className="block text-sm font-medium mb-1">Email</label><input type="email" required value={studentEmail} onChange={(e) => setStudentEmail(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2" /></div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Course</label>
                    <select required value={studentCourseId} onChange={(e) => setStudentCourseId(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white">
                      <option value="" disabled>Select a course</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <button type="submit" className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium">Save Student</button>
                </div>
              </form>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {students.map((student) => (
                <div key={student.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative group">
                  <button onClick={() => handleDeleteStudent(student.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="bg-emerald-50 p-3 rounded-full text-emerald-600"><Users size={24} /></div>
                    <div><h3 className="text-lg font-bold text-slate-800">{student.name}</h3><p className="text-sm text-slate-500">{student.email}</p></div>
                  </div>
                  <div className="mt-2 pt-4 border-t border-slate-100">
                    <p className="text-sm font-medium text-slate-600">Enrolled Course:</p>
                    <p className={`text-sm font-semibold mt-1 ${student.course_title ? 'text-emerald-600' : 'text-slate-400 italic'}`}>{student.course_title || "Not enrolled"}</p>
                  </div>
                </div>
              ))}
            </div>
          </>

        // ASSIGNMENTS TAB
        ) : activeTab === 'assignments' ? (
          <>
             {showAssignmentForm && (
              <form onSubmit={handleSaveAssignment} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 relative">
                <button type="button" onClick={resetAssignmentForm} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-1"><X size={20} /></button>
                <h3 className="text-xl font-bold mb-4">Create Assignment</h3>
                <div className="space-y-4 max-w-xl">
                  <div><label className="block text-sm font-medium mb-1">Title</label><input type="text" required value={assignmentTitle} onChange={(e) => setAssignmentTitle(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2" /></div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Course</label>
                    <select required value={assignmentCourseId} onChange={(e) => setAssignmentCourseId(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white">
                      <option value="" disabled>Select a course</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Due Date</label><input type="date" value={assignmentDueDate} onChange={(e) => setAssignmentDueDate(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2" /></div>
                  <div><label className="block text-sm font-medium mb-1">Instructions</label><textarea required value={assignmentDesc} onChange={(e) => setAssignmentDesc(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2" rows="3" /></div>
                  <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-lg font-medium">Save Assignment</button>
                </div>
              </form>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assignments.map((assignment) => (
                <div key={assignment.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative group flex flex-col">
                  <button onClick={() => handleDeleteAssignment(assignment.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-indigo-50 p-2 rounded-lg"><FileText className="text-indigo-600" size={20} /></div>
                    <h3 className="text-lg font-bold text-slate-800 pr-8">{assignment.title}</h3>
                  </div>
                  <p className="text-sm font-bold text-indigo-600 mb-3">{assignment.course_title}</p>
                  <p className="text-sm text-slate-500 flex-1">{assignment.description}</p>
                  {assignment.due_date && (
                    <div className="mt-4 flex items-center gap-2 text-sm text-amber-700 bg-amber-50 px-3 py-2 rounded-lg w-max font-medium border border-amber-100">
                      <Calendar size={16} /> Due: {new Date(assignment.due_date).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>

        // QUIZZES TAB
        ) : activeTab === 'quizzes' ? (
           <>
             {showQuizForm && (
              <form onSubmit={handleSaveQuiz} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-8 relative">
                <button type="button" onClick={resetQuizForm} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-1"><X size={20} /></button>
                <h3 className="text-xl font-bold mb-4">Create Quiz</h3>
                <div className="space-y-4 max-w-xl">
                  <div><label className="block text-sm font-medium mb-1">Quiz Title</label><input type="text" required value={quizTitle} onChange={(e) => setQuizTitle(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2" /></div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Course</label>
                    <select required value={quizCourseId} onChange={(e) => setQuizCourseId(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2 bg-white">
                      <option value="" disabled>Select a course</option>
                      {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div><label className="block text-sm font-medium mb-1">Total Marks</label><input type="number" required value={quizMarks} onChange={(e) => setQuizMarks(e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2" /></div>
                  <button type="submit" className="bg-rose-600 hover:bg-rose-700 text-white px-6 py-2 rounded-lg font-medium">Save Quiz</button>
                </div>
              </form>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {quizzes.map((quiz) => (
                <div key={quiz.id} className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative group">
                  <button onClick={() => handleDeleteQuiz(quiz.id)} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500"><Trash2 size={18} /></button>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="bg-rose-50 p-2 rounded-lg"><CheckSquare className="text-rose-600" size={20} /></div>
                    <h3 className="text-lg font-bold text-slate-800 pr-8">{quiz.title}</h3>
                  </div>
                  <p className="text-sm font-bold text-rose-600 mb-4">{quiz.course_title}</p>
                  <div className="mt-4 inline-block bg-slate-50 border border-slate-200 text-slate-700 font-bold text-sm px-4 py-2 rounded-xl">
                    Total Marks: {quiz.total_marks}
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}

export default App;