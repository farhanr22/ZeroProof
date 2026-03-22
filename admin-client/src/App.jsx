// src/App.jsx
import { createBrowserRouter, RouterProvider, Navigate, useLocation, Outlet } from 'react-router-dom';
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

const RootLayout = () => {
  return (
    <AuthProvider>
      <ConditionalNavbar />
      <Outlet />
    </AuthProvider>
  );
};

const router = createBrowserRouter([
  {
    element: <RootLayout />,
    children: [
      { path: "/", element: <LandingPage /> },
      { path: "/LandingPage", element: <Navigate to="/" replace /> },
      { path: "/login", element: <Login /> },
      { path: "/signup", element: <Signup /> },
      { path: "/campaigns", element: <ProtectedRoute><Campaigns /></ProtectedRoute> },
      { path: "/campaigns/:id", element: <ProtectedRoute><CampaignOverview /></ProtectedRoute> },
      { path: "/campaigns/:id/contacts", element: <ProtectedRoute><ManageContacts /></ProtectedRoute> },
      { path: "/campaigns/:id/questions", element: <ProtectedRoute><ManageQuestions /></ProtectedRoute> },
      { path: "/campaigns/:id/responses", element: <ProtectedRoute><Responses /></ProtectedRoute> },
      { path: "/campaigns/:id/insights", element: <ProtectedRoute><Insights /></ProtectedRoute> },
      { path: "/settings", element: <ProtectedRoute><Settings /></ProtectedRoute> },
    ]
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;