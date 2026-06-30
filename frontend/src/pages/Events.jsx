export default function Events() {
  return (
    <div className="py-6">
      <h2 className="text-3xl font-extrabold text-white mb-6">Upcoming Events</h2>
      <p className="text-gray-400 mb-8">
        Explore a variety of live music, sports, tech conferences, and theater events.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((item) => (
          <div key={item} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg opacity-75">
            <div className="h-48 bg-slate-800 flex items-center justify-center text-gray-500">
              <span>Event Banner Placeholder</span>
            </div>
            <div className="p-6">
              <span className="inline-block text-xs font-semibold tracking-wider text-indigo-400 uppercase mb-2">Category</span>
              <h3 className="text-xl font-bold text-white mb-2">Live Academic Concert #{item}</h3>
              <p className="text-gray-400 text-sm mb-4">Experience standard layouts, waitlist operations, and real-time seat locks.</p>
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>Date: TBD</span>
                <span className="font-semibold text-white">Price: $99</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
