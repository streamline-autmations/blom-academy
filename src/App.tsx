import { Toaster as Sonner } from "./components/ui/sonner";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Suspense, lazy, useEffect } from "react";
import { AppShell } from "./components/AppShell";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import CourseDetail from "./pages/CourseDetail";
import LessonPlayer from "./pages/LessonPlayer";
import Login from "./pages/Login";
import SimpleSignup from "./pages/SimpleSignup";
import ScrollToTop from "./components/ScrollToTop";
import InstallPrompt from "./components/InstallPrompt";
import { AuthProvider } from "./contexts/AuthProvider";
import { useAuth } from "./hooks/useAuth";
import { Skeleton } from "./components/ui/skeleton";
import ForgotPassword from "./pages/ForgotPassword";
import UpdatePassword from "./pages/UpdatePassword";
import SetupProfile from "./pages/SetupProfile";
import AcceptInvite from "./pages/AcceptInvite";
import SimpleInvite from "./pages/SimpleInvite";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { CourseProtectedRoute } from "./components/CourseProtectedRoute";
import { LessonProtectedRoute } from "./components/LessonProtectedRoute";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { debugLog } from "./lib/debugLog";

// Lazily loaded: none of these sit on the signup/login/invite/purchase/
// course-viewing path, so splitting them out of the main bundle carries no
// risk to those flows.
const Bookmarks = lazy(() => import("./pages/Bookmarks"));
const Profile = lazy(() => import("./pages/Profile"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Certificate = lazy(() => import("./pages/Certificate"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const AdminInvites = lazy(() => import("./pages/AdminInvites"));
const AdminAccess = lazy(() => import("./pages/AdminAccess"));

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-bloom">
    <div className="text-center">
      <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
      <p className="text-body-text">Loading...</p>
    </div>
  </div>
);

const AppRoutes = () => {
  const { session, loading, isProfileComplete, user, profile } = useAuth();
  
  // Handle malformed invite URLs that go to root with hash
  useEffect(() => {
    const currentUrl = window.location.href;
    const hash = window.location.hash;
    
    // If URL is root with hash, check if it contains invite token
    if (window.location.pathname === '/' && hash) {
      debugLog('🔍 Detected root URL with hash:', { currentUrl, hash });
      
      // Check if hash contains invite token
      if (hash.includes('invite=')) {
        const inviteToken = new URLSearchParams(hash.substring(1)).get('invite');
        if (inviteToken) {
          debugLog('🎫 Found invite token in hash, redirecting to AcceptInvite page');
          window.location.replace(`/accept-invite?invite=${inviteToken}`);
          return;
        }
      }
    }
  }, []);
  
  // Debug logging
  debugLog('🎯 AppRoutes state:', { 
    loading, 
    hasSession: !!session, 
    hasUser: !!user, 
    hasProfile: !!profile, 
    isProfileComplete,
    userId: user?.id 
  });

  // Show loading spinner while checking auth state
  if (loading) {
    debugLog('⏳ Showing loading spinner');
    return (
      <div className="min-h-screen flex items-center justify-center bg-bloom">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-body-text">Loading...</p>
        </div>
      </div>
    );
  }

  // User is not logged in.
  if (!session) {
    debugLog('❌ No session, showing unauthenticated routes');
    return (
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SimpleSignup />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/invite/:token" element={<SimpleInvite />} />
          <Route path="/account-setup" element={<SetupProfile />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/home" element={<Navigate to="/login" replace />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Suspense>
    );
  }

  // Check if profile is complete - only require first_name and last_name
  const isProfileCompleteLocal = profile && (
    profile.first_name && profile.first_name.trim() !== '' &&
    profile.last_name && profile.last_name.trim() !== ''
  );

  // Debug profile completion
  debugLog('🔍 Profile completion check:', {
    hasProfile: !!profile,
    first_name: profile?.first_name,
    last_name: profile?.last_name,
    username: profile?.username,
    isComplete: isProfileCompleteLocal
  });

  // Emergency fallback: If user has any profile data, consider them complete
  // This prevents existing users from being stuck in account setup loop
  const hasAnyProfileData = profile && (
    profile.first_name || 
    profile.last_name || 
    profile.username
  );
  
  const shouldShowApp = isProfileCompleteLocal || hasAnyProfileData;

  debugLog('🚨 Emergency fallback check:', {
    hasAnyProfileData,
    shouldShowApp,
    originalComplete: isProfileCompleteLocal
  });

  // Note: the incomplete-profile redirect to /account-setup is intentionally
  // disabled — any authenticated user proceeds straight into the app below,
  // regardless of profile completeness.

  // Fully authenticated with complete profile
  debugLog('✅ User authenticated, showing app (profile check is disabled by edit)');
  return (
    <AppShell>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/home" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/accept-invite" element={<AcceptInvite />} />
          <Route path="/invite/:token" element={<SimpleInvite />} />
          <Route path="/course/:slug" element={
            <CourseProtectedRoute>
              <CourseDetail />
            </CourseProtectedRoute>
          } />
          <Route path="/lesson/:lessonId" element={
            <LessonProtectedRoute>
              <LessonPlayer />
            </LessonProtectedRoute>
          } />
          <Route path="/bookmarks" element={<Bookmarks />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin/invites" element={<AdminInvites />} />
          <Route path="/admin/access" element={<AdminAccess />} />
          <Route path="/course/:slug/certificate" element={<Certificate />} />
          {/* Redirect authenticated users away from login */}
          <Route path="/login" element={<Navigate to="/home" replace />} />
          <Route path="/account-setup" element={<SetupProfile />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/update-password" element={<UpdatePassword />} />
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AppShell>
  );
};

const App = () => (
  <ErrorBoundary>
    <Sonner richColors />
    <BrowserRouter>
      <AuthProvider>
        <ScrollToTop />
        <AppRoutes />
        <InstallPrompt />
      </AuthProvider>
    </BrowserRouter>
  </ErrorBoundary>
);

export default App;
