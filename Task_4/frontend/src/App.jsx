import { ArrowRight, Layers, Lock, Mail, User } from 'lucide-react';
import { useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import Dashboard from './Dashboard'; // Imported your new Dashboard component

function App() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    const endpoint = isLogin ? '/api/auth/login' : '/api/auth/register';
    
    try {
      const response = await fetch(`http://localhost:5003${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
      
      toast.success(isLogin ? `Welcome back, ${data.user.name}!` : 'Registration successful! Please login.');
      
      if (isLogin) {
        // Saving everything to localStorage so Dashboard can access it seamlessly
        localStorage.setItem('collab_token', data.token);
        localStorage.setItem('token', data.token); 
        localStorage.setItem('user', JSON.stringify(data.user)); 
        
        setUser(data.user);
      } else {
        setIsLogin(true);
      }
      
      setFormData({ name: '', email: '', password: '' });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  // If a user is logged in, show the Dashboard component directly!
  if (user) {
    return (
      <>
        <Toaster position="top-right" />
        <Dashboard />
      </>
    );
  }

  // Otherwise, show the Login/Register Form page
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 flex items-center justify-center p-4 font-sans">
      <Toaster position="top-right" />
      
      <div className="bg-white p-8 rounded-2xl shadow-sm max-w-md w-full border border-gray-200 transition-all duration-300">
        <div className="flex flex-col items-center mb-8">
          <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 mb-3">
            <Layers className="w-8 h-8 text-gray-900" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-gray-900">
            {isLogin ? 'Access Your Workspace' : 'Create an Account'}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {isLogin ? 'Enter your credentials to continue' : 'Join your project management team'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLogin && (
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
                <input 
                  type="text" 
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="John Doe" 
                  className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition text-sm text-gray-900 placeholder-gray-400"
                  required
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input 
                type="email" 
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="you@example.com" 
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition text-sm text-gray-900 placeholder-gray-400"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-gray-500 mb-2">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
              <input 
                type="password" 
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="••••••••" 
                className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:border-gray-900 focus:ring-1 focus:ring-gray-900 outline-none transition text-sm text-gray-900 placeholder-gray-400"
                required
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-gray-900 hover:bg-gray-800 disabled:bg-gray-300 disabled:opacity-50 text-white font-medium rounded-xl flex items-center justify-center gap-2 transition duration-200 shadow-sm group"
          >
            {loading ? 'Processing...' : isLogin ? 'Sign In' : 'Get Started'}
            <ArrowRight className="w-4 h-4 transition group-hover:translate-x-0.5" />
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 text-center text-sm">
          <button 
            onClick={() => setIsLogin(!isLogin)} 
            className="text-gray-500 hover:text-gray-900 font-medium transition"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;