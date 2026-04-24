import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Plus, Trash2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const Meetings = () => {
  const { user } = useAuth();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [filter, setFilter] = useState('upcoming'); // upcoming, past, all

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const [deletingId, setDeletingId] = useState(null);

  useEffect(() => {
    if (!success) return;
    const timer = setTimeout(() => setSuccess(''), 3000);
    return () => clearTimeout(timer);
  }, [success]);

  useEffect(() => {
    fetchMeetings();
  }, []);

  const fetchMeetings = async () => {
    try {
      const response = await api.get('/meetings');
      setMeetings(response.data);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to fetch meetings');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMeeting = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setError('');

    try {
      const localDate = new Date(`${newDate}T${newTime}:00`);
      const isoString = localDate.toISOString();

      await api.post('/meetings', {
        title: newTitle,
        meetingDate: isoString,
        location: newLocation,
        notes: newNotes
      });
      setSuccess('Meeting created successfully');
      setShowCreateModal(false);
      
      // Reset form
      setNewTitle('');
      setNewDate('');
      setNewTime('');
      setNewLocation('');
      setNewNotes('');
      
      fetchMeetings();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to create meeting');
    } finally {
      setIsCreating(false);
    }
  };

  const handleDeleteMeeting = async (id) => {
    if (!window.confirm('Are you sure you want to delete this meeting? This will remove all associated agenda items.')) return;
    
    setDeletingId(id);
    setError('');
    try {
      await api.delete(`/meetings/${id}`);
      setSuccess('Meeting deleted successfully');
      fetchMeetings();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to delete meeting');
    } finally {
      setDeletingId(null);
    }
  };

  const isUpcoming = (dateString) => new Date(dateString) > new Date();

  const filteredMeetings = meetings.filter(m => {
    if (filter === 'all') return true;
    const upcoming = isUpcoming(m.meetingDate);
    return filter === 'upcoming' ? upcoming : !upcoming;
  }).sort((a, b) => {
    if (filter === 'all') {
      const aUpcoming = isUpcoming(a.meetingDate);
      const bUpcoming = isUpcoming(b.meetingDate);
      if (aUpcoming && !bUpcoming) return -1;
      if (!aUpcoming && bUpcoming) return 1;
    }
    return new Date(b.meetingDate) - new Date(a.meetingDate);
  });

  const getStats = (agendaItems) => {
    if (!agendaItems || agendaItems.length === 0) return null;
    return {
      total: agendaItems.length,
      pending: agendaItems.filter(i => i.status === 'PENDING').length,
      discussed: agendaItems.filter(i => i.status === 'DISCUSSED').length,
      followUp: agendaItems.filter(i => i.status === 'FOLLOW_UP_REQUIRED').length,
      resolved: agendaItems.filter(i => i.status === 'RESOLVED').length,
    };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Class Rep Meetings</h2>
          <p className="mt-1 text-sm text-gray-500">Manage meeting agendas and track discussion outcomes.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-1" /> New Meeting
        </button>
      </div>

      {error && <div className="text-red-600 bg-red-50 p-4 rounded-md">{error}</div>}
      {success && <div className="text-green-600 bg-green-50 p-4 rounded-md">{success}</div>}

      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex gap-2">
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-3 py-1 text-sm font-medium rounded-md ${filter === 'upcoming' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-3 py-1 text-sm font-medium rounded-md ${filter === 'past' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Past
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm font-medium rounded-md ${filter === 'all' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}
          >
            All
          </button>
        </div>

        {loading ? (
          <div className="animate-pulse p-6 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No {filter !== 'all' ? filter : ''} meetings found.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {filteredMeetings.map(meeting => (
              <li key={meeting.id} className="hover:bg-gray-50 transition">
                <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <Link to={`/meetings/${meeting.id}`} className="block focus:outline-none">
                      <p className="text-sm font-medium text-primary-600 truncate">{meeting.title}</p>
                      <div className="mt-2 flex items-center text-sm text-gray-500 space-x-4">
                        <span className="flex items-center">
                          <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {new Date(meeting.meetingDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          {new Date(meeting.meetingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {meeting.location && (
                          <span className="flex items-center">
                            <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            {meeting.location}
                          </span>
                        )}
                        <span className="hidden sm:inline">
                          • {meeting.agendaItems?.length === 0 ? '0 agenda items' : (
                            <span>
                              {meeting.agendaItems?.length} items 
                              {getStats(meeting.agendaItems) && (
                                <span className="text-xs ml-1 text-gray-400">
                                  ({getStats(meeting.agendaItems).pending} pending)
                                </span>
                              )}
                            </span>
                          )}
                        </span>
                      </div>
                    </Link>
                  </div>
                  <div className="flex items-center space-x-4">
                    <Link to={`/meetings/${meeting.id}`} className="btn-primary py-1 px-4 text-sm shadow-sm font-medium">
                      View
                    </Link>
                    {user?.role === 'ADMIN' && (
                      <button
                        onClick={() => handleDeleteMeeting(meeting.id)}
                        disabled={deletingId === meeting.id}
                        className="text-red-500 hover:text-red-700 disabled:opacity-50 p-2 rounded hover:bg-red-50"
                        title="Delete Meeting"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Schedule Meeting</h3>
            
            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Meeting Title</label>
                <input
                  type="text"
                  required
                  disabled={isCreating}
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="input-field mt-1 w-full"
                  placeholder="e.g., Weekly Rep Sync"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Date</label>
                  <input
                    type="date"
                    required
                    disabled={isCreating}
                    value={newDate}
                    onChange={(e) => setNewDate(e.target.value)}
                    className="input-field mt-1 w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Time</label>
                  <input
                    type="time"
                    required
                    disabled={isCreating}
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="input-field mt-1 w-full"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Location (Optional)</label>
                <input
                  type="text"
                  disabled={isCreating}
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  className="input-field mt-1 w-full"
                  placeholder="Room 101 or Zoom Link"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">General Notes (Optional)</label>
                <textarea
                  rows="2"
                  disabled={isCreating}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="input-field mt-1 w-full"
                  placeholder="Focus topics, etc."
                ></textarea>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  disabled={isCreating}
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="btn-primary disabled:opacity-50"
                >
                  {isCreating ? 'Scheduling...' : 'Schedule Meeting'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Meetings;
