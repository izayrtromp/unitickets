import React from 'react';
import { releaseNotes } from '../constants/releaseNotes';
import Badge from '../components/Badge';

const Updates = () => {
  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      <div className="text-center sm:text-left">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Release Notes & Updates</h2>
        <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">
          Stay up to date with the latest features, improvements, and fixes in UniTickets.
        </p>
      </div>

      <div className="space-y-8">
        {releaseNotes.map((note, index) => (
          <div key={index} className="bg-white dark:bg-gray-800 shadow-sm sm:rounded-xl transition-colors border border-gray-100 dark:border-gray-700 overflow-hidden relative">
            
            {/* Timeline connector visual (optional styling element) */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500 rounded-l-xl hidden sm:block"></div>
            
            <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/30 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{note.title}</h3>
                <Badge type="update" value={note.type} className="uppercase tracking-wider px-2.5 py-1 text-[10px]" />
                <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 px-2.5 py-0.5 rounded-full">
                  {note.version}
                </span>
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400 font-medium whitespace-nowrap">
                {new Date(note.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
            
            <div className="px-6 py-6 space-y-5">
              <p className="text-gray-700 dark:text-gray-300 text-base leading-relaxed">
                {note.description}
              </p>
              
              {note.highlights && note.highlights.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider mb-3 flex items-center">
                    <span className="mr-2">✨</span> Highlights
                  </h4>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6 text-gray-700 dark:text-gray-300">
                    {note.highlights.map((highlight, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-primary-500 mr-2 mt-1 flex-shrink-0">•</span>
                        <span className="leading-tight pt-0.5">{highlight}</span>
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
