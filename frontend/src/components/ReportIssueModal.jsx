import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import api from '../api/axios';

const ReportIssueModal = ({ isOpen, onClose }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('GENERAL_FEEDBACK');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isSubmitting && !success) {
        onClose();
      }
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, success, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');
    
    const currentUrl = window.location.pathname;
    const finalDescription = `${description}\n\n[Reported from: ${currentUrl}]`;

    try {
      await api.post('/tickets', {
        title,
        description: finalDescription,
        type,
        category: 'Feedback',
        priority: 'MEDIUM'
      });
      setSuccess('Issue reported successfully');
      setTimeout(() => {
        setSuccess('');
        setTitle('');
        setDescription('');
        setType('GENERAL_FEEDBACK');
        onClose();
        // Optional: refresh tickets if on dashboard
        window.dispatchEvent(new Event('refreshNotifications'));
      }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || err.response?.data?.error || 'Failed to report issue');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSubmitting && !success) onClose();
      }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Report Issue / Feedback</h3>
            <p className="text-sm text-gray-500 mt-1">
              Use this to report bugs, suggest improvements, or share feedback about UniTickets.
            </p>
          </div>
          <button onClick={onClose} disabled={isSubmitting || success} className="text-gray-400 hover:text-gray-600">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        {error && <div className="mb-4 text-sm text-red-600 bg-red-50 p-3 rounded">{error}</div>}
        {success && <div className="mb-4 text-sm text-green-600 bg-green-50 p-3 rounded">{success}</div>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={isSubmitting || success}
              className="input-field mt-1 w-full text-sm py-2"
            >
              <option value="BUG">Bug</option>
              <option value="FEATURE_REQUEST">Feature Request</option>
              <option value="GENERAL_FEEDBACK">General Feedback</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Title</label>
            <input
              type="text"
              required
              disabled={isSubmitting || success}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="input-field mt-1 w-full text-sm"
              placeholder="Brief summary"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              required
              rows="4"
              disabled={isSubmitting || success}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="input-field mt-1 w-full text-sm"
              placeholder="Please provide details..."
            ></textarea>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              disabled={isSubmitting || success}
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded shadow-sm hover:bg-gray-50 focus:outline-none"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || success}
              className="btn-primary disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReportIssueModal;
