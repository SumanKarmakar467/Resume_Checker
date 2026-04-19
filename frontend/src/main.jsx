import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

const THEME_STORAGE_KEY = "resume_checker_theme";
try {
  const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
  const darkByDefault = storedTheme ? storedTheme === "dark" : true;
  document.documentElement.classList.toggle("dark", darkByDefault);
} catch (_error) {
  document.documentElement.classList.add("dark");
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
