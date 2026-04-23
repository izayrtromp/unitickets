import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatLabel, formatRelativeTime } from '../utils/format';

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      setError('Failed to fetch users. Ensure you have admin access.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setCreateError('');
    setCreateSuccess('');
    
    if (password.length < 6) {
      setCreateError('Password must be at least 6 characters.');
      return;
    }

    try {
      await api.post('/users', { name, email, password, role });
      setCreateSuccess('User created successfully!');
      setName('');
      setEmail('');
      setPassword('');
      setRole('STUDENT');
      fetchUsers();
    } catch (err) {
      setCreateError(err.response?.data?.error || 'Failed to create user.');
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    try {
      const endpoint = currentStatus ? 'deactivate' : 'reactivate';
      await api.patch(`/users/${userId}/${endpoint}`);
      fetchUsers();
      setActionSuccess(`User ${currentStatus ? 'deactivated' : 'reactivated'} successfully`);
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${currentStatus ? 'deactivate' : 'reactivate'} user.`);
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      fetchUsers();
      setActionSuccess('User role updated successfully');
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update role');
    }
  };

  const handleResetPassword = async (userId) => {
    const newPassword = window.prompt('Enter new password for this user (min 6 characters):');
    if (!newPassword) return;
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    try {
      await api.patch(`/users/${userId}/password`, { password: newPassword });
      setActionSuccess('Password reset successfully');
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password');
    }
  };

  if (loading) return <div className="p-8 text-center">Loading users...</div>;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
        <p className="mt-1 text-sm text-gray-500">Manage all users in the system. Only administrators have access to this area.</p>
      </div>

      <div className="bg-white shadow sm:rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Create New User</h3>
          {createError && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{createError}</div>}
          {createSuccess && <div className="mb-4 text-sm text-green-600 bg-green-50 p-3 rounded">{createSuccess}</div>}
          
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input-field mt-1 w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field mt-1 w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" required minLength="6" value={password} onChange={(e) => setPassword(e.target.value)} className="input-field mt-1 w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select value={role} onChange={(e) => setRole(e.target.value)} className="input-field mt-1 w-full h-[42px]">
                <option value="STUDENT">Student</option>
                <option value="CLASS_REP">Class Rep</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <button type="submit" className="btn-primary w-full h-[42px] mt-1 whitespace-nowrap">Create User</button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        {actionSuccess && <div className="m-4 text-sm text-green-600 bg-green-50 p-3 rounded">{actionSuccess}</div>}
        {error ? (
          <div className="p-4 text-red-500">{error}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((u) => (
                  <tr key={u.id} className={!u.isActive ? "bg-gray-50 opacity-75" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.id === currentUser?.id ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {formatLabel(u.role)}
                        </span>
                      ) : (
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="text-xs rounded border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-1 pl-2 pr-6"
                        >
                          <option value="STUDENT">Student</option>
                          <option value="CLASS_REP">Class Rep</option>
                          <option value="ADMIN">Admin</option>
                        </select>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {u.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatRelativeTime(u.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button 
                        onClick={() => handleResetPassword(u.id)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        Reset Password
                      </button>
                      {u.id !== currentUser?.id ? (
                        <button 
                          onClick={() => handleToggleActive(u.id, u.isActive)}
                          className={`${u.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'}`}
                        >
                          {u.isActive ? 'Deactivate' : 'Reactivate'}
                        </button>
                      ) : (
                        <span className="text-gray-400 italic">Current Account</span>
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

export default AdminUsers;
