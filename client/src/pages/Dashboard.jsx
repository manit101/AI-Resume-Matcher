import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import StatsCard from '../components/dashboard/StatsCard';
import ActionCard from '../components/dashboard/ActionCard';
import JobListItem from '../components/dashboard/JobListItem';
import { 
  Briefcase, 
  Files, 
  UserCheck, 
  UserX, 
  PlusCircle, 
  History 
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalMatchings: 0,
    totalResumes: 0,
    shortlistedCount: 0,
    rejectedCount: 0
  });
  const [recentJobs, setRecentJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user) throw new Error("No user logged in");
        
        const token = await user.getIdToken();
        const response = await axios.get('http://localhost:5000/api/dashboard/stats', {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (response.data.success) {
          setStats(response.data.data.stats);
          setRecentJobs(response.data.data.recentJobs);
        }
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-slate-200 dark:bg-slate-800 h-28 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-200 dark:bg-slate-800 h-32 rounded-xl"></div>
          <div className="bg-slate-200 dark:bg-slate-800 h-32 rounded-xl"></div>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-slate-200 dark:bg-slate-800 h-24 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-fade-in">
      {error && (
        <div className="p-4 bg-red-50 text-red-600 rounded-lg">
          {error}
        </div>
      )}

      {/* Top Stats Row */}
      <section>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatsCard 
            icon={Briefcase} 
            title="Total Matchings" 
            value={stats.totalMatchings} 
            colorClass="bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400" 
          />
          <StatsCard 
            icon={Files} 
            title="Resumes Processed" 
            value={stats.totalResumes} 
            colorClass="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400" 
          />
          <StatsCard 
            icon={UserCheck} 
            title="Shortlisted" 
            value={stats.shortlistedCount} 
            colorClass="bg-green-100 text-green-600 dark:bg-green-900/40 dark:text-green-400" 
          />
          <StatsCard 
            icon={UserX} 
            title="Rejected" 
            value={stats.rejectedCount} 
            colorClass="bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400" 
          />
        </div>
      </section>

      {/* Quick Actions Row */}
      <section>
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ActionCard 
            icon={PlusCircle}
            title="New Matching"
            description="Upload a new job description and candidate resumes to start an AI analysis."
            linkTo="/match"
            colorClass="bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400"
            borderClass="border-primary-100 dark:border-primary-800"
          />
          <ActionCard 
            icon={History}
            title="View History"
            description="Browse through your previous matchings, candidate pools, and AI explanations."
            linkTo="/history"
            colorClass="bg-slate-100 text-slate-600 dark:bg-slate-700/50 dark:text-slate-300"
            borderClass="border-slate-200 dark:border-slate-700"
          />
        </div>
      </section>

      {/* Recent Jobs Row */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Recent Matchings</h2>
        </div>
        
        {recentJobs.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">No matchings yet</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-6">Get started by creating your first job matching.</p>
            <ActionCard 
              icon={PlusCircle}
              title="New Matching"
              description="Start your first AI analysis."
              linkTo="/match"
              colorClass="bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400"
              borderClass="border-primary-100 dark:border-primary-800 max-w-sm mx-auto"
            />
          </div>
        ) : (
          <div className="space-y-4">
            {recentJobs.map(job => (
              <JobListItem key={job.id} job={job} />
            ))}
          </div>
        )}
      </section>

    </div>
  );
}
