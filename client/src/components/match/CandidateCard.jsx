import React, { useState } from 'react';
import { ExternalLink, Check, X, AlertCircle, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';

export default function CandidateCard({ result, onActionUpdate }) {
  const [activeAction, setActiveAction] = useState(result.action || null);
  const [isUpdating, setIsUpdating] = useState(false);

  React.useEffect(() => {
    if (result.action) {
      setActiveAction(result.action);
    }
  }, [result.action]);

  const { resume, score, matchedSkills, missingSkills, experienceGap, explanation, id } = result;
  const fileName = resume?.fileName || "Unknown Candidate";
  const fileUrl = resume?.fileUrl || "#";

  // Ensure JSON parsing if stored as string, otherwise use directly
  const safeParseArray = (data) => {
    if (Array.isArray(data)) return data;
    if (typeof data === 'string') {
      try { return JSON.parse(data); } catch { return []; }
    }
    return [];
  };

  const matched = safeParseArray(matchedSkills);
  const missing = safeParseArray(missingSkills);

  const handleAction = async (actionStr) => {
    setIsUpdating(true);
    await onActionUpdate(id, actionStr);
    setActiveAction(actionStr);
    setIsUpdating(false);
  };

  // Color mapping based on score
  const getScoreColor = (s) => {
    if (s >= 80) return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
    if (s >= 50) return "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800";
    return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
  };

  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      
      {/* Header section */}
      <div className="p-6 border-b border-slate-100 dark:border-slate-700/50 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center flex-shrink-0 mt-1">
            <FileText className="w-6 h-6 text-slate-500 dark:text-slate-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight mb-1">{fileName}</h3>
            <a 
              href={fileUrl} 
              target="_blank" 
              rel="noreferrer"
              className="inline-flex items-center text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
            >
              View Original PDF
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>
          </div>
        </div>

        <div className="flex items-center md:flex-col md:items-end gap-3">
          <div className={`px-4 py-2 rounded-xl border font-bold flex items-center text-lg ${getScoreColor(score)}`}>
            {Math.round(score)}% Match
          </div>
        </div>
      </div>

      {/* Content section */}
      <div className="p-6 space-y-6 bg-slate-50/50 dark:bg-slate-800/50">
        
        <div className="grid md:grid-cols-2 gap-6">
          {/* Matched Skills */}
          <div>
            <div className="flex items-center mb-3">
              <Check className="w-4 h-4 text-green-500 mr-2" />
              <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wider">Matched Skills</h4>
            </div>
            {matched.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {matched.map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 text-sm rounded-lg border border-green-200 dark:border-green-800/50">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-sm text-slate-500 dark:text-slate-400 italic">No exact skill matches found</span>
            )}
          </div>

          {/* Missing Skills */}
          <div>
            <div className="flex items-center mb-3">
              <X className="w-4 h-4 text-red-500 mr-2" />
              <h4 className="font-bold text-slate-700 dark:text-slate-300 text-sm uppercase tracking-wider">Missing Skills</h4>
            </div>
            {missing.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {missing.map((skill, i) => (
                  <span key={i} className="px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 text-sm rounded-lg border border-red-200 dark:border-red-800/50">
                    {skill}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-sm text-slate-500 dark:text-slate-400 italic">No missing skills detected</span>
            )}
          </div>
        </div>

        {/* AI Explanations */}
        <div className="space-y-4 pt-4 border-t border-slate-200 dark:border-slate-700">
          {experienceGap && (
            <div className="flex items-start bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/30">
              <AlertCircle className="w-5 h-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
              <div>
                <h5 className="font-bold text-amber-800 dark:text-amber-500 text-sm mb-1">Experience Analysis</h5>
                <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">{experienceGap}</p>
              </div>
            </div>
          )}

          {explanation && (
            <div className="flex items-start bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="w-5 h-5 rounded bg-primary-100 dark:bg-primary-900/50 flex items-center justify-center mr-3 flex-shrink-0 mt-0.5">
                <span className="text-primary-600 dark:text-primary-400 text-xs font-bold font-mono">AI</span>
              </div>
              <div>
                <h5 className="font-bold text-slate-800 dark:text-slate-200 text-sm mb-1">Matching Summary</h5>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{explanation}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action Footer */}
      <div className="p-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-700 flex flex-wrap gap-3 justify-end items-center">
        {activeAction ? (
          <div className="flex items-center px-4 py-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm font-bold text-slate-600 dark:text-slate-300">
            {activeAction === 'SHORTLISTED' && <CheckCircle className="w-4 h-4 text-green-500 mr-2" />}
            {activeAction === 'REJECTED' && <XCircle className="w-4 h-4 text-red-500 mr-2" />}
            {activeAction === 'HOLD' && <Clock className="w-4 h-4 text-amber-500 mr-2" />}
            Marked as {activeAction.toLowerCase()}
          </div>
        ) : (
          <>
            <button 
              onClick={() => handleAction('REJECTED')}
              disabled={isUpdating}
              className="px-4 py-2 rounded-lg font-medium text-sm text-red-600 bg-red-50 hover:bg-red-100 dark:text-red-400 dark:bg-red-900/20 dark:hover:bg-red-900/40 border border-red-200 dark:border-red-800/50 transition-colors disabled:opacity-50"
            >
              Reject
            </button>
            <button 
              onClick={() => handleAction('HOLD')}
              disabled={isUpdating}
              className="px-4 py-2 rounded-lg font-medium text-sm text-slate-700 bg-white hover:bg-slate-50 dark:text-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 transition-colors disabled:opacity-50"
            >
              Hold
            </button>
            <button 
              onClick={() => handleAction('SHORTLISTED')}
              disabled={isUpdating}
              className="px-6 py-2 rounded-lg font-bold text-sm text-white bg-green-600 hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors shadow-sm disabled:opacity-50"
            >
              Shortlist Candidate
            </button>
          </>
        )}
      </div>
    </div>
  );
}
