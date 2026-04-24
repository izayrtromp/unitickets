export function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);

  if (diffInSeconds < 60) {
    return 'Just now';
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} min ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatLabel(str) {
  if (!str) return '';
  return str.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
}

export function getStatusColor(status) {
  switch(status) {
    case 'NEW': return 'bg-gray-100 text-gray-800';
    case 'IN_PROGRESS': return 'bg-blue-100 text-blue-800';
    case 'CLOSED': return 'bg-green-100 text-green-800';
    case 'RESOLVED': return 'bg-teal-100 text-teal-800';
    case 'WAITING': return 'bg-yellow-100 text-yellow-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

export function getFeedbackColor(type) {
  switch(type) {
    case 'BUG': return 'bg-red-100 text-red-600';
    case 'FEATURE_REQUEST': return 'bg-blue-100 text-blue-600';
    case 'GENERAL_FEEDBACK': return 'bg-gray-100 text-gray-600';
    default: return 'bg-gray-100 text-gray-600';
  }
}

export function getFeedbackTypeLabel(type) {
  if (type === "BUG") return "Bug";
  if (type === "FEATURE_REQUEST") return "Feature Request";
  if (type === "GENERAL_FEEDBACK") return "Feedback";
  return null;
}
