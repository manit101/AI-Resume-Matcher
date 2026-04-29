import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { getAuth } from 'firebase/auth';
import { uploadToFirebase } from '../services/firebase';
import { useSearchParams } from 'react-router-dom';
import UploadPanel from '../components/match/UploadPanel';
import ResultsPanel from '../components/match/ResultsPanel';

export default function MatchPage() {
  const [searchParams] = useSearchParams();
  const initialJobId = searchParams.get('jobId');

  const [jobData, setJobData] = useState({ title: '', description: '', requirements: '' });
  const [files, setFiles] = useState([]);
  
  const [status, setStatus] = useState(initialJobId ? 'PROCESSING' : 'IDLE'); // 'IDLE', 'PROCESSING', 'COMPLETED', 'ERROR'
  const [errorMsg, setErrorMsg] = useState('');
  
  const [jobId, setJobId] = useState(initialJobId || null);
  const [results, setResults] = useState([]);
  const [expectedResultsCount, setExpectedResultsCount] = useState(0);

  const pollingIntervalRef = useRef(null);

  // Stop polling when we unmount
  useEffect(() => {
    return () => stopPolling();
  }, []);

  // Initiate polling immediately if jobId is in URL
  useEffect(() => {
    if (initialJobId) {
      const initPolling = async () => {
        try {
          const auth = getAuth();
          const user = auth.currentUser;
          if (!user) return;
          const token = await user.getIdToken();
          // For historical, we don't know expectedCount beforehand, so we just poll once or let it run
          // Actually, if it's history, the matches are likely already COMPLETED.
          // Let's just fetch once, if some are still processing, we can poll.
          startPolling(initialJobId, 0, token, true);
        } catch (err) {
          console.error(err);
        }
      };
      initPolling();
    }
  }, [initialJobId]);

  const stopPolling = () => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  };

  const handleRunMatching = async () => {
    if (!jobData.title || !jobData.description || files.length === 0) {
      setErrorMsg("Please fill out the job title, description, and upload at least one resume.");
      return;
    }

    try {
      setStatus('PROCESSING');
      setErrorMsg('');
      setResults([]);
      setExpectedResultsCount(files.length);
      
      const auth = getAuth();
      const user = auth.currentUser;
      const token = await user.getIdToken();
      const headers = { Authorization: `Bearer ${token}` };

      // 1. Create Job Description
      const jdRes = await axios.post('http://localhost:5000/api/jds', jobData, { headers });
      const newJobId = jdRes.data.data.id;
      setJobId(newJobId);

      // 2. Upload Files to Firebase and send to backend
      let successCount = 0;
      const uploadPromises = files.map(async (file) => {
        try {
          const fileUrl = await uploadToFirebase(file);
          await axios.post('http://localhost:5000/api/resumes', {
            fileName: file.name,
            fileUrl: fileUrl,
            jobId: newJobId
          }, { headers });
          successCount++;
          return true;
        } catch (err) {
          console.error("Error uploading file", file.name, err);
          return false; // Could track partial failures if needed
        }
      });

      await Promise.all(uploadPromises);

      if (successCount === 0) {
        setErrorMsg("Failed to upload resumes to Firebase. Check your Firebase Storage rules (storage/unauthorized).");
        setStatus('ERROR');
        return;
      }

      // 3. Start Polling with the actual number of successfully uploaded files
      startPolling(newJobId, successCount, token);

    } catch (err) {
      console.error("Match flow error:", err);
      setErrorMsg("Failed to start matching process. Please try again.");
      setStatus('ERROR');
    }
  };

  const startPolling = (currentJobId, expectedCount, token, isHistory = false) => {
    stopPolling(); // Clear any existing intervals
    
    const fetchResults = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/matches/${currentJobId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (res.data.success) {
          const currentResults = res.data.data;
          setResults(currentResults);

          // Check completion logic
          const hasAtLeastExpected = isHistory ? true : (currentResults.length >= expectedCount);
          const allCompletedOrFailed = currentResults.length > 0 && currentResults.every(
            r => r.status === 'COMPLETED' || r.status === 'FAILED'
          );

          if (allCompletedOrFailed && hasAtLeastExpected) {
            stopPolling();
            setStatus('COMPLETED');
          } else if (isHistory && currentResults.length === 0) {
            // If historical but 0 results, maybe just show completed (empty list)
            stopPolling();
            setStatus('COMPLETED');
          }
        }
      } catch (err) {
        console.error("Polling error:", err);
      }
    };

    fetchResults(); // Call immediately
    pollingIntervalRef.current = setInterval(fetchResults, 3000); // Then every 3s
  };

  const handleActionUpdate = async (matchId, action) => {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const token = await user.getIdToken();
      
      await axios.post(`http://localhost:5000/api/matches/${matchId}/action`, { action }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Optimistically update the UI to show it's handled, or simply leave it for the next poll 
      // (If polling is stopped, we should update local state manually if we show badges for actions)
      // Since CandidateCard might need action state, we will pass it down.
    } catch (err) {
      console.error("Action update failed", err);
      alert("Failed to update candidate action");
    }
  };

  return (
    <div className="flex flex-col md:flex-row min-h-[calc(100vh-64px)] animate-fade-in gap-8">
      
      {/* Left Panel: Upload Controls (35%) - Hide if we loaded from history */}
      {!initialJobId && (
        <div className="w-full md:w-[35%] flex-shrink-0 md:sticky md:top-24 self-start max-h-[calc(100vh-100px)] overflow-y-auto pr-2 custom-scrollbar">
          <UploadPanel 
            jobData={jobData}
            setJobData={setJobData}
            files={files}
            setFiles={setFiles}
            onRunMatching={handleRunMatching}
            status={status}
            errorMsg={errorMsg}
          />
        </div>
      )}

      {/* Right Panel: Results (65% or 100% if history) */}
      <div className={`w-full ${initialJobId ? 'md:w-full max-w-4xl mx-auto' : 'md:w-[65%]'} pb-12`}>
        <ResultsPanel 
          status={status}
          results={results}
          onActionUpdate={handleActionUpdate}
        />
      </div>

    </div>
  );
}
