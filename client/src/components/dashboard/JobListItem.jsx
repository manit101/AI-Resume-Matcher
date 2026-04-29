import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, Calendar, Users, Trophy } from 'lucide-react';

export default function JobListItem({ job }) {
  const navigate = useNavigate();
  const dateStr = new Date(job.createdAt).toLocaleDateString(undefined, { 
    year: 'numeric', month: 'short', day: 'numeric' 
  });

  return (
    <div 
      onClick={() => navigate(`/match?jobId=${job.id}`)}
      className="group bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-5 hover:border-primary-300 dark:hover:border-primary-700 hover:shadow-md transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="flex-1">
        <h4 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors mb-2">
          {job.title}
        </h4>
        <div className="flex flex-wrap gap-4 text-sm text-slate-500 dark:text-slate-400">
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1.5" />
            {dateStr}
          </div>
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1.5" />
            {job.resumeCount} Resumes
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-between sm:justify-end sm:w-1/3 gap-6">
        <div className="text-right">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Top Match</p>
          <div className="flex items-center justify-end">
            <Trophy className={`w-4 h-4 mr-1.5 ${job.topScore >= 80 ? 'text-amber-500' : 'text-slate-400'}`} />
            <span className={`text-lg font-bold ${job.topScore >= 80 ? 'text-green-600 dark:text-green-400' : 'text-slate-700 dark:text-slate-300'}`}>
              {job.topScore}%
            </span>
          </div>
        </div>
        <div className="w-8 h-8 rounded-full bg-slate-50 dark:bg-slate-700 flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/50 transition-colors">
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
        </div>
      </div>
    </div>
  );
}
