import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
      <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white mb-6">
        Discover and Book <span className="text-indigo-500">Amazing Events</span>
      </h1>
      <p className="max-w-2xl text-lg sm:text-xl text-gray-400 mb-8">
        Secure your seats in real-time, join waitlists for sold-out events, and experience seamless ticket delivery.
      </p>
      <div className="flex space-x-4">
        <Link 
          to="/events" 
          className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-all transform hover:-translate-y-0.5"
        >
          Browse Events
        </Link>
        <Link 
          to="/login" 
          className="bg-slate-800 hover:bg-slate-700 text-gray-200 font-semibold px-6 py-3 rounded-lg border border-slate-700 transition-all transform hover:-translate-y-0.5"
        >
          Sign In
        </Link>
      </div>
    </div>
  );
}
