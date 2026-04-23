import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { ArrowLeft } from 'lucide-react';
import { formatRelativeTime, formatLabel } from '../utils/format';

const TicketDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [ticket, setTicket] = useState(null);
  const [commentText, setCommentText] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState('');

  useEffect(() => {
    fetchTicket();
    if (['CLASS_REP', 'ADMIN'].includes(user.role)) {
      fetchUsers();
    }
  }, [id]);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users/staff');
      setUsers(res.data);
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
    try {
      await api.put(`/tickets/${id}`, { status: newStatus });
      fetchTicket();
      window.dispatchEvent(new Event('refreshNotifications'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssignToMe = async () => {
    try {
      await api.put(`/tickets/${id}`, { assignedToId: user.id });
      fetchTicket();
      window.dispatchEvent(new Event('refreshNotifications'));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAssign = async () => {
    try {
      await api.put(`/tickets/${id}`, { assignedToId: selectedAssignee || null });
      fetchTicket();
      window.dispatchEvent(new Event('refreshNotifications'));
    } catch (err) {
      console.error(err);
    }
  };

  const submitComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      await api.post(`/tickets/${id}/comments`, { content: commentText });
      setCommentText('');
      fetchTicket();
      window.dispatchEvent(new Event('refreshNotifications'));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading ticket details...</div>;
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

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 flex justify-between items-start">
          <div>
            <h3 className="text-xl leading-6 font-medium text-gray-900">{ticket.title}</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Submitted by {ticket.submitter.name} • Updated {formatRelativeTime(ticket.updatedAt)}
            </p>
          </div>
          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
            {formatLabel(ticket.status)}
          </span>
        </div>
        <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
          <dl className="sm:divide-y sm:divide-gray-200">
            <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Category & Priority</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {ticket.category} • <span className="font-semibold">{ticket.priority}</span>
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
                      <button onClick={handleAssign} className="btn-primary py-1 px-3 text-xs whitespace-nowrap">
                        {selectedAssignee ? 'Assign / Reassign' : 'Unassign'}
                      </button>
                    )}
                    {!ticket.assignedTo && selectedAssignee === '' && (
                      <button onClick={handleAssignToMe} className="text-primary-600 hover:text-primary-800 font-medium text-sm ml-2 whitespace-nowrap">
                        Assign to me
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
                        disabled={isCurrent}
                        className={`px-3 py-1 text-xs rounded border ${isCurrent ? 'bg-gray-100 text-gray-800 cursor-default border-gray-300 font-semibold' : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300 shadow-sm'}`}
                      >
                        {ticket.status === 'CLOSED' && status === 'IN_PROGRESS' ? 'Reopen Ticket' : status.replace('_', ' ')}
                      </button>
                    );
                  })}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Activity & Comments</h3>
        </div>
        <div className="px-4 py-5 sm:p-6 text-sm text-gray-700 space-y-4">
          {timeline.length === 0 ? (
            <p className="text-gray-500 italic">No activity yet. Be the first to comment.</p>
          ) : (
            timeline.map(item => (
              item.type === 'activity' ? (
                <div key={`act-${item.id}`} className="text-xs text-gray-500 flex items-center space-x-2 px-2 py-1">
                  <span className="font-medium text-gray-700">{item.user?.name || 'Unknown'}</span>
                  <span>{item.action.replace(/NEW|IN_PROGRESS|WAITING|RESOLVED|CLOSED/g, match => formatLabel(match))}</span>
                  <span className="text-gray-400">• {formatRelativeTime(item.createdAt)}</span>
                </div>
              ) : (
                <div key={`com-${item.id}`} className={`p-4 rounded-lg bg-gray-50 border border-gray-100`}>
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
        <div className="bg-gray-50 px-4 py-4 sm:px-6 border-t border-gray-200">
          <form onSubmit={submitComment} className="flex flex-col space-y-3">
            <textarea
              rows="3"
              className="input-field"
              placeholder="Add a comment or update..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <div className="flex justify-end">
              <button type="submit" className="btn-primary" disabled={!commentText.trim()}>Post Comment</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;
