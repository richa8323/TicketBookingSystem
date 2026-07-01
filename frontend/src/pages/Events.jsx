import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Build query params for search filtering
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (selectedVenue) params.venue = selectedVenue;
      if (selectedDate) params.date = selectedDate;

      // Fetch events (filtered) and venues (for the dropdown list)
      const [eventsRes, venuesRes] = await Promise.all([
        axios.get(`${API_BASE}/api/events`, { params }),
        axios.get(`${API_BASE}/api/venues`) // This is protected or public? Wait, venues is public read!
      ]);

      setEvents(eventsRes.data.data.events || []);
      setVenues(venuesRes.data.data.venues || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load events data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Debounce search a bit or trigger on filter updates
    const delayDebounceFn = setTimeout(() => {
      fetchData();
    }, 200);

    return () => clearTimeout(delayDebounceFn);
  }, [search, selectedVenue, selectedDate]);

  return (
    <div className="space-y-8 py-6">
      <div>
        <h2 className="text-3xl font-extrabold text-white mb-2">Upcoming Events</h2>
        <p className="text-gray-400 text-sm">
          Explore live concerts, theater acts, sports games, and tech conferences near you.
        </p>
      </div>

      {/* Filter and Search Panel */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900 border border-slate-800 p-4 rounded-xl shadow-md">
        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Search By Title</label>
          <input
            type="text"
            placeholder="e.g. Avengers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Filter By Venue</label>
          <select
            value={selectedVenue}
            onChange={(e) => setSelectedVenue(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          >
            <option value="">All Venues</option>
            {venues.map((venue) => (
              <option key={venue._id} value={venue._id}>
                {venue.name} ({venue.location})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Filter By Date</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Events Listing */}
      {loading ? (
        <div className="text-gray-400 text-sm text-center py-10">Loading events list...</div>
      ) : events.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 p-12 rounded-xl text-center text-gray-400 text-sm shadow">
          No matching upcoming events found. Try adjusting your search filters.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-fadeIn">
          {events.map((event) => {
            const seatsLeft = event.seats?.filter(s => s.status === 'available').length || 0;
            return (
              <div key={event._id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between group">
                <div>
                  <div className="h-44 bg-slate-950 flex items-center justify-center text-gray-500 relative border-b border-slate-800 overflow-hidden">
                    {event.posterUrl ? (
                      <img 
                        src={event.posterUrl} 
                        alt={event.title}
                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    ) : (
                      <span className="text-xs uppercase tracking-wider text-gray-600 font-bold">🎟️ Show Image</span>
                    )}
                    <span className="absolute top-3 right-3 bg-indigo-900/80 text-indigo-300 border border-indigo-700 px-2 py-0.5 rounded text-[10px] font-bold">
                      {event.venue?.name}
                    </span>
                  </div>
                  
                  <div className="p-5">
                    <span className="inline-block text-[10px] font-bold tracking-widest text-indigo-400 uppercase mb-2">
                      {event.venue?.location}
                    </span>
                    <h3 className="text-lg font-bold text-white mb-2 leading-tight line-clamp-1">{event.title}</h3>
                    {event.description && (
                      <p className="text-gray-400 text-xs mb-4 line-clamp-2">{event.description}</p>
                    )}
                    
                    <div className="space-y-1.5 border-t border-slate-800 pt-3 text-[11px] text-gray-400">
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <strong className="text-white">{new Date(event.date).toISOString().split('T')[0]}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Time:</span>
                        <strong className="text-white">{event.startTime} - {event.endTime}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Seats Remaining:</span>
                        <strong className="text-white">{seatsLeft} seats left</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="px-5 pb-5 pt-2">
                  <Link 
                    to={`/events/${event._id}`}
                    className="block w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs text-center rounded-lg shadow transition-all active:scale-[0.98]"
                  >
                    View Layout & Book (₹{event.basePrice})
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
