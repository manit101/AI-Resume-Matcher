import React from 'react';
import Logo from '../../Logo.png';

export default function Footer() {
  return (
    <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-12 mt-20 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center">
        <div className="mb-4 md:mb-0">
          <div className="flex items-center space-x-2 mb-2">
            <img src={Logo} alt="ResumeAI Logo" className="h-6 w-auto" />
            <span className="font-bold text-xl text-slate-900 dark:text-white tracking-tight">ResumeAI Matcher</span>
          </div>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">© 2026 AI Resume Matcher SaaS. All rights reserved.</p>
        </div>
        <div className="flex space-x-6 text-sm font-medium text-slate-500 dark:text-slate-400">
          <a href="#" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">About Us</a>
          <a href="#" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Privacy Policy</a>
          <a href="#" className="hover:text-primary-600 dark:hover:text-primary-400 transition-colors">Contact Support</a>
        </div>
      </div>
    </footer>
  );
}
