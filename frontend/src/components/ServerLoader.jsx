import React, { useState, useEffect } from 'react';

const ServerLoader = () => {
  const [stage, setStage] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    let activeRequests = 0;
    let loadingTimer = null;
    let loadingSince = null;

    const checkStage = () => {
      if (!loadingSince) {
        setStage(0);
        setIsVisible(false);
        return;
      }
      const elapsed = Date.now() - loadingSince;
      
      if (elapsed >= 20000) {
        setStage(4);
        setIsVisible(true);
      } else if (elapsed >= 12000) {
        setStage(3);
        setIsVisible(true);
      } else if (elapsed >= 6000) {
        setStage(2);
        setIsVisible(true);
      } else if (elapsed >= 2000) {
        setStage(1);
        setIsVisible(true);
      } else {
        setStage(0);
        setIsVisible(false);
      }
    };

    const handleStart = () => {
      if (activeRequests === 0) {
        loadingSince = Date.now();
        loadingTimer = setInterval(checkStage, 500); // Check every 500ms
      }
      activeRequests++;
    };

    const handleEnd = () => {
      activeRequests = Math.max(0, activeRequests - 1);
      if (activeRequests === 0) {
        loadingSince = null;
        if (loadingTimer) clearInterval(loadingTimer);
        loadingTimer = null;
        setStage(0);
        setIsVisible(false);
      }
    };

    window.addEventListener('unitickets-api-start', handleStart);
    window.addEventListener('unitickets-api-end', handleEnd);

    return () => {
      window.removeEventListener('unitickets-api-start', handleStart);
      window.removeEventListener('unitickets-api-end', handleEnd);
      if (loadingTimer) clearInterval(loadingTimer);
    };
  }, []);

  if (!isVisible || stage === 0) return null;

  let primary = "";
  let secondary = "";

  if (stage === 1) {
    primary = "Connecting to UniTickets...";
  } else if (stage === 2) {
    primary = "Connecting to UniTickets...";
    secondary = "Server is waking up. This may take a few seconds.";
  } else if (stage >= 3) {
    primary = "Still connecting...";
    secondary = "This is taking longer than usual. Please wait or refresh the page.";
  }

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-white bg-opacity-80 backdrop-blur-sm transition-opacity duration-300">
      <div className="flex flex-col items-center max-w-sm px-6 py-8 bg-white rounded-xl shadow-xl border border-gray-100 text-center">
        <div className="mb-6">
          <div className="w-12 h-12 border-4 border-primary-100 border-t-primary-600 rounded-full animate-spin"></div>
        </div>
        
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {primary}
        </h3>
        
        {secondary && (
          <p className="text-sm text-gray-500 mb-0">
            {secondary}
          </p>
        )}
        
        {stage >= 4 && (
          <button 
            onClick={handleRetry}
            className="mt-6 px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded-md hover:bg-primary-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            Refresh Page
          </button>
        )}
      </div>
    </div>
  );
};

export default ServerLoader;
