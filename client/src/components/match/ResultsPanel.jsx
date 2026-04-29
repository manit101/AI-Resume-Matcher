import React from 'react';
import CandidateCard from './CandidateCard';
import { Search, Loader2 } from 'lucide-react';

export default function ResultsPanel({ status, results, onActionUpdate }) {
  
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
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Ranked Candidates</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Showing {results.length} analyzed resumes</p>
        </div>
        <div className="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg text-sm font-bold border border-green-200 dark:border-green-800">
          Analysis Complete
        </div>
      </div>

      <div className="space-y-5">
        {results.sort((a, b) => b.score - a.score).map((result) => (
          <CandidateCard key={result.id} result={result} onActionUpdate={onActionUpdate} />
        ))}
      </div>
    </div>
  );
}
