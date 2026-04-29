import React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';

export default function CandidateCard({ name, role, score, matchedSkills, missingSkills }) {
  const getScoreColor = (s) => {
    if (s >= 80) return 'text-green-600 bg-green-50';
    if (s >= 50) return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 mb-4 hover:shadow-md transition-shadow">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h4 className="font-bold text-slate-900 dark:text-white">{name}</h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">{role}</p>
        </div>
        <div className={`px-3 py-1 rounded-full font-bold text-sm ${getScoreColor(score)}`}>
          {score}% Match
        </div>
      </div>
      
      <div className="space-y-2">
        <div className="flex items-center space-x-2">
          <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
          <div className="flex flex-wrap gap-1">
            {matchedSkills.map(skill => (
              <span key={skill} className="text-xs font-medium text-green-700 bg-green-50 px-2 py-0.5 rounded border border-green-200">
                {skill}
              </span>
            ))}
          </div>
        </div>
        
        {missingSkills.length > 0 && (
          <div className="flex items-center space-x-2">
            <XCircle className="h-4 w-4 text-red-400 flex-shrink-0" />
            <div className="flex flex-wrap gap-1">
              {missingSkills.map(skill => (
                <span key={skill} className="text-xs font-medium text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
