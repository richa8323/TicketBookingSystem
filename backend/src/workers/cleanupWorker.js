const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { connectDB } = require('../config/database');
const Event = require('../models/Event');

async function runCleanupLoop() {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    // 1. Query events having stale seat reservations
    const staleEvents = await Event.find({
      "seats.status": "reserved", 
      "seats.reservedAt": { $lt: fiveMinutesAgo }
    });

    for (const event of staleEvents) {
      // 2. Identify the specific seatIds that are stale
      const staleSeatIds = event.seats
        .filter(s => s.status === 'reserved' && s.reservedAt < fiveMinutesAgo)
        .map(s => s.seatId);

      if (staleSeatIds.length > 0) {
        // 3. Atomically release seats for this event
        await Event.updateOne(
          { _id: event._id },
          { 
            $set: { 
              "seats.$[elem].status": "available",
              "seats.$[elem].reservedBy": null,
              "seats.$[elem].reservedAt": null
            } 
          },
          { 
            arrayFilters: [{ "elem.seatId": { $in: staleSeatIds } }] 
          }
        );

        console.log(`[Cleanup Worker] Released ${staleSeatIds.length} stale seats for event ${event._id}`);

        // 4. Emit real-time releases via Socket.io
        const { getIO } = require('../utils/socket');
        const io = getIO();
        if (io) {
          const releasedSeats = staleSeatIds.map(id => ({
            seatId: id,
            status: 'available',
            reservedBy: null,
            reservedAt: null
          }));
          io.to(`event_${event._id}`).emit('seatStatusUpdate', {
            eventId: event._id.toString(),
            seats: releasedSeats
          });
        }
      }
    }
  } catch (err) {
    console.error('[Cleanup Worker] Error during lock sweep execution:', err);
  } finally {
    setTimeout(runCleanupLoop, 60000);
  }
}

// Start database connection and kick off loop
const init = async () => {
  await connectDB();
  console.log('[Cleanup Worker] Background reservation cleanup worker initialized.');
  runCleanupLoop();
};

init();
