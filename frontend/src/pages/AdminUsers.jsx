import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { formatLabel, formatRelativeTime, getRoleColor, getRoleIcon } from '../utils/format';
import Badge from '../components/Badge';
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
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [createError, setCreateError] = useState('');
  const [createSuccess, setCreateSuccess] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isResettingPwd, setIsResettingPwd] = useState(false);
  const [isTogglingId, setIsTogglingId] = useState(null);
  const [isSavingRoleId, setIsSavingRoleId] = useState(null);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [showCleanupModal, setShowCleanupModal] = useState(false);
  const [cleanupPreviewCount, setCleanupPreviewCount] = useState(0);
  
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
    setIsSubmitted(true);
    
    if (password && password.length < 6) {
      return;
    }
    
    if (role === 'STUDENT' && !studentId.trim()) {
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
      setIsSubmitted(false);
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
    if (!window.confirm('Are you sure you want to reject and deactivate this unverified account?')) return;
    try {
      await api.patch(`/users/${userId}/reject`);
      fetchUsers();
      addToast('Unverified account rejected', 'success');
    } catch (err) {
      addToast(err.response?.data?.message || err.response?.data?.error || 'Failed to reject user', 'error');
    }
  };

  const handlePreviewCleanup = async () => {
    try {
      setIsPreviewing(true);
      const res = await api.get('/users/unverified/cleanup/preview');
      if (res.data.count === 0) {
        addToast('There are no expired unverified accounts to clean up.', 'success');
      } else {
        setCleanupPreviewCount(res.data.count);
        setShowCleanupModal(true);
      }
    } catch (err) {
      addToast(err.response?.data?.message || err.response?.data?.error || 'Failed to preview cleanup', 'error');
    } finally {
      setIsPreviewing(false);
    }
  };

  const handleConfirmCleanup = async () => {
    try {
      setIsCleaningUp(true);
      const res = await api.delete('/users/unverified/cleanup');
      fetchUsers();
      addToast(res.data.message || 'Cleanup complete', 'success');
      setShowCleanupModal(false);
    } catch (err) {
      addToast(err.response?.data?.message || err.response?.data?.error || 'Failed to clean up accounts', 'error');
    } finally {
      setIsCleaningUp(false);
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

  const safeUsers = Array.isArray(users) ? users : [];

  const filteredUsers = safeUsers.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'ALL' || u.role === roleFilter;
    const matchesTab = viewTab === 'UNVERIFIED' ? u.isEmailVerified === false : true;
    return matchesSearch && matchesRole && matchesTab;
  });

  if (!currentUser) return <div className="p-8 text-center animate-pulse">Loading admin access...</div>;



  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">User Management</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Manage all users in the system. Only administrators have access to this area.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow sm:rounded-lg transition-colors">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mb-4">Create New User</h3>
          {createSuccess && <div className="mb-4 text-sm text-green-600 bg-green-50 p-3 rounded">{createSuccess}</div>}
          {createError && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{createError}</div>}
          
          <form onSubmit={handleCreateUser} className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6 items-start">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
              <input type="text" required disabled={isCreating} value={name} onChange={(e) => setName(e.target.value)} className="input-field mt-1 w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
              <input type="email" required disabled={isCreating} value={email} onChange={(e) => setEmail(e.target.value)} className="input-field mt-1 w-full" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Student ID</label>
              <input type="text" disabled={isCreating} value={studentId} onChange={(e) => setStudentId(e.target.value)} className={`input-field mt-1 w-full ${isSubmitted && role === 'STUDENT' && !studentId.trim() ? 'border-red-300 dark:border-red-500 ring-1 ring-red-300 dark:ring-red-500' : ''}`} placeholder={role === 'STUDENT' ? 'Required' : 'Optional'} />
              {isSubmitted && role === 'STUDENT' && !studentId.trim() && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">Student ID is required.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
              <input type="password" required disabled={isCreating} value={password} onChange={(e) => setPassword(e.target.value)} className={`input-field mt-1 w-full ${isSubmitted && password.length > 0 && password.length < 6 ? 'border-red-300 dark:border-red-500 ring-1 ring-red-300 dark:ring-red-500' : ''}`} />
              {isSubmitted && password.length > 0 && password.length < 6 && (
                <p className="mt-1 text-xs text-red-500 dark:text-red-400">Must be at least 6 characters.</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Role</label>
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

      <div className="bg-white dark:bg-gray-800 shadow overflow-hidden sm:rounded-lg transition-colors">
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button 
            onClick={() => setViewTab('ALL')} 
            className={`py-3 px-6 text-sm font-medium transition-colors ${viewTab === 'ALL' ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            All Users
          </button>
          <button 
            onClick={() => setViewTab('UNVERIFIED')} 
            className={`py-3 px-6 text-sm font-medium flex items-center transition-colors ${viewTab === 'UNVERIFIED' ? 'border-b-2 border-primary-600 text-primary-600 dark:text-primary-400 dark:border-primary-400' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'}`}
          >
            Unverified Accounts
            {safeUsers.filter(u => u.isEmailVerified === false).length > 0 && (
              <span className="ml-2 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 py-0.5 px-2 rounded-full text-xs">
                {safeUsers.filter(u => u.isEmailVerified === false).length}
              </span>
            )}
          </button>
        </div>
        
        {viewTab === 'UNVERIFIED' && (
          <div className="px-4 py-3 bg-yellow-50 dark:bg-yellow-900/20 border-b border-yellow-100 dark:border-yellow-800/30 text-sm text-yellow-800 dark:text-yellow-300 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <span>These users registered but have not verified their institutional email yet. They cannot access the app until they verify their email. If users do not receive verification emails, ask them to check spam/junk and use Resend Verification. If the daily limit is reached, an admin may create or review the account manually.</span>
            <button 
              onClick={handlePreviewCleanup} 
              disabled={isPreviewing}
              className="px-3 py-1.5 text-xs font-semibold rounded border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 dark:border-red-800/50 dark:text-red-400 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition-colors whitespace-nowrap disabled:opacity-50"
            >
              {isPreviewing ? 'Loading...' : 'Clean up expired unverified accounts'}
            </button>
          </div>
        )}
        
        <div className="p-4 mb-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 transition-colors">
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
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Joined</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className={`${!u.isActive ? "bg-gray-50 dark:bg-gray-800/50 opacity-75" : ""} hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{u.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{u.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">{u.studentId || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {u.id === currentUser?.id ? (
                        <Badge type="role" value={u.role} />
                      ) : (
                        <div className="flex items-center space-x-2">
                          <div className={`flex items-center rounded-full focus-within:ring-2 focus-within:ring-green-500 ${getRoleColor(pendingRoles[u.id] || u.role)} transition-colors duration-200`}>
                            <span className="pl-3 text-xs select-none pointer-events-none">{getRoleIcon(pendingRoles[u.id] || u.role)}</span>
                            <select
                              disabled={isSavingRoleId === u.id}
                              value={pendingRoles[u.id] || u.role}
                              onChange={(e) => setPendingRoles({ ...pendingRoles, [u.id]: e.target.value })}
                              className="text-xs bg-transparent border-none focus:ring-0 py-1 pl-2 pr-8 cursor-pointer font-semibold disabled:opacity-70 disabled:cursor-not-allowed"
                              style={{ color: 'inherit' }}
                            >
                              <option value="STUDENT" className="text-gray-900 bg-white dark:bg-gray-800 dark:text-gray-100">Student</option>
                              <option value="CLASS_REP" className="text-gray-900 bg-white dark:bg-gray-800 dark:text-gray-100">Class Rep</option>
                              <option value="ADMIN" className="text-gray-900 bg-white dark:bg-gray-800 dark:text-gray-100">Admin</option>
                            </select>
                          </div>
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
                      {u.isEmailVerified === false ? (
                        <span className="px-2.5 py-0.5 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800">
                          Unverified
                        </span>
                      ) : (
                        <Badge type="active" value={u.isActive} />
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatRelativeTime(u.createdAt)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      {u.isEmailVerified === false ? (
                        <>
                          <button onClick={() => handleReject(u.id)} className="text-red-600 hover:text-red-900 transition-colors">Reject / Delete</button>
                        </>
                      ) : (
                        <>
                          <button 
                            onClick={() => { setResettingPasswordUser(u); setNewPassword(''); setConfirmPassword(''); setResetError(''); }}
                            className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
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
        <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Reset Password for {resettingPasswordUser.name}</h3>
            {resetError && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{resetError}</div>}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">New Password</label>
                <input type="password" disabled={isResettingPwd} value={newPassword} onChange={e => setNewPassword(e.target.value)} className="input-field mt-1 w-full" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                <input type="password" disabled={isResettingPwd} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-field mt-1 w-full" />
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button disabled={isResettingPwd} onClick={() => setResettingPasswordUser(null)} className="btn-secondary transition-all duration-200">Cancel</button>
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

      {/* Cleanup Preview Modal */}
      {showCleanupModal && (
        <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80 flex items-center justify-center p-4 z-50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Confirm Cleanup</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              This will permanently remove <strong>{cleanupPreviewCount}</strong> unverified account{cleanupPreviewCount !== 1 ? 's' : ''} older than 48 hours. Continue?
            </p>
            <div className="flex justify-end space-x-3 mt-6">
              <button disabled={isCleaningUp} onClick={() => setShowCleanupModal(false)} className="btn-secondary transition-all duration-200">Cancel</button>
              <button disabled={isCleaningUp} onClick={handleConfirmCleanup} className="btn-primary bg-red-600 hover:bg-red-700 focus:ring-red-500 dark:bg-red-700 dark:hover:bg-red-600 disabled:opacity-50 transition-all duration-200 flex items-center justify-center">
                {isCleaningUp ? 'Deleting...' : 'Delete Accounts'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminUsers;
