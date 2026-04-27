import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatRelativeTime } from '../utils/format';
import Badge from '../components/Badge';
import { Ticket as TicketIcon, PlusCircle, Clock, AlertTriangle, MessageSquare, Inbox } from 'lucide-react';
import { useToast } from '../context/ToastContext';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [showNewModal, setShowNewModal] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');

  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterType, setFilterType] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState('all');

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [filterStatus, filterCategory, filterPriority, filterType, searchQuery, quickFilter]);

  const hasFilters = filterStatus || filterCategory || filterPriority || filterType || searchQuery || quickFilter !== 'all';
  const resetFilters = () => {
    setFilterStatus(''); setFilterCategory(''); setFilterPriority(''); setFilterType(''); setSearchQuery(''); setQuickFilter('all');
  };

  const fetchStats = async () => {
    try {
      const statsRes = await api.get('/dashboard/stats');
      setStats(statsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to fetch stats');
    }
  };

  const fetchTickets = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterCategory) params.append('category', filterCategory);
      if (filterPriority) params.append('priority', filterPriority);
      if (filterType) params.append('type', filterType);
      if (searchQuery) params.append('search', searchQuery);
      if (quickFilter !== 'all') params.append('quickFilter', quickFilter);

      const ticketsRes = await api.get(`/tickets?${params.toString()}`);
      setTickets(ticketsRes.data);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setCreateError('');
    try {
      await api.post('/tickets', {
        title: newTitle, category: newCategory, description: newDesc, priority: newPriority
      });
      addToast('Ticket created successfully', 'success');
      setShowNewModal(false);
      fetchStats();
      fetchTickets();
      setNewTitle(''); setNewDesc('');
    } catch (err) {
      addToast(err.response?.data?.message || err.response?.data?.error || 'Failed to create ticket', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  if (!user) return <div className="p-8 text-center animate-pulse">Loading dashboard...</div>;

  const safeTickets = Array.isArray(tickets) ? tickets : [];

  return (
    <div className="space-y-6">
      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard title="Total Tickets" value={stats.totalTickets} icon={Inbox} />
          <StatCard title="New" value={stats.newTickets} icon={PlusCircle} />
          <StatCard title="In Progress" value={stats.inProgress} icon={Clock} />
          <StatCard title="Urgent" value={stats.urgentPriority || 0} highlight icon={AlertTriangle} titleTooltip="Urgent tickets that require immediate attention" />
          <StatCard title="Feedback" value={stats.feedbackCount || 0} icon={MessageSquare} />
        </div>
      )}

      <div className="flex justify-between items-center mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Recent Tickets</h2>
            {hasFilters && (
              <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-full flex items-center">
                {filterPriority === 'URGENT' ? 'Urgent priority selected' : 'Filtered results'}
                <button onClick={resetFilters} className="ml-2 text-primary-600 hover:text-primary-800 font-medium">Reset</button>
              </span>
            )}
          </div>
          <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-md self-start">
            <button 
              onClick={() => setQuickFilter('open')} 
              className={`px-3 py-1 text-sm font-medium rounded-md ${quickFilter === 'open' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Open
            </button>
            <button 
              onClick={() => setQuickFilter('closed')} 
              className={`px-3 py-1 text-sm font-medium rounded-md ${quickFilter === 'closed' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              Closed
            </button>
            <button 
              onClick={() => setQuickFilter('all')} 
              className={`px-3 py-1 text-sm font-medium rounded-md ${quickFilter === 'all' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
            >
              All
            </button>
          </div>
        </div>
        <button onClick={() => setShowNewModal(true)} className="btn-primary flex-shrink-0">
          + New Ticket
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-md shadow flex flex-col md:flex-row flex-wrap gap-4 items-center transition-colors">
        <div className="relative flex-grow">
          <input 
            type="text" 
            placeholder="Search by title or keyword..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field w-full pr-8 focus:ring-2 focus:ring-primary-500/30 transition-all duration-150"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              ×
            </button>
          )}
        </div>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field w-full md:w-auto min-w-[140px] focus:ring-2 focus:ring-primary-500/30 transition-all duration-150">
          <option value="">All Statuses</option>
          <option value="NEW">New</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="WAITING">Waiting</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="input-field w-full md:w-auto min-w-[140px] focus:ring-2 focus:ring-primary-500/30 transition-all duration-150">
          <option value="">All Categories</option>
          <option value="General">General</option>
          <option value="Academic">Academic</option>
          <option value="Facility">Facility</option>
          <option value="Event">Event</option>
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="input-field w-full md:w-auto min-w-[140px] focus:ring-2 focus:ring-primary-500/30 transition-all duration-150">
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
        <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className="input-field w-full md:w-auto min-w-[140px] focus:ring-2 focus:ring-primary-500/30 transition-all duration-150">
          <option value="">All Types</option>
          <option value="Academic / Standard">Academic / Standard</option>
          <option value="BUG">Bug</option>
          <option value="FEATURE_REQUEST">Feature Request</option>
          <option value="Feedback">Feedback</option>
        </select>
      </div>

      {error && <div className="text-red-600 bg-red-50 p-4 rounded-md">{error}</div>}

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-md mt-4 transition-colors">
        <ul className="divide-y divide-gray-200 dark:divide-gray-700">
          {loading ? (
            <div className="animate-pulse divide-y divide-gray-200 dark:divide-gray-700">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 sm:px-6">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-3"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : safeTickets.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <Inbox className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No tickets found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                {hasFilters 
                  ? "No tickets match your filters. Try adjusting filters." 
                  : "No tickets yet. Create your first ticket to get started."}
              </p>
            </div>
          ) : (
            safeTickets.map((t) => (
              <li key={t.id} className={`bg-white dark:bg-gray-800 transition-all ${
                t.priority === 'URGENT' ? 'border-l-2 border-red-500' : 
                t.priority === 'HIGH' ? 'border-l-2 border-red-300 dark:border-red-400' : ''
              }`}>
                <Link to={`/tickets/${t.id}`} className={`block active:scale-[0.995] transition-all p-4 sm:px-6 ${
                  t.priority === 'URGENT' ? 'hover:bg-red-50/40 dark:hover:bg-red-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col space-y-1 truncate pr-4">
                      <div className="flex items-center space-x-3 truncate">
                        {t.category === 'Feedback' && ['BUG', 'FEATURE_REQUEST', 'GENERAL_FEEDBACK'].includes(t.type) && (
                          <Badge type="feedback" value={t.type} />
                        )}
                        <p className="text-base font-semibold text-gray-900 dark:text-white truncate">{t.title}</p>
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400 truncate">
                        <p>Submitted by {t.submitter.name} • Updated {formatRelativeTime(t.updatedAt)} • {t.category}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end space-y-2">
                      <Badge type="status" value={t.status} />
                      <div className="flex items-center text-sm">
                        <Badge type="priority" value={t.priority} icon={t.priority === 'URGENT' ? AlertTriangle : null} />
                      </div>
                    </div>
                  </div>
                </Link>
              </li>
            ))
          )}
        </ul>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80 flex items-center justify-center p-4 z-50 transition-opacity duration-200 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg p-6 max-w-lg w-full transform transition-all duration-200 scale-100 shadow-xl">
            <h3 className="text-lg font-medium leading-6 text-gray-900 dark:text-white mb-4">Submit New Ticket</h3>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Title</label>
                <input required disabled={isCreating} value={newTitle} onChange={e=>setNewTitle(e.target.value)} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Category</label>
                  <select disabled={isCreating} value={newCategory} onChange={e=>setNewCategory(e.target.value)} className="input-field">
                    <option>General</option>
                    <option>Academic</option>
                    <option>Facility</option>
                    <option>Event</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Priority</label>
                  <select disabled={isCreating} value={newPriority} onChange={e=>setNewPriority(e.target.value)} className="input-field">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                <textarea required disabled={isCreating} rows={4} value={newDesc} onChange={e=>setNewDesc(e.target.value)} className="input-field" />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" disabled={isCreating} onClick={()=>setShowNewModal(false)} className="btn-secondary transition-all duration-200 disabled:opacity-50">Cancel</button>
                <button type="submit" disabled={isCreating} className="btn-primary transition-all duration-200 flex items-center disabled:opacity-50">
                  {isCreating && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isCreating ? 'Submitting...' : 'Submit'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, highlight, icon: Icon, titleTooltip }) => (
  <div className={`bg-white dark:bg-gray-800 p-6 rounded-lg shadow-sm hover:shadow-md transition duration-150 border ${highlight ? 'border-red-200 dark:border-red-900/30' : 'border-gray-200 dark:border-gray-700'}`}>
    <div className="flex items-center justify-between" title={titleTooltip}>
      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 truncate cursor-default">{title}</dt>
      {Icon && <Icon className={`h-5 w-5 ${highlight ? 'text-red-500 dark:text-red-400' : 'text-gray-400 dark:text-gray-500'}`} />}
    </div>
    <dd className={`mt-1 text-3xl font-semibold ${highlight ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>{value}</dd>
    <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">All time</p>
  </div>
);

export default Dashboard;
