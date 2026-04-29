import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { Link } from 'react-router-dom';
import { PlusCircle, Clock } from 'lucide-react';
import SearchBar from '../components/history/SearchBar';
import HistoryJobCard from '../components/history/HistoryJobCard';

export default function History() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filtering and sorting state
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('latest'); // 'latest', 'score_desc'

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) return;
        const token = await user.getIdToken();

        const response = await axios.get('http://localhost:5000/api/jds', {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data.success) {
          setJobs(response.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch history", err);
        setError('Failed to load your match history. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, []);

  // Filter and sort logic
  const processedJobs = jobs
    .filter(job => job.title.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === 'latest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      } else if (sortBy === 'score_desc') {
        return b.topScore - a.topScore;
      }
      return 0;
    });

  if (loading) {
    return (
      <div className="animate-fade-in max-w-5xl mx-auto w-full">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-lg w-48 mb-8 animate-pulse"></div>
        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl w-full mb-8 animate-pulse"></div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-5xl mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white mb-1">Match History</h1>
          <p className="text-slate-500 dark:text-slate-400">View and manage your past AI matchings.</p>
        </div>
        <Link 
          to="/match" 
          className="inline-flex items-center justify-center px-5 py-2.5 rounded-xl font-bold text-sm text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm"
        >
          <PlusCircle className="w-4 h-4 mr-2" />
          New Matching
        </Link>
      </div>

      {error && (
        <div className="p-4 mb-6 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl border border-red-100 dark:border-red-900/50">
          {error}
        </div>
      )}

      {jobs.length === 0 && !error ? (
        // Empty State
        <div className="py-20 text-center bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm mt-8">
          <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No matchings yet</h3>
          <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mb-6">
            You haven't run any AI resume matches yet. Start your first matching to see it here.
          </p>
          <Link 
            to="/match" 
            className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-bold text-white bg-primary-600 hover:bg-primary-700 transition-colors shadow-sm"
          >
            Start First Matching
          </Link>
        </div>
      ) : (
        // List State
        <>
          <SearchBar 
            searchQuery={searchQuery} 
            setSearchQuery={setSearchQuery} 
            sortBy={sortBy} 
            setSortBy={setSortBy} 
          />
          
          {processedJobs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-slate-400">
              No jobs found matching "{searchQuery}"
            </div>
          ) : (
            <div className="space-y-4">
              {processedJobs.map(job => (
                <HistoryJobCard key={job.id} job={job} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
