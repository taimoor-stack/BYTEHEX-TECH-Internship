import { Briefcase, Layers, LogOut, Pencil, Plus, Trash2 } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import WorkspaceView from "./WorkspaceView";

const Dashboard = () => {
  const [workspaces, setWorkspaces] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedWorkspace, setSelectedWorkspace] = useState(null); 

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user") || "null");

  const fetchWorkspaces = useCallback(async () => {
    if (!token) return;
    try {
      const response = await fetch("http://localhost:5003/api/workspaces", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      
      if (response.ok) {
        setWorkspaces(data);
      } else {
        setError(data.error || "Failed to fetch workspaces");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError("Server connection failed.");
    }
  }, [token]);

  useEffect(() => {
    let isMounted = true;
    const executeFetch = async () => {
      await Promise.resolve();
      if (isMounted) {
        fetchWorkspaces();
      }
    };
    executeFetch();
    return () => {
      isMounted = false;
    };
  }, [fetchWorkspaces]);

  const handleCreateWorkspace = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:5003/api/workspaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, description }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("Workspace created successfully!");
        setName("");
        setDescription("");
        fetchWorkspaces(); 
      } else {
        setError(data.error || "Failed to create workspace");
      }
    } catch (err) {
      console.error("Create error:", err);
      setError("Server connection failed.");
    }
  };

  // 🔥 NEW: Handle Updating Workspace details
  const handleUpdateWorkspace = async (workspaceId, currentName, currentDesc) => {
    const newName = prompt("Enter new workspace name:", currentName);
    if (!newName) return;
    const newDesc = prompt("Enter new description:", currentDesc || "");

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`http://localhost:5003/api/workspaces/${workspaceId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: newName, description: newDesc }),
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess("Workspace updated successfully!");
        fetchWorkspaces();
      } else {
        setError(data.error || "Failed to update workspace.");
      }
    } catch (err) {
      console.error("Update workspace error:", err);
      setError("Server connection failure.");
    }
  };

  // 🔥 NEW: Handle Deleting Workspace
  const handleDeleteWorkspace = async (workspaceId) => {
    if (!window.confirm("Are you sure you want to delete this workspace? This will permanently wipe all containing projects and tasks!")) return;

    setError("");
    setSuccess("");

    try {
      const response = await fetch(`http://localhost:5003/api/workspaces/${workspaceId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();
      if (response.ok) {
        setSuccess("Workspace deleted successfully.");
        fetchWorkspaces();
      } else {
        setError(data.error || "Failed to delete workspace.");
      }
    } catch (err) {
      console.error("Delete workspace error:", err);
      setError("Server connection failure.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("collab_token");
    localStorage.removeItem("user");
    window.location.reload(); 
  };

  if (!token) {
    return (
      <div className="min-h-screen bg-gray-50 text-gray-500 flex items-center justify-center font-sans">
        Please log in to view your dashboard.
      </div>
    );
  }

  if (selectedWorkspace) {
    return (
      <WorkspaceView 
        workspaceId={selectedWorkspace.id} 
        workspaceName={selectedWorkspace.name} 
        onBack={() => setSelectedWorkspace(null)} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-12 font-sans">
      <div className="max-w-6xl mx-auto">
        
        {/* HEADER SECTION */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gray-100 rounded-xl border border-gray-200">
              <Layers className="w-6 h-6 text-gray-700" />
            </div>
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-gray-900">Welcome back, {user?.name || "User"}! 👋</h2>
              <p className="text-sm text-gray-500 mt-0.5">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout} 
            className="flex items-center gap-2 py-2 px-4 bg-white border border-gray-200 hover:bg-red-50 hover:text-red-600 hover:border-red-200 text-gray-700 font-medium rounded-xl transition duration-200 shadow-sm text-sm"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CREATION FORM COMPONENT */}
          <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm h-fit">
            <div className="flex items-center gap-2 mb-4">
              <Plus className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">Create New Workspace</h3>
            </div>
            
            {error && <p className="text-sm bg-red-50 border border-red-200 text-red-600 p-3 rounded-xl mb-4">{error}</p>}
            {success && <p className="text-sm bg-green-50 border border-green-200 text-green-700 p-3 rounded-xl mb-4">{success}</p>}
            
            <form onSubmit={handleCreateWorkspace} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Workspace Name</label>
                <input
                  type="text"
                  placeholder="e.g., Development Team"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition text-sm text-gray-900 placeholder-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Description</label>
                <textarea
                  placeholder="What is this workspace focused on?"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition text-sm text-gray-900 placeholder-gray-400 min-h-[100px] resize-none"
                />
              </div>
              <button 
                type="submit" 
                className="w-full py-2.5 px-4 bg-gray-900 hover:bg-gray-800 font-medium rounded-xl shadow-sm transition duration-200 text-sm text-white"
              >
                Create Workspace
              </button>
            </form>
          </div>

          {/* WORKSPACE RENDERING CONTAINER */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <Briefcase className="w-5 h-5 text-gray-400" />
              <h3 className="text-lg font-semibold text-gray-900">Your Workspaces</h3>
            </div>
            
            {workspaces.length === 0 ? (
              <div className="bg-gray-50 border border-dashed border-gray-300 rounded-2xl p-12 text-center text-gray-500">
                <p className="text-sm font-medium text-gray-700">You don't belong to any workspaces yet.</p>
                <p className="text-xs mt-1">Fill out the form on the left to spin up your first one!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workspaces.map((ws) => (
                  <div 
                    key={ws.id} 
                    onClick={() => setSelectedWorkspace(ws)} 
                    className="bg-white border border-gray-200 p-5 rounded-2xl hover:border-gray-300 hover:shadow-md cursor-pointer transition-all flex flex-col justify-between shadow-sm group relative"
                  >
                    <div>
                      <div className="flex justify-between items-start gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 text-lg truncate flex-1">{ws.name}</h4>
                        
                        {/* 🔥 NEW: Action controls appear on hover if user is Owner */}
                        {(!ws.role || ws.role.toLowerCase() === "owner") && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUpdateWorkspace(ws.id, ws.name, ws.description);
                              }}
                              className="p-1.5 text-gray-400 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                              title="Edit Workspace"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteWorkspace(ws.id);
                              }}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete Workspace"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>
                      <p className="text-gray-500 text-sm mb-4 line-clamp-3 leading-relaxed">{ws.description || "No description provided."}</p>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs font-medium bg-gray-100 text-gray-600 border border-gray-200 px-2.5 py-1 rounded-full uppercase tracking-wider">
                        Role: {ws.role || "Owner"}
                      </span>
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

export default Dashboard;