import React from 'react';

const ConfirmModal = ({ isOpen, onClose, onConfirm, title, message, confirmText = "Delete", confirmColor = "red", isProcessing = false }) => {
  if (!isOpen) return null;

  const colorClasses = {
    red: "bg-red-600 hover:bg-red-700",
    blue: "bg-blue-600 hover:bg-blue-700",
    primary: "bg-primary-600 hover:bg-primary-700"
  };
  const btnClass = colorClasses[confirmColor] || colorClasses.red;

  return (
    <div className="fixed inset-0 bg-gray-500 dark:bg-gray-900 bg-opacity-75 dark:bg-opacity-80 flex items-center justify-center p-4 z-[70] transition-opacity duration-200 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-xl max-w-sm w-full p-6 text-center sm:text-left transform transition-all duration-200 scale-100">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {title || "Confirm Deletion"}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {message || "Are you sure you want to delete this item? This action cannot be undone."}
        </p>
        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          <button 
            onClick={onClose} 
            disabled={isProcessing}
            className="btn-secondary w-full sm:w-auto transition-all duration-200"
          >
            Cancel
          </button>
          <button 
            onClick={() => {
              onConfirm();
            }} 
            disabled={isProcessing}
            className={`w-full sm:w-auto px-4 py-2 text-sm font-medium text-white border border-transparent rounded transition-all duration-200 disabled:opacity-50 flex items-center justify-center ${btnClass}`}
          >
            {isProcessing && (
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {isProcessing ? `${confirmText.replace(/e$/, '')}ing...` : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
