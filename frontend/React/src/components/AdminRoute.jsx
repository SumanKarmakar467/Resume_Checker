import { Navigate, Outlet } from "react-router-dom";
import { useAuthContext } from "../context/AuthContext";

export default function AdminRoute() {
  const { currentUser, loading } = useAuthContext();
  const adminEmail = String(import.meta.env.VITE_ADMIN_EMAIL || "").trim().toLowerCase();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-950">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-400 border-t-transparent" />
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // this 
  const isAdmin = currentUser?.isAdmin || (adminEmail && String(currentUser?.email || "").toLowerCase() === adminEmail);
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
