import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Events from './pages/Events';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import Venues from './pages/admin/Venues';
import AdminEvents from './pages/admin/Events';
import EventDetails from './pages/EventDetails';
import CustomerBookings from './pages/customer/CustomerBookings';
import TicketDetails from './pages/customer/TicketDetails';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
            <Route path="events" element={<Events />} />
            <Route path="events/:eventId" element={<EventDetails />} />
            
            {/* Protected Customer Routes */}
            <Route 
              path="customer/bookings" 
              element={
                <ProtectedRoute allowedRoles={['Customer']}>
                  <CustomerBookings />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="customer/tickets/:bookingId" 
              element={
                <ProtectedRoute allowedRoles={['Customer']}>
                  <TicketDetails />
                </ProtectedRoute>
              } 
            />
            
            {/* Protected Admin Routes */}
            <Route 
              path="admin/venues" 
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <Venues />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="admin/events" 
              element={
                <ProtectedRoute allowedRoles={['Admin']}>
                  <AdminEvents />
                </ProtectedRoute>
              } 
            />
            
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
