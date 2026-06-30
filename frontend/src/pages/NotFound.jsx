import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center text-center py-20">
      <h1 className="text-9xl font-extrabold text-indigo-600 tracking-widest">404</h1>
      <div className="bg-slate-900 px-2 text-sm text-white rounded rotate-12 absolute border border-slate-800">
        Page Not Found
      </div>
      <p className="text-gray-400 text-lg mt-6 mb-10 max-w-md">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link 
        to="/" 
        className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition-colors"
      >
        Go Home
      </Link>
    </div>
  );
}
