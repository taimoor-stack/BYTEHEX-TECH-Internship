import { ArrowLeft, FolderPlus, LayoutDashboard, Pencil, Trash2, Users } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import ProjectView from "./ProjectView";

const WorkspaceView = ({ workspaceId, workspaceName, onBack }) => {
  const [projects, setProjects] = useState([]);
  const [projectName, setProjectName] = useState("");
  const [projectDesc, setProjectDesc] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedProject, setSelectedProject] = useState(null);

  const token = localStorage.getItem("token");

  const fetchProjects = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:5003/api/workspaces/${workspaceId}/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await response.json();
      if (response.ok) setProjects(data);
    } catch (err) {
      console.error("Failed to fetch projects:", err); 
    }
  }, [workspaceId, token]);

  useEffect(() => {
    let isMounted = true;
    const loadData = async () => {
      await Promise.resolve();
      if (isMounted) fetchProjects();
    };
    loadData();
    return () => { isMounted = false; };
  }, [fetchProjects]);

  const handleCreateProject = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      const response = await fetch(`http://localhost:5003/api/workspaces/${workspaceId}/projects`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: projectName, description: projectDesc }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess("Project created successfully!");
        setProjectName("");
        setProjectDesc("");
        fetchProjects();
      } else {
        setError(data.error || "Failed to create project.");
      }
    } catch (err) {
      console.error("Create project error:", err);
      setError("Server connection failed.");
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    try {
      const response = await fetch(`http://localhost:5003/api/workspaces/${workspaceId}/invite`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: inviteEmail, role: "Member" }),
      });
      const data = await response.json();
      if (response.ok) {
        setSuccess("Team member invited successfully!");
        setInviteEmail("");
      } else {
        setError(data.error || "Failed to invite member.");
      }
    } catch (err) {
      console.error("Invite member error:", err);
      setError("Server connection failed.");
    }
  };

  // 🔥 NEW: Update Project details handler
  const handleUpdateProject = async (projectId, currentName, currentDesc) => {
    const newName = prompt("Enter new project name:", currentName);
    if (!newName) return;
    const newDesc = prompt("Enter new description:", currentDesc || "");

    setError(""); setSuccess("");
    try {
      const response = await fetch(`http://localhost:5003/api/projects/${projectId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ name: newName, description: newDesc }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess("Project updated successfully.");
        fetchProjects();
      } else {
        setError(data.error || "Failed to update project data.");
      }
    } catch (err) {
      console.error("Update project error:", err);
      setError("Server connection failed.");
    }
  };

  const handleDeleteProject = async (projectId) => {
    if (!window.confirm("Warning: Deleting this project will delete all containing tasks! Proceed?")) return;

    setError(""); setSuccess("");
    try {
      const response = await fetch(`http://localhost:5003/api/projects/${projectId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        setSuccess("Project successfully deleted.");
        fetchProjects(); 
      } else {
        setError("Failed to delete project.");
      }
    } catch (err) {
      console.error("Delete project error:", err);
      setError("Server error during deletion.");
    }
  };

  if (selectedProject) {
    return (
      <ProjectView 
        projectId={selectedProject.id} 
        projectName={selectedProject.name} 
        onBack={() => setSelectedProject(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* Header Navigation */}
        <div className="flex items-center gap-4 mb-8 pb-6 border-b border-gray-200">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-500 hover:text-gray-900">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">{workspaceName} - Dashboard</h2>
            <p className="text-sm text-gray-500 mt-0.5">Manage your projects and team members here.</p>
          </div>
        </div>

        {error && <p className="bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-6">{error}</p>}
        {success && <p className="bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl mb-6">{success}</p>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Actions */}
          <div className="space-y-6">
            {/* Create Project Form */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <FolderPlus className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-semibold">New Project</h3>
              </div>
              <form onSubmit={handleCreateProject} className="space-y-4">
                <input
                  type="text"
                  placeholder="Project Name"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-sm text-gray-900 placeholder-gray-400 transition"
                />
                <textarea
                  placeholder="Project Description (Optional)"
                  value={projectDesc}
                  onChange={(e) => setProjectDesc(e.target.value)}
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-sm text-gray-900 placeholder-gray-400 min-h-[80px] resize-none transition"
                />
                <button type="submit" className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium transition shadow-sm">
                  Create Project
                </button>
              </form>
            </div>

            {/* Invite Member Form */}
            <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-gray-400" />
                <h3 className="text-lg font-semibold">Invite Team Member</h3>
              </div>
              <form onSubmit={handleInvite} className="space-y-4">
                <input
                  type="email"
                  placeholder="User's Email Address"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none text-sm text-gray-900 placeholder-gray-400 transition"
                />
                <button type="submit" className="w-full py-3 bg-gray-900 hover:bg-gray-800 text-white rounded-xl text-sm font-medium transition shadow-sm">
                  Send Invite
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Projects List */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <LayoutDashboard className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold">Active Projects</h3>
            </div>
            
            {projects.length === 0 ? (
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-12 text-center text-gray-500">
                <p className="text-sm font-medium text-gray-700">No projects created yet.</p>
                <p className="text-xs mt-1">Start by creating one on the left!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {projects.map((proj) => (
                  <div 
                    key={proj.id} 
                    onClick={() => setSelectedProject(proj)} 
                    className="bg-white border border-gray-200 p-5 rounded-2xl hover:border-gray-300 cursor-pointer transition-all shadow-sm hover:-translate-y-1 hover:shadow-md flex justify-between items-start group"
                  >
                    <div className="flex-1 min-w-0 pr-2">
                      <h4 className="font-semibold text-gray-900 text-lg mb-1 truncate">{proj.name}</h4>
                      <p className="text-gray-500 text-sm line-clamp-2">{proj.description || "Project ready for tasks."}</p>
                    </div>
                    
                    {/* Action Panel Buttons */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* 🔥 NEW: Update/Edit Button */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleUpdateProject(proj.id, proj.name, proj.description);
                        }}
                        className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                        title="Edit Project"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => {
                          e.stopPropagation(); 
                          handleDeleteProject(proj.id);
                        }}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete Project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default WorkspaceView;