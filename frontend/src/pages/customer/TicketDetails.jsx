import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

export default function TicketDetails() {
  const { bookingId } = useParams();
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState('');
  const [cancelError, setCancelError] = useState('');

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

  const handleCancelBooking = async () => {
    if (!window.confirm('Are you sure you want to cancel this booking? This will release your seats immediately.')) {
      return;
    }
    try {
      setCancelLoading(true);
      setCancelSuccess('');
      setCancelError('');
      
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await axios.patch(
        `${API_BASE}/api/bookings/${bookingId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setCancelSuccess(response.data.message || 'Booking cancelled successfully.');
      fetchTicketDetails();
    } catch (err) {
      setCancelError(err.response?.data?.message || 'Failed to cancel this booking.');
    } finally {
      setCancelLoading(false);
    }
  };

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
        <div className="flex gap-3">
          {booking.status === 'confirmed' && (
            <button
              disabled={cancelLoading}
              onClick={handleCancelBooking}
              className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white font-semibold text-xs rounded-xl shadow transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {cancelLoading ? 'Cancelling...' : 'Cancel Ticket'}
            </button>
          )}
          {booking.status !== 'cancelled' && (
            <button 
              onClick={() => window.print()}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow transition-all active:scale-[0.98]"
            >
              Print Ticket
            </button>
          )}
        </div>
      </div>

      {/* Cancellation Alerts */}
      {(cancelError || cancelSuccess) && (
        <div className="space-y-3 print-hidden">
          {cancelError && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3.5 rounded-xl text-xs">
              {cancelError}
            </div>
          )}
          {cancelSuccess && (
            <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3.5 rounded-xl text-xs">
              {cancelSuccess}
            </div>
          )}
        </div>
      )}

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

            {/* Real QR Code / Scanner Check-in Section */}
            <div className="relative w-32 h-32 bg-white p-2 rounded-xl border border-slate-200 flex flex-col items-center justify-center shadow mx-auto">
              {booking.qrCode ? (
                <img 
                  src={booking.qrCode} 
                  alt="Check-in QR Code"
                  className={`w-24 h-24 object-contain select-none pointer-events-none ${
                    !isConfirmed ? 'opacity-20 grayscale' : ''
                  }`}
                />
              ) : (
                <div className="w-24 h-24 bg-slate-100 flex items-center justify-center text-slate-400 text-[10px] font-mono text-center">
                  QR Code Unavailable
                </div>
              )}
              {!isConfirmed && (
                <div className="absolute inset-0 flex items-center justify-center select-none pointer-events-none">
                  <span className="text-red-600 font-extrabold text-sm uppercase tracking-wider bg-slate-950 border border-red-600/30 px-2 py-0.5 rounded rotate-12">
                    VOID
                  </span>
                </div>
              )}
              <span className="text-[9px] text-slate-800 uppercase tracking-widest font-extrabold mt-1">QR Check-In</span>
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
