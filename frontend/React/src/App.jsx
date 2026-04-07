import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Route, Routes, useNavigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import UploadResume from "./pages/UploadResume";
import Result from "./pages/Result";
import ResumeBuilder from "./pages/ResumeBuilder";
import AuthPage from "./pages/AuthPage";
import AdminPanel from "./pages/AdminPanel";
import History from "./pages/History";
import { AuthProvider, useAuthContext } from "./context/AuthContext";
import "./index.css";
import "./styles/global.css";

const GUEST_USAGE_KEY = "resume_ai_guest_usage";
const ANALYSIS_RESULT_KEY = "resume_ai_latest_analysis";

const PAGE_ROUTES = {
  landing: "/",
  upload: "/upload",
  result: "/result",
  builder: "/builder",
  history: "/history",
  auth: "/login",
  admin: "/admin",
};

function loadGuestUsage() {
  try {
    const stored = JSON.parse(localStorage.getItem(GUEST_USAGE_KEY) || "null");
    return {
      analyzerUsed: Boolean(stored?.analyzerUsed),
      builderUsed: Boolean(stored?.builderUsed),
    };
  } catch (_err) {
    return { analyzerUsed: false, builderUsed: false };
  }
}

function loadLatestAnalysis() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(ANALYSIS_RESULT_KEY) || "null");
    return stored && typeof stored === "object" ? stored : null;
  } catch (_err) {
    return null;
  }
}

function useLegacyNavigate() {
  const navigate = useNavigate();
  return (page) => navigate(PAGE_ROUTES[page] || "/");
}

function AppRoutes() {
  const navigate = useNavigate();
  const legacyNavigate = useLegacyNavigate();
  const { currentUser, logout } = useAuthContext();
  const [analysisResult, setAnalysisResult] = useState(() => loadLatestAnalysis());
  const [guestUsage, setGuestUsage] = useState(() => loadGuestUsage());

  useEffect(() => {
    try {
      if (!analysisResult) {
        sessionStorage.removeItem(ANALYSIS_RESULT_KEY);
        return;
      }
      sessionStorage.setItem(ANALYSIS_RESULT_KEY, JSON.stringify(analysisResult));
    } catch (_err) {
      // Ignore storage write failures.
    }
  }, [analysisResult]);

  const consumeGuestTry = (featureKey) => {
    if (currentUser) return true;
    if (guestUsage[featureKey]) return false;

    const nextUsage = { ...guestUsage, [featureKey]: true };
    setGuestUsage(nextUsage);
    localStorage.setItem(GUEST_USAGE_KEY, JSON.stringify(nextUsage));
    return true;
  };

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <Routes>
      <Route
        path="/"
        element={<LandingPage navigate={legacyNavigate} user={currentUser} onLogout={handleLogout} />}
      />
      <Route
        path="/upload"
        element={
          <UploadResume
            navigate={legacyNavigate}
            user={currentUser}
            guestAnalyzerUsed={guestUsage.analyzerUsed}
            consumeGuestAnalyzerTry={() => consumeGuestTry("analyzerUsed")}
            requireAuth={() => navigate("/login")}
            setAnalysisResult={setAnalysisResult}
            onLogout={handleLogout}
          />
        }
      />
      <Route
        path="/builder"
        element={
          <ResumeBuilder
            navigate={legacyNavigate}
            user={currentUser}
            guestBuilderUsed={guestUsage.builderUsed}
            consumeGuestBuilderTry={() => consumeGuestTry("builderUsed")}
            requireAuth={() => navigate("/login")}
            onLogout={handleLogout}
          />
        }
      />
      <Route
        path="/result"
        element={<Result navigate={legacyNavigate} result={analysisResult} user={currentUser} onLogout={handleLogout} />}
      />
      <Route
        path="/history"
        element={<History navigate={legacyNavigate} user={currentUser} onLogout={handleLogout} />}
      />

      <Route path="/login" element={<AuthPage initialMode="login" />} />
      <Route path="/register" element={<AuthPage initialMode="register" />} />

      <Route path="/admin" element={<AdminPanel />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

