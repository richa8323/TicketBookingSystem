import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function EventDetails() {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchEventDetails = async () => {
      try {
        setLoading(true);
        setError('');
        const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const token = localStorage.getItem('token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        const response = await axios.get(`${API_BASE}/api/events/${eventId}`, { headers });
        setEvent(response.data.data.event);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch event details.');
      } finally {
        setLoading(false);
      }
    };

    fetchEventDetails();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        <span className="text-gray-400 text-sm">Loading event details...</span>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="text-sm mb-4">{error || 'Event not found.'}</p>
          <Link to="/events" className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors">
            Back to Events
          </Link>
        </div>
      </div>
    );
  }

  // 1. Group seats by row
  const seatsByRow = {};
  event.seats?.forEach(seat => {
    if (!seatsByRow[seat.row]) {
      seatsByRow[seat.row] = [];
    }
    seatsByRow[seat.row].push(seat);
  });

  // 2. Sort row labels alphabetically
  const sortedRowLabels = Object.keys(seatsByRow).sort((a, b) => a.localeCompare(b));

  // 3. Sort seat numbers numerically within each row
  sortedRowLabels.forEach(row => {
    seatsByRow[row].sort((a, b) => a.number - b.number);
  });

  // Count available seats
  const totalSeats = event.seats?.length || 0;
  const availableSeats = event.seats?.filter(s => s.status === 'available').length || 0;

  return (
    <div className="space-y-10 max-w-7xl mx-auto py-6 px-4">
      {/* Event Details Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row gap-8 shadow-xl">
        {event.posterUrl && (
          <div className="w-full md:w-60 h-80 bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow flex-shrink-0 flex items-center justify-center">
            <img 
              src={event.posterUrl} 
              alt={event.title}
              className="object-cover w-full h-full"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          </div>
        )}
        <div className="flex-grow flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex flex-wrap justify-between items-start gap-4">
              <div>
                <h1 className="text-3xl font-extrabold text-white leading-tight">{event.title}</h1>
                <p className="text-gray-400 mt-2 flex items-center text-sm">
                  📍 {event.venue?.name} — {event.venue?.location}
                </p>
              </div>
              <div className="bg-indigo-600/20 text-indigo-400 border border-indigo-500/20 px-4 py-2 rounded-xl">
                <span className="text-xs block text-center text-gray-400">Base Ticket Price</span>
                <span className="text-xl font-bold block text-center">₹{event.basePrice}</span>
              </div>
            </div>

            {event.description && (
              <p className="text-gray-300 text-sm leading-relaxed border-t border-slate-800 pt-4">
                {event.description}
              </p>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 border-t border-slate-800 pt-4 text-sm text-gray-400">
              <div>
                <span className="block text-xs text-gray-500">Date</span>
                <strong className="text-white mt-0.5 block">
                  {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </strong>
              </div>
              <div>
                <span className="block text-xs text-gray-500">Show Time</span>
                <strong className="text-white mt-0.5 block">{event.startTime} - {event.endTime}</strong>
              </div>
              <div>
                <span className="block text-xs text-gray-500">Seats Available</span>
                <strong className="text-white mt-0.5 block">{availableSeats} / {totalSeats} seats</strong>
              </div>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <Link to="/events" className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold transition-all">
              ← Browse Other Events
            </Link>
          </div>
        </div>
      </div>

      {/* Visual Seat Map */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 md:p-8 shadow-xl space-y-8">
        <div className="border-b border-slate-800 pb-5 flex flex-wrap justify-between items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-white">Choose Your Seats</h2>
            <p className="text-gray-400 text-xs mt-1">Select from the available seats on the layout grid below.</p>
          </div>

          {/* Seat Status Legend */}
          <div className="flex flex-wrap gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-slate-700 border border-slate-600 rounded-md block"></span>
              <span className="text-gray-300">Standard (Available)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-indigo-600 rounded-md block"></span>
              <span className="text-gray-300">Premium (Available)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-amber-500 rounded-md block"></span>
              <span className="text-gray-300">Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-4 h-4 bg-red-600 rounded-md block"></span>
              <span className="text-gray-300">Booked</span>
            </div>
          </div>
        </div>

        {/* Curved Screen projection marker */}
        <div className="max-w-md mx-auto text-center space-y-2">
          <div className="w-full h-1 bg-gradient-to-r from-transparent via-slate-700 to-transparent rounded-full shadow-[0_4px_12px_rgba(255,255,255,0.05)]"></div>
          <span className="text-[10px] text-gray-500 uppercase tracking-widest block">STAGE / SCREEN THIS WAY</span>
        </div>

        {/* Scrollable grid wrapper */}
        <div className="overflow-x-auto pb-4 max-w-full flex justify-center">
          <div className="inline-block min-w-max px-4">
            <div className="space-y-3">
              {sortedRowLabels.map(rowLabel => (
                <div key={rowLabel} className="flex gap-3 items-center">
                  {/* Row Name label */}
                  <span className="w-6 text-sm font-bold text-gray-400 text-center select-none mr-2">
                    {rowLabel}
                  </span>
                  
                  {/* Seats in this row */}
                  {seatsByRow[rowLabel].map(seat => {
                    const isPremium = seat.category?.toLowerCase() === 'premium';
                    const isAvailable = seat.status === 'available';
                    const isReserved = seat.status === 'reserved';
                    const isBooked = seat.status === 'booked';

                    let buttonClass = "";
                    if (isAvailable) {
                      buttonClass = isPremium 
                        ? "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer" 
                        : "bg-slate-700 hover:bg-slate-600 text-gray-200 cursor-pointer";
                    } else if (isReserved) {
                      buttonClass = "bg-amber-500 text-white opacity-50 cursor-not-allowed";
                    } else if (isBooked) {
                      buttonClass = "bg-red-600 text-white opacity-50 cursor-not-allowed";
                    }

                    return (
                      <button
                        key={seat.seatId}
                        disabled={!isAvailable}
                        title={`Seat ${seat.seatId} (${seat.category}) - ${seat.status}`}
                        className={`w-10 h-10 rounded-lg text-xs font-semibold flex items-center justify-center transition-all select-none border border-slate-900/10 active:scale-95 ${buttonClass}`}
                      >
                        {seat.number}
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
