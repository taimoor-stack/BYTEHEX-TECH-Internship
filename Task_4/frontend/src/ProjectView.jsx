import { ArrowLeft, CheckCircle, Circle, Clock, LayoutDashboard, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";

const ProjectView = ({ projectId, projectName, onBack }) => {
  const [tasks, setTasks] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  
  const [refreshKey, setRefreshKey] = useState(0); 
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        const response = await fetch(`http://localhost:5003/api/projects/${projectId}/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        if (response.ok) {
          setTasks(data);
        } else {
          setError(data.error || "Failed to fetch tasks");
        }
      } catch (err) {
        console.error("Fetch error:", err);
        setError("Server connection failed.");
      }
    };

    if (projectId) {
      fetchTasks();
    }
  }, [projectId, token, refreshKey]);

  // Create a new task
  const handleCreateTask = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const response = await fetch(`http://localhost:5003/api/projects/${projectId}/tasks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, description, status: "To Do" }),
      });

      if (response.ok) {
        setTitle("");
        setDescription("");
        setRefreshKey(prev => prev + 1);
      } else {
        const data = await response.json();
        setError(data.error || "Failed to create task");
      }
    } catch (err) {
      console.error("Create error:", err);
      setError("Server connection failed.");
    }
  };

  // 🔥 NEW: Update task content (Title/Description)
  const handleUpdateTask = async (taskId, currentTitle, currentDesc) => {
    const newTitle = prompt("Edit task title:", currentTitle);
    if (!newTitle) return;
    const newDesc = prompt("Edit task details:", currentDesc || "");

    try {
      const response = await fetch(`http://localhost:5003/api/tasks/${taskId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newTitle, description: newDesc }),
      });

      if (response.ok) {
        setRefreshKey(prev => prev + 1);
      } else {
        const data = await response.json();
        alert(data.error || "Failed to update task.");
      }
    } catch (err) {
      console.error("Update task details error:", err);
    }
  };

  // Update task kanban status
  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      const response = await fetch(`http://localhost:5003/api/tasks/${taskId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        setRefreshKey(prev => prev + 1);
      }
    } catch (err) {
      console.error("Update status error:", err);
    }
  };

  // Delete Task handler
  const handleDeleteTask = async (taskId) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`http://localhost:5003/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setRefreshKey(prev => prev + 1); 
      } else {
        alert("Failed to delete task.");
      }
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  // 🔥 NEW: HTML5 Drag & Drop Handlers
  const handleDragStart = (e, taskId) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDrop = (e, newStatus) => {
    e.preventDefault();
    const draggedTaskId = e.dataTransfer.getData("taskId");
    if (draggedTaskId) {
      updateTaskStatus(draggedTaskId, newStatus);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const todoTasks = tasks.filter(t => t.status === "To Do");
  const inProgressTasks = tasks.filter(t => t.status === "In Progress");
  const doneTasks = tasks.filter(t => t.status === "Done");

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-12 font-sans">
      <div className="max-w-7xl mx-auto">
        
        {/* HEADER */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
          <button 
            onClick={onBack}
            className="p-2 bg-white hover:bg-gray-100 border border-gray-200 shadow-sm rounded-xl transition text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <LayoutDashboard className="text-gray-400 w-6 h-6" />
              {projectName}
            </h2>
            <p className="text-sm text-gray-500 mt-1">Project Task Board</p>
          </div>
        </div>

        {error && <p className="text-sm bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-6">{error}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* TASK CREATION FORM */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm h-fit">
            <h3 className="text-md font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-gray-500" /> New Task
            </h3>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <input
                type="text"
                placeholder="Task Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-sm text-gray-900 placeholder-gray-400 transition"
              />
              <textarea
                placeholder="Task Details..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-200 rounded-lg focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-sm text-gray-900 placeholder-gray-400 min-h-[80px] resize-none transition"
              />
              <button 
                type="submit" 
                className="w-full py-2 bg-gray-900 hover:bg-gray-800 font-medium rounded-lg transition shadow-sm text-sm text-white"
              >
                Add Task
              </button>
            </form>
          </div>

          {/* KANBAN BOARD */}
          <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* TO DO COLUMN */}
            <div 
              className="bg-gray-100/50 rounded-2xl p-4 border border-gray-200/60"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "To Do")}
            >
              <h4 className="font-semibold text-gray-700 mb-4 flex items-center gap-2">
                <Circle className="w-4 h-4 text-gray-400" /> To Do ({todoTasks.length})
              </h4>
              <div className="space-y-3">
                {todoTasks.map(task => (
                  <div 
                    key={task.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group cursor-grab active:cursor-grabbing hover:border-gray-300 transition"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h5 className="font-semibold text-gray-900 text-sm truncate flex-1">{task.title}</h5>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleUpdateTask(task.id, task.title, task.description)}
                          className="p-1 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded transition"
                          title="Edit Task"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 mb-3 line-clamp-2">{task.description}</p>
                    <button 
                      onClick={() => updateTaskStatus(task.id, "In Progress")}
                      className="text-xs font-medium w-full py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition"
                    >
                      Start Work
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* IN PROGRESS COLUMN */}
            <div 
              className="bg-blue-50/30 rounded-2xl p-4 border border-blue-100"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "In Progress")}
            >
              <h4 className="font-semibold text-blue-700 mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" /> In Progress ({inProgressTasks.length})
              </h4>
              <div className="space-y-3">
                {inProgressTasks.map(task => (
                  <div 
                    key={task.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="bg-white p-4 rounded-xl border border-blue-200 shadow-sm group cursor-grab active:cursor-grabbing hover:border-blue-300 transition"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h5 className="font-semibold text-gray-900 text-sm truncate flex-1">{task.title}</h5>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleUpdateTask(task.id, task.title, task.description)}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition"
                          title="Edit Task"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 mb-3 line-clamp-2">{task.description}</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => updateTaskStatus(task.id, "To Do")}
                        className="text-xs font-medium flex-1 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                      >
                        Back
                      </button>
                      <button 
                        onClick={() => updateTaskStatus(task.id, "Done")}
                        className="text-xs font-medium flex-1 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg transition"
                      >
                        Complete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* DONE COLUMN */}
            <div 
              className="bg-green-50/30 rounded-2xl p-4 border border-green-100"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, "Done")}
            >
              <h4 className="font-semibold text-green-700 mb-4 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" /> Done ({doneTasks.length})
              </h4>
              <div className="space-y-3">
                {doneTasks.map(task => (
                  <div 
                    key={task.id} 
                    draggable
                    onDragStart={(e) => handleDragStart(e, task.id)}
                    className="bg-gray-50 p-4 rounded-xl border border-gray-200 shadow-sm relative group opacity-70 hover:opacity-100 cursor-grab active:cursor-grabbing transition"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <h5 className="font-semibold text-gray-900 text-sm line-through decoration-green-500/50 truncate flex-1">{task.title}</h5>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => handleUpdateTask(task.id, task.title, task.description)}
                          className="p-1 text-gray-400 hover:text-gray-900 hover:bg-white rounded transition"
                          title="Edit Task"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteTask(task.id)}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-white rounded transition"
                          title="Delete Task"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{task.description}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default ProjectView;