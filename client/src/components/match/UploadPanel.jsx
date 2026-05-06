import React from 'react';
import FileUpload from './FileUpload';
import { Briefcase, Loader2, Play } from 'lucide-react';

export default function UploadPanel({ jobData, setJobData, files, setFiles, onRunMatching, status, errorMsg }) {
  
  const isProcessing = status === 'PROCESSING';

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm p-6">
      <div className="flex items-center mb-6">
        <div className="w-10 h-10 rounded-xl bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center mr-3">
          <Briefcase className="w-5 h-5 text-primary-600 dark:text-primary-400" />
        </div>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Match Configuration</h2>
      </div>

      {errorMsg && (
        <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-sm rounded-lg border border-red-100 dark:border-red-900/50">
          {errorMsg}
        </div>
      )}

      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Job Title *</label>
          <input
            type="text"
            value={jobData.title}
            onChange={(e) => setJobData({ ...jobData, title: e.target.value })}
            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-slate-900 dark:text-white"
            placeholder="e.g. Senior Frontend Engineer"
            disabled={isProcessing}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Job Description *</label>
          <textarea
            value={jobData.description}
            onChange={(e) => setJobData({ ...jobData, description: e.target.value })}
            className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-colors text-slate-900 dark:text-white min-h-[120px] resize-y custom-scrollbar"
            placeholder="Paste the full job description here..."
            disabled={isProcessing}
          />
        </div>



        <div className="pt-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">Candidate Resumes (PDFs) *</label>
          <FileUpload files={files} setFiles={setFiles} disabled={isProcessing} />
        </div>

        <button
          onClick={onRunMatching}
          disabled={isProcessing || files.length === 0 || !jobData.title || !jobData.description}
          className="w-full mt-6 flex items-center justify-center py-3.5 px-4 rounded-xl shadow-sm text-sm font-bold text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Processing AI Match...
            </>
          ) : (
            <>
              <Play className="w-5 h-5 mr-2" fill="currentColor" />
              Run Matching Engine
            </>
          )}
        </button>
      </div>
    </div>
  );
}
