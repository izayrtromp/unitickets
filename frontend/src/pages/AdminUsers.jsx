import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatLabel, formatRelativeTime } from '../utils/format';
import { useToast } from '../context/ToastContext';

const AdminUsers = () => {
  const { user: currentUser } = useAuth();
  const { addToast } = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STUDENT');
  const [createError, setCreateError] = useState('');
  const [isResettingPwd, setIsResettingPwd] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [viewTab, setViewTab] = useState('ALL');
  
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
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to fetch users. Ensure you have admin access.');
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
      setIsCreating(true);
      await api.post('/users', { name, email, studentId: studentId.trim() || null, password, role });
      addToast('User created successfully!', 'success');
      setName('');
      setEmail('');
      setStudentId('');
      setPassword('');
      setRole('STUDENT');
      fetchUsers();
    } catch (err) {
      setCreateError(err.response?.data?.message || err.response?.data?.error || 'Failed to create user.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleToggleActive = async (userId, currentStatus) => {
    const actionName = currentStatus ? 'deactivate' : 'reactivate';
    if (!window.confirm(`Are you sure you want to ${actionName} this user?`)) return;
    setIsTogglingId(userId);
    try {
      await api.patch(`/users/${userId}/${actionName}`);
      fetchUsers();
      addToast(`User ${actionName}d successfully`, 'success');
    } catch (err) {
      addToast(err.response?.data?.message || err.response?.data?.error || `Failed to ${actionName} user.`, 'error');
    } finally {
      setIsTogglingId(null);
    }
  };

  const handleApprove = async (userId) => {
    try {
      await api.patch(`/users/${userId}/approve`);
      fetchUsers();
      addToast('User approved successfully', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || err.response?.data?.error || 'Failed to approve user', 'error');
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm('Are you sure you want to reject this account request?')) return;
    try {
      await api.patch(`/users/${userId}/reject`);
      fetchUsers();
      addToast('User request rejected', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || err.response?.data?.error || 'Failed to reject user', 'error');
    }
  };

  const handleRoleChange = async (userId, newRole) => {
    setIsSavingRoleId(userId);
    try {
      await api.patch(`/users/${userId}/role`, { role: newRole });
      fetchUsers();
      addToast('User role updated successfully', 'success');
      
      const p = {...pendingRoles};
      delete p[userId];
      setPendingRoles(p);
    } catch (err) {
      addToast(err.response?.data?.message || err.response?.data?.error || 'Failed to update role', 'error');
    } finally {
      setIsSavingRoleId(null);
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
      setIsResettingPwd(true);
      await api.patch(`/users/${resettingPasswordUser.id}/password`, { password: newPassword });
      addToast('Password reset successfully', 'success');
      setResettingPasswordUser(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setResetError(err.response?.data?.message || err.response?.data?.error || 'Failed to reset password');
    } finally {
      setIsResettingPwd(false);
    }
  };

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesTab = viewTab === 'PENDING' ? u.approvalStatus === 'PENDING' : u.approvalStatus !== 'PENDING';
    return matchesSearch && matchesRole && matchesTab;
  });



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
              <input type="text" required disabled={isCreating} value={name} onChange={(e) => setName(e.target.value)} className="input-field mt-1 w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input type="email" required disabled={isCreating} value={email} onChange={(e) => setEmail(e.target.value)} className="input-field mt-1 w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Student ID</label>
              <input type="text" disabled={isCreating} value={studentId} onChange={(e) => setStudentId(e.target.value)} className={`input-field mt-1 w-full ${role === 'STUDENT' && !studentId.trim() ? 'border-red-300 ring-1 ring-red-300' : ''}`} placeholder={role === 'STUDENT' ? 'Required' : 'Optional'} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Password</label>
              <input type="password" required minLength="6" disabled={isCreating} value={password} onChange={(e) => setPassword(e.target.value)} className="input-field mt-1 w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Role</label>
              <select value={role} disabled={isCreating} onChange={(e) => setRole(e.target.value)} className="input-field mt-1 w-full h-[42px]">
                <option value="STUDENT">Student</option>
                <option value="CLASS_REP">Class Rep</option>
                <option value="ADMIN">Admin</option>
              </select>
            </div>
            <div>
              <button type="submit" disabled={isCreating} className="btn-primary w-full h-[42px] mt-1 whitespace-nowrap disabled:opacity-50 transition-all duration-200 flex justify-center items-center">
                {isCreating && (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isCreating ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="flex border-b border-gray-200">
          <button 
            onClick={() => setViewTab('ALL')} 
            className={`py-3 px-6 text-sm font-medium ${viewTab === 'ALL' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            All Users
          </button>
          <button 
            onClick={() => setViewTab('PENDING')} 
            className={`py-3 px-6 text-sm font-medium flex items-center ${viewTab === 'PENDING' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Pending Approvals
            {users.filter(u => u.approvalStatus === 'PENDING').length > 0 && (
              <span className="ml-2 bg-red-100 text-red-600 py-0.5 px-2 rounded-full text-xs">
                {users.filter(u => u.approvalStatus === 'PENDING').length}
              </span>
            )}
          </button>
        </div>
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
        {error ? (
          <div className="p-4 text-red-500">{error}</div>
        ) : loading ? (
          <div className="animate-pulse p-6 flex flex-col space-y-6">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="flex space-x-4">
                <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                <div className="h-4 bg-gray-200 rounded w-1/5"></div>
              </div>
            ))}
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            {searchTerm || roleFilter !== 'ALL' ? "No results match your search." : "No users found."}
          </div>
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
                  <tr key={u.id} className={`${!u.isActive ? "bg-gray-50 opacity-75" : ""} hover:bg-gray-50 transition-colors duration-150`}>
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
                            disabled={isSavingRoleId === u.id}
                            value={pendingRoles[u.id] || u.role}
                            onChange={(e) => setPendingRoles({ ...pendingRoles, [u.id]: e.target.value })}
                            className="text-xs rounded border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 py-1 pl-2 pr-6 disabled:opacity-50"
                          >
                            <option value="STUDENT">Student</option>
                            <option value="CLASS_REP">Class Rep</option>
                            <option value="ADMIN">Admin</option>
                          </select>
                          {pendingRoles[u.id] && pendingRoles[u.id] !== u.role && (
                            <div className="flex space-x-1">
                              <button disabled={isSavingRoleId === u.id} onClick={() => handleRoleChange(u.id, pendingRoles[u.id])} className="text-green-600 hover:text-green-800 text-xs font-bold px-1 border border-green-200 rounded bg-green-50 disabled:opacity-50">
                                {isSavingRoleId === u.id ? 'Saving...' : 'Save'}
                              </button>
                              <button disabled={isSavingRoleId === u.id} onClick={() => { const p = {...pendingRoles}; delete p[u.id]; setPendingRoles(p); }} className="text-gray-500 hover:text-gray-700 text-xs px-1 border border-gray-200 rounded disabled:opacity-50">Cancel</button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        u.approvalStatus === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        u.approvalStatus === 'REJECTED' ? 'bg-gray-100 text-gray-800' :
                        u.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {u.approvalStatus === 'PENDING' ? 'Pending' : u.approvalStatus === 'REJECTED' ? 'Rejected' : (u.isActive ? 'Active' : 'Inactive')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatRelativeTime(u.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      {u.approvalStatus === 'PENDING' ? (
                        <>
                          <button onClick={() => handleApprove(u.id)} className="text-green-600 hover:text-green-900 transition-colors">Approve</button>
                          <button onClick={() => handleReject(u.id)} className="text-red-600 hover:text-red-900 transition-colors">Reject</button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => { setResettingPasswordUser(u); setNewPassword(''); setConfirmPassword(''); setResetError(''); }}
                            className="text-primary-600 hover:text-primary-900 transition-colors"
                          >
                            Reset Password
                          </button>
                          {u.id !== currentUser?.id ? (
                            <button 
                              onClick={() => handleToggleActive(u.id, u.isActive)}
                              disabled={isTogglingId === u.id}
                              className={`${u.isActive ? 'text-red-600 hover:text-red-900' : 'text-green-600 hover:text-green-900'} disabled:opacity-50 transition-colors`}
                            >
                              {isTogglingId === u.id ? (u.isActive ? 'Deactivating...' : 'Reactivating...') : (u.isActive ? 'Deactivate' : 'Reactivate')}
                            </button>
                          ) : (
                            <span className="text-gray-400 italic">Current Account</span>
                          )}
                        </>
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
                <input type="password" disabled={isResettingPwd} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field mt-1 w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
                <input type="password" disabled={isResettingPwd} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-field mt-1 w-full" />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button disabled={isResettingPwd} onClick={() => setResettingPasswordUser(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-all duration-200">Cancel</button>
                <button disabled={isResettingPwd} onClick={submitPasswordReset} className="btn-primary disabled:opacity-50 transition-all duration-200 flex items-center justify-center">
                  {isResettingPwd && (
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isResettingPwd ? 'Updating...' : 'Save Password'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
