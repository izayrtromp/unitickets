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
    <div className={`min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 transition-opacity duration-700 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8">
        
        <div className="flex flex-col items-center mb-6">
          <div className="bg-primary-50 p-3 rounded-full mb-4">
            <Ticket className="h-10 w-10 text-primary-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight text-center">
            Reset Password
          </h2>
          <p className="mt-3 text-center text-sm text-gray-500 leading-relaxed">
            Enter your new password below.
          </p>
        </div>

        {message ? (
          <div className="text-center space-y-6">
            <div className="bg-green-50 text-green-700 p-4 rounded-lg border border-green-100">
              {message}
            </div>
            <Link to="/login" className="btn-primary w-full block py-2.5 rounded-lg text-sm font-semibold text-center">
              Login to your account
            </Link>
          </div>
        ) : (
          <form className="space-y-5" onSubmit={handleSubmit}>
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 text-center">
                {error}
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
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
