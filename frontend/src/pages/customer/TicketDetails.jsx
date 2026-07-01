import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function TicketDetails() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      setError('');
      
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await axios.get(`${API_BASE}/api/bookings/${bookingId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setBooking(response.data.data.booking);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to retrieve ticket details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetails();
  }, [bookingId]);

  if (loading) {
    return (
      <div className="flex h-[60vh] flex-col items-center justify-center space-y-4">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
        <span className="text-gray-400 text-sm">Loading ticket details...</span>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-bold mb-2">Error</h2>
          <p className="text-sm mb-4">{error || 'Ticket not found.'}</p>
          <Link to="/customer/bookings" className="inline-block px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm transition-colors">
            Back to Bookings
          </Link>
        </div>
      </div>
    );
  }

  const event = booking.event;
  const isConfirmed = booking.status === 'confirmed';

  return (
    <div className="max-w-3xl mx-auto py-6 px-4 space-y-8">
      {/* CSS Overrides for Printing (Hides Navigation Headers & Footers and centers the ticket stub) */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          header, footer, button, .print-hidden {
            display: none !important;
          }
          body {
            background-color: #0f172a !important;
            color: #f8fafc !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          main {
            padding: 0 !important;
            margin: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }
          .ticket-voucher {
            border: 2px dashed #334155 !important;
            box-shadow: none !important;
            background-color: #0f172a !important;
            margin-top: 40px !important;
          }
        }
      `}} />

      {/* Breadcrumb / Nav */}
      <div className="flex justify-between items-center print-hidden">
        <Link to="/customer/bookings" className="text-sm text-indigo-400 hover:text-indigo-300 font-semibold transition-colors">
          ← Back to Booking History
        </Link>
        <button 
          onClick={() => window.print()}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow transition-all active:scale-[0.98]"
        >
          Print Ticket
        </button>
      </div>

      {/* Ticket Voucher Stub */}
      <div className="ticket-voucher bg-slate-900 border-2 border-slate-800 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-800">
        
        {/* Main Ticket Area */}
        <div className="flex-grow p-8 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex justify-between items-start gap-4">
              <div>
                <span className="inline-block text-[10px] font-bold tracking-widest text-indigo-400 uppercase">
                  📍 {event.venue?.name}
                </span>
                <h1 className="text-3xl font-extrabold text-white leading-tight mt-1">{event.title}</h1>
                <p className="text-slate-400 text-xs mt-1">{event.venue?.location}</p>
              </div>
            </div>

            {event.description && (
              <p className="text-slate-300 text-xs leading-relaxed border-t border-slate-850 pt-4">
                {event.description}
              </p>
            )}

            <div className="grid grid-cols-2 gap-4 border-t border-slate-850 pt-4 text-xs text-slate-400">
              <div>
                <span className="block text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Date</span>
                <strong className="text-white mt-1 block">
                  {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </strong>
              </div>
              <div>
                <span className="block text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Show Time</span>
                <strong className="text-white mt-1 block">{event.startTime} - {event.endTime}</strong>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-850 pt-4 text-[10px] text-slate-500 flex justify-between select-none">
            <span>Powered by TicketPass Systems</span>
            <span>Security ID: {booking._id}</span>
          </div>
        </div>

        {/* Access Receipt / Stub */}
        <div className="w-full md:w-72 bg-slate-950 p-8 flex flex-col justify-between space-y-6 md:space-y-0">
          <div className="space-y-5">
            <div className="flex justify-between items-start">
              <div>
                <span className="block text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Booking Ref</span>
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

            {/* Handcrafted Mock QR Code scanner checkin placeholder */}
            <div className="w-32 h-32 bg-white p-2 rounded-xl border border-slate-200 flex flex-col items-center justify-center space-y-1.5 shadow mx-auto">
              <div className="w-24 h-24 bg-slate-950 rounded flex flex-col justify-between p-1.5">
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-2 border-white rounded-sm"></div>
                  <div className="w-5 h-5 border-2 border-white rounded-sm"></div>
                </div>
                <div className="flex justify-center">
                  <div className="w-8 h-8 border border-dashed border-white/40 flex items-center justify-center text-[10px] text-white/50 font-mono">
                    QR
                  </div>
                </div>
                <div className="flex justify-between">
                  <div className="w-5 h-5 border-2 border-white rounded-sm"></div>
                  <div className="w-2 h-2 bg-white rounded-sm"></div>
                </div>
              </div>
              <span className="text-[9px] text-slate-800 uppercase tracking-widest font-extrabold">QR Check-In</span>
            </div>

            <div className="flex justify-between border-t border-slate-900 pt-4">
              <div>
                <span className="block text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Seats</span>
                <span className="text-white font-bold text-xs mt-0.5 block">{booking.seats.join(', ')}</span>
              </div>
              <div className="text-right">
                <span className="block text-slate-500 text-[10px] uppercase tracking-wider font-semibold">Total Paid</span>
                <span className="text-white font-extrabold text-sm mt-0.5 block">₹{booking.totalAmount}</span>
              </div>
            </div>
          </div>

          <div className="md:pt-4 border-t border-slate-900 flex justify-between items-center text-[10px] text-slate-500">
            <span>Booked: {new Date(booking.createdAt).toLocaleDateString()}</span>
            <Link to="/events" className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors print-hidden">
              Buy More →
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
