import { useEffect, useState } from 'react';
import axios from 'axios';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError('');
      
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE}/api/organiser/dashboard`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setStats(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard analytics.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        <span className="text-gray-400 text-sm">Loading dashboard analytics...</span>
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
            onClick={fetchDashboardStats}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats || stats.eventsCount === 0) {
    return (
      <div className="max-w-md mx-auto py-16 px-4 text-center space-y-6">
        <div className="w-20 h-20 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-4xl mx-auto text-gray-500 select-none shadow">
          📊
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-white">No analytics data available yet</h2>
          <p className="text-gray-400 text-sm">Create events and await customer bookings to view sales insights.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 py-6 max-w-7xl mx-auto px-4">
      <div>
        <h2 className="text-3xl font-extrabold text-white mb-2">Sales Dashboard</h2>
        <p className="text-gray-400 text-sm">Monitor event occupancy, seat bookings, and revenue metrics.</p>
      </div>

      {/* Summary Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow space-y-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total Revenue</span>
          <strong className="text-3xl font-extrabold text-emerald-400 block">₹{stats.revenue}</strong>
          <span className="text-xs text-slate-400 block">From confirmed sales</span>
        </div>

        {/* Tickets Sold */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow space-y-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Tickets Sold</span>
          <strong className="text-3xl font-extrabold text-white block">{stats.ticketsSold}</strong>
          <span className="text-xs text-slate-400 block">Seats booked globally</span>
        </div>

        {/* Total Events */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow space-y-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Total Events</span>
          <strong className="text-3xl font-extrabold text-white block">{stats.eventsCount}</strong>
          <span className="text-xs text-slate-400 block">Active listed shows</span>
        </div>

        {/* Average Occupancy */}
        <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow space-y-3">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Average Occupancy</span>
          <strong className="text-3xl font-extrabold text-indigo-400 block">{stats.averageOccupancy}%</strong>
          <span className="text-xs text-slate-400 block">Booked capacity average</span>
        </div>
      </div>

      {/* Event Performance Grid */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-6">
        <div>
          <h3 className="text-xl font-bold text-white">Event Performance</h3>
          <p className="text-gray-400 text-xs mt-1">Breakdown of metrics for individual event listings.</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4 font-semibold">Event Title</th>
                <th className="py-3 px-4 font-semibold">Date</th>
                <th className="py-3 px-4 font-semibold">Tickets Sold</th>
                <th className="py-3 px-4 font-semibold">Total Seats</th>
                <th className="py-3 px-4 font-semibold">Occupancy %</th>
                <th className="py-3 px-4 font-semibold text-right">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-300">
              {stats.eventPerformance.map((item) => (
                <tr key={item._id} className="hover:bg-slate-950/20 transition-colors">
                  <td className="py-4 px-4 font-bold text-white">{item.title}</td>
                  <td className="py-4 px-4">{new Date(item.date).toLocaleDateString()}</td>
                  <td className="py-4 px-4 font-semibold">{item.ticketsSold}</td>
                  <td className="py-4 px-4 text-slate-400">{item.totalSeats}</td>
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-2">
                      <span className="w-10 font-semibold">{item.occupancyPercent}%</span>
                      <div className="w-16 h-1.5 bg-slate-950 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-indigo-500 rounded-full" 
                          style={{ width: `${Math.min(100, item.occupancyPercent)}%` }}
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4 text-right font-bold text-emerald-400">₹{item.revenue}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
