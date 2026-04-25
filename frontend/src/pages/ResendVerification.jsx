import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { Mail } from 'lucide-react';
import { isValidUAEmail } from '../utils/validation';

const ResendVerification = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  
  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!isValidUAEmail(email)) {
      return setError('Please use your University of Aruba email address (@ua.aw).');
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/resend-verification', { email });
      setSuccess(res.data.message);
      setEmail('');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to request verification email.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 transition-opacity duration-700 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8">
        
        <div className="flex flex-col items-center mb-6">
          <div className="bg-primary-50 p-3 rounded-full mb-4">
            <Mail className="h-10 w-10 text-primary-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight text-center">
            Resend Verification
          </h2>
          <p className="mt-3 text-center text-sm text-gray-500 leading-relaxed">
            Enter your University of Aruba email to receive a new verification link.
          </p>
        </div>

        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg border border-green-100 text-center">
              {success}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">University of Aruba Email</label>
            <input
              type="email"
              required
              disabled={isSubmitting}
              className="input-field w-full disabled:opacity-50 rounded-lg focus:ring-2 focus:ring-primary-500 transition-shadow"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your.email@ua.aw"
            />
            <p className="mt-1 text-xs text-gray-500">Use your official University of Aruba email address (@ua.aw)</p>
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isSubmitting} 
              className="w-full btn-primary py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Sending...' : 'Send verification email'}
            </button>
            <div className="mt-4 text-center">
              <Link to="/login" className="text-sm text-primary-600 hover:text-primary-800 font-medium">
                Back to sign in
              </Link>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResendVerification;
