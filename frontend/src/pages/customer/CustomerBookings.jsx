import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function CustomerBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchBookings = async () => {
    try {
      setLoading(true);
      setError('');
      
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE}/api/bookings/my`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBookings(response.data.data.bookings || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your booking history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        <span className="text-gray-400 text-sm">Loading your bookings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="text-sm mb-4">{error}</p>
          <button 
            onClick={fetchBookings}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (bookings.length === 0) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-20 h-20 bg-slate-900 border border-slate-850 rounded-full flex items-center justify-center text-4xl mx-auto text-gray-500 select-none shadow-inner">
          🎟️
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">No bookings yet</h2>
          <p className="text-gray-400 text-sm">You haven't purchased any event tickets yet.</p>
        </div>
        <Link 
          to="/events" 
          className="inline-block px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl text-sm transition-all shadow"
        >
          Explore Events
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-6 max-w-5xl mx-auto px-4">
      <div>
        <h2 className="text-3xl font-extrabold text-white mb-2">My Bookings</h2>
        <p className="text-gray-400 text-sm">View your active tickets and booking history.</p>
      </div>

      <div className="space-y-6">
        {bookings.map(booking => {
          const event = booking.event;
          if (!event) return null; // Safety check in case event was deleted
          
          const eventDate = new Date(event.date);
          const isConfirmed = booking.status === 'confirmed';

          return (
            <div 
              key={booking._id} 
              className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col md:flex-row shadow-lg hover:border-slate-700 transition-all"
            >
              {/* Left Column: Event details (Main ticket stub) */}
              <div className="flex-grow p-6 flex flex-col justify-between border-b md:border-b-0 md:border-r border-slate-800 space-y-4">
                <div className="space-y-2">
                  <span className="inline-block text-[10px] font-bold tracking-widest text-indigo-400 uppercase">
                    📍 {event.venue?.name} — {event.venue?.location}
                  </span>
                  <h3 className="text-xl font-bold text-white leading-tight">{event.title}</h3>
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs text-gray-400 pt-2">
                  <div>
                    <span className="block text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Show Date</span>
                    <strong className="text-white mt-1 block">
                      {eventDate.toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                    </strong>
                  </div>
                  <div>
                    <span className="block text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Show Time</span>
                    <strong className="text-white mt-1 block">
                      {event.startTime} - {event.endTime}
                    </strong>
                  </div>
                </div>
              </div>

              {/* Right Column: Ticket Metadata / Receipt stub */}
              <div className="w-full md:w-80 bg-slate-950 p-6 flex flex-col justify-between space-y-4 md:space-y-0">
                <div className="space-y-3.5">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="block text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Booking Ref</span>
                      <strong className="text-white font-mono text-sm block mt-0.5">{booking.bookingReference}</strong>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${
                      isConfirmed 
                        ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    }`}>
                      {booking.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="flex justify-between">
                    <div>
                      <span className="block text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Seats</span>
                      <span className="text-white font-bold text-xs mt-0.5 block">{booking.seats.join(', ')}</span>
                    </div>
                    <div className="text-right">
                      <span className="block text-gray-500 text-[10px] uppercase tracking-wider font-semibold">Total Paid</span>
                      <span className="text-white font-extrabold text-sm mt-0.5 block">₹{booking.totalAmount}</span>
                    </div>
                  </div>
                </div>

                <div className="md:pt-4 border-t border-slate-900 flex justify-between items-center text-[10px] text-gray-500">
                  <span>Booked: {new Date(booking.createdAt).toLocaleDateString()}</span>
                  <Link 
                    to={`/events/${event._id}`}
                    className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                  >
                    View Layout →
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
