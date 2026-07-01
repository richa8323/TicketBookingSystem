import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function EventDetails() {
  const { eventId } = useParams();
  const { user } = useAuth();
  
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Timer States
  const [reservationExpiry, setReservationExpiry] = useState(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [bookingSuccess, setBookingSuccess] = useState(null);

  const fetchEventDetails = async () => {
    try {
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

  useEffect(() => {
    setLoading(true);
    fetchEventDetails();
  }, [eventId]);

  // Countdown timer logic
  useEffect(() => {
    if (!reservationExpiry) return;

    const interval = setInterval(() => {
      const remaining = Math.max(0, Math.round((reservationExpiry - Date.now()) / 1000));
      setTimeLeft(remaining);
      
      if (remaining === 0) {
        setReservationExpiry(null);
        setSelectedSeats([]);
        setSuccess('');
        setFormError('Your temporary reservation has expired. Please select seats again.');
        fetchEventDetails();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [reservationExpiry]);

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

  // Group and sort seats
  const seatsByRow = {};
  event.seats?.forEach(seat => {
    if (!seatsByRow[seat.row]) {
      seatsByRow[seat.row] = [];
    }
    seatsByRow[seat.row].push(seat);
  });

  const sortedRowLabels = Object.keys(seatsByRow).sort((a, b) => a.localeCompare(b));

  sortedRowLabels.forEach(row => {
    seatsByRow[row].sort((a, b) => a.number - b.number);
  });

  // Capacity Stats
  const totalSeats = event.seats?.length || 0;
  const availableSeats = event.seats?.filter(s => s.status === 'available').length || 0;

  // Seat Click Handler
  const handleSeatClick = (seat) => {
    // If seats are currently locked in reservation checkout, freeze clicks
    if (reservationExpiry) return;

    setSelectedSeats(prev => {
      if (prev.find(s => s.seatId === seat.seatId)) {
        return prev.filter(s => s.seatId !== seat.seatId);
      } else {
        return [...prev, seat];
      }
    });
  };

  // Price Computations
  const getSeatPrice = (seat) => {
    const category = event.venue?.seatCategories?.find(cat => cat.name === seat.category);
    const multiplier = category ? category.priceMultiplier : 1.0;
    return event.basePrice * multiplier;
  };

  const totalPrice = selectedSeats.reduce((sum, seat) => sum + getSeatPrice(seat), 0);

  // Reserve Handler
  const handleReserveSeats = async () => {
    if (selectedSeats.length === 0) return;
    try {
      setFormLoading(true);
      setFormError('');
      setSuccess('');
      
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_BASE}/api/events/${eventId}/reserve`,
        { seatIds: selectedSeats.map(s => s.seatId) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { expiresInSeconds } = response.data.data;
      setReservationExpiry(Date.now() + expiresInSeconds * 1000);
      setSuccess('Seats reserved successfully! Complete your booking before the timer runs out.');
      
      // Refresh backend layout state to lock standard selection views
      fetchEventDetails();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to reserve selected seats.');
    } finally {
      setFormLoading(false);
    }
  };

  // Confirm and Book Handler
  const handleConfirmBooking = async () => {
    if (selectedSeats.length === 0 || !reservationExpiry) return;
    try {
      setFormLoading(true);
      setFormError('');
      
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
      const token = localStorage.getItem('token');
      
      const response = await axios.post(
        `${API_BASE}/api/bookings`,
        {
          eventId,
          seatIds: selectedSeats.map(s => s.seatId)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setBookingSuccess(response.data.data.booking);
      setReservationExpiry(null);
      setSelectedSeats([]);
      setSuccess('');
      fetchEventDetails();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Booking confirmation failed.');
      setReservationExpiry(null);
      setSelectedSeats([]);
      setSuccess('');
    } finally {
      setFormLoading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Visual Seat Map */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-8">
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
                <span className="w-4 h-4 bg-emerald-500 rounded-md block"></span>
                <span className="text-gray-300">Selected</span>
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
                      const isSelected = selectedSeats.some(s => s.seatId === seat.seatId);

                      let buttonClass = "";
                      if (isSelected) {
                        buttonClass = "bg-emerald-500 text-white cursor-pointer hover:bg-emerald-400 ring-2 ring-emerald-300";
                      } else if (isAvailable) {
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
                          disabled={!isAvailable || !!reservationExpiry}
                          onClick={() => handleSeatClick(seat)}
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

        {/* Checkout Summary / Booking Success Card */}
        {bookingSuccess ? (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit flex flex-col justify-between space-y-6">
            <div className="text-center space-y-4 py-4">
              <div className="mx-auto w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center text-3xl">
                ✓
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Booking Confirmed</h2>
                <p className="text-gray-400 text-xs mt-1">Thank you for your order!</p>
              </div>
            </div>

            <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl space-y-3 text-xs text-gray-300">
              <div className="flex justify-between">
                <span className="text-gray-500">Booking Ref:</span>
                <strong className="text-white font-mono text-sm">{bookingSuccess.bookingReference}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Event:</span>
                <span className="text-white text-right font-medium">{event.title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Seats Booked:</span>
                <span className="text-white font-bold">{bookingSuccess.seats.join(', ')}</span>
              </div>
              <div className="flex justify-between border-t border-slate-800 pt-3 text-sm">
                <span className="text-gray-400 font-semibold">Total Amount:</span>
                <strong className="text-white font-extrabold text-base">₹{bookingSuccess.totalAmount}</strong>
              </div>
            </div>

            <div className="space-y-3">
              <Link
                to="/events"
                className="block w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs text-center rounded-xl transition-all"
              >
                Browse Other Events
              </Link>
            </div>
          </div>
        ) : (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl h-fit flex flex-col justify-between space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Booking Summary</h2>
              <p className="text-gray-400 text-xs">Review your selected seat positions and pricing.</p>
              
              {formError && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs mt-4">
                  {formError}
                </div>
              )}

              {success && (
                <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-3 rounded-lg text-xs mt-4">
                  {success}
                </div>
              )}

              {/* Hold Expiry Timer Panel */}
              {reservationExpiry && (
                <div className="bg-amber-500/10 border border-amber-500/25 p-3 rounded-xl flex items-center justify-between text-xs text-amber-400 mt-4">
                  <span className="font-medium">Hold Expiration Timer:</span>
                  <span className="font-bold text-sm bg-slate-950 px-2 py-0.5 rounded border border-amber-500/20">
                    {formatTime(timeLeft)}
                  </span>
                </div>
              )}

              {/* Selected Seats breakdown */}
              <div className="mt-6 border-t border-slate-800 pt-4 space-y-3">
                {selectedSeats.length === 0 ? (
                  <div className="text-center text-gray-500 text-xs py-4">
                    No seats selected. Click on available grid blocks to select.
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                      {selectedSeats.map(seat => (
                        <div key={seat.seatId} className="flex justify-between items-center text-xs bg-slate-950 border border-slate-850 p-2.5 rounded-lg">
                          <div>
                            <span className="font-bold text-white text-sm mr-2">{seat.seatId}</span>
                            <span className="text-[10px] text-indigo-400 px-1.5 py-0.5 bg-indigo-900/30 rounded border border-indigo-900/30">
                              {seat.category}
                            </span>
                          </div>
                          <span className="text-white font-semibold">₹{getSeatPrice(seat)}</span>
                        </div>
                      ))}
                    </div>

                    <div className="border-t border-slate-800 pt-3 flex justify-between items-center text-sm">
                      <span className="text-gray-400 font-medium">Subtotal ({selectedSeats.length} seats):</span>
                      <span className="text-xl font-bold text-white">₹{totalPrice}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="pt-2">
              {!user ? (
                <Link 
                  to="/login"
                  className="block w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs text-center rounded-xl shadow transition-all active:scale-[0.98]"
                >
                  Log In to Book Tickets
                </Link>
              ) : user.role !== 'Customer' ? (
                <button 
                  disabled 
                  className="w-full py-2.5 bg-slate-800 text-gray-500 font-semibold text-xs rounded-xl border border-slate-700 cursor-not-allowed"
                >
                  Only Customers Can Book
                </button>
              ) : reservationExpiry ? (
                <button
                  disabled={formLoading}
                  onClick={handleConfirmBooking}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow transition-all disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {formLoading ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Processing Payment...</span>
                    </>
                  ) : (
                    <span>Confirm & Pay (₹{totalPrice})</span>
                  )}
                </button>
              ) : (
                <button
                  disabled={selectedSeats.length === 0 || formLoading}
                  onClick={handleReserveSeats}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs rounded-xl shadow transition-all disabled:opacity-50 active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  {formLoading ? (
                    <>
                      <div className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                      <span>Reserving...</span>
                    </>
                  ) : (
                    <span>Lock & Reserve Seats</span>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
