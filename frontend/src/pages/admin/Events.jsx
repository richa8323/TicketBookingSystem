import { useEffect, useState } from 'react';
import eventService from '../../services/eventService';
import venueService from '../../services/venueService';

export default function Events() {
  const [events, setEvents] = useState([]);
  const [venues, setVenues] = useState([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedVenue, setSelectedVenue] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [basePrice, setBasePrice] = useState('');
  const [posterUrl, setPosterUrl] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [eventsRes, venuesRes] = await Promise.all([
        eventService.getEvents(),
        venueService.getVenues()
      ]);
      
      setEvents(eventsRes.data.events || []);
      setVenues(venuesRes.data.venues || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve events or venues data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !selectedVenue || !date || !startTime || !endTime || !basePrice) {
      setFormError('Please fill in all required fields.');
      return;
    }

    const priceNum = parseFloat(basePrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      setFormError('Base ticket price must be a positive number.');
      return;
    }

    // Time validation check (endTime must be after startTime)
    const timeToMinutes = (timeStr) => {
      const parts = timeStr.split(':');
      return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
    };

    if (timeToMinutes(endTime) <= timeToMinutes(startTime)) {
      setFormError('End time must be chronologically after the start time.');
      return;
    }

    try {
      setFormError('');
      setSuccess('');
      setFormLoading(true);

      const payload = {
        title,
        description,
        venue: selectedVenue,
        date,
        startTime,
        endTime,
        basePrice: priceNum,
        posterUrl
      };

      await eventService.createEvent(payload);

      setSuccess('Event scheduled successfully!');
      setTitle('');
      setDescription('');
      setSelectedVenue('');
      setDate('');
      setStartTime('');
      setEndTime('');
      setBasePrice('');
      setPosterUrl('');

      // Refresh list
      fetchData();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to schedule event.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-3xl font-bold text-white">Event Management</h1>
        <p className="text-gray-400 text-sm mt-1">Schedule and manage your shows, movies, and live bookings.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Event Form */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-md h-fit">
          <h2 className="text-xl font-bold text-white mb-4">Schedule New Event</h2>

          {formError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm mb-4">
              {formError}
            </div>
          )}

          {success && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-sm mb-4">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Event Title *</label>
              <input
                type="text"
                placeholder="e.g. Avengers Endgame"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={formLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
              <textarea
                placeholder="Brief event description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
                disabled={formLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Select Venue *</label>
              <select
                value={selectedVenue}
                onChange={(e) => setSelectedVenue(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={formLoading}
              >
                <option value="">-- Choose a Venue --</option>
                {venues.map((venue) => (
                  <option key={venue._id} value={venue._id}>
                    {venue.name} ({venue.location})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Date *</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={formLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Start Time *</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={formLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">End Time *</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={formLoading}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Base Price (INR) *</label>
              <input
                type="number"
                placeholder="e.g. 300"
                value={basePrice}
                onChange={(e) => setBasePrice(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={formLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Poster Image URL</label>
              <input
                type="text"
                placeholder="https://example.com/poster.jpg"
                value={posterUrl}
                onChange={(e) => setPosterUrl(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={formLoading}
              />
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full py-2 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg shadow transition-colors disabled:opacity-50 active:scale-[0.98]"
            >
              {formLoading ? 'Scheduling...' : 'Schedule Event'}
            </button>
          </form>
        </div>

        {/* Events List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-white">Scheduled Events</h2>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-gray-400 text-sm">Loading scheduled events...</div>
          ) : events.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl text-center text-gray-400 text-sm">
              No scheduled events found. Select a venue and schedule one using the form.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {events.map((event) => (
                <div key={event._id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm flex flex-col md:flex-row gap-5">
                  {event.posterUrl && (
                    <div className="w-full md:w-24 h-36 md:h-auto bg-slate-950 border border-slate-800 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center">
                      <img 
                        src={event.posterUrl} 
                        alt={event.title}
                        className="object-cover w-full h-full"
                        onError={(e) => { e.target.style.display = 'none'; }}
                      />
                    </div>
                  )}
                  <div className="flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex justify-between items-start gap-4">
                        <h3 className="text-xl font-bold text-white leading-tight">{event.title}</h3>
                        <span className="bg-emerald-950 text-emerald-400 border border-emerald-900 px-2 py-0.5 rounded text-xs font-semibold whitespace-nowrap">
                          INR {event.basePrice}
                        </span>
                      </div>
                      {event.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{event.description}</p>
                      )}
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2 mt-4 text-xs text-gray-400">
                        <div className="flex items-center">
                          <span className="mr-1.5">📍</span>
                          <span>Venue: <strong className="text-white">{event.venue?.name || 'Unknown Venue'}</strong></span>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-1.5">📅</span>
                          <span>Date: <strong className="text-white">{new Date(event.date).toISOString().split('T')[0]}</strong></span>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-1.5">⏰</span>
                          <span>Time: <strong className="text-white">{event.startTime} - {event.endTime}</strong></span>
                        </div>
                        <div className="flex items-center">
                          <span className="mr-1.5">🎟️</span>
                          <span>Total Capacity: <strong className="text-white">{(event.venue?.rows * event.venue?.cols) || 0} seats</strong></span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
