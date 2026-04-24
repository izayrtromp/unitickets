import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const formatStatus = (status) => {
  if (status === 'TODO') return 'To Do';
  if (status === 'IN_PROGRESS') return 'In Progress';
  if (status === 'DONE') return 'Done';
  return status;
};

const Tasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [isUpdatingStatusId, setIsUpdatingStatusId] = useState(null);
  const [isDeletingTaskId, setIsDeletingTaskId] = useState(null);

  // Default filter: "Assigned to me"
  const [filter, setFilter] = useState('ASSIGNED_TO_ME'); // ALL, ASSIGNED_TO_ME, TODO, IN_PROGRESS, DONE

  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => setSuccess(''), 3000);
    return () => clearTimeout(t);
  }, [success]);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const res = await api.get('/tasks');
      setTasks(res.data);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    setIsUpdatingStatusId(taskId);
    setError('');
    try {
      await api.patch(`/tasks/${taskId}`, { status: newStatus });
      setSuccess('Task status updated');
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to update task status');
    } finally {
      setIsUpdatingStatusId(null);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;
    setIsDeletingTaskId(taskId);
    setError('');
    try {
      await api.delete(`/tasks/${taskId}`);
      setSuccess('Task deleted successfully');
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to delete task');
    } finally {
      setIsDeletingTaskId(null);
    }
  };

  const isOverdue = (task) => {
    if (!task.dueDate || task.status === 'DONE') return false;
    return new Date(task.dueDate) < new Date();
  };

  const filteredTasks = tasks.filter(t => {
    if (filter === 'ASSIGNED_TO_ME') return t.assignedTo?.id === user.id;
    if (filter === 'TODO') return t.status === 'TODO';
    if (filter === 'IN_PROGRESS') return t.status === 'IN_PROGRESS';
    if (filter === 'DONE') return t.status === 'DONE';
    return true; // ALL
  });



  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Task Management</h2>
          <p className="mt-1 text-sm text-gray-500">Track follow-up actions and responsibilities.</p>
        </div>
        
        <div className="flex bg-white rounded-md shadow-sm border border-gray-300 p-1">
          <select 
            value={filter} 
            onChange={e => setFilter(e.target.value)}
            className="input-field border-none shadow-none py-1.5 focus:ring-0"
          >
            <option value="ASSIGNED_TO_ME">Assigned to me</option>
            <option value="ALL">All Tasks</option>
            <option value="TODO">To Do</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="DONE">Done</option>
          </select>
        </div>
      </div>

      {error && <div className="text-red-600 bg-red-50 p-4 rounded-md">{error}</div>}
      {success && <div className="text-green-600 bg-green-50 p-4 rounded-md">{success}</div>}

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {loading ? (
          <div className="animate-pulse p-6 flex flex-col space-y-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        ) : filteredTasks.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {filter === 'ALL' ? 'No tasks found.' : 'No tasks match your current filter.'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Linked Ticket</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Assigned To</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTasks.map(task => (
                  <tr key={task.id} className={`${task.status === 'DONE' ? 'opacity-75 bg-gray-50' : ''}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {isOverdue(task) && <span className="h-2 w-2 rounded-full bg-red-500 mr-2" title="Overdue"></span>}
                        <div className="text-sm font-medium text-gray-900">{task.title}</div>
                      </div>
                      {task.description && <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">{task.description}</div>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {task.ticket ? (
                        <Link to={`/tickets/${task.ticket.id}`} className="text-primary-600 hover:text-primary-900 hover:underline">
                          {task.ticket.title}
                        </Link>
                      ) : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.assignedTo?.name || '-'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isOverdue(task) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select 
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        disabled={isUpdatingStatusId === task.id}
                        className={`text-xs rounded border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-1 pl-2 pr-6 disabled:opacity-50
                          ${task.status === 'DONE' ? 'bg-green-50 text-green-800 border-green-200' : 
                            task.status === 'IN_PROGRESS' ? 'bg-yellow-50 text-yellow-800 border-yellow-200' : ''}`}
                      >
                        {isUpdatingStatusId === task.id ? (
                          <option value={task.status}>Updating...</option>
                        ) : (
                          <>
                            <option value="TODO">To Do</option>
                            <option value="IN_PROGRESS">In Progress</option>
                            <option value="DONE">Done</option>
                          </>
                        )}
                      </select>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {user.role === 'ADMIN' && (
                        <button 
                          onClick={() => handleDeleteTask(task.id)} 
                          disabled={isDeletingTaskId === task.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                        >
                          {isDeletingTaskId === task.id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default Tasks;
