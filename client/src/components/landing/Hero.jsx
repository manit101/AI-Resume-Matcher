import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import CandidateCard from './CandidateCard';

export default function Hero() {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-slate-900 pt-20 pb-32 transition-colors duration-200">
      {/* Decorative gradient background */}
      <div className="absolute inset-x-0 top-0 h-96 bg-gradient-to-b from-primary-50 dark:from-primary-900/20 to-transparent -z-10" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="lg:grid lg:grid-cols-12 lg:gap-16 items-center">
          
          {/* Left Text Column */}
          <div className="lg:col-span-6 text-center lg:text-left mb-16 lg:mb-0">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 font-medium text-sm mb-8 border border-primary-100 dark:border-primary-800">
              <Sparkles className="w-4 h-4 mr-2" />
              AI-Powered Recruitment 2.0
            </div>
            <h1 className="text-5xl lg:text-6xl font-extrabold text-slate-900 dark:text-white tracking-tight leading-tight mb-6">
              Find the Best Candidates in <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-indigo-600">Seconds</span> with AI.
            </h1>
            <p className="text-xl text-slate-600 dark:text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Upload resumes, match with job descriptions, and instantly rank top candidates using intelligent AI scoring and semantic analysis.
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
              <Link to="/login" className="inline-flex justify-center items-center px-8 py-4 text-base font-medium rounded-xl text-white bg-primary-600 hover:bg-primary-700 shadow-lg shadow-primary-600/30 transition-all hover:-translate-y-0.5">
                Start Hiring Smarter
                <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
              <a href="#how-it-works" className="inline-flex justify-center items-center px-8 py-4 text-base font-medium rounded-xl text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                See How It Works
              </a>
            </div>
          </div>

          {/* Right UI Preview Column */}
          <div className="lg:col-span-6 relative">
            <div className="absolute -inset-0.5 bg-gradient-to-tr from-primary-200 dark:from-primary-900/50 to-indigo-200 dark:to-indigo-900/50 rounded-2xl blur opacity-50"></div>
            <div className="relative bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200 dark:border-slate-700">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Senior Frontend Engineer Match Results</h3>
                <span className="text-sm font-medium text-slate-500 dark:text-slate-400">24 Candidates</span>
              </div>
              
              <div className="space-y-4">
                <CandidateCard 
                  name="Sarah Jenkins" 
                  role="Frontend Developer" 
                  score={96} 
                  matchedSkills={['React', 'TypeScript', 'Tailwind']} 
                  missingSkills={[]} 
                />
                <CandidateCard 
                  name="Michael Chen" 
                  role="Full Stack Engineer" 
                  score={82} 
                  matchedSkills={['React', 'Node.js']} 
                  missingSkills={['Tailwind']} 
                />
                <div className="opacity-50">
                  <CandidateCard 
                    name="Emma Wilson" 
                    role="Web Developer" 
                    score={45} 
                    matchedSkills={['HTML', 'CSS']} 
                    missingSkills={['React', 'TypeScript']} 
                  />
                </div>
              </div>
              
              {/* Fade out bottom overlay */}
              <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-slate-50 dark:from-slate-800 to-transparent rounded-b-2xl pointer-events-none"></div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
