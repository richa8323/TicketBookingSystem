export default function Footer() {
  return (
    <footer className="bg-slate-950 text-gray-400 py-6 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-sm">
        <p>&copy; {new Date().getFullYear()} TicketPass Booking System. All rights reserved.</p>
        <p className="mt-2 text-gray-600">Built for academic assignment - production ready architecture.</p>
      </div>
    </footer>
  );
}
