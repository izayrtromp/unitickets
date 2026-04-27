import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import api from '../api/axios';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    if (!token) {
      setError('Invalid or missing password reset token.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || isSubmitting) return;
    
    setError('');
    setMessage('');
    setIsSubmitting(true);
    
    try {
      const res = await api.post('/auth/reset-password', { 
        token, 
        password, 
        confirmPassword 
      });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to reset password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 transition-opacity duration-700 ease-out transition-colors ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 w-full max-w-md rounded-2xl shadow-lg p-8 transition-colors">
        
        <div className="flex flex-col items-center mb-6">
          <div className="bg-primary-50 dark:bg-primary-900/30 p-3 rounded-full mb-4 transition-colors">
            <Ticket className="h-10 w-10 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight text-center">
            Reset Password
          </h2>
          <p className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Enter your new password below.
          </p>
        </div>

        {message ? (
          <div className="text-center space-y-6">
            <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-4 rounded-lg border border-green-100 dark:border-green-800 transition-colors">
              {message}
            </div>
            <Link to="/login" className="btn-primary w-full block py-2.5 rounded-lg text-sm font-semibold text-center">
              Login to your account
            </Link>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 text-sm p-3 rounded-lg border border-red-100 dark:border-red-800 text-center transition-colors">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">New Password</label>
              <input
                type="password"
                required
                disabled={isSubmitting || !token}
                className="input-field w-full disabled:opacity-50 rounded-lg transition-shadow focus:ring-2 focus:ring-primary-500"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
              <input
                type="password"
                required
                disabled={isSubmitting || !token}
                className="input-field w-full disabled:opacity-50 rounded-lg transition-shadow focus:ring-2 focus:ring-primary-500"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={isSubmitting || !token} 
                className="w-full btn-primary py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 flex justify-center items-center"
              >
                {isSubmitting ? 'Resetting...' : 'Reset Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
