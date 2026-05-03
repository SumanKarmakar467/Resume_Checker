import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import PaymentButton from "../components/PaymentButton";
import { fetchPaymentStatus } from "../api/resumeApi";

const PRO_STORAGE_KEY = "resume_ai_is_pro";

export default function Pricing({ navigate, user, onLogout }) {
  const [isPro, setIsPro] = useState(localStorage.getItem(PRO_STORAGE_KEY) === "true");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const syncStatus = async () => {
      if (!user?.email) return;
      setLoading(true);
      try {
        const result = await fetchPaymentStatus(user.email);
        if (!mounted) return;
        const pro = Boolean(result?.isPro);
        setIsPro(pro);
        localStorage.setItem(PRO_STORAGE_KEY, pro ? "true" : "false");
      } catch (_err) {
        // Ignore sync errors to avoid blocking pricing UI.
      } finally {
        if (mounted) setLoading(false);
      }
    };
    syncStatus();
    return () => {
      mounted = false;
    };
  }, [user?.email]);

  return (
    <div>
      <Navbar navigate={navigate} user={user} onLogout={onLogout} />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "2.5rem 2rem" }}>
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--g)", marginBottom: 6 }}>
            # pricing_plans()
          </div>
          <h1 style={{ fontSize: "clamp(1.8rem, 4vw, 2.5rem)", fontWeight: 800 }}>Choose Your Plan</h1>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(290px, 1fr))", gap: 14 }}>
          <div className="card" style={{ padding: "1.2rem" }}>
            <h3 style={{ marginBottom: 8 }}>Free</h3>
            <div style={{ color: "var(--muted)", marginBottom: 10 }}>Great for trying the product</div>
            <ul style={{ paddingLeft: 18, lineHeight: 1.7 }}>
              <li>3 analyses per day</li>
              <li>Single upload only</li>
              <li>No history dashboard</li>
            </ul>
          </div>

          <div className="card" style={{ padding: "1.2rem", border: "1px solid rgba(79,70,229,0.35)" }}>
            <h3 style={{ marginBottom: 8 }}>Pro (One-Time)</h3>
            <div style={{ color: "var(--muted)", marginBottom: 10 }}>INR 199 one-time payment</div>
            <ul style={{ paddingLeft: 18, lineHeight: 1.7, marginBottom: 14 }}>
              <li>Unlimited analyses</li>
              <li>Bulk upload enabled</li>
              <li>History dashboard access</li>
            </ul>

            {isPro ? (
              <div style={{ color: "#16a34a", fontWeight: 700 }}>You are Pro</div>
            ) : (
              <PaymentButton
                user={user}
                onSuccess={() => {
                  setIsPro(true);
                  localStorage.setItem(PRO_STORAGE_KEY, "true");
                }}
              />
            )}
            {loading ? <div style={{ marginTop: 8, fontSize: 12, color: "var(--muted)" }}>checking plan status...</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}

