import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import UploadResume from './UploadResume';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Landing from './pages/Landing';
import useAuth from './hooks/useAuth';

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function PublicOnly({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }
  return children;
}

function HomeGate() {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/app" replace />;
  }
  return <Landing />;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomeGate />} />
        <Route
          path="/app"
          element={(
            <RequireAuth>
              <UploadResume />
            </RequireAuth>
          )}
        />
        <Route
          path="/login"
          element={(
            <PublicOnly>
              <Login />
            </PublicOnly>
          )}
        />
        <Route
          path="/register"
          element={(
            <PublicOnly>
              <Register />
            </PublicOnly>
          )}
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route path="*" element={<HomeGate />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
