import React, { useState } from 'react';
import CandidateCard from './CandidateCard';
import { Search, Loader2, Filter } from 'lucide-react';

export default function ResultsPanel({ status, results, onActionUpdate }) {
  const [filter, setFilter] = useState('ALL');
  
  if (status === 'IDLE') {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-700">
        <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm">
          <Search className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Ready to Match</h3>
        <p className="text-slate-500 dark:text-slate-400 max-w-sm">
          Fill out the job description on the left and upload candidate resumes. We'll use AI to analyze, score, and rank them instantly.
        </p>
      </div>
    );
  }

  if (status === 'PROCESSING') {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-primary-200 dark:bg-primary-900/50 rounded-full blur-xl animate-pulse"></div>
          <div className="relative bg-white dark:bg-slate-900 w-16 h-16 rounded-full flex items-center justify-center shadow-lg">
            <Loader2 className="w-8 h-8 text-primary-600 dark:text-primary-400 animate-spin" />
          </div>
        </div>
        <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 animate-pulse">Analyzing Candidates...</h3>
        <p className="text-slate-500 dark:text-slate-400">
          Our AI is reading resumes, extracting skills, and calculating match scores. This usually takes a few seconds.
        </p>
        
        {/* Render partial results if available while processing */}
        {results.length > 0 && (
          <div className="w-full mt-10 text-left animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-700 dark:text-slate-300">Partial Results Found ({results.length})</h4>
              <span className="text-xs font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-2.5 py-1 rounded-full">Still Processing</span>
            </div>
            <div className="space-y-4">
              {results.sort((a, b) => b.score - a.score).map((result) => (
                <CandidateCard key={result.id} result={result} onActionUpdate={onActionUpdate} />
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  if (status === 'ERROR') {
    return (
      <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-center p-8 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
        <h3 className="text-xl font-bold text-red-700 dark:text-red-400 mb-2">Something went wrong</h3>
        <p className="text-red-600 dark:text-red-300">We couldn't process your matching request. Please check your inputs and try again.</p>
      </div>
    );
  }

  // COMPLETED STATE
  const getFilteredResults = () => {
    let sorted = [...results].sort((a, b) => b.score - a.score);
    if (filter === 'TOP_3') return sorted.slice(0, 3);
    if (filter === 'SHORTLISTED') return sorted.filter(r => r.action === 'SHORTLISTED');
    if (filter === 'REJECTED') return sorted.filter(r => r.action === 'REJECTED');
    if (filter === 'HOLD') return sorted.filter(r => r.action === 'HOLD');
    return sorted; // ALL
  };

  const filteredResults = getFilteredResults();

  const filterOptions = [
    { id: 'ALL', label: 'All Candidates' },
    { id: 'TOP_3', label: 'Top 3' },
    { id: 'SHORTLISTED', label: 'Shortlisted' },
    { id: 'HOLD', label: 'On Hold' },
    { id: 'REJECTED', label: 'Rejected' },
  ];

  const averageScore = results.length > 0 
    ? Math.round(results.reduce((acc, curr) => acc + curr.score, 0) / results.length) 
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Ranked Candidates
          </h2>
          <div className="flex items-center gap-2 mt-1.5 flex-wrap">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Showing {results.length} analyzed resumes
            </p>
            {results.length > 0 && (
              <>
                <span className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600 hidden sm:block"></span>
                <p className="text-sm font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-900/50 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/50">
                  Batch Average: <span className="font-bold text-primary-600 dark:text-primary-400">{averageScore}%</span>
                </p>
              </>
            )}
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center text-sm font-medium text-slate-500 dark:text-slate-400 mr-2">
            <Filter className="w-4 h-4 mr-1" />
            Filter:
          </div>
          <div className="flex flex-wrap gap-2 bg-slate-100 dark:bg-slate-900 p-1 rounded-lg">
            {filterOptions.map(opt => (
              <button
                key={opt.id}
                onClick={() => setFilter(opt.id)}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all ${
                  filter === opt.id 
                    ? 'bg-white dark:bg-slate-700 text-primary-600 dark:text-primary-400 shadow-sm' 
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-800/50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-5">
        {filteredResults.length > 0 ? (
          filteredResults.map((result) => (
            <CandidateCard key={result.id} result={result} onActionUpdate={onActionUpdate} />
          ))
        ) : (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <p className="text-slate-500 dark:text-slate-400 font-medium">No candidates found for this filter.</p>
          </div>
        )}
      </div>
    </div>
  );
}
