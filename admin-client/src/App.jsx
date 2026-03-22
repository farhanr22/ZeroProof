// src/App.jsx
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import Navbar from './components/Navbar.jsx';

// Pages
import LandingPage from './pages/LandingPage.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Campaigns from './pages/Campaigns.jsx';
import CampaignOverview from './pages/CampaignOverview.jsx';
import ManageContacts from './pages/ManageContacts.jsx';
import ManageQuestions from './pages/ManageQuestions.jsx';
import Responses from './pages/Responses.jsx';
import Insights from './pages/Insights.jsx';
import Settings from './pages/Settings.jsx';

// A wrapper component that checks for authentication
const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Hide the main Navbar on the landing page (it has its own dark navbar)
const ConditionalNavbar = () => {
  const { pathname } = useLocation();
  if (pathname === '/') return null;
  return <Navbar />;
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ConditionalNavbar />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/LandingPage" element={<Navigate to="/" replace />} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />

          {/* ALL DASHBOARD ROUTES ARE NOW PROTECTED */}
          <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
          <Route path="/campaigns/:id" element={<ProtectedRoute><CampaignOverview /></ProtectedRoute>} />
          <Route path="/campaigns/:id/contacts" element={<ProtectedRoute><ManageContacts /></ProtectedRoute>} />
          <Route path="/campaigns/:id/questions" element={<ProtectedRoute><ManageQuestions /></ProtectedRoute>} />
          <Route path="/campaigns/:id/responses" element={<ProtectedRoute><Responses /></ProtectedRoute>} />
          <Route path="/campaigns/:id/insights" element={<ProtectedRoute><Insights /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App;