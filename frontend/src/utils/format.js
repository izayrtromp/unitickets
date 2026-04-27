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
    case 'NEW':
    case 'TODO':
    case 'PENDING':
    case 'WAITING':
      return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700';
    case 'IN_PROGRESS':
    case 'DISCUSSED':
    case 'FOLLOW_UP_REQUIRED':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
    case 'CLOSED':
    case 'RESOLVED':
    case 'DONE':
    case 'COMPLETED':
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800';
    case 'OVERDUE':
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700';
  }
}

export function getPriorityColor(priority) {
  switch(priority) {
    case 'URGENT':
    case 'HIGH':
      return 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 border border-red-200 dark:border-red-800';
    case 'MEDIUM':
      return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-800';
    case 'LOW':
      return 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700';
  }
}

export function getFeedbackColor(type) {
  switch(type) {
    case 'BUG': return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
    case 'FEATURE_REQUEST': return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
    case 'GENERAL_FEEDBACK': return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
    default: return 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';
  }
}

export function getFeedbackTypeLabel(type) {
  if (type === "BUG") return "Bug";
  if (type === "FEATURE_REQUEST") return "Feature Request";
  if (type === "GENERAL_FEEDBACK") return "Feedback";
  return null;
}

export function getRoleColor(role) {
  switch(role) {
    case 'STUDENT':
      return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
    case 'CLASS_REP':
      return 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800';
    case 'ADMIN':
      return 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800';
    default:
      return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300 border border-gray-200 dark:border-gray-700';
  }
}

export function getRoleIcon(role) {
  switch(role) {
    case 'STUDENT': return '🎓';
    case 'CLASS_REP': return '👥';
    case 'ADMIN': return '🛡️';
    default: return '';
  }
}
