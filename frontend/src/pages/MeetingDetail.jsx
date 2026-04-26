import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, Clock, Edit2, ExternalLink, Plus } from 'lucide-react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import { getStatusColor, getPriorityColor } from '../utils/format';
import { useToast } from '../context/ToastContext';

const MeetingDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addToast } = useToast();
  
  const [meeting, setMeeting] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [staff, setStaff] = useState([]);
  
  // Edit Meeting State
  const [isEditingMeeting, setIsEditingMeeting] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [isSavingMeeting, setIsSavingMeeting] = useState(false);

  // Editing Agenda Item State
  const [editingItemId, setEditingItemId] = useState(null);
  const [editItemNotes, setEditItemNotes] = useState('');
  const [editItemOutcome, setEditItemOutcome] = useState('');
  const [editItemStatus, setEditItemStatus] = useState('');
  const [isSavingItem, setIsSavingItem] = useState(false);
  
  // Follow-up Task Modal State
  const [taskModalItemId, setTaskModalItemId] = useState(null);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToRemove, setItemToRemove] = useState(null);

  useEffect(() => {
    fetchMeeting();
    fetchStaff();
  }, [id]);

  const fetchMeeting = async () => {
    try {
      const response = await api.get(`/meetings/${id}`);
      setMeeting(response.data);
      setEditTitle(response.data.title);
      
      const md = new Date(response.data.meetingDate);
      if (!isNaN(md.getTime())) {
        const year = md.getFullYear();
        const month = String(md.getMonth() + 1).padStart(2, '0');
        const day = String(md.getDate()).padStart(2, '0');
        const hours = String(md.getHours()).padStart(2, '0');
        const mins = String(md.getMinutes()).padStart(2, '0');
        setEditDate(`${year}-${month}-${day}`);
        setEditTime(`${hours}:${mins}`);
      }

      setEditLocation(response.data.location || '');
      setEditNotes(response.data.notes || '');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to fetch meeting');
    } finally {
      setLoading(false);
    }
  };

  const fetchStaff = async () => {
    try {
      const response = await api.get('/users/staff');
      setStaff(response.data);
    } catch (err) {
      console.error('Failed to fetch staff list');
    }
  };

  const handleUpdateMeeting = async (e) => {
    e.preventDefault();
    setIsSavingMeeting(true);
    setError('');
    try {
      const payload = {
        title: editTitle,
        location: editLocation,
        notes: editNotes
      };
      
      if (editDate && editTime) {
        const localDate = new Date(`${editDate}T${editTime}:00`);
        payload.meetingDate = localDate.toISOString();
      }

      await api.patch(`/meetings/${id}`, payload);
      addToast('Meeting updated successfully', 'success');
      setIsEditingMeeting(false);
      fetchMeeting();
    } catch (err) {
      addToast(err.response?.data?.message || err.response?.data?.error || 'Failed to update meeting', 'error');
    } finally {
      setIsSavingMeeting(false);
    }
  };

  const startEditItem = (item) => {
    setEditingItemId(item.id);
    setEditItemNotes(item.discussionNotes || '');
    setEditItemOutcome(item.outcome || '');
    setEditItemStatus(item.status);
  };

  const saveEditItem = async (itemId) => {
    setIsSavingItem(true);
    setError('');
    try {
      await api.patch(`/meetings/${id}/agenda/${itemId}`, {
        discussionNotes: editItemNotes,
        outcome: editItemOutcome,
        status: editItemStatus
      });
      addToast('Agenda item updated', 'success');
      setEditingItemId(null);
      fetchMeeting();
    } catch (err) {
      addToast(err.response?.data?.message || err.response?.data?.error || 'Failed to update agenda item', 'error');
    } finally {
      setIsSavingItem(false);
    }
  };

  const confirmRemove = (itemId) => {
    setItemToRemove(itemId);
    setDeleteModalOpen(true);
  };

  const executeRemove = async () => {
    if (!itemToRemove) return;
    setError('');
    try {
      await api.delete(`/meetings/${id}/agenda/${itemToRemove}`);
      addToast('Ticket removed from agenda', 'success');
      setDeleteModalOpen(false);
      fetchMeeting();
    } catch (err) {
      addToast(err.response?.data?.message || err.response?.data?.error || 'Failed to remove agenda item', 'error');
    } finally {
      setItemToRemove(null);
    }
  };

  const openTaskModal = (item) => {
    setTaskModalItemId(item.id);
    setTaskTitle(`Follow up: ${item.ticket.title}`);
    setTaskDesc(item.outcome || item.discussionNotes || `Follow up from meeting: ${meeting.title}`);
    setTaskAssignee(user.id);
    setTaskDueDate('');
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setIsCreatingTask(true);
    setError('');
    
    const agendaItem = meeting.agendaItems.find(i => i.id === taskModalItemId);

    try {
      await api.post('/tasks', {
        title: taskTitle,
        description: taskDesc,
        assignedToId: taskAssignee,
        dueDate: taskDueDate || null,
        ticketId: agendaItem.ticketId
      });
      
      addToast('Follow-up task created successfully', 'success');
      setTaskModalItemId(null);
    } catch (err) {
      addToast(err.response?.data?.message || err.response?.data?.error || 'Failed to create task', 'error');
    } finally {
      setIsCreatingTask(false);
    }
  };

  const formatTicketStatus = (status) => {
    return status ? status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ') : '';
  };

  const getSortedAgendaItems = () => {
    if (!meeting?.agendaItems) return [];
    const statusOrder = {
      'PENDING': 1,
      'FOLLOW_UP_REQUIRED': 2,
      'DISCUSSED': 3,
      'RESOLVED': 4
    };
    return [...meeting.agendaItems].sort((a, b) => {
      const orderA = statusOrder[a.status] || 99;
      const orderB = statusOrder[b.status] || 99;
      return orderA - orderB;
    });
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto space-y-6 animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
        <div className="bg-white shadow sm:rounded-lg p-6 space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (!meeting) {
    return <div className="p-8 text-center text-red-500">Meeting not found</div>;
  }
  if (!user) return <div className="p-8 text-center animate-pulse">Loading meeting data...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <button 
        onClick={() => navigate('/meetings')}
        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Meetings
      </button>

      {error && <div className="text-red-600 bg-red-50 p-4 rounded-md">{error}</div>}

      <div className="bg-white shadow sm:rounded-lg">
        {isEditingMeeting ? (
          <form onSubmit={handleUpdateMeeting} className="p-6 space-y-4 border-b border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700">Meeting Title</label>
              <input type="text" required value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="input-field mt-1 w-full" disabled={isSavingMeeting} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Date</label>
                <input type="date" required value={editDate} onChange={(e) => setEditDate(e.target.value)} className="input-field mt-1 w-full" disabled={isSavingMeeting} />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Time</label>
                <input type="time" required value={editTime} onChange={(e) => setEditTime(e.target.value)} className="input-field mt-1 w-full" disabled={isSavingMeeting} />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <input type="text" value={editLocation} onChange={(e) => setEditLocation(e.target.value)} className="input-field mt-1 w-full" disabled={isSavingMeeting} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">General Notes</label>
              <textarea rows="3" value={editNotes} onChange={(e) => setEditNotes(e.target.value)} className="input-field mt-1 w-full" disabled={isSavingMeeting} />
            </div>
            <div className="flex justify-end space-x-2">
              <button type="button" onClick={() => setIsEditingMeeting(false)} disabled={isSavingMeeting} className="btn-secondary text-sm py-1">Cancel</button>
              <button type="submit" disabled={isSavingMeeting} className="btn-primary text-sm py-1">{isSavingMeeting ? 'Saving...' : 'Save Changes'}</button>
            </div>
          </form>
        ) : (
          <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{meeting.title}</h2>
              <div className="mt-2 flex items-center text-sm text-gray-500 space-x-6">
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
                {meeting.createdBy && (
                  <span className="flex items-center text-gray-500">
                    Created by: {meeting.createdBy.name}
                  </span>
                )}
              </div>
              {meeting.notes && (
                <div className="mt-4 text-sm text-gray-700 bg-gray-50 p-3 rounded border border-gray-100 whitespace-pre-wrap">
                  {meeting.notes}
                </div>
              )}
            </div>
            <button onClick={() => setIsEditingMeeting(true)} className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100">
              <Edit2 className="h-5 w-5" />
            </button>
          </div>
        )}

        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">Agenda Items ({meeting.agendaItems.length})</h3>
        </div>

        {meeting.agendaItems.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No agenda items yet. Add tickets to this meeting from the Ticket Detail page.
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {getSortedAgendaItems().map((item, index) => (
              <li key={item.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="bg-gray-200 text-gray-700 text-xs font-bold px-2 py-0.5 rounded-full">#{index + 1}</span>
                      <Link to={`/tickets/${item.ticket.id}`} className="text-lg font-medium text-primary-600 hover:text-primary-800 hover:underline flex items-center">
                        {item.ticket.title}
                        <ExternalLink className="h-4 w-4 ml-1" />
                      </Link>
                    </div>
                    <div className="mt-2 flex items-center text-xs text-gray-500 space-x-3">
                      <span>By: {item.ticket.submitter.name}</span>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${getPriorityColor(item.ticket.priority)}`}>{item.ticket.priority}</span>
                      <span>•</span>
                      <span className={`px-2 py-0.5 rounded-full font-medium ${getStatusColor(item.ticket.status)}`}>{formatTicketStatus(item.ticket.status)}</span>
                    </div>
                  </div>
                  
                  {editingItemId !== item.id && (
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(item.status)}`}>
                      {formatTicketStatus(item.status)}
                    </span>
                  )}
                </div>

                {editingItemId === item.id ? (
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Agenda Status</label>
                        <select 
                          value={editItemStatus} 
                          onChange={(e) => setEditItemStatus(e.target.value)} 
                          className="input-field mt-1 w-full text-sm py-1.5"
                          disabled={isSavingItem}
                        >
                          <option value="PENDING">Pending</option>
                          <option value="DISCUSSED">Discussed</option>
                          <option value="FOLLOW_UP_REQUIRED">Follow-up Required</option>
                          <option value="RESOLVED">Resolved</option>
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Discussion Notes</label>
                      <textarea 
                        rows="2" 
                        value={editItemNotes} 
                        onChange={(e) => setEditItemNotes(e.target.value)} 
                        className="input-field mt-1 w-full text-sm"
                        placeholder="What was discussed?"
                        disabled={isSavingItem}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700">Outcome</label>
                      <textarea 
                        rows="2" 
                        value={editItemOutcome} 
                        onChange={(e) => setEditItemOutcome(e.target.value)} 
                        className="input-field mt-1 w-full text-sm"
                        placeholder="What was the decision?"
                        disabled={isSavingItem}
                      />
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <button 
                        type="button" 
                        onClick={() => confirmRemove(item.id)} 
                        disabled={isSavingItem}
                        className="text-red-600 hover:text-red-800 text-xs font-medium"
                      >
                        Remove from Agenda
                      </button>
                      <div className="flex space-x-2">
                        <button type="button" onClick={() => setEditingItemId(null)} disabled={isSavingItem} className="btn-secondary py-1 px-3 text-xs">Cancel</button>
                        <button type="button" onClick={() => saveEditItem(item.id)} disabled={isSavingItem} className="btn-primary py-1 px-3 text-xs">
                          {isSavingItem ? 'Saving...' : 'Save Notes'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {item.discussionNotes && (
                        <div className="bg-blue-50 border border-blue-100 p-3 rounded-md">
                          <h4 className="text-xs font-semibold text-blue-800 uppercase tracking-wider mb-1">Discussion</h4>
                          <p className="text-sm text-blue-900 whitespace-pre-wrap">{item.discussionNotes}</p>
                        </div>
                      )}
                      {item.outcome && (
                        <div className="bg-green-50 border border-green-100 p-3 rounded-md">
                          <h4 className="text-xs font-semibold text-green-800 uppercase tracking-wider mb-1">Outcome</h4>
                          <p className="text-sm text-green-900 whitespace-pre-wrap">{item.outcome}</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex space-x-3 pt-2">
                      <button 
                        onClick={() => startEditItem(item)} 
                        className="btn-secondary py-1.5 px-3 text-sm font-medium"
                      >
                        Edit Notes & Outcome
                      </button>
                      <button 
                        onClick={() => openTaskModal(item)}
                        className="btn-secondary py-1.5 px-3 text-sm font-medium flex items-center"
                      >
                        <Plus className="h-3.5 w-3.5 mr-1" /> Create Follow-up Task
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <ConfirmModal 
        isOpen={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        onConfirm={executeRemove} 
        title="Remove from Agenda" 
        message="Are you sure you want to remove this ticket from the agenda?"
        confirmText="Remove"
        confirmColor="red"
      />

      {/* Create Task Modal */}
      {taskModalItemId && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create Follow-up Task</h3>
            
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Task Title</label>
                <input
                  type="text"
                  required
                  disabled={isCreatingTask}
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="input-field mt-1 w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  rows="3"
                  disabled={isCreatingTask}
                  value={taskDesc}
                  onChange={(e) => setTaskDesc(e.target.value)}
                  className="input-field mt-1 w-full"
                ></textarea>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Assign To</label>
                <select
                  required
                  disabled={isCreatingTask}
                  value={taskAssignee}
                  onChange={(e) => setTaskAssignee(e.target.value)}
                  className="input-field mt-1 w-full"
                >
                  <option value="">Select Assignee...</option>
                  {staff.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({formatTicketStatus(user.role)})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date (Optional)</label>
                <input
                  type="date"
                  disabled={isCreatingTask}
                  value={taskDueDate}
                  onChange={(e) => setTaskDueDate(e.target.value)}
                  className="input-field mt-1 w-full"
                />
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  disabled={isCreatingTask}
                  onClick={() => setTaskModalItemId(null)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingTask}
                  className="btn-primary disabled:opacity-50"
                >
                  {isCreatingTask ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MeetingDetail;
