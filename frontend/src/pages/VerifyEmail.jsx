import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { CheckCircle, XCircle } from 'lucide-react';

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  
  const [status, setStatus] = useState('verifying'); // verifying, success, error
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided.');
      return;
    }

    const verify = async () => {
      try {
        const res = await api.post('/auth/verify-email', { token });
        setStatus('success');
        setMessage(res.data.message);
      } catch (err) {
        setStatus('error');
        setMessage(err.response?.data?.error || err.response?.data?.message || 'Verification failed. The link may have expired or is invalid.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 w-full max-w-md rounded-2xl shadow-lg p-8 text-center transition-colors">
        {status === 'verifying' && (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 dark:border-primary-400 mb-4"></div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verifying Email...</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Please wait while we verify your account.</p>
          </div>
        )}

        {status === 'success' && (
          <div className="flex flex-col items-center">
            <CheckCircle className="h-16 w-16 text-green-500 dark:text-green-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Email Verified!</h2>
            <p className="mt-2 text-gray-500 dark:text-gray-400 mb-6">{message}</p>
            <Link to="/login" className="btn-primary py-2.5 px-6 rounded-lg font-semibold w-full block text-center shadow-sm hover:shadow transition-all">
              Continue to Login
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <XCircle className="h-16 w-16 text-red-500 dark:text-red-400 mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Verification Failed</h2>
            <p className="mt-2 text-red-600 dark:text-red-400 mb-6">{message}</p>
            <Link to="/login" className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 font-medium transition-colors">
              Back to Login
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
