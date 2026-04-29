import React from 'react';

export default function FeatureCard({ icon: Icon, title, description }) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 border border-slate-100 dark:border-slate-700 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-none transition-shadow">
      <div className="bg-primary-50 dark:bg-primary-900/30 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
        <Icon className="h-7 w-7 text-primary-600 dark:text-primary-400" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
        {description}
      </p>
    </div>
  );
}
