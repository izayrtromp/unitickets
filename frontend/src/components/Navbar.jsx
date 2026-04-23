import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Ticket, LogOut } from 'lucide-react';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <Ticket className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900">UniTickets</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            {user?.role === 'ADMIN' && (
              <Link to="/admin/users" className="text-gray-500 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Users
              </Link>
            )}
            {user && (
              <>
                <span className="text-sm text-gray-700 font-medium">
                  {user.name} <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full uppercase ml-1">{user.role.replace('_', ' ')}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
