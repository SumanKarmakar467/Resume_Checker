import { useState } from "react";
import { createPaymentOrder, verifyPayment } from "../api/resumeApi";

const PRO_STORAGE_KEY = "resume_ai_is_pro";

export default function PaymentButton({ user, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handlePayment = async () => {
    if (!user?.email) {
      setError("Please login before upgrading.");
      return;
    }
    if (!window.Razorpay) {
      setError("Razorpay SDK failed to load.");
      return;
    }
    if (!import.meta.env.VITE_RAZORPAY_KEY_ID) {
      setError("Razorpay public key is not configured.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const order = await createPaymentOrder(user.email);

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency || "INR",
        name: "ATS Resume Checker",
        description: "Pro Plan - One Time",
        order_id: order.id,
        handler: async (response) => {
          const result = await verifyPayment({
            ...response,
            userEmail: user.email,
          });
          if (result.status === "success") {
            localStorage.setItem(PRO_STORAGE_KEY, "true");
            onSuccess?.();
          } else {
            setError("Payment verification failed.");
          }
        },
        prefill: {
          name: user.displayName || "User",
          email: user.email,
        },
        theme: { color: "#4F46E5" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (event) => {
        setError(event?.error?.description || "Payment failed.");
      });
      rzp.open();
    } catch (err) {
      setError(err.message || "Unable to start payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={handlePayment} disabled={loading} className="btn-primary">
        {loading ? "Processing..." : "Upgrade to Pro - INR 199"}
      </button>
      {error ? <div style={{ marginTop: 8, color: "var(--r)", fontSize: 12 }}>{error}</div> : null}
    </div>
  );
}
