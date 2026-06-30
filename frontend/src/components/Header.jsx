import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-slate-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="text-xl font-bold tracking-tight text-white hover:text-indigo-400 transition-colors">
            🎟️ TicketPass
          </Link>
        </div>
        <nav className="flex items-center space-x-6">
          <NavLink 
            to="/" 
            className={({ isActive }) => 
              isActive ? "text-indigo-400 font-semibold" : "text-gray-300 hover:text-white transition-colors"
            }
          >
            Home
          </NavLink>
          <NavLink 
            to="/events" 
            className={({ isActive }) => 
              isActive ? "text-indigo-400 font-semibold" : "text-gray-300 hover:text-white transition-colors"
            }
          >
            Events
          </NavLink>

          {/* Conditional Admin Links */}
          {user && user.role === 'Admin' && (
            <NavLink 
              to="/admin/venues" 
              className={({ isActive }) => 
                isActive ? "text-indigo-400 font-semibold" : "text-gray-300 hover:text-white transition-colors"
              }
            >
              Manage Venues
            </NavLink>
          )}
          
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-gray-400 text-sm">
                Hello, <span className="text-white font-medium">{user.name}</span>
                <span className="text-xs bg-indigo-900/60 text-indigo-300 px-2 py-0.5 rounded-full ml-1.5 border border-indigo-800">
                  {user.role}
                </span>
              </span>
              <button 
                onClick={handleLogout}
                className="bg-slate-800 hover:bg-slate-700 text-gray-200 text-sm font-semibold px-4 py-2 rounded-lg border border-slate-700 transition-all active:scale-[0.97]"
              >
                Logout
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <NavLink 
                to="/login" 
                className={({ isActive }) => 
                  isActive ? "text-indigo-400 font-semibold" : "text-gray-300 hover:text-white transition-colors"
                }
              >
                Login
              </NavLink>
              <NavLink 
                to="/register" 
                className={({ isActive }) => 
                  isActive ? "text-indigo-400 font-semibold" : "text-gray-300 hover:text-white transition-colors"
                }
              >
                Register
              </NavLink>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
