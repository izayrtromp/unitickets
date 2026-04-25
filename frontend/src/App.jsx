import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import ResendVerification from './pages/ResendVerification';
import VerifyEmail from './pages/VerifyEmail';
import Dashboard from './pages/Dashboard';
import TicketDetail from './pages/TicketDetail';
import AdminUsers from './pages/AdminUsers';
import Tasks from './pages/Tasks';
import Meetings from './pages/Meetings';
import MeetingDetail from './pages/MeetingDetail';

const PrivateRoute = ({ children, roles }) => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  return children;
};

const FullScreenLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="flex flex-col items-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      <p className="mt-4 text-gray-500 font-medium">Loading...</p>
    </div>
  </div>
);

function App() {
  const { loading } = useAuth();

  if (loading) return <FullScreenLoader />;

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/resend-verification" element={<ResendVerification />} />
        <Route path="/verify-email" element={<VerifyEmail />} />
        
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="tickets/:id" element={<TicketDetail />} />
          <Route path="tasks" element={<PrivateRoute roles={['CLASS_REP', 'ADMIN']}><Tasks /></PrivateRoute>} />
          <Route path="meetings" element={<PrivateRoute roles={['CLASS_REP', 'ADMIN']}><Meetings /></PrivateRoute>} />
          <Route path="meetings/:id" element={<PrivateRoute roles={['CLASS_REP', 'ADMIN']}><MeetingDetail /></PrivateRoute>} />
          <Route path="admin/users" element={<PrivateRoute roles={['ADMIN']}><AdminUsers /></PrivateRoute>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
