import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Ticket, GraduationCap, ClipboardList } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Invalid credentials');
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 transition-opacity duration-700 ease-out ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
      <div className="bg-white w-full max-w-md rounded-2xl shadow-lg p-8">
        
        {/* Top Section */}
        <div className="flex flex-col items-center mb-6">
          <div className="bg-primary-50 p-3 rounded-full mb-4">
            <Ticket className="h-10 w-10 text-primary-600" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 tracking-tight text-center">
            Welcome to UniTickets
          </h2>
          <p className="mt-3 text-center text-sm text-gray-500 leading-relaxed">
            A centralized platform for students and class representatives to report, track, and manage academic concerns efficiently.
          </p>
        </div>

        {/* Role Explanation Section */}
        <div className="bg-gray-50 rounded-xl p-5 mb-8 space-y-4 border border-gray-100">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <GraduationCap className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Students</h3>
              <p className="text-xs text-gray-500 mt-0.5">Submit and track issues</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 mt-0.5">
              <ClipboardList className="h-5 w-5 text-gray-500" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Class Representatives</h3>
              <p className="text-xs text-gray-500 mt-0.5">Manage tickets and organize meetings</p>
            </div>
          </div>
        </div>

        {/* Login Form Section */}
        <form className="space-y-5" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100 text-center">
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email address</label>
            <input
              type="email"
              required
              disabled={isLoggingIn}
              className="input-field w-full disabled:opacity-50 rounded-lg transition-shadow focus:ring-2 focus:ring-primary-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@university.edu"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              disabled={isLoggingIn}
              className="input-field w-full disabled:opacity-50 rounded-lg transition-shadow focus:ring-2 focus:ring-primary-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </div>

          <div className="pt-2">
            <button 
              type="submit" 
              disabled={isLoggingIn} 
              className="w-full btn-primary py-2.5 rounded-lg text-sm font-semibold shadow-sm hover:shadow transition-all disabled:opacity-50"
            >
              {isLoggingIn ? 'Signing in...' : 'Sign in'}
            </button>
            <p className="mt-4 text-center text-xs text-gray-400">
              Sign in to continue
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;
