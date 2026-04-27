import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Clock } from 'lucide-react';

export const INACTIVITY_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
export const WARNING_COUNTDOWN_MS = 5 * 60 * 1000; // 5 minutes

const InactivityTimeout = () => {
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const [showWarning, setShowWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_COUNTDOWN_MS / 1000);
  
  const inactivityTimerRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const handleLogout = useCallback(() => {
    logout();
    navigate('/login');
    addToast('You were signed out due to inactivity.', 'info');
    setShowWarning(false);
  }, [logout, navigate, addToast]);

  const resetTimer = useCallback(() => {
    // If warning is displayed, require explicit click to dismiss
    if (showWarning) return; 

    const now = Date.now();
    // Throttle activity updates to at most once per second
    if (now - lastActivityRef.current < 1000) return;
    
    lastActivityRef.current = now;

    if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
    
    inactivityTimerRef.current = setTimeout(() => {
      setShowWarning(true);
      setCountdown(WARNING_COUNTDOWN_MS / 1000);
    }, INACTIVITY_TIMEOUT_MS);
  }, [showWarning]);

  const handleStaySignedIn = () => {
    setShowWarning(false);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    // Force the timer to reset from now
    lastActivityRef.current = 0; 
    resetTimer();
  };

  useEffect(() => {
    if (!user) return;

    // Initial setup
    resetTimer();

    const events = ['mousemove', 'mousedown', 'keydown', 'scroll', 'touchstart'];
    events.forEach(event => window.addEventListener(event, resetTimer));

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      if (inactivityTimerRef.current) clearTimeout(inactivityTimerRef.current);
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [user, resetTimer]);

  useEffect(() => {
    if (showWarning) {
      countdownTimerRef.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimerRef.current);
            handleLogout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    }

    return () => {
      if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
    };
  }, [showWarning, handleLogout]);

  if (!user || !showWarning) return null;

  const minutes = Math.floor(countdown / 60);
  const seconds = countdown % 60;

  return (
    <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl max-w-sm w-full p-6 text-center transform transition-all">
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100 dark:bg-yellow-900/30 mb-4 border border-yellow-200 dark:border-yellow-800">
          <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Are you still there?</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 leading-relaxed">
          You've been inactive for a while. For your security, you will be automatically logged out in:
        </p>
        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-6 font-mono bg-gray-50 dark:bg-gray-900/50 py-3 rounded-lg border border-gray-100 dark:border-gray-700 tracking-wider">
          {minutes}:{seconds.toString().padStart(2, '0')}
        </div>
        <button
          onClick={handleStaySignedIn}
          className="w-full btn-primary py-2.5 text-base shadow-sm font-medium"
        >
          Stay signed in
        </button>
      </div>
    </div>
  );
};

export default InactivityTimeout;
