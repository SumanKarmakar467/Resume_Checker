import { useState } from "react";
import LandingPage from "./pages/LandingPage";
import UploadResume from "./pages/UploadResume";
import Result from "./pages/Result";
import ResumeBuilder from "./pages/ResumeBuilder";
import AuthPage from "./pages/AuthPage";
import "./styles/global.css";

const GUEST_USAGE_KEY = "resume_ai_guest_usage";

function loadUserFromStorage() {
  try {
    const token = localStorage.getItem("jwt_token");
    if (!token) return null;
    const savedUser = JSON.parse(localStorage.getItem("resume_ai_user") || "null");
    if (savedUser && savedUser.email) return { ...savedUser, token };
    return { name: "User", email: "signed-in", token };
  } catch (_err) {
    return null;
  }
}

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

export default function App() {
  const [page, setPage] = useState("landing");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [user, setUser] = useState(() => loadUserFromStorage());
  const [guestUsage, setGuestUsage] = useState(() => loadGuestUsage());

  const navigate = (p) => setPage(p);
  const requireAuth = () => navigate("auth");

  const consumeGuestTry = (featureKey) => {
    if (user) return true;
    if (guestUsage[featureKey]) return false;
    const next = { ...guestUsage, [featureKey]: true };
    setGuestUsage(next);
    localStorage.setItem(GUEST_USAGE_KEY, JSON.stringify(next));
    return true;
  };

  const handleSetUser = (nextUser) => {
    setUser(nextUser);
    if (nextUser) {
      localStorage.setItem("resume_ai_user", JSON.stringify({
        name: nextUser.name || "",
        email: nextUser.email || "",
      }));
      if (nextUser.token) localStorage.setItem("jwt_token", nextUser.token);
    }
  };

  return (
    <div className="app">
      {page === "landing" && (
        <LandingPage navigate={navigate} user={user} />
      )}
      {page === "upload" && (
        <UploadResume
          navigate={navigate}
          user={user}
          guestAnalyzerUsed={guestUsage.analyzerUsed}
          consumeGuestAnalyzerTry={() => consumeGuestTry("analyzerUsed")}
          requireAuth={requireAuth}
          setAnalysisResult={setAnalysisResult}
        />
      )}
      {page === "result" && (
        <Result
          navigate={navigate}
          result={analysisResult}
        />
      )}
      {page === "builder" && (
        <ResumeBuilder
          navigate={navigate}
          user={user}
          guestBuilderUsed={guestUsage.builderUsed}
          consumeGuestBuilderTry={() => consumeGuestTry("builderUsed")}
          requireAuth={requireAuth}
        />
      )}
      {page === "auth" && (
        <AuthPage navigate={navigate} setUser={handleSetUser} />
      )}
    </div>
  );
}
