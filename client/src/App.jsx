import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import MatchPage from './pages/MatchPage';
import History from './pages/History';
import Landing from './pages/Landing';
import AuthPage from './pages/AuthPage';
import DashboardLayout from './components/layout/DashboardLayout';

function App() {
  return (
    <Router>
      <div className="font-sans">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<AuthPage />} />

          {/* Protected App Routes with Shared Layout */}
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/match" element={<MatchPage />} />
            <Route path="/history" element={<History />} />
          </Route>
        </Routes>
      </div>
    </Router>
  );
}

export default App;
