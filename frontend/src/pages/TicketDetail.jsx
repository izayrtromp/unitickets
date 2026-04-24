import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { formatRelativeTime, formatLabel } from '../utils/format';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  
  const [ticket, setTicket] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState('');

  const [showTaskModal, setShowTaskModal] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [taskAssignee, setTaskAssignee] = useState('');
  const [taskDueDate, setTaskDueDate] = useState('');
  const [taskSuccess, setTaskSuccess] = useState('');
  const [taskError, setTaskError] = useState('');
  
  const [isAssigning, setIsAssigning] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isPostingComment, setIsPostingComment] = useState(false);
  const [isCreatingTask, setIsCreatingTask] = useState(false);

  const [showAgendaModal, setShowAgendaModal] = useState(false);
  const [meetings, setMeetings] = useState([]);
  const [selectedMeeting, setSelectedMeeting] = useState('');
  const [isAddingToAgenda, setIsAddingToAgenda] = useState(false);
  const [agendaSuccess, setAgendaSuccess] = useState('');
  const [agendaError, setAgendaError] = useState('');

  useEffect(() => {
    if (!taskSuccess) return;
    const t = setTimeout(() => {
      setTaskSuccess('');
      setShowTaskModal(false);
    }, 2000);
    return () => clearTimeout(t);
  }, [taskSuccess]);

  useEffect(() => {
    fetchTicket();
    if (['CLASS_REP', 'ADMIN'].includes(user.role)) {
      fetchUsers();
      fetchUpcomingMeetings();
    }
  }, [id]);

  useEffect(() => {
    if (!agendaSuccess) return;
    const t = setTimeout(() => {
      setAgendaSuccess('');
      setShowAgendaModal(false);
    }, 2000);
    return () => clearTimeout(t);
  }, [agendaSuccess]);

  useEffect(() => {
    if (!loading && ticket) {
      const params = new URLSearchParams(location.search);
      const commentId = params.get('commentId');
      const activityId = params.get('activityId');
      const section = params.get('section');
      
      let targetId = null;
      if (commentId) targetId = `comment-${commentId}`;
      else if (activityId) targetId = `activity-${activityId}`;
      else if (section) targetId = `section-${section}`;

      if (targetId) {
        setTimeout(() => {
          const el = document.getElementById(targetId);
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.classList.add('ring-2', 'ring-blue-400', 'bg-blue-50', 'transition-all', 'duration-1000');
            setTimeout(() => {
              el.classList.remove('ring-2', 'ring-blue-400', 'bg-blue-50');
            }, 2500);
          }
        }, 150);
      }
    }
  }, [loading, ticket, location.search]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users/staff');
      setUsers(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchUpcomingMeetings = async () => {
    try {
      const res = await api.get('/meetings');
      // Filter only upcoming meetings
      const upcoming = res.data.filter(m => new Date(m.meetingDate) > new Date());
      setMeetings(upcoming);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTicket = async () => {
    try {
      const res = await api.get(`/tickets/${id}`);
      setTicket(res.data);
      setSelectedAssignee(res.data.assignedTo?.id || '');
    } catch (err) {
      setError('Ticket not found or access denied');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setIsUpdatingStatus(true);
    try {
      await api.put(`/tickets/${id}`, { status: newStatus });
      fetchTicket();
      window.dispatchEvent(new Event('refreshNotifications'));
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to update ticket status');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleAssignToMe = async () => {
    setIsAssigning(true);
    try {
      await api.put(`/tickets/${id}`, { assignedToId: user.id });
      fetchTicket();
      window.dispatchEvent(new Event('refreshNotifications'));
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to assign ticket');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleAssign = async () => {
    setIsAssigning(true);
    try {
      await api.put(`/tickets/${id}`, { assignedToId: selectedAssignee || null });
      fetchTicket();
      window.dispatchEvent(new Event('refreshNotifications'));
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to update assignment');
    } finally {
      setIsAssigning(false);
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setIsPostingComment(true);
    try {
      await api.post(`/tickets/${id}/comments`, { content: commentText });
      setCommentText('');
      fetchTicket();
      window.dispatchEvent(new Event('refreshNotifications'));
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to post comment');
    } finally {
      setIsPostingComment(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setTaskError('');
    setIsCreatingTask(true);
    try {
      await api.post('/tasks', {
        title: taskTitle,
        description: taskDesc,
        assignedToId: taskAssignee,
        dueDate: taskDueDate || null,
        ticketId: ticket.id
      });
      setTaskSuccess('Task created successfully');
    } catch (err) {
      setTaskError(err.response?.data?.message || err.response?.data?.error || 'Failed to create task');
    } finally {
      setIsCreatingTask(false);
    }
  };
  
  const openTaskModal = () => {
    setTaskTitle(ticket.title);
    setTaskDesc(`Follow-up action for ticket #${ticket.id}`);
    setTaskAssignee(ticket.assignedTo?.id || user.id);
    setTaskDueDate('');
    setTaskError('');
    setTaskSuccess('');
    setShowTaskModal(true);
  };

  const openAgendaModal = () => {
    setSelectedMeeting('');
    setAgendaError('');
    setAgendaSuccess('');
    setShowAgendaModal(true);
  };

  const handleAddToAgenda = async (e) => {
    e.preventDefault();
    if (!selectedMeeting) {
      setAgendaError('Please select a meeting');
      return;
    }
    setIsAddingToAgenda(true);
    setAgendaError('');
    try {
      await api.post(`/meetings/${selectedMeeting}/agenda`, { ticketId: ticket.id });
      setAgendaSuccess('Added to meeting agenda');
    } catch (err) {
      if (err.response?.status === 409) {
        setAgendaError('This ticket is already on that meeting agenda.');
      } else {
        setAgendaError(err.response?.data?.message || err.response?.data?.error || 'Failed to add to agenda');
      }
    } finally {
      setIsAddingToAgenda(false);
    }
  };

  if (loading) return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-1/4"></div>
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6 space-y-4">
        <div className="h-6 bg-gray-200 rounded w-1/2"></div>
        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        <div className="border-t border-gray-200 pt-4 space-y-4">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    </div>
  );
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>;
  if (!ticket) return null;

  const timeline = ticket 
    ? [
        ...(ticket.activities || []).map(a => ({ ...a, type: 'activity' })),
        ...(ticket.comments || []).map(c => ({ ...c, type: 'comment' }))
      ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
    : [];

  const allowedTransitions = {
    'NEW': ['IN_PROGRESS'],
    'IN_PROGRESS': ['WAITING', 'RESOLVED'],
    'WAITING': ['RESOLVED'],
    'RESOLVED': ['CLOSED'],
    'CLOSED': ['IN_PROGRESS']
  };
  const validNextStatuses = ticket ? (allowedTransitions[ticket.status] || []) : [];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <button onClick={() => navigate(-1)} className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </button>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg" id="section-details">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div>
            <h3 className="text-xl leading-6 font-medium text-gray-900">{ticket.title}</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Submitted by {ticket.submitter.name} • Updated {formatRelativeTime(ticket.updatedAt)}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            {['CLASS_REP', 'ADMIN'].includes(user.role) && (
              <>
                <button onClick={openAgendaModal} className="px-3 py-1 text-xs font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm">
                  Add to Agenda
                </button>
                <button onClick={openTaskModal} className="px-3 py-1 text-xs font-medium rounded border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 shadow-sm">
                  Create Task
                </button>
              </>
            )}
            <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
              {formatLabel(ticket.status)}
            </span>
          </div>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Category & Priority</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center space-x-2 flex-wrap gap-y-2">
                <span>{ticket.category} • <span className="font-semibold">{ticket.priority}</span></span>
                {['BUG', 'FEATURE_REQUEST', 'GENERAL_FEEDBACK'].includes(ticket.type) && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wider">
                    {ticket.type === 'BUG' ? 'Bug' : ticket.type === 'FEATURE_REQUEST' ? 'Feature Request' : 'Feedback'}
                  </span>
                )}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Assigned To</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 flex items-center justify-between">
                <span>{ticket.assignedTo ? ticket.assignedTo.name : 'Unassigned'}</span>
                {['CLASS_REP', 'ADMIN'].includes(user.role) && (
                  <div className="flex items-center space-x-2">
                    <select
                      value={selectedAssignee}
                      onChange={(e) => setSelectedAssignee(e.target.value)}
                      className="input-field py-1 text-sm border-gray-300 w-48"
                    >
                      <option value="">Unassigned</option>
                      {users.filter(u => ['CLASS_REP', 'ADMIN'].includes(u.role)).map(u => (
                        <option key={u.id} value={u.id}>{u.name} ({formatLabel(u.role)})</option>
                      ))}
                    </select>
                    {selectedAssignee !== (ticket.assignedTo?.id || '') && (
                      <button onClick={handleAssign} disabled={isAssigning} className="btn-primary py-1 px-3 text-xs whitespace-nowrap disabled:opacity-50">
                        {isAssigning ? 'Assigning...' : (selectedAssignee ? 'Assign / Reassign' : 'Unassign')}
                      </button>
                    )}
                    {!ticket.assignedTo && selectedAssignee === '' && (
                      <button onClick={handleAssignToMe} disabled={isAssigning} className="text-primary-600 hover:text-primary-800 font-medium text-sm ml-2 whitespace-nowrap disabled:opacity-50">
                        {isAssigning ? 'Assigning...' : 'Assign to me'}
                      </button>
                    )}
                  </div>
                )}
              </dd>
            </div>
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Description</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 whitespace-pre-wrap">
                {ticket.description}
              </dd>
            </div>
            
            {/* Action Bar for Reps/Admins */}
            {['CLASS_REP', 'ADMIN'].includes(user.role) && (
              <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6 bg-gray-50">
                <dt className="text-sm font-medium text-gray-500 flex items-center">Update Status</dt>
                <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 space-x-2">
                  {['NEW', 'IN_PROGRESS', 'WAITING', 'RESOLVED', 'CLOSED'].map(status => {
                    const isCurrent = ticket.status === status;
                    const isValidNext = validNextStatuses.includes(status);
                    
                    if (!isCurrent && !isValidNext) return null;

                    return (
                      <button 
                        key={status}
                        onClick={() => handleStatusChange(status)}
                        disabled={isCurrent || isUpdatingStatus}
                        className={`px-3 py-1 text-xs rounded border disabled:opacity-50 ${isCurrent ? 'bg-gray-100 text-gray-800 cursor-default border-gray-300 font-semibold' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 shadow-sm'}`}
                      >
                        {isUpdatingStatus && !isCurrent ? 'Updating...' : (ticket.status === 'CLOSED' && status === 'IN_PROGRESS' ? 'Reopen Ticket' : status.replace('_', ' '))}
                      </button>
                    );
                  })}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg" id="section-activity">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Activity & Comments</h3>
        </div>
        <div className="px-4 py-5 sm:p-6 text-sm text-gray-700 space-y-4">
          {timeline.length === 0 ? (
            <p className="text-gray-500 italic">No activity yet. Be the first to comment.</p>
          ) : (
            timeline.map(item => (
              item.type === 'activity' ? (
                <div id={`activity-${item.id}`} key={`act-${item.id}`} className="text-xs text-gray-500 flex items-center space-x-2 px-2 py-1 rounded transition-colors duration-500">
                  <span className="font-medium text-gray-700">{item.user?.name || 'Unknown'}</span>
                  <span>{item.action.replace(/NEW|IN_PROGRESS|WAITING|RESOLVED|CLOSED/g, match => formatLabel(match))}</span>
                  <span className="text-gray-400">• {formatRelativeTime(item.createdAt)}</span>
                </div>
              ) : (
                <div id={`comment-${item.id}`} key={`com-${item.id}`} className={`p-4 rounded-lg bg-gray-50 border border-gray-100 transition-colors duration-500`}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-semibold text-gray-900">{item.user?.name || 'Unknown'} <span className="text-xs text-gray-500 font-normal ml-1">({formatLabel(item.user?.role || '')})</span></span>
                    <span className="text-xs text-gray-500">{formatRelativeTime(item.createdAt)}</span>
                  </div>
                  <p className="whitespace-pre-wrap">{item.content}</p>
                </div>
              )
            ))
          )}
        </div>
        <div className="bg-gray-50 px-4 py-4 sm:px-6 border-t border-gray-200" id="section-comments">
          <form onSubmit={submitComment} className="flex flex-col space-y-3">
            <textarea
              rows="3"
              className="input-field disabled:opacity-50"
              placeholder="Add a comment or update..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              disabled={isPostingComment}
            />
            <div className="flex justify-end">
              <button type="submit" className="btn-primary disabled:opacity-50" disabled={!commentText.trim() || isPostingComment}>
                {isPostingComment ? 'Posting...' : 'Post Comment'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create Task from Ticket</h3>
            {taskError && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{taskError}</div>}
            {taskSuccess && <div className="mb-4 text-sm text-green-600 bg-green-50 p-3 rounded">{taskSuccess}</div>}
            
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Task Title</label>
                <input type="text" required disabled={isCreatingTask} value={taskTitle} onChange={e => setTaskTitle(e.target.value)} className="input-field mt-1 w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea rows="3" disabled={isCreatingTask} value={taskDesc} onChange={e => setTaskDesc(e.target.value)} className="input-field mt-1 w-full"></textarea>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Assign To</label>
                <select required disabled={isCreatingTask} value={taskAssignee} onChange={e => setTaskAssignee(e.target.value)} className="input-field mt-1 w-full">
                  <option value="">Select Assignee...</option>
                  {users.filter(u => ['CLASS_REP', 'ADMIN'].includes(u.role)).map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({formatLabel(u.role)})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Due Date (Optional)</label>
                <input type="date" disabled={isCreatingTask} value={taskDueDate} onChange={e => setTaskDueDate(e.target.value)} className="input-field mt-1 w-full" />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" disabled={isCreatingTask} onClick={() => setShowTaskModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isCreatingTask} className="btn-primary disabled:opacity-50">
                  {isCreatingTask ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Agenda Modal */}
      {showAgendaModal && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Add to Meeting Agenda</h3>
            {agendaError && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{agendaError}</div>}
            {agendaSuccess && <div className="mb-4 text-sm text-green-600 bg-green-50 p-3 rounded">{agendaSuccess}</div>}
            
            <form onSubmit={handleAddToAgenda} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Select Upcoming Meeting</label>
                {meetings.length === 0 ? (
                  <p className="text-sm text-gray-500 mt-2">No upcoming meetings available. Create one from the Meetings page.</p>
                ) : (
                  <select 
                    required 
                    disabled={isAddingToAgenda} 
                    value={selectedMeeting} 
                    onChange={e => setSelectedMeeting(e.target.value)} 
                    className="input-field mt-1 w-full"
                  >
                    <option value="">Select a meeting...</option>
                    {meetings.map(m => (
                      <option key={m.id} value={m.id}>
                        {new Date(m.meetingDate).toLocaleDateString()} - {m.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button type="button" disabled={isAddingToAgenda} onClick={() => setShowAgendaModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isAddingToAgenda || meetings.length === 0} className="btn-primary disabled:opacity-50">
                  {isAddingToAgenda ? 'Adding...' : 'Add to Agenda'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TicketDetail;
