import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAllUsers } from "../services/firestoreUsers";
import { useAuthContext } from "../context/AuthContext";

function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === "function") return value.toDate();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDate(value) {
  const date = toDate(value);
  if (!date) return "-";
  return date.toLocaleString();
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuthContext();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError("");
      try {
        const records = await fetchAllUsers();
        if (mounted) setUsers(records);
      } catch (err) {
        if (mounted) setError(err?.message || "Failed to load admin metrics.");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const metrics = useMemo(() => {
    const now = Date.now();
    const twentyFourHoursAgo = now - 24 * 60 * 60 * 1000;

    const totalUsers = users.length;
    const totalResumesChecked = users.reduce((sum, user) => sum + (user.resumesChecked || 0), 0);
    const totalGenerated = users.reduce((sum, user) => sum + (user.resumesGenerated || 0), 0);
    const activeToday = users.filter((user) => {
      const lastActive = toDate(user.lastActive);
      return lastActive && lastActive.getTime() >= twentyFourHoursAgo;
    }).length;

    return { totalUsers, totalResumesChecked, totalGenerated, activeToday };
  }, [users]);

  const sortedUsers = useMemo(() => {
    return [...users].sort((a, b) => {
      const dateA = toDate(a.createdAt)?.getTime() || 0;
      const dateB = toDate(b.createdAt)?.getTime() || 0;
      return dateB - dateA;
    });
  }, [users]);

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-slate-100">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-slate-400">Owner view for user and usage metrics.</p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => navigate("/")}
              className="rounded-md border border-slate-700 px-3 py-2 text-sm hover:border-slate-500"
            >
              Home
            </button>
            <button
              type="button"
              onClick={async () => {
                await logout();
                navigate("/login");
              }}
              className="rounded-md border border-slate-700 px-3 py-2 text-sm hover:border-slate-500"
            >
              Logout
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs text-slate-400">Total Users</p>
            <p className="mt-2 text-2xl font-semibold">{metrics.totalUsers}</p>
          </article>
          <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs text-slate-400">Total Resumes Checked</p>
            <p className="mt-2 text-2xl font-semibold">{metrics.totalResumesChecked}</p>
          </article>
          <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs text-slate-400">Total Generated</p>
            <p className="mt-2 text-2xl font-semibold">{metrics.totalGenerated}</p>
          </article>
          <article className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <p className="text-xs text-slate-400">Active Today</p>
            <p className="mt-2 text-2xl font-semibold">{metrics.activeToday}</p>
          </article>
        </section>

        <section className="rounded-xl border border-slate-800 bg-slate-900 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold">Users</h2>
            <p className="text-xs text-slate-500">Signed in as: {currentUser?.email || "owner"}</p>
          </div>

          {loading ? <p className="text-sm text-slate-400">Loading users...</p> : null}
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}

          {!loading && !error ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-800 text-xs uppercase tracking-wide text-slate-400">
                    <th className="py-2 pr-3">Name</th>
                    <th className="py-2 pr-3">Email</th>
                    <th className="py-2 pr-3">Registered date</th>
                    <th className="py-2 pr-3">Resumes Checked</th>
                    <th className="py-2 pr-3">Resumes Generated</th>
                    <th className="py-2 pr-3">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedUsers.map((user) => (
                    <tr key={user.uid || user.id} className="border-b border-slate-800/60 text-slate-200">
                      <td className="py-2 pr-3">{user.displayName || "-"}</td>
                      <td className="py-2 pr-3">{user.email || "-"}</td>
                      <td className="py-2 pr-3">{formatDate(user.createdAt)}</td>
                      <td className="py-2 pr-3">{user.resumesChecked || 0}</td>
                      <td className="py-2 pr-3">{user.resumesGenerated || 0}</td>
                      <td className="py-2 pr-3">{formatDate(user.lastActive)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : null}
        </section>
      </div>
    </main>
  );
}
