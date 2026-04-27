import React from 'react';
import { 
  getStatusColor, 
  getPriorityColor, 
  getRoleColor, 
  getRoleIcon, 
  getFeedbackColor, 
  formatLabel, 
  getFeedbackTypeLabel,
  getApprovalColor,
  getActiveColor
} from '../utils/format';

const Badge = ({ type, value, icon: CustomIcon, className = '' }) => {
  if (value === undefined || value === null) return null;

  let colorClass = '';
  let icon = null;
  let label = formatLabel(value.toString());

  if (type === 'role') {
    colorClass = getRoleColor(value);
    icon = getRoleIcon(value);
  } else if (type === 'status') {
    colorClass = getStatusColor(value);
  } else if (type === 'priority') {
    colorClass = getPriorityColor(value);
  } else if (type === 'feedback') {
    colorClass = getFeedbackColor(value);
    label = getFeedbackTypeLabel(value) || label;
  } else if (type === 'approval') {
    colorClass = getApprovalColor(value);
  } else if (type === 'active') {
    colorClass = getActiveColor(value);
    label = value ? 'Active' : 'Inactive';
  } else {
    colorClass = 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-700 border';
  }

  return (
    <span className={`px-2.5 py-0.5 inline-flex items-center text-xs leading-5 font-semibold rounded-full ${colorClass} ${className}`}>
      {icon && <span className="mr-1.5 text-sm leading-none">{icon}</span>}
      {CustomIcon && <span className="mr-1.5"><CustomIcon className="w-3.5 h-3.5" /></span>}
      {label}
    </span>
  );
};

export default Badge;
