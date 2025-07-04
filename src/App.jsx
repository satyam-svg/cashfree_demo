import { useState, useEffect } from "react";
import axios from "axios";
import { load } from "@cashfreepayments/cashfree-js";

function App() {
  const [cashfree, setCashfree] = useState(null);
  const [orderId, setOrderId] = useState("");

  useEffect(() => {
    const initializeSDK = async () => {
      const instance = await load({
        mode: "production", // ⬅️ Change to "sandbox" for testing
      });
      setCashfree(instance);
    };
    initializeSDK();
  }, []);

  const getSessionId = async () => {
    try {
      const res = await axios.get("http://localhost:8000/payment");
      console.log("✅ Session Data:", res.data);

      if (res.data && res.data.payment_session_id) {
        setOrderId(res.data.order_id);
        return res.data.payment_session_id;
      } else {
        throw new Error("No payment_session_id received from backend");
      }
    } catch (error) {
      console.error("❌ Error fetching session ID:", error);
      alert("Failed to get session ID");
    }
  };

  const verifyPayment = async () => {
    try {
      const res = await axios.post("http://localhost:8000/verify", {
        orderId: orderId,
      });
      console.log("✅ Payment Verification:", res.data);

      if (res.data && res.data.success) {
        alert("🎉 Payment Verified Successfully!");
      } else {
        alert("⚠️ Payment verification failed.");
      }
    } catch (error) {
      console.error("❌ Error verifying payment:", error);
      alert("Payment verification failed");
    }
  };

  const handleClick = async (e) => {
    e.preventDefault();
    if (!cashfree) {
      alert("Cashfree SDK not loaded yet");
      return;
    }

    try {
      const sessionId = await getSessionId();
      const checkoutOptions = {
        paymentSessionId: sessionId,
        redirectTarget: "_modal", // _self | _blank | _modal
      };

      await cashfree.checkout(checkoutOptions);
      console.log("✅ Payment Initialized");

      // Optional: Verify payment after checkout
      verifyPayment();
    } catch (error) {
      console.error("❌ Payment Error:", error);
      alert("Payment failed to initialize");
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "0 auto", padding: "20px" }}>
      <h1 style={{ textAlign: "center" }}>💳 Cashfree Payment Gateway</h1>

      <div style={{ textAlign: "center", margin: "30px 0" }}>
        <button
          onClick={handleClick}
          style={{
            padding: "12px 24px",
            fontSize: "18px",
            backgroundColor: "#3a86ff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
          }}
        >
          Pay Now
        </button>
      </div>

      {/* PDF Download Links Section */}
      <div
        style={{
          marginTop: "40px",
          borderTop: "1px solid #eee",
          paddingTop: "20px",
        }}
      >
        <h2>Important Documents</h2>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          <a
            href="/Contact_Details (1).pdf"
            download="ContactUs.pdf"
            style={{
              display: "block",
              padding: "12px",
              backgroundColor: "#f8f9fa",
              border: "1px solid #ddd",
              borderRadius: "4px",
              textDecoration: "none",
              color: "#333",
            }}
          >
            📞 Contact Us
          </a>

          <a
            href="/terms_condition.pdf"
            download="TermsAndConditions.pdf"
            style={{
              display: "block",
              padding: "12px",
              backgroundColor: "#f8f9fa",
              border: "1px solid #ddd",
              borderRadius: "4px",
              textDecoration: "none",
              color: "#333",
            }}
          >
            📑 Terms & Conditions
          </a>

          <a
            href=""
            download="/refund_cancellation.pdf"
            style={{
              display: "block",
              padding: "12px",
              backgroundColor: "#f8f9fa",
              border: "1px solid #ddd",
              borderRadius: "4px",
              textDecoration: "none",
              color: "#333",
            }}
          >
            ↩️ Refund & Cancellation Policy
          </a>
        </div>
      </div>
    </div>
  );
}

export default App;
