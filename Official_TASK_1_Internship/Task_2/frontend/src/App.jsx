// App.jsx - Main React Component for Enterprise E-Commerce Dashboard
// npm run dev (to run te frontend)


import { useEffect, useState } from 'react';
import { Toaster, toast } from 'react-hot-toast';

function App() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  // Authentication States
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
  const [authMode, setAuthMode] = useState('login'); 
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authRole, setAuthRole] = useState('customer'); 

  // Shopping Cart States
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);

  // Product Form States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('');
  const [stock, setStock] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  // --- NEW: State for physical image file ---
  const [imageFile, setImageFile] = useState(null);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Fetch Logic
  useEffect(() => {
    const fetchProducts = () => {
      setLoading(true);
      fetch('http://localhost:5002/api/products')
        .then((res) => res.json())
        .then((data) => {
          setProducts(data);
          setLoading(false);
        })
        .catch((err) => {
          console.error("Error fetching products:", err);
          toast.error("Failed to load products from server");
          setLoading(false);
        });
    };

    fetchProducts();
  }, []);

  const refreshProducts = () => {
    fetch('http://localhost:5002/api/products')
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error(err));
  };

  // Shopping Cart Core Functions
  const handleAddToCart = (product) => {
    if (product.stock_quantity <= 0) {
      toast.error("Sorry, this item is out of stock!");
      return;
    }

    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.id === product.id);
      if (existingItem) {
        if (existingItem.quantity >= product.stock_quantity) {
          toast.error(`Cannot add more. Only ${product.stock_quantity} units available.`);
          return prevCart;
        }
        toast.success(`Incremented quantity for ${product.name}`);
        return prevCart.map((item) =>
          item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      toast.success(`${product.name} added to your cart!`);
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const handleUpdateCartQuantity = (id, amount) => {
    setCart((prevCart) => {
      return prevCart.map((item) => {
        if (item.id === id) {
          const targetQty = item.quantity + amount;
          if (targetQty <= 0) return null; 
          if (targetQty > item.stock_quantity) {
            toast.error("Cannot exceed available warehouse stock!");
            return item;
          }
          return { ...item, quantity: targetQty };
        }
        return item;
      }).filter(Boolean); 
    });
  };

  const handleCheckout = () => {
    toast.success("Order dispatched successfully! Thank you for your business.");
    setCart([]);
    setShowCart(false);
  };

  const cartTotal = cart.reduce((sum, item) => sum + parseFloat(item.price) * item.quantity, 0);
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Analytics Computations
  const totalSKUs = products.length;
  const totalStockVolume = products.reduce((sum, p) => sum + (parseInt(p.stock_quantity) || 0), 0);
  const totalAssetValuation = products.reduce((sum, p) => sum + (parseFloat(p.price || 0) * (parseInt(p.stock_quantity) || 0)), 0);
  const lowStockItems = products.filter(p => (parseInt(p.stock_quantity) || 0) < 10);

  // Authentication Submission
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    const bodyData = authMode === 'login' 
      ? { email: authEmail, password: authPassword }
      : { name: authName, email: authEmail, password: authPassword, role: authRole };

    const loadToast = toast.loading(authMode === 'login' ? "Verifying..." : "Creating Account...");

    try {
      const res = await fetch(`http://localhost:5002${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData)
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(authMode === 'login' ? "Welcome back!" : "Account created successfully!", { id: loadToast });
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setAuthEmail('');
        setAuthPassword('');
        setAuthName('');
      } else {
        toast.error(data.error || "Authentication failed", { id: loadToast });
      }
    } catch (err) {
      console.error(err);
      toast.error("Server connection error", { id: loadToast });
    }
  };

  const handleLogout = () => {
    setToken(null);
    setUser(null);
    setCart([]);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    toast.success("Logged out successfully");
  };

  const resetForm = () => {
    setName('');
    setDescription('');
    setPrice('');
    setCategory('');
    setStock('');
    setImageUrl('');
    setImageFile(null); // --- Reset file state ---
    setEditingId(null);
    setShowForm(false);
  };

  // --- UPDATED: Submit Product handles Image Upload first ---
  const handleSubmitProduct = async (e) => {
    e.preventDefault();
    
    if (name.trim().length < 2) {
      toast.error("Product title must be at least 2 characters long.");
      return;
    }

    const toastId = toast.loading(editingId ? "Updating product..." : "Publishing product...");
    let finalImageUrl = imageUrl.trim();

    // 1. If user selected a physical file, upload it to the backend first!
    if (imageFile) {
      toast.loading("Uploading image to local storage...", { id: toastId });
      const formData = new FormData();
      formData.append('image', imageFile);

      try {
        const uploadRes = await fetch('http://localhost:5002/api/upload', {
          method: 'POST',
          body: formData, // Notice we don't send JSON headers for FormData
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          finalImageUrl = uploadData.imageUrl; // Grab the new local URL!
        } else {
          toast.error("Failed to upload image.", { id: toastId });
          return; // Stop execution if upload fails
        }
      } catch (error) {
        console.error("Image upload error:", error);
        toast.error("Network error during image upload.", { id: toastId });
        return;
      }
    }

    // 2. Fallback to a placeholder if absolutely no image is provided
    if (!finalImageUrl) {
      finalImageUrl = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60';
    }

    // 3. Save the product data to the Aiven Database
    const productData = {
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      category: category.trim(),
      stock_quantity: parseInt(stock) || 0,
      image_url: finalImageUrl
    };

    const url = editingId ? `http://localhost:5002/api/products/${editingId}` : 'http://localhost:5002/api/products';
    const method = editingId ? 'PUT' : 'POST';

    try {
      toast.loading("Saving to Aiven Database...", { id: toastId });
      const response = await fetch(url, {
        method: method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        toast.success(editingId ? "Product updated successfully!" : "Product published to database!", { id: toastId });
        resetForm();
        refreshProducts(); 
      } else {
        toast.error(`Failed to execute.`, { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error.", { id: toastId });
    }
  };

  const handleEditClick = (product) => {
    setName(product.name);
    setDescription(product.description || '');
    setPrice(product.price);
    setCategory(product.category || '');
    setStock(product.stock_quantity);
    setImageUrl(product.image_url || '');
    setImageFile(null); // Clear file input when editing
    setEditingId(product.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteProduct = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to permanently delete this product?");
    if (!confirmDelete) return;

    const toastId = toast.loading("Deleting product...");

    try {
      const response = await fetch(`http://localhost:5002/api/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setProducts(products.filter(product => product.id !== id));
        toast.success("Product permanently deleted.", { id: toastId });
      } else {
        toast.error("Failed to delete product!", { id: toastId });
      }
    } catch (error) {
      console.error(error);
      toast.error("Network error.", { id: toastId });
    }
  };

  const uniqueCategories = ['All', ...new Set(products.map(p => p.category || 'General'))];

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === 'All' || (product.category || 'General') === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (!token) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6 font-sans">
        <Toaster position="bottom-right" />
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-extrabold text-slate-900">Enterprise Cloud</h1>
            <p className="text-slate-500 mt-2 text-sm">Sign in to access your e-commerce gateway</p>
          </div>

          <form onSubmit={handleAuthSubmit} className="space-y-4">
            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Full Name</label>
                <input required type="text" value={authName} onChange={(e) => setAuthName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="John Doe" />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Email Address</label>
              <input required type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="manager@enterprise.com" />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Password</label>
              <input required type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none text-sm" placeholder="••••••••" />
            </div>

            {authMode === 'register' && (
              <div>
                <label className="block text-xs font-bold uppercase text-slate-600 mb-2">Security Role Authorization</label>
                <select value={authRole} onChange={(e) => setAuthRole(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white text-sm">
                  <option value="customer">Customer (Read-Only Catalog Access)</option>
                  <option value="admin">Admin (Full Write/Edit Inventory Access)</option>
                </select>
              </div>
            )}

            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-sm transition-all shadow-md mt-2">
              {authMode === 'login' ? 'Secure Authentication' : 'Establish Account'}
            </button>
          </form>

          <div className="mt-6 text-center border-t pt-4">
            <button 
              onClick={() => setAuthMode(authMode === 'login' ? 'register' : 'login')}
              className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors"
            >
              {authMode === 'login' ? "New around here? Create an enterprise profile" : "Already authorized? Switch to log in"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans relative overflow-x-hidden">
      <Toaster position="bottom-right" reverseOrder={false} />

      {/* Identity & Navigation Top Bar */}
      <div className="max-w-6xl mx-auto flex justify-between items-center bg-white border border-slate-200 px-6 py-3 rounded-xl mb-8 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
          <p className="text-sm text-slate-600">
            Authorized session: <strong className="text-slate-900">{user?.name}</strong> 
            <span className={`ml-2 text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-wide ${user?.role === 'admin' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'}`}>
              {user?.role}
            </span>
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setShowCart(true)} 
            className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold px-4 py-2 rounded-lg transition-all shadow-sm"
          >
            🛒 Basket 
            <span className="bg-blue-500 text-white text-[10px] px-2 py-0.5 rounded-full">
              {cartItemCount}
            </span>
          </button>

          <button onClick={handleLogout} className="text-xs font-bold text-slate-500 hover:text-rose-600 border border-slate-200 hover:border-rose-200 bg-white px-3 py-1.5 rounded-lg shadow-sm transition-all">
            🚪 Logout
          </button>
        </div>
      </div>

      {/* Slide-out Drawer Sidebar Panel for the Shopping Cart */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between p-6 overflow-y-auto">
            <div>
              <div className="flex justify-between items-center border-b pb-4 mb-4">
                <h2 className="text-xl font-extrabold text-slate-900">Your Shopping Basket</h2>
                <button onClick={() => setShowCart(false)} className="text-slate-400 hover:text-slate-600 text-xl font-bold">✕</button>
              </div>

              {cart.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <p className="text-lg font-medium">Your basket is empty</p>
                  <p className="text-xs mt-1">Add items from the store catalog to look over details here.</p>
                </div>
              ) : (
                <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                  {cart.map((item) => (
                    <div key={item.id} className="flex gap-4 bg-slate-50 p-3 rounded-xl border border-slate-100 items-center justify-between">
                      <div className="flex items-center gap-3">
                        <img 
                          src={item.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60'} 
                          alt={item.name} 
                          onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60' }}
                          className="w-12 h-12 rounded-lg object-cover bg-white" 
                        />
                        <div>
                          <h4 className="text-sm font-bold text-slate-800 line-clamp-1">{item.name}</h4>
                          <p className="text-xs text-slate-500">${parseFloat(item.price).toFixed(2)} each</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleUpdateCartQuantity(item.id, -1)} className="w-6 h-6 bg-white border text-xs font-bold rounded hover:bg-slate-100 flex items-center justify-center">-</button>
                        <span className="text-sm font-bold text-slate-800 w-4 text-center">{item.quantity}</span>
                        <button onClick={() => handleUpdateCartQuantity(item.id, 1)} className="w-6 h-6 bg-white border text-xs font-bold rounded hover:bg-slate-100 flex items-center justify-center">+</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {cart.length > 0 && (
              <div className="border-t pt-4 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-slate-600">Total Balance Due:</span>
                  <span className="text-2xl font-black text-slate-900">${cartTotal.toFixed(2)}</span>
                </div>
                <button onClick={handleCheckout} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all shadow-md">
                  🚀 Secure Checkout Execution
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      <header className="mb-12 text-center max-w-xl mx-auto">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Enterprise E-Commerce</h1>
        <p className="text-slate-500 mt-2 text-lg">Premium Cloud-Backed Management System</p>
        
        {user?.role === 'admin' ? (
          <button 
            onClick={() => showForm ? resetForm() : setShowForm(true)}
            className={`mt-6 font-medium px-6 py-2.5 rounded-xl shadow-md transition-all duration-200 text-white ${showForm ? 'bg-slate-500 hover:bg-slate-600' : 'bg-blue-600 hover:bg-blue-700'}`}
          >
            {showForm ? 'Close Control Panel' : '➕ Add New Product'}
          </button>
        ) : (
          <p className="text-slate-400 text-xs italic mt-4">⚠️ Standard user profiles are restricted to catalog viewing privileges.</p>
        )}
      </header>

      <div className="max-w-6xl mx-auto">
        {user?.role === 'admin' && !loading && products.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Active SKUs</p>
              <h3 className="text-3xl font-black text-slate-800 mt-2">{totalSKUs} Items</h3>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Warehouse Stock</p>
              <h3 className="text-3xl font-black text-slate-800 mt-2">{totalStockVolume} Units</h3>
            </div>
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inventory Asset Valuation</p>
              <h3 className="text-3xl font-black text-emerald-600 mt-2">${totalAssetValuation.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
            </div>
            <div className={`p-5 rounded-xl border shadow-sm transition-colors ${lowStockItems.length > 0 ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-200'}`}>
              <p className={`text-xs font-bold uppercase tracking-wider ${lowStockItems.length > 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                {lowStockItems.length > 0 ? '🚨 Low Stock Alerts' : 'Warehouse Health'}
              </p>
              <h3 className={`text-3xl font-black mt-2 ${lowStockItems.length > 0 ? 'text-rose-700' : 'text-slate-800'}`}>
                {lowStockItems.length > 0 ? `${lowStockItems.length} Warnings` : 'All Stable'}
              </h3>
            </div>
          </div>
        )}

        {showForm && user?.role === 'admin' && (
          <form onSubmit={handleSubmitProduct} className="bg-white p-8 rounded-2xl shadow-xl border border-slate-200 max-w-2xl mx-auto mb-12 relative">
            {editingId && (
              <span className="absolute top-8 right-8 bg-amber-100 text-amber-700 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                Editing Mode
              </span>
            )}
            <h2 className="text-2xl font-bold text-slate-800 mb-6 border-b pb-3">
              {editingId ? 'Update Inventory Item' : 'Inventory Entry'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Product Title *</label>
                <input required type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Wireless Headphones" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Category</label>
                <input type="text" value={category} onChange={(e) => setCategory(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Electronics" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Price ($) *</label>
                <input required min="0" type="number" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="99.99" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">Initial Stock</label>
                <input type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="50" />
              </div>
              
              {/* --- NEW: UPGRADED IMAGE SELECTION UI --- */}
              <div className="md:col-span-2 border p-5 rounded-xl bg-slate-50 border-slate-200">
                <label className="block text-sm font-bold text-slate-800 mb-3 border-b pb-2">Product Imagery</label>
                <div className="flex flex-col gap-4">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Option A: Upload Local File</p>
                    <input 
                      type="file" 
                      accept="image/*"
                      onChange={(e) => {
                        setImageFile(e.target.files[0]);
                        setImageUrl(''); // Clear URL if they pick a file
                      }} 
                      className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
                    />
                    {imageFile && <p className="text-xs text-emerald-600 mt-2 font-bold">✓ File selected: {imageFile.name}</p>}
                  </div>
                  
                  <div className="relative flex py-2 items-center">
                    <div className="flex-grow border-t border-slate-300"></div>
                    <span className="flex-shrink-0 mx-4 text-slate-400 text-xs font-bold uppercase">Or</span>
                    <div className="flex-grow border-t border-slate-300"></div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Option B: Paste Web URL</p>
                    <input 
                      type="url" 
                      value={imageUrl} 
                      onChange={(e) => { 
                        setImageUrl(e.target.value); 
                        setImageFile(null); // Clear file if they type a URL
                      }} 
                      className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" 
                      placeholder="https://example.com/image.jpg" 
                      disabled={!!imageFile}
                    />
                  </div>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Description</label>
                <textarea rows="3" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Provide product features details..."></textarea>
              </div>
            </div>
            <div className="flex gap-4 mt-6">
              <button type="submit" className={`flex-1 text-white font-bold py-3 rounded-xl transition-all shadow-md ${editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                {editingId ? '💾 Save Changes' : 'Publish Product to Aiven Database'}
              </button>
              {editingId && (
                <button type="button" onClick={resetForm} className="px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold py-3 rounded-xl transition-all">
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}

        {/* Search and Filter Controls */}
        {!loading && products.length > 0 && (
          <div className="flex flex-col md:flex-row gap-4 mb-8 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
            <div className="flex-1">
              <input 
                type="text" 
                placeholder="🔍 Search products by name or description..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div className="w-full md:w-64">
              <select 
                value={selectedCategory} 
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none bg-white"
              >
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Product Display Catalog */}
        {loading ? (
          <p className="text-center text-slate-500 text-xl font-medium">Querying Aiven Cloud Storage...</p>
        ) : products.length === 0 ? (
          <div className="text-center bg-white p-12 rounded-2xl shadow-sm border border-slate-200 max-w-md mx-auto">
            <p className="text-slate-600 font-semibold text-xl">Catalog Empty</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center bg-white p-12 rounded-2xl shadow-sm border border-slate-200 max-w-md mx-auto">
            <p className="text-slate-600 font-semibold text-xl">No Matches Found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 flex flex-col justify-between">
                <div>
                  <div className="h-52 bg-slate-100 flex items-center justify-center overflow-hidden">
                    <img 
                      src={product.image_url || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60'} 
                      alt={product.name} 
                      onError={(e) => { e.target.src = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=500&auto=format&fit=crop&q=60' }}
                      className="object-cover h-full w-full hover:scale-105 transition-transform duration-500" 
                    />
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-start mb-2 gap-2">
                      <h2 className="text-xl font-bold text-slate-800 line-clamp-1">{product.name}</h2>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="bg-blue-50 text-blue-700 text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wider mr-2">
                          {product.category || 'General'}
                        </span>
                        
                        {user?.role === 'admin' && (
                          <>
                            <button onClick={() => handleEditClick(product)} className="text-slate-400 hover:text-amber-500 transition-colors p-1" title="Edit Product">✏️</button>
                            <button onClick={() => handleDeleteProduct(product.id)} className="text-slate-400 hover:text-rose-600 transition-colors p-1" title="Delete Product">🗑️</button>
                          </>
                        )}
                      </div>
                    </div>
                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">{product.description || 'No description supplied.'}</p>
                  </div>
                </div>

                <div className="px-6 pb-6 pt-4 border-t border-slate-50 flex justify-between items-center bg-slate-50/50">
                  <div className="flex flex-col">
                    <span className="text-2xl font-black text-slate-900">${parseFloat(product.price).toFixed(2)}</span>
                    <span className={`text-[10px] font-bold ${product.stock_quantity > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {product.stock_quantity > 0 ? `${product.stock_quantity} AVAILABLE` : 'OUT OF STOCK'}
                    </span>
                  </div>

                  {user?.role === 'customer' && (
                    <button 
                      onClick={() => handleAddToCart(product)}
                      disabled={product.stock_quantity <= 0}
                      className={`text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm text-white ${
                        product.stock_quantity > 0 
                          ? 'bg-blue-600 hover:bg-blue-700 active:scale-95' 
                          : 'bg-slate-300 cursor-not-allowed'
                      }`}
                    >
                      {product.stock_quantity > 0 ? '🛒 Add To Basket' : 'Out of Stock'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;