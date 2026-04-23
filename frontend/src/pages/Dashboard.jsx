import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatLabel, formatRelativeTime } from '../utils/format';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [tickets, setTickets] = useState([]);
  const { user } = useAuth();
  
  const [showNewModal, setShowNewModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('General');
  const [newDesc, setNewDesc] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIUM');

  const [filterStatus, setFilterStatus] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState('all');

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [filterStatus, filterCategory, filterPriority, searchQuery, quickFilter]);

  const fetchStats = async () => {
    try {
      const statsRes = await api.get('/dashboard/stats');
      setStats(statsRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const fetchTickets = async () => {
    try {
      const params = new URLSearchParams();
      if (filterStatus) params.append('status', filterStatus);
      if (filterCategory) params.append('category', filterCategory);
      if (filterPriority) params.append('priority', filterPriority);
      if (searchQuery) params.append('search', searchQuery);
      if (quickFilter !== 'all') params.append('quickFilter', quickFilter);

      const ticketsRes = await api.get(`/tickets?${params.toString()}`);
      setTickets(ticketsRes.data);
    } catch (error) {
      console.error(error);
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      await api.post('/tickets', {
        title: newTitle, category: newCategory, description: newDesc, priority: newPriority
      });
      setShowNewModal(false);
      fetchStats();
      fetchTickets();
      setNewTitle(''); setNewDesc('');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats row */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard title="Total Tickets" value={stats.totalTickets} />
          <StatCard title="New" value={stats.newTickets} />
          <StatCard title="In Progress" value={stats.inProgress} />
          <StatCard title="High Priority" value={stats.highPriority} highlight />
        </div>
      )}

      <div className="flex justify-between items-center mt-8">
        <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
          <h2 className="text-2xl font-bold text-gray-900">Recent Tickets</h2>
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
      <div className="bg-white p-4 rounded-md shadow flex flex-col md:flex-row gap-4">
        <input 
          type="text" 
          placeholder="Search tickets..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="input-field flex-grow"
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="input-field w-full md:w-48">
          <option value="">All Statuses</option>
          <option value="NEW">New</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="WAITING">Waiting</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className="input-field w-full md:w-48">
          <option value="">All Categories</option>
          <option value="General">General</option>
          <option value="Academic">Academic</option>
          <option value="Facility">Facility</option>
          <option value="Event">Event</option>
        </select>
        <select value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)} className="input-field w-full md:w-48">
          <option value="">All Priorities</option>
          <option value="LOW">Low</option>
          <option value="MEDIUM">Medium</option>
          <option value="HIGH">High</option>
          <option value="URGENT">Urgent</option>
        </select>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-md mt-4">
        <ul className="divide-y divide-gray-200">
          {tickets.map((t) => (
            <li key={t.id}>
              <Link to={`/tickets/${t.id}`} className="block hover:bg-gray-50 transition p-4 sm:px-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-primary-600 truncate">{t.title}</p>
                  <div className="ml-2 flex-shrink-0 flex">
                    <p className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100`}>
                      {formatLabel(t.status)}
                    </p>
                  </div>
                </div>
                <div className="mt-2 sm:flex sm:justify-between">
                  <div className="sm:flex text-sm text-gray-500">
                    <p>Submitted by {t.submitter.name} • Updated {formatRelativeTime(t.updatedAt)} • {t.category}</p>
                  </div>
                  <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                    <p>Priority: {formatLabel(t.priority)}</p>
                  </div>
                </div>
              </Link>
            </li>
          ))}
          {tickets.length === 0 && (
            <div className="p-6 text-center text-gray-500">No tickets found.</div>
          )}
        </ul>
      </div>

      {showNewModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-lg w-full">
            <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">Submit New Ticket</h3>
            <form onSubmit={handleCreateTicket} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Title</label>
                <input required value={newTitle} onChange={e=>setNewTitle(e.target.value)} className="input-field" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select value={newCategory} onChange={e=>setNewCategory(e.target.value)} className="input-field">
                    <option>General</option>
                    <option>Academic</option>
                    <option>Facility</option>
                    <option>Event</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Priority</label>
                  <select value={newPriority} onChange={e=>setNewPriority(e.target.value)} className="input-field">
                    <option value="LOW">Low</option>
                    <option value="MEDIUM">Medium</option>
                    <option value="HIGH">High</option>
                    <option value="URGENT">Urgent</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea required rows={4} value={newDesc} onChange={e=>setNewDesc(e.target.value)} className="input-field" />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" onClick={()=>setShowNewModal(false)} className="btn-secondary">Cancel</button>
                <button type="submit" className="btn-primary">Submit</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, highlight }) => (
  <div className={`bg-white p-6 rounded-lg shadow-sm border ${highlight ? 'border-red-200' : 'border-gray-200'}`}>
    <dt className="text-sm font-medium text-gray-500 truncate">{title}</dt>
    <dd className={`mt-1 text-3xl font-semibold ${highlight ? 'text-red-600' : 'text-gray-900'}`}>{value}</dd>
  </div>
);

export default Dashboard;
