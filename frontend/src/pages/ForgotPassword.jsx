import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Ticket } from 'lucide-react';
import api from '../api/axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setIsSubmitting(true);
    
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to send reset link');
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
            Forgot Password
          </h2>
          <p className="mt-3 text-center text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
            Enter your University of Aruba email to receive a password reset link.
          </p>
        </div>

        {message ? (
          <div className="text-center space-y-6">
            <div className="bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 p-4 rounded-lg border border-green-100 dark:border-green-800 transition-colors">
              {message}
            </div>
            <Link to="/login" className="btn-primary w-full block py-2.5 rounded-lg text-sm font-semibold text-center">
              Back to Login
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email address</label>
              <input
                type="email"
                required
                disabled={isSubmitting}
                className="input-field w-full disabled:opacity-50 rounded-lg transition-shadow focus:ring-2 focus:ring-primary-500"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your.email@ua.aw"
              />
            </div>

            <div className="pt-2">
              <button 
                type="submit" 
                disabled={isSubmitting} 
                className="w-full btn-primary py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition-all duration-200 disabled:opacity-50 flex justify-center items-center"
              >
                {isSubmitting ? 'Sending...' : 'Send reset link'}
              </button>
              <div className="mt-4 text-center">
                <Link to="/login" className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 font-medium transition-colors">
                  Back to login
                </Link>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
