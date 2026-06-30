import { Link, NavLink } from 'react-router-dom';

export default function Header() {
  return (
    <header className="bg-slate-900 text-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/" className="text-xl font-bold tracking-tight text-white hover:text-indigo-400 transition-colors">
            🎟️ TicketPass
          </Link>
        </div>
        <nav className="flex space-x-6">
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
        </nav>
      </div>
    </header>
  );
}
