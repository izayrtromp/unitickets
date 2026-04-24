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
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [actionSuccess, setActionSuccess] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  
  const [pendingRoles, setPendingRoles] = useState({});
  
  const [resettingPasswordUser, setResettingPasswordUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [resetError, setResetError] = useState('');

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
    
    if (role === 'STUDENT' && !studentId.trim()) {
      setCreateError('Student ID is required for students.');
      return;
    }

    try {
      await api.post('/users', { name, email, studentId: studentId.trim() || null, password, role });
      setCreateSuccess('User created successfully!');
      setName('');
      setEmail('');
      setStudentId('');
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
      
      const p = {...pendingRoles};
      delete p[userId];
      setPendingRoles(p);
      
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update role');
    }
  };

  const submitPasswordReset = async () => {
    setResetError('');
    if (newPassword.length < 6) {
      setResetError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setResetError('Passwords do not match');
      return;
    }
    try {
      await api.patch(`/users/${resettingPasswordUser.id}/password`, { password: newPassword });
      setActionSuccess('Password reset successfully');
      setResettingPasswordUser(null);
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setActionSuccess(''), 3000);
    } catch (err) {
      setResetError(err.response?.data?.error || 'Failed to reset password');
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

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
          
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700">Name</label>
              <input type="text" required value={name} onChange={(e) => setName(e.target.value)} className="input-field mt-1 w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="input-field mt-1 w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Student ID</label>
              <input type="text" value={studentId} onChange={(e) => setStudentId(e.target.value)} className={`input-field mt-1 w-full ${role === 'STUDENT' && !studentId.trim() ? 'border-red-300 ring-1 ring-red-300' : ''}`} placeholder={role === 'STUDENT' ? 'Required' : 'Optional'} />
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
        <div className="p-4 border-b border-gray-200 bg-gray-50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input-field w-full sm:max-w-xs"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="input-field w-full sm:max-w-xs"
          >
            <option value="ALL">All Roles</option>
            <option value="STUDENT">Student</option>
            <option value="CLASS_REP">Class Rep</option>
            <option value="ADMIN">Admin</option>
          </select>
        </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className={!u.isActive ? "bg-gray-50 opacity-75" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{u.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{u.studentId || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.id === currentUser?.id ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {formatLabel(u.role)}
                        </span>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <select
                            value={pendingRoles[u.id] || u.role}
                            onChange={(e) => setPendingRoles({ ...pendingRoles, [u.id]: e.target.value })}
                            className="text-xs rounded border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-1 pl-2 pr-6"
                          >
                            <option value="STUDENT">Student</option>
                            <option value="CLASS_REP">Class Rep</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                          {pendingRoles[u.id] && pendingRoles[u.id] !== u.role && (
                            <div className="flex space-x-1">
                              <button onClick={() => handleRoleChange(u.id, pendingRoles[u.id])} className="text-green-600 hover:text-green-800 text-xs font-bold px-1 border border-green-200 rounded bg-green-50">Save</button>
                              <button onClick={() => { const p = {...pendingRoles}; delete p[u.id]; setPendingRoles(p); }} className="text-gray-500 hover:text-gray-700 text-xs px-1 border border-gray-200 rounded">Cancel</button>
                            </div>
                          )}
                        </div>
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
                        onClick={() => { setResettingPasswordUser(u); setNewPassword(''); setConfirmPassword(''); setResetError(''); }}
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

      {/* Password Reset Modal */}
      {resettingPasswordUser && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Reset Password for {resettingPasswordUser.name}</h3>
            {resetError && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{resetError}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">New Password</label>
                <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field mt-1 w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-field mt-1 w-full" />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button onClick={() => setResettingPasswordUser(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
                <button onClick={submitPasswordReset} className="btn-primary">Save Password</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
