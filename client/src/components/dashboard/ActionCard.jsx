import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

export default function ActionCard({ icon: Icon, title, description, linkTo, colorClass, borderClass }) {
  return (
    <Link 
      to={linkTo}
      className={`group block bg-white dark:bg-slate-800 rounded-xl p-6 border ${borderClass} shadow-sm hover:shadow-md transition-all hover:-translate-y-1`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${colorClass}`}>
            <Icon className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
              {title}
            </h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              {description}
            </p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center group-hover:bg-primary-50 dark:group-hover:bg-primary-900/50 transition-colors">
          <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors" />
        </div>
      </div>
    </Link>
  );
}
