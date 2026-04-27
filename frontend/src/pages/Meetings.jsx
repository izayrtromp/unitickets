import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Clock, Plus, Trash2, CalendarX2 } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import { useToast } from '../context/ToastContext';

const Meetings = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [meetings, setMeetings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [filter, setFilter] = useState('upcoming'); // upcoming, past, all

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDate, setNewDate] = useState('');
  const [newTime, setNewTime] = useState('');
  const [newLocation, setNewLocation] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  
  const [deletingId, setDeletingId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [meetingToDelete, setMeetingToDelete] = useState(null);

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
      addToast('Meeting created successfully', 'success');
      setShowCreateModal(false);
      
      // Reset form
      setNewTitle('');
      setNewDate('');
      setNewTime('');
      setNewLocation('');
      setNewNotes('');
      
      fetchMeetings();
    } catch (err) {
      addToast(err.response?.data?.message || err.response?.data?.error || 'Failed to create meeting', 'error');
    } finally {
      setIsCreating(false);
    }
  };

  const confirmDelete = (id) => {
    setMeetingToDelete(id);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!meetingToDelete) return;
    setDeletingId(meetingToDelete);
    setError('');
    try {
      await api.delete(`/meetings/${meetingToDelete}`);
      addToast('Meeting deleted successfully', 'success');
      setDeleteModalOpen(false);
      fetchMeetings();
    } catch (err) {
      addToast(err.response?.data?.message || err.response?.data?.error || 'Failed to delete meeting', 'error');
    } finally {
      setDeletingId(null);
      setMeetingToDelete(null);
    }
  };

  const isUpcoming = (dateString) => new Date(dateString) > new Date();

  const safeMeetings = Array.isArray(meetings) ? meetings : [];

  const filteredMeetings = safeMeetings.filter(m => {
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Class Rep Meetings</h2>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage meeting agendas and track discussion outcomes.</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="btn-primary flex items-center"
        >
          <Plus className="h-4 w-4 mr-1" /> New Meeting
        </button>
      </div>

      {error && <div className="text-red-600 bg-red-50 p-4 rounded-md">{error}</div>}

      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg overflow-hidden transition-colors">
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex gap-2">
          <button
            onClick={() => setFilter('upcoming')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${filter === 'upcoming' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Upcoming
          </button>
          <button
            onClick={() => setFilter('past')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${filter === 'past' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Past
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${filter === 'all' ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            All
          </button>
        </div>

        {loading ? (
          <div className="animate-pulse p-6 space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        ) : filteredMeetings.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <CalendarX2 className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-3" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">No meetings scheduled</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {filter === 'all' ? 'Schedule a new meeting to get started.' : `No ${filter} meetings match your current filter.`}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-200 dark:divide-gray-700">
            {filteredMeetings.map(meeting => (
              <li key={meeting.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-200 cursor-pointer">
                <div className="px-4 py-4 sm:px-6 flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <Link to={`/meetings/${meeting.id}`} className="block focus:outline-none">
                      <p className="text-sm font-medium text-primary-600 dark:text-primary-400 truncate">{meeting.title}</p>
                      <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400 space-x-4">
                        <span className="flex items-center">
                          <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                          {new Date(meeting.meetingDate).toLocaleDateString()}
                        </span>
                        <span className="flex items-center">
                          <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                          {new Date(meeting.meetingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {meeting.location && (
                          <span className="flex items-center">
                            <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400 dark:text-gray-500" />
                            {meeting.location}
                          </span>
                        )}
                        <span className="hidden sm:inline">
                          • {meeting.agendaItems?.length === 0 ? '0 agenda items' : (
                            <span>
                              {meeting.agendaItems?.length} items 
                              {getStats(meeting.agendaItems) && (
                                <span className="text-xs ml-1 text-gray-400 dark:text-gray-500">
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
                        onClick={() => confirmDelete(meeting.id)}
                        disabled={deletingId === meeting.id}
                        className="text-red-500 hover:text-red-700 dark:hover:text-red-400 disabled:opacity-50 p-2 rounded hover:bg-red-50 dark:hover:bg-red-900/30 transition-colors"
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

      <ConfirmModal 
        isOpen={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        onConfirm={executeDelete} 
        title="Delete Meeting" 
        message="Are you sure you want to delete this meeting? This will remove all associated agenda items. This action cannot be undone." 
        confirmText="Delete"
        confirmColor="red"
        isProcessing={!!deletingId}
      />

      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Schedule Meeting</h3>
            
            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Meeting Title</label>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date</label>
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
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Time</label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Location (Optional)</label>
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">General Notes (Optional)</label>
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
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="btn-primary disabled:opacity-50 transition-all duration-200 flex items-center"
                >
                  {isCreating && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
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
