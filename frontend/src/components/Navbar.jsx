import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { Ticket, LogOut, Bell, AlertCircle, Sun, Moon } from 'lucide-react';
import api from '../api/axios';
import { formatRelativeTime } from '../utils/format';
import ReportIssueModal from './ReportIssueModal';

const Navbar = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [error, setError] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(''), 3000);
    return () => clearTimeout(t);
  }, [error]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const handleRefresh = () => fetchNotifications();
      window.addEventListener('refreshNotifications', handleRefresh);
      return () => window.removeEventListener('refreshNotifications', handleRefresh);
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data);
    } catch (err) {
      // silently fail for polling
    }
  };

  const markAsRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to mark notification as read');
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, read: true })));
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to mark all as read');
    }
  };

  const handleNotificationClick = (n) => {
    if (!n.read) markAsRead(n.id);
    setShowDropdown(false);
    if (n.ticketId) {
      let url = `/tickets/${n.ticketId}`;
      if (n.commentId) {
        url += `?commentId=${n.commentId}`;
      } else if (n.activityId) {
        url += `?activityId=${n.activityId}`;
      } else if (n.targetSection) {
        url += `?section=${n.targetSection}`;
      }
      navigate(url);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex-shrink-0 flex items-center">
              <Ticket className="h-8 w-8 text-primary-600" />
              <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white transition-colors">UniTickets</span>
            </Link>
          </div>
          <div className="flex items-center space-x-4">
            <Link to="/updates" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
              Updates
            </Link>
            {['CLASS_REP', 'ADMIN'].includes(user?.role) && (
              <>
                <Link to="/tasks" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Tasks
                </Link>
                <Link to="/meetings" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Meetings
                </Link>
              </>
            )}
            {user?.role === 'ADMIN' && (
              <>
                <Link to="/admin/users" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Users
                </Link>
                <Link to="/admin/audit-logs" className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors">
                  Audit Logs
                </Link>
              </>
            )}
            {user && (
              <>
                <button
                  onClick={() => setShowReportModal(true)}
                  className="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white px-3 py-1.5 rounded-md text-sm font-medium border border-gray-300 dark:border-gray-600 shadow-sm bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 mr-2 transition-all duration-150"
                >
                  <AlertCircle className="w-4 h-4" />
                  Report Issue
                </button>
                <div className="relative" ref={dropdownRef}>
                  <button 
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="p-2 relative rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none transition-colors"
                  >
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1 right-1 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
                    )}
                  </button>

                  {showDropdown && (
                    <div className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white dark:bg-gray-800 ring-1 ring-black ring-opacity-5 dark:ring-white dark:ring-opacity-10 z-50">
                      <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                        <h3 className="text-sm font-medium text-gray-900 dark:text-white">Notifications</h3>
                        {unreadCount > 0 && (
                          <button onClick={markAllAsRead} className="text-xs text-primary-600 hover:text-primary-800">
                            Mark all as read
                          </button>
                        )}
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {notifications.length === 0 ? (
                          <div className="p-4 text-sm text-center text-gray-500 dark:text-gray-400">No notifications</div>
                        ) : (
                          notifications.map((n) => (
                            <div 
                              key={n.id} 
                              onClick={() => handleNotificationClick(n)}
                              className={`p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors cursor-pointer ${!n.read ? 'bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50' : ''}`}
                            >
                              <div className="flex justify-between items-start">
                                <p className={`text-sm ${!n.read ? 'font-bold text-gray-900 dark:text-white' : 'font-medium text-gray-600 dark:text-gray-300'}`}>{n.message}</p>
                                {!n.read && <span className="flex-shrink-0 ml-2 mt-1 h-2 w-2 rounded-full bg-blue-600 shadow-sm" />}
                              </div>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{formatRelativeTime(n.createdAt)}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={toggleTheme}
                  aria-label="Toggle dark mode"
                  className="p-2 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors duration-200 ml-1"
                >
                  {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300 font-medium ml-2">
                  {user.name} <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full uppercase ml-1 transition-colors">{user.role.replace('_', ' ')}</span>
                </span>
                <button
                  onClick={handleLogout}
                  className="p-2 ml-1 rounded-full text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500 transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      {error && (
        <div className="absolute top-16 right-4 bg-red-50 dark:bg-red-900/50 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 px-4 py-2 rounded text-sm shadow-md z-50 transition-colors">
          {error}
        </div>
      )}
      <ReportIssueModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)} 
      />
    </nav>
  );
};

export default Navbar;
