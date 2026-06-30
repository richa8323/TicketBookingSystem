import { useEffect, useState } from 'react';
import venueService from '../../services/venueService';

export default function Venues() {
  const [venues, setVenues] = useState([]);
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [rows, setRows] = useState('');
  const [cols, setCols] = useState('');
  const [categories, setCategories] = useState([
    { name: 'Premium', priceMultiplier: 1.5 },
    { name: 'Standard', priceMultiplier: 1.0 }
  ]);
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

  const handleAddCategory = () => {
    setCategories([...categories, { name: '', priceMultiplier: 1.0 }]);
  };

  const handleRemoveCategory = (index) => {
    if (categories.length === 1) {
      setFormError('At least one seat category is required.');
      return;
    }
    setCategories(categories.filter((_, i) => i !== index));
  };

  const handleCategoryChange = (index, field, value) => {
    const updated = categories.map((cat, i) => {
      if (i === index) {
        return { 
          ...cat, 
          [field]: field === 'priceMultiplier' ? value : value 
        };
      }
      return cat;
    });
    setCategories(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !location || !rows || !cols) {
      setFormError('Please fill in all general fields.');
      return;
    }

    const rowsNum = parseInt(rows, 10);
    const colsNum = parseInt(cols, 10);

    if (isNaN(rowsNum) || rowsNum <= 0 || isNaN(colsNum) || colsNum <= 0) {
      setFormError('Rows and columns must be positive numbers.');
      return;
    }

    // Validate seat categories
    if (categories.length === 0) {
      setFormError('At least one seat category is required.');
      return;
    }

    const cleanCategories = [];
    const categoryNamesSet = new Set();

    for (const cat of categories) {
      const cleanName = cat.name.trim();
      if (!cleanName) {
        setFormError('Seat category name cannot be empty.');
        return;
      }
      if (categoryNamesSet.has(cleanName.toLowerCase())) {
        setFormError(`Duplicate seat category name detected: ${cleanName}`);
        return;
      }
      categoryNamesSet.add(cleanName.toLowerCase());

      const multiplier = parseFloat(cat.priceMultiplier);
      if (isNaN(multiplier) || multiplier <= 0) {
        setFormError(`Price multiplier for "${cleanName}" must be a positive number.`);
        return;
      }

      cleanCategories.push({
        name: cleanName,
        priceMultiplier: multiplier
      });
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
        seatCategories: cleanCategories
      };

      await venueService.createVenue(payload);
      
      setSuccess('Venue created successfully!');
      setName('');
      setLocation('');
      setRows('');
      setCols('');
      setCategories([
        { name: 'Premium', priceMultiplier: 1.5 },
        { name: 'Standard', priceMultiplier: 1.0 }
      ]);
      
      // Refresh the venues list
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
                placeholder="e.g. PVR IMAX"
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
                placeholder="e.g. New Delhi"
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
                  placeholder="e.g. 10"
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
                  placeholder="e.g. 12"
                  value={cols}
                  onChange={(e) => setCols(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  disabled={formLoading}
                />
              </div>
            </div>

            {/* Custom Seat Categories */}
            <div className="space-y-3 pt-2">
              <div className="flex justify-between items-center">
                <label className="block text-sm font-medium text-gray-300">Seat Categories</label>
                <button
                  type="button"
                  onClick={handleAddCategory}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
                  disabled={formLoading}
                >
                  + Add Category
                </button>
              </div>

              <div className="space-y-2">
                {categories.map((cat, index) => (
                  <div key={index} className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="Category Name"
                      value={cat.name}
                      onChange={(e) => handleCategoryChange(index, 'name', e.target.value)}
                      className="flex-grow min-w-0 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      disabled={formLoading}
                    />
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Multiplier"
                      value={cat.priceMultiplier}
                      onChange={(e) => handleCategoryChange(index, 'priceMultiplier', e.target.value)}
                      className="w-20 px-2 py-1.5 bg-slate-950 border border-slate-700 rounded-md text-white text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      disabled={formLoading}
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(index)}
                      className="p-1.5 text-red-500 hover:text-red-400 hover:bg-red-500/10 rounded-md transition-colors"
                      disabled={formLoading}
                      title="Remove category"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <button
              type="submit"
              disabled={formLoading}
              className="w-full py-2 mt-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm rounded-lg shadow transition-colors disabled:opacity-50 active:scale-[0.98]"
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
                    <div className="flex justify-between items-start">
                      <h3 className="text-lg font-bold text-white leading-tight">{venue.name}</h3>
                      <span className="text-[10px] bg-slate-950 px-2 py-0.5 rounded text-indigo-400 border border-slate-800 uppercase font-semibold">
                        {venue.seatCategories?.length || 0} Cats
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1 flex items-center">📍 {venue.location}</p>
                    
                    {/* Render Category badges */}
                    <div className="mt-3 flex flex-wrap gap-1">
                      {venue.seatCategories?.map((cat, i) => (
                        <span key={i} className="text-[10px] bg-slate-950 border border-slate-800 text-gray-300 px-1.5 py-0.5 rounded">
                          {cat.name} ({cat.priceMultiplier}x)
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="border-t border-slate-800 pt-3 mt-4 flex justify-between items-center text-xs text-gray-400">
                    <span>Grid: <strong className="text-white">{venue.rows}x{venue.cols}</strong></span>
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
