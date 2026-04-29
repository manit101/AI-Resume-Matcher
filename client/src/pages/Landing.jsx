import React from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/landing/Navbar';
import Hero from '../components/landing/Hero';
import FeatureCard from '../components/landing/FeatureCard';
import Footer from '../components/landing/Footer';
import { Brain, FileSearch, Zap, ArrowRight, UploadCloud, Cpu, CheckCircle } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-white dark:bg-slate-900 selection:bg-primary-200 dark:selection:bg-primary-900 selection:text-primary-900 dark:selection:text-primary-100 transition-colors duration-200">
      <Navbar />
      
      <Hero />

      {/* Features Section */}
      <section className="py-24 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Why Top Recruiters Choose ResumeAI</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">Stop manually reading hundreds of CVs. Let our advanced AI models find your next hire with mathematical precision.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={Brain}
              title="Semantic AI Matching"
              description="We don't just keyword match. Our OpenAI-powered engine understands the context of a candidate's experience against your job description."
            />
            <FeatureCard 
              icon={FileSearch}
              title="Smart Skill Analysis"
              description="Instantly see exactly which required skills a candidate has and which ones they are missing, beautifully color-coded."
            />
            <FeatureCard 
              icon={Zap}
              title="Instant Candidate Ranking"
              description="Upload 100 resumes and get them sorted from best to worst in seconds with a 0-100% confidence score."
            />
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section id="how-it-works" className="py-24 bg-white dark:bg-slate-900 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">How It Works</h2>
            <p className="text-lg text-slate-600 dark:text-slate-400">Three simple steps to supercharge your recruitment workflow.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting line for desktop */}
            <div className="hidden md:block absolute top-12 left-24 right-24 h-0.5 bg-slate-100 dark:bg-slate-800 -z-10"></div>
            
            <div className="text-center">
              <div className="bg-white dark:bg-slate-800 border-4 border-slate-50 dark:border-slate-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <UploadCloud className="h-10 w-10 text-primary-500 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">1. Upload Files</h3>
              <p className="text-slate-600 dark:text-slate-400">Paste your job description and upload a batch of candidate PDF resumes.</p>
            </div>

            <div className="text-center">
              <div className="bg-white dark:bg-slate-800 border-4 border-slate-50 dark:border-slate-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <Cpu className="h-10 w-10 text-primary-500 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">2. AI Analysis</h3>
              <p className="text-slate-600 dark:text-slate-400">Our engine extracts text, generates vector embeddings, and calculates similarities.</p>
            </div>

            <div className="text-center">
              <div className="bg-white dark:bg-slate-800 border-4 border-slate-50 dark:border-slate-800 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
                <CheckCircle className="h-10 w-10 text-primary-500 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">3. Review Results</h3>
              <p className="text-slate-600 dark:text-slate-400">Get a sorted dashboard of top candidates with AI-generated explanations for each.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-20 bg-slate-900 dark:bg-slate-950 text-white relative overflow-hidden transition-colors duration-200">
        <div className="absolute inset-0 bg-primary-600/20 dark:bg-primary-900/30 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl font-bold mb-6">Start Hiring Smarter Today</h2>
          <p className="text-xl text-slate-300 mb-10">
            Join the waitlist of modern recruiters leveraging AI to find top talent faster.
          </p>
          <Link to="/login" className="inline-flex justify-center items-center px-8 py-4 text-lg font-medium rounded-xl text-slate-900 bg-white hover:bg-slate-100 transition-colors">
            Try the App Now
            <ArrowRight className="ml-2 w-5 h-5" />
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
