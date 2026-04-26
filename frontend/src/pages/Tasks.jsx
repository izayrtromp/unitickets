import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import ConfirmModal from '../components/ConfirmModal';
import { getStatusColor } from '../utils/format';
import { ClipboardList } from 'lucide-react';

const formatStatus = (status) => {
  if (status === 'TODO') return 'To Do';
  if (status === 'IN_PROGRESS') return 'In Progress';
  if (status === 'DONE') return 'Done';
  return status;
};

const Tasks = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [isUpdatingStatusId, setIsUpdatingStatusId] = useState(null);
  const [isDeletingTaskId, setIsDeletingTaskId] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);

  // Default filter: "Assigned to me"
  const [filter, setFilter] = useState('ASSIGNED_TO_ME'); // ALL, ASSIGNED_TO_ME, TODO, IN_PROGRESS, DONE

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
      addToast('Task status updated', 'success');
      fetchTasks();
    } catch (err) {
      addToast(err.response?.data?.message || err.response?.data?.error || 'Failed to update task status', 'error');
    } finally {
      setIsUpdatingStatusId(null);
    }
  };

  const confirmDelete = (taskId) => {
    setTaskToDelete(taskId);
    setDeleteModalOpen(true);
  };

  const executeDelete = async () => {
    if (!taskToDelete) return;
    setIsDeletingTaskId(taskToDelete);
    setError('');
    try {
      await api.delete(`/tasks/${taskToDelete}`);
      addToast('Task deleted successfully', 'success');
      setDeleteModalOpen(false);
      fetchTasks();
    } catch (err) {
      addToast(err.response?.data?.message || err.response?.data?.error || 'Failed to delete task', 'error');
    } finally {
      setIsDeletingTaskId(null);
      setTaskToDelete(null);
    }
  };

  const isOverdue = (task) => {
    if (!task.dueDate || task.status === 'DONE') return false;
    return new Date(task.dueDate) < new Date();
  };

  const safeTasks = Array.isArray(tasks) ? tasks : [];

  const filteredTasks = safeTasks.filter(t => {
    if (filter === 'ASSIGNED_TO_ME') return t.assignedTo?.id === user?.id;
    if (filter === 'TODO') return t.status === 'TODO';
    if (filter === 'IN_PROGRESS') return t.status === 'IN_PROGRESS';
    if (filter === 'DONE') return t.status === 'DONE';
    return true; // ALL
  });



  if (!user) return <div className="p-8 text-center animate-pulse">Loading tasks...</div>;

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
          <div className="p-12 text-center flex flex-col items-center justify-center">
            <ClipboardList className="h-12 w-12 text-gray-400 mb-3" />
            <h3 className="text-lg font-medium text-gray-900">No tasks found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {filter === 'ALL' ? 'No tasks assigned yet.' : 'No tasks match your current filter.'}
            </p>
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
                  <tr key={task.id} className={`${task.status === 'DONE' ? 'opacity-75 bg-gray-50' : ''} hover:bg-gray-50 transition-all duration-200`}>
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
                      ) : <span className="italic text-gray-400">No ticket linked</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {task.assignedTo?.name || '-'}
                    </td>
                    <td className={`px-6 py-4 whitespace-nowrap text-sm ${isOverdue(task) ? 'text-red-600 font-medium' : 'text-gray-500'}`}>
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : <span className="italic text-gray-400">No due date</span>}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <select 
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        disabled={isUpdatingStatusId === task.id}
                        className={`text-xs rounded shadow-sm focus:border-primary-500 focus:ring-primary-500 py-1 pl-2 pr-6 disabled:opacity-50 transition-all duration-200 cursor-pointer ${getStatusColor(task.status)}`}
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
                          onClick={() => confirmDelete(task.id)} 
                          disabled={isDeletingTaskId === task.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 font-semibold"
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

      <ConfirmModal 
        isOpen={deleteModalOpen} 
        onClose={() => setDeleteModalOpen(false)} 
        onConfirm={executeDelete} 
        title="Delete Task" 
        message="Are you sure you want to delete this task? This action cannot be undone."
        confirmText="Delete"
        confirmColor="red"
        isProcessing={!!isDeletingTaskId}
      />
    </div>
  );
};

export default Tasks;
