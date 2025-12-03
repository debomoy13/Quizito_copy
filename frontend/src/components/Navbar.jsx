// Add this to your existing Navbar component (in the user section):
{user ? (
  <div className="relative">
    <button
      onClick={() => setShowDropdown(!showDropdown)}
      className="flex items-center space-x-3 px-4 py-2 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl border border-indigo-100 hover:shadow-md transition-all"
    >
      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center justify-center">
        <span className="text-white font-bold text-sm">
          {user.name?.charAt(0).toUpperCase() || 'U'}
        </span>
      </div>
      <div className="text-left">
        <p className="font-semibold text-gray-800 text-sm">{user.name}</p>
        <p className="text-xs text-gray-500">View Profile</p>
      </div>
    </button>

    {showDropdown && (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-50"
      >
        <div className="px-4 py-3 border-b border-gray-100">
          <p className="font-semibold text-gray-800">{user.name}</p>
          <p className="text-sm text-gray-500">{user.email}</p>
        </div>
        <Link to="/profile" className="block px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-2">
          <User size={18} />
          <span>Profile</span>
        </Link>
        <Link to="/create" className="block px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-2">
          <Brain size={18} />
          <span>Create Quiz</span>
        </Link>
        <Link to="/admin" className="block px-4 py-3 text-left hover:bg-gray-50 flex items-center space-x-2">
          <Settings size={18} />
          <span>Dashboard</span>
        </Link>
        <div className="border-t border-gray-100">
          <button
            onClick={() => {
              logout();
              setShowDropdown(false);
            }}
            className="w-full px-4 py-3 text-left text-red-600 hover:bg-red-50 flex items-center space-x-2"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </motion.div>
    )}
  </div>
) : (
  <div className="flex space-x-3">
    <Link
      to="/login"
      className="px-4 py-2 text-gray-600 hover:text-indigo-600 font-medium"
    >
      Login
    </Link>
    <Link
      to="/register"
      className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-300 font-semibold"
    >
      Sign Up
    </Link>
  </div>
)}
