import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Briefcase, Calendar, Users, ChevronRight } from 'lucide-react';

export default function HistoryJobCard({ job }) {
  const navigate = useNavigate();

  // Format the date nicely
  const formattedDate = new Date(job.createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const getScoreColor = (s) => {
    if (s >= 80) return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20";
    if (s >= 50) return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20";
    return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20";
  };

  const handleClick = () => {
    navigate(`/match?jobId=${job.id}`);
  };

  return (
    <div 
      onClick={handleClick}
      className="group bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-sm hover:shadow-md transition-all cursor-pointer hover:border-primary-300 dark:hover:border-primary-700 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between"
    >
      {/* Left section: Icon + Title + Meta */}
      <div className="flex items-start gap-4 flex-grow min-w-0">
        <div className="w-12 h-12 rounded-xl bg-primary-50 dark:bg-primary-900/30 flex items-center justify-center flex-shrink-0 group-hover:bg-primary-100 dark:group-hover:bg-primary-900/50 transition-colors">
          <Briefcase className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        
        <div className="min-w-0">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate mb-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {job.title}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-1 mb-3">
            {job.description}
          </p>
          
          <div className="flex flex-wrap items-center gap-4 text-sm font-medium text-slate-600 dark:text-slate-400">
            <div className="flex items-center">
              <Calendar className="w-4 h-4 mr-1.5 opacity-70" />
              {formattedDate}
            </div>
            <div className="flex items-center">
              <Users className="w-4 h-4 mr-1.5 opacity-70" />
              {job.resumeCount} {job.resumeCount === 1 ? 'Candidate' : 'Candidates'}
            </div>
          </div>
        </div>
      </div>

      {/* Right section: Score & Arrow */}
      <div className="flex items-center gap-6 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 border-slate-100 dark:border-slate-700 pt-4 sm:pt-0">
        <div className="text-center sm:text-right">
          <div className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider mb-1">Top Score</div>
          <div className={`inline-flex items-center justify-center px-3 py-1 rounded-lg font-bold ${getScoreColor(job.topScore)}`}>
            {job.resumeCount > 0 ? `${job.topScore}%` : 'N/A'}
          </div>
        </div>
        
        <div className="w-10 h-10 rounded-full flex items-center justify-center bg-slate-50 dark:bg-slate-900 text-slate-400 group-hover:bg-primary-50 dark:group-hover:bg-primary-900/30 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
          <ChevronRight className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}
