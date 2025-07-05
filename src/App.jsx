import React, { useState, useEffect } from "react";
import axios from "axios";
import { load } from "@cashfreepayments/cashfree-js";

const API_BASE_URL = "https://cashfree-backend-007e.onrender.com";
const CASHFREE_MODE = "production"; // Use "sandbox" for testing

function PaymentApp() {
  const [cashfree, setCashfree] = useState(null);
  const [orderInfo, setOrderInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState(null);

  // Initialize Cashfree SDK
  useEffect(() => {
    const initializePaymentSDK = async () => {
      try {
        const instance = await load({
          mode: CASHFREE_MODE,
        });
        setCashfree(instance);
        console.log("Cashfree SDK loaded successfully");

        // Add event listeners for payment status
        instance.on("paymentSuccess", async (data) => {
          console.log("Payment Success:", data);
          setPaymentStatus("verifying");
          await verifyPayment();
        });

        instance.on("paymentFailure", (data) => {
          console.log("Payment Failed:", data);
          setPaymentStatus("failure");
        });

        instance.on("paymentCancel", (data) => {
          console.log("Payment Cancelled:", data);
          setPaymentStatus("cancelled");
        });
      } catch (error) {
        console.error("Payment initialization failed:", error);
        setPaymentStatus("payment_init_failed");
      }
    };

    initializePaymentSDK();
  }, []);

  // Hardcoded user data
  const userData = {
    name: "Ludo Player",
    email: "player@ludoking.com",
    phone: "9876543210",
  };

  const createPaymentOrder = async () => {
    try {
      setLoading(true);
      setPaymentStatus(null);

      const response = await axios.post(`${API_BASE_URL}/create-payment`, {
        customer_name: userData.name,
        customer_email: userData.email,
        customer_phone: userData.phone,
      });

      console.log(response.data);

      if (response.data.success) {
        setOrderInfo(response.data.data);
        return response.data.data.payment_session_id;
      }
      throw new Error(response.data.error || "Order creation failed");
    } catch (error) {
      console.error("Order creation error:", error);
      setPaymentStatus("order_failed");
      return null;
    } finally {
      setLoading(false);
    }
  };

  const verifyPayment = async () => {
    try {
      if (!orderInfo?.order_id) return;

      setLoading(true);
      const response = await axios.get(
        `${API_BASE_URL}/verify-payment/${orderInfo.order_id}`
      );

      if (response.data.success) {
        const payments = response.data.data;
        if (payments.length > 0) {
          setPaymentStatus("success");
          startLudoGame();
        } else {
          setPaymentStatus("pending");
        }
      } else {
        setPaymentStatus("verification_failed");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setPaymentStatus("verification_error");
    } finally {
      setLoading(false);
    }
  };

  const startLudoGame = () => {
    console.log("Starting Ludo game...");
    // Add your Ludo game initialization logic here
    alert("🎉 Payment Successful! Starting Ludo Game...");
  };

  const initiatePayment = async () => {
    if (!cashfree) {
      setPaymentStatus("sdk_not_loaded");
      return;
    }

    const sessionId = await createPaymentOrder();
    if (!sessionId) return;

    try {
      // ✅ UPDATED: Enhanced checkout options to show all payment methods
      const checkoutOptions = {
        paymentSessionId: sessionId,
        redirectTarget: "_modal",

        // ✅ CRITICAL: These options ensure all payment methods are displayed
        appearance: {
          theme: "light",
          variables: {
            colorPrimary: "#6a11cb",
            colorPrimaryText: "#ffffff",
            colorBackground: "#ffffff",
            colorText: "#333333",
            borderRadius: "8px",
            fontFamily: "Arial, sans-serif",
          },
        },

        // ✅ Enable specific payment methods explicitly
        paymentMethods: {
          // All major payment methods
          card: {
            enabled: true,
          },
          upi: {
            enabled: true,
          },
          netBanking: {
            enabled: true,
          },
          wallet: {
            enabled: true,
          },
          payLater: {
            enabled: true,
          },
          cardlessEmi: {
            enabled: true,
          },
          bankTransfer: {
            enabled: true,
          },
        },

        // ✅ Enhanced user experience options
        retry: {
          enabled: true,
          maxCount: 3,
        },

        // Customer details for better UX
        customerDetails: {
          customerPhone: userData.phone,
          customerEmail: userData.email,
          customerName: userData.name,
        },
      };

      console.log("Initiating checkout with options:", checkoutOptions);

      // ✅ Use the enhanced checkout method
      await cashfree.checkout(checkoutOptions);
    } catch (error) {
      console.error("Checkout error:", error);
      setPaymentStatus("checkout_failed");
    }
  };

  const renderPaymentStatus = () => {
    switch (paymentStatus) {
      case "success":
        return (
          <div className="success-message">
            🎉 Payment Successful! Starting Ludo...
          </div>
        );
      case "verifying":
        return <div className="info-message">🔍 Verifying payment...</div>;
      case "pending":
        return (
          <div className="warning-message">
            ⏳ Payment processing...
            <button className="retry-button" onClick={verifyPayment}>
              Check Again
            </button>
          </div>
        );
      case "failure":
        return (
          <div className="error-message">
            ❌ Payment failed. Please try again.
          </div>
        );
      case "cancelled":
        return (
          <div className="warning-message">
            ⚠️ Payment was cancelled. Try again when ready.
          </div>
        );
      case "order_failed":
        return (
          <div className="error-message">❌ Failed to create payment order</div>
        );
      case "checkout_failed":
        return (
          <div className="error-message">❌ Payment window failed to open</div>
        );
      case "sdk_not_loaded":
        return (
          <div className="error-message">
            ❌ Payment system not ready. Please refresh.
          </div>
        );
      case "payment_init_failed":
        return (
          <div className="error-message">❌ Payment initialization failed</div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="payment-container">
      <header className="header">
        <h1>🎲 Ludo King</h1>
        <p>Choose your preferred payment method below</p>
        <div className="payment-methods-preview">
          <span className="method-icon">💳</span>
          <span className="method-icon">📱</span>
          <span className="method-icon">🏦</span>
          <span className="method-icon">💰</span>
        </div>
      </header>

      <div className="payment-actions">
        <button
          onClick={initiatePayment}
          disabled={loading}
          className={`pay-button ${loading ? "loading" : ""}`}
        >
          {loading ? (
            <>
              <span className="loading-spinner"></span>
              Processing...
            </>
          ) : (
            <span>💰 Pay ₹1 & Play Ludo</span>
          )}
        </button>

        <div className="payment-info">
          <p>Secure payments powered by Cashfree</p>
          <p>✅ Cards • UPI • Net Banking • Wallets • EMI</p>
        </div>

        <div className="status-container">{renderPaymentStatus()}</div>
      </div>

      <div className="documents-section">
        <div className="documents-list">
          <a href="/terms.pdf" download className="doc-link">
            Terms
          </a>
          <a href="/privacy.pdf" download className="doc-link">
            Privacy
          </a>
          <a href="/refund.pdf" download className="doc-link">
            Refund
          </a>
        </div>
      </div>

      <footer className="footer">
        <p>© {new Date().getFullYear()} Ludo King</p>
      </footer>

      <style jsx>{`
        .payment-container {
          max-width: 400px;
          margin: 50px auto;
          padding: 30px;
          font-family: "Arial", sans-serif;
          background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          color: white;
          text-align: center;
        }

        .header {
          margin-bottom: 30px;
        }

        .header h1 {
          font-size: 2.8rem;
          margin-bottom: 10px;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
        }

        .header p {
          font-size: 1.2rem;
          opacity: 0.9;
          margin-bottom: 15px;
        }

        .payment-methods-preview {
          display: flex;
          justify-content: center;
          gap: 15px;
          margin-top: 15px;
        }

        .method-icon {
          font-size: 2rem;
          padding: 10px;
          background: rgba(255, 255, 255, 0.2);
          border-radius: 50%;
          animation: float 3s ease-in-out infinite;
        }

        .method-icon:nth-child(2) {
          animation-delay: 0.5s;
        }

        .method-icon:nth-child(3) {
          animation-delay: 1s;
        }

        .method-icon:nth-child(4) {
          animation-delay: 1.5s;
        }

        @keyframes float {
          0%,
          100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }

        .pay-button {
          width: 100%;
          padding: 20px;
          background: #ffd700;
          color: #2c3e50;
          border: none;
          border-radius: 15px;
          font-size: 1.5rem;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 6px 15px rgba(0, 0, 0, 0.3);
          display: flex;
          justify-content: center;
          align-items: center;
          gap: 10px;
          margin-bottom: 20px;
        }

        .pay-button:hover {
          transform: translateY(-5px);
          box-shadow: 0 10px 20px rgba(0, 0, 0, 0.4);
          background: #ffdf30;
        }

        .pay-button:disabled {
          background: #bdc3c7;
          cursor: not-allowed;
          transform: none;
          box-shadow: none;
        }

        .loading-spinner {
          display: inline-block;
          width: 24px;
          height: 24px;
          border: 3px solid rgba(44, 62, 80, 0.3);
          border-radius: 50%;
          border-top-color: #2c3e50;
          animation: spin 1s ease-in-out infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .payment-info {
          margin-bottom: 20px;
          padding: 15px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          font-size: 0.9rem;
        }

        .payment-info p {
          margin: 5px 0;
        }

        .status-container {
          margin-top: 25px;
          min-height: 60px;
        }

        .success-message,
        .error-message,
        .warning-message,
        .info-message {
          padding: 15px;
          border-radius: 10px;
          text-align: center;
          font-weight: 500;
          margin-top: 15px;
          font-size: 1.1rem;
        }

        .success-message {
          background: rgba(255, 255, 255, 0.9);
          color: #27ae60;
        }

        .error-message {
          background: rgba(255, 255, 255, 0.9);
          color: #e74c3c;
        }

        .warning-message {
          background: rgba(255, 255, 255, 0.9);
          color: #f39c12;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 12px;
        }

        .info-message {
          background: rgba(255, 255, 255, 0.9);
          color: #3498db;
        }

        .retry-button {
          padding: 10px 25px;
          background: #3498db;
          color: white;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          transition: background 0.3s;
          font-size: 1rem;
        }

        .retry-button:hover {
          background: #2980b9;
        }

        .documents-section {
          margin-top: 30px;
        }

        .documents-list {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 15px;
        }

        .doc-link {
          color: rgba(255, 255, 255, 0.8);
          text-decoration: none;
          font-weight: 500;
          transition: color 0.3s;
          font-size: 0.9rem;
        }

        .doc-link:hover {
          color: white;
          text-decoration: underline;
        }

        .footer {
          margin-top: 30px;
          text-align: center;
          opacity: 0.7;
          font-size: 0.9rem;
          padding-top: 20px;
          border-top: 1px solid rgba(255, 255, 255, 0.2);
        }
      `}</style>
    </div>
  );
}

export default PaymentApp;
