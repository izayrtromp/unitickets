import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { getStatusColor, getFeedbackColor, getFeedbackTypeLabel, formatLabel, formatRelativeTime } from '../utils/format';
import { Ticket as TicketIcon, PlusCircle, Clock, AlertTriangle, MessageSquare, Inbox } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useAuth();
  
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
      setShowNewModal(false);
      fetchStats();
      fetchTickets();
      setNewTitle(''); setNewDesc('');
    } catch (err) {
      setCreateError(err.response?.data?.message || err.response?.data?.error || 'Failed to create ticket');
    } finally {
      setIsCreating(false);
    }
  };

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
            <h2 className="text-2xl font-bold text-gray-900">Recent Tickets</h2>
            {hasFilters && (
              <span className="text-sm text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full flex items-center">
                {filterPriority === 'URGENT' ? 'Urgent priority selected' : 'Filtered results'}
                <button onClick={resetFilters} className="ml-2 text-primary-600 hover:text-primary-800 font-medium">Reset</button>
              </span>
            )}
          </div>
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-md self-start">
            <button 
              onClick={() => setQuickFilter('open')} 
              className={`px-3 py-1 text-sm font-medium rounded-md ${quickFilter === 'open' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Open
            </button>
            <button 
              onClick={() => setQuickFilter('closed')} 
              className={`px-3 py-1 text-sm font-medium rounded-md ${quickFilter === 'closed' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Closed
            </button>
            <button 
              onClick={() => setQuickFilter('all')} 
              className={`px-3 py-1 text-sm font-medium rounded-md ${quickFilter === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
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
      <div className="bg-white p-4 rounded-md shadow flex flex-col md:flex-row flex-wrap gap-4 items-center">
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

      <div className="bg-white shadow overflow-hidden sm:rounded-md mt-4">
        <ul className="divide-y divide-gray-200">
          {loading ? (
            <div className="animate-pulse divide-y divide-gray-200">
              {[1, 2, 3].map(i => (
                <div key={i} className="p-4 sm:px-6">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : tickets.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center">
              <Inbox className="h-12 w-12 text-gray-400 mb-3" />
              <h3 className="text-lg font-medium text-gray-900">No tickets found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {hasFilters 
                  ? "No tickets match your filters. Try adjusting filters." 
                  : "No tickets yet. Create your first ticket to get started."}
              </p>
            </div>
          ) : (
            tickets.map((t) => (
              <li key={t.id} className={`bg-white transition-all ${
                t.priority === 'URGENT' ? 'border-l-2 border-red-500' : 
                t.priority === 'HIGH' ? 'border-l-2 border-red-300' : ''
              }`}>
                <Link to={`/tickets/${t.id}`} className={`block active:scale-[0.995] transition-all p-4 sm:px-6 ${
                  t.priority === 'URGENT' ? 'hover:bg-red-50/40' : 'hover:bg-gray-50'
                }`}>
                  <div className="flex items-start justify-between">
                    <div className="flex flex-col space-y-1 truncate pr-4">
                      <div className="flex items-center space-x-3 truncate">
                        {t.category === 'Feedback' && ['BUG', 'FEATURE_REQUEST', 'GENERAL_FEEDBACK'].includes(t.type) && (
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${getFeedbackColor(t.type)}`}>
                            {getFeedbackTypeLabel(t.type)}
                          </span>
                        )}
                        <p className="text-base font-semibold text-gray-900 truncate">{t.title}</p>
                      </div>
                      <div className="text-sm text-gray-500 truncate">
                        <p>Submitted by {t.submitter.name} • Updated {formatRelativeTime(t.updatedAt)} • {t.category}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 flex flex-col items-end space-y-2">
                      <p className={`px-2 py-0.5 inline-flex text-xs leading-5 font-medium rounded-full ${getStatusColor(t.status)}`}>
                        {formatLabel(t.status)}
                      </p>
                      <div className="flex items-center text-sm">
                        <span className={`flex items-center ${
                          t.priority === 'URGENT' ? 'text-red-600 font-medium' : 
                          t.priority === 'HIGH' ? 'text-red-500 font-normal' : 
                          t.priority === 'MEDIUM' ? 'text-gray-600 font-normal' : 
                          'text-gray-400 font-normal'
                        }`}>
                          {t.priority === 'URGENT' && <AlertTriangle className="w-3.5 h-3.5 mr-1 inline" />}
                          {formatLabel(t.priority)}
                        </span>
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
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Submit New Ticket</h3>
            {createError && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{createError}</div>}
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input required disabled={isCreating} value={newTitle} onChange={e=>setNewTitle(e.target.value)} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select disabled={isCreating} value={newCategory} onChange={e=>setNewCategory(e.target.value)} className="input-field">
                    <option>General</option>
                    <option>Academic</option>
                    <option>Facility</option>
                    <option>Event</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select disabled={isCreating} value={newPriority} onChange={e=>setNewPriority(e.target.value)} className="input-field">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea required disabled={isCreating} rows={4} value={newDesc} onChange={e=>setNewDesc(e.target.value)} className="input-field" />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" disabled={isCreating} onClick={()=>setShowNewModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={isCreating} className="btn-primary">
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
  <div className={`bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition duration-150 border ${highlight ? 'border-red-200' : 'border-gray-200'}`}>
    <div className="flex items-center justify-between" title={titleTooltip}>
      <dt className="text-sm font-medium text-gray-500 truncate cursor-default">{title}</dt>
      {Icon && <Icon className={`h-5 w-5 ${highlight ? 'text-red-500' : 'text-gray-400'}`} />}
    </div>
    <dd className={`mt-1 text-3xl font-semibold ${highlight ? 'text-red-600' : 'text-gray-900'}`}>{value}</dd>
  </div>
);

export default Dashboard;
