import React from 'react';
import { releaseNotes } from '../constants/releaseNotes';
import Badge from '../components/Badge';
import { getUpdateAccentColor } from '../utils/format';

const Updates = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      <div className="text-center sm:text-left">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Release Notes & Updates</h2>
        <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
          Stay up to date with the latest features, improvements, and fixes in UniTickets.
        </p>
      </div>

      <div className="space-y-10">
        {releaseNotes.map((note, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 shadow-sm sm:rounded-xl transition-colors border border-gray-100 dark:border-gray-700 overflow-hidden relative">
            
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${getUpdateAccentColor(note.type)} hidden sm:block`}></div>
            
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-gray-900 dark:text-white">
                    {note.version}
                  </span>
                  <Badge type="update" value={note.type} className="uppercase tracking-wider px-2.5 py-1 text-[10px]" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">{note.title}</h3>
              </div>
              <div className="text-sm text-gray-400 dark:text-gray-500 opacity-90 sm:mt-1 font-medium whitespace-nowrap">
                {new Date(note.date).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
              </div>
            </div>
            
            <div className="px-6 py-6 space-y-5">
              <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
                {note.description}
              </p>
              
              {note.highlights && note.highlights.length > 0 && (
                <div className="mt-6 pt-6 border-t border-gray-100 dark:border-gray-800">
                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4 tracking-wide">
                    Highlights
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6 text-gray-600 dark:text-gray-400">
                    {note.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0">—</span>
                        <span className="leading-relaxed">{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
      
      {releaseNotes.length === 0 && (
        <div className="text-center py-12 bg-white dark:bg-gray-800 shadow-sm sm:rounded-xl border border-gray-100 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 font-medium text-lg">No updates available yet.</p>
        </div>
      )}
    </div>
  );
};

export default Updates;
