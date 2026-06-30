import { useEffect, useState } from 'react';
import venueService from '../../services/venueService';

export default function Venues() {
  const [venues, setVenues] = useState([]);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [rows, setRows] = useState('');
  const [cols, setCols] = useState('');
  const [loading, setLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');

  const fetchVenues = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await venueService.getVenues();
      setVenues(response.data.venues || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch venues from the server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !location || !rows || !cols) {
      setFormError('Please fill in all fields.');
      return;
    }

    const rowsNum = parseInt(rows, 10);
    const colsNum = parseInt(cols, 10);

    if (isNaN(rowsNum) || rowsNum <= 0 || isNaN(colsNum) || colsNum <= 0) {
      setFormError('Rows and columns must be positive numbers.');
      return;
    }

    try {
      setFormError('');
      setSuccess('');
      setFormLoading(true);

      const payload = {
        name,
        location,
        rows: rowsNum,
        cols: colsNum,
        seatCategories: [
          { name: 'Premium', priceMultiplier: 1.5 },
          { name: 'Standard', priceMultiplier: 1.0 }
        ]
      };

      await venueService.createVenue(payload);
      
      setSuccess('Venue created successfully!');
      setName('');
      setLocation('');
      setRows('');
      setCols('');
      
      // Refresh the list after success
      fetchVenues();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create venue.');
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-10">
      <div className="border-b border-slate-800 pb-5">
        <h1 className="text-3xl font-bold text-white">Venue Management</h1>
        <p className="text-gray-400 text-sm mt-1">Create and manage your event locations and seat grids.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Create Venue Form */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-md h-fit">
          <h2 className="text-xl font-bold text-white mb-4">Create New Venue</h2>
          
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
              <label className="block text-sm font-medium text-gray-300 mb-1">Venue Name</label>
              <input
                type="text"
                placeholder="e.g. INOX Mall"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={formLoading}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Location</label>
              <input
                type="text"
                placeholder="e.g. Mumbai, MH"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={formLoading}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Rows</label>
                <input
                  type="number"
                  placeholder="e.g. 5"
                  value={rows}
                  onChange={(e) => setRows(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={formLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1">Columns</label>
                <input
                  type="number"
                  placeholder="e.g. 10"
                  value={cols}
                  onChange={(e) => setCols(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={formLoading}
                />
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-3 rounded-lg text-xs text-gray-400 space-y-1">
              <span className="font-semibold text-gray-300 block mb-1">Default Seat Categories Included:</span>
              <div className="flex justify-between"><span>Premium</span> <span>1.5x Price</span></div>
              <div className="flex justify-between"><span>Standard</span> <span>1.0x Price</span></div>
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg shadow transition-colors disabled:opacity-50"
            >
              {formLoading ? 'Creating...' : 'Create Venue'}
            </button>
          </form>
        </div>

        {/* Venues List */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-xl font-bold text-white">Existing Venues</h2>
          
          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {loading ? (
            <div className="text-gray-400 text-sm">Loading venues list...</div>
          ) : venues.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 p-8 rounded-xl text-center text-gray-400 text-sm">
              No venues found. Create one using the form.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {venues.map((venue) => (
                <div key={venue._id} className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-sm flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white">{venue.name}</h3>
                    <p className="text-xs text-gray-400 mt-1 flex items-center">📍 {venue.location}</p>
                  </div>
                  <div className="border-t border-slate-800 pt-3 mt-4 flex justify-between items-center text-xs text-gray-400">
                    <span>Layout: <strong className="text-white">{venue.rows}x{venue.cols}</strong></span>
                    <span className="bg-indigo-900/40 text-indigo-300 border border-indigo-850 px-2 py-0.5 rounded">
                      {venue.seats?.length || (venue.rows * venue.cols)} seats
                    </span>
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
