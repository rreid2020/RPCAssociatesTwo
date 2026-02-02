import { SignedIn, SignedOut } from '@clerk/clerk-react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ChatPage from './pages/ChatPage';
import PortalDashboard from './pages/PortalDashboard';
import FormsPage from './pages/FormsPage';
import FormDetailPage from './pages/FormDetailPage';
import CustomSignUpPage from './pages/CustomSignUpPage';
import CustomSignInPage from './pages/CustomSignInPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import PortalLayout from './pages/PortalLayout';

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Public routes - show when signed out */}
        <Route
          path="/sign-in/*"
          element={
            <SignedOut>
              <CustomSignInPage />
            </SignedOut>
          }
        />
        <Route
          path="/sign-up"
          element={
            <SignedOut>
              <CustomSignUpPage />
            </SignedOut>
          }
        />
        <Route
          path="/verify-email"
          element={
            <SignedOut>
              <VerifyEmailPage />
            </SignedOut>
          }
        />
        {/* Portal layout with nested services */}
        <Route
          path="/portal/*"
          element={
            <>
              <SignedOut>
                <Navigate to="/sign-in" replace />
              </SignedOut>
              <SignedIn>
                <PortalLayout />
              </SignedIn>
            </>
          }
        >
          <Route index element={<PortalDashboard />} />
          <Route path="taxgpt" element={<ChatPage />} />
        </Route>
        {/* Forms module */}
        <Route
          path="/forms/*"
          element={
            <>
              <SignedOut>
                <Navigate to="/sign-in" replace />
              </SignedOut>
              <SignedIn>
                <PortalLayout />
              </SignedIn>
            </>
          }
        >
          <Route index element={<FormsPage />} />
          <Route path=":formCode" element={<FormDetailPage />} />
        </Route>
        {/* Default route - redirect to portal if signed in */}
        <Route
          path="/*"
          element={
            <>
              <SignedOut>
                <Navigate to="/sign-in" replace />
              </SignedOut>
              <SignedIn>
                <Navigate to="/portal" replace />
              </SignedIn>
            </>
          }
        />
      </Routes>
    </div>
  );
}

export default App;

