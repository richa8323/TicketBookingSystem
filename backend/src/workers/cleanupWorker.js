const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const { connectDB } = require('../config/database');
const Event = require('../models/Event');

async function runCleanupLoop() {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    const result = await Event.updateMany(
      { 
        "seats.status": "reserved", 
        "seats.reservedAt": { $lt: fiveMinutesAgo } 
      },
      { 
        $set: { 
          "seats.$[elem].status": "available",
          "seats.$[elem].reservedBy": null,
          "seats.$[elem].reservedAt": null
        } 
      },
      { 
        arrayFilters: [{ "elem.status": "reserved", "elem.reservedAt": { $lt: fiveMinutesAgo } }] 
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[Cleanup Worker] Releasing stale reservations: ${result.modifiedCount} events updated.`);
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
