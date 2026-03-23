import { useState } from "react";
import LandingPage from "./pages/LandingPage";
import UploadResume from "./pages/UploadResume";
import Result from "./pages/Result";
import ResumeBuilder from "./pages/ResumeBuilder";
import AuthPage from "./pages/AuthPage";
import "./styles/global.css";

export default function App() {
  const [page, setPage] = useState("landing");
  const [analysisResult, setAnalysisResult] = useState(null);
  const [user, setUser] = useState(null);

  const navigate = (p) => setPage(p);

  return (
    <div className="app">
      {page === "landing" && (
        <LandingPage navigate={navigate} user={user} />
      )}
      {page === "upload" && (
        <UploadResume
          navigate={navigate}
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
        <ResumeBuilder navigate={navigate} user={user} />
      )}
      {page === "auth" && (
        <AuthPage navigate={navigate} setUser={setUser} />
      )}
    </div>
  );
}
