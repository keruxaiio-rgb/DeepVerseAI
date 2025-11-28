"use client";

import React, { useState } from "react";
import { db } from "../../firebase";
import { collection, addDoc, doc, setDoc } from "firebase/firestore";
import type { Subscription, User } from "../../types/api";

const UpgradePage = () => {
  const [tier, setTier] = useState<'basic' | 'premium'>('premium');
  const [interval, setInterval] = useState<'monthly' | 'yearly'>('monthly');
  const [autoRenew, setAutoRenew] = useState(true);
  const [fullName, setFullName] = useState(process.env.NEXT_PUBLIC_USER_NAME || "");
  const [email, setEmail] = useState(process.env.NEXT_PUBLIC_USER_EMAIL || "");
  const [mobileNumber, setMobileNumber] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"gcash" | "bank">("gcash");
  const [accountNumber, setAccountNumber] = useState("");
  const [cvc, setCvc] = useState("");
  const [paymentVerification, setPaymentVerification] = useState("");
  const [authorizationConfirmed, setAuthorizationConfirmed] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'completed' | 'failed'>('idle');

  const getAmount = () => {
    if (tier === 'premium') {
      return interval === 'monthly' ? 299 : 299 * 12;
    }
    return interval === 'monthly' ? 99 : 99 * 12;
  };

  const handleProceed = async () => {
    if (!authorizationConfirmed) {
      alert("Please confirm authorization to proceed with payment.");
      return;
    }

    if (!fullName || !email || !mobileNumber || !accountNumber) {
      alert("Please fill in all required fields.");
      return;
    }

    setIsProcessing(true);
    setPaymentStatus('processing');

    try {
      // Call payment API
      const paymentResponse = await fetch('/api/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: getAmount(),
          paymentMethod,
          userId: email, // In production, use actual user ID from auth
          planType: tier,
          interval,
          accountNumber,
          fullName,
          email,
          mobileNumber,
          paymentVerification,
        }),
      });

      const paymentData = await paymentResponse.json();

      if (!paymentResponse.ok) {
        throw new Error(paymentData.error || 'Payment failed');
      }

      if (paymentData.success) {
        // Create subscription record in Firestore
        const subscription: Omit<Subscription, 'id'> = {
          userId: email, // In production, use actual user ID
          tier,
          status: 'active',
          paymentMethod,
          accountNumber,
          fullName,
          email,
          mobileNumber,
          paymentVerification,
          authorizationConfirmed,
          startDate: new Date(),
          endDate: new Date(Date.now() + (interval === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000),
          autoRenew,
          interval,
        };

        // Save subscription
        await addDoc(collection(db, "subscriptions"), subscription);

        // Update user role (in production, this would be done server-side)
        const userRef = doc(db, "users", email);
        await setDoc(userRef, {
          id: email,
          email,
          role: 'subscriber',
          subscriptionStatus: 'active',
          referralLimit: 50,
          activeReferrals: 0,
          fullName,
          mobileNumber,
          subscriptionStartDate: new Date(),
          subscriptionEndDate: new Date(Date.now() + (interval === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000),
          lastLogin: new Date(),
        } as User, { merge: true });

        setPaymentStatus('completed');

        // Redirect to success page or show success message
        alert(`🎉 Payment successful! Welcome to DeepVerse ${tier.charAt(0).toUpperCase() + tier.slice(1)}!`);

        // In production, redirect to dashboard or success page
        setTimeout(() => {
          window.location.href = '/chat';
        }, 2000);

      } else {
        throw new Error('Payment was not successful');
      }

    } catch (error) {
      console.error("Payment error:", error);
      setPaymentStatus('failed');
      alert(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div style={{ padding: 20, fontFamily: "Arial, sans-serif" }}>
      <button
        onClick={() => window.location.href = '/'}
        style={{ marginBottom: 20, padding: 8, background: "none", border: "none", cursor: "pointer", fontSize: 20 }}
      >
        ← Back
      </button>
      <h1>Upgrade to Subscribed</h1>
      <form onSubmit={(e) => { e.preventDefault(); handleProceed(); }}>
        <div style={{ marginBottom: 10 }}>
          <label>Subscription Tier: </label>
          <select value={tier} onChange={(e) => setTier(e.target.value as 'basic' | 'premium')}>
            <option value="basic">Basic</option>
            <option value="premium">Premium</option>
          </select>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Payment Interval: </label>
          <select value={interval} onChange={(e) => setInterval(e.target.value as 'monthly' | 'yearly')}>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
          </select>
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Auto Renew: </label>
          <input type="checkbox" checked={autoRenew} onChange={(e) => setAutoRenew(e.target.checked)} />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Full Name: </label>
          <input
            type="text"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
            style={{ padding: 8, width: 200 }}
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Email: </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{ padding: 8, width: 200 }}
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Mobile Number: </label>
          <input
            type="tel"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            required
            style={{ padding: 8, width: 200 }}
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Payment Method: </label>
          <div>
            <input
              type="radio"
              name="payment"
              value="gcash"
              checked={paymentMethod === "gcash"}
              onChange={() => setPaymentMethod("gcash")}
            /> GCash
          </div>
          <div>
            <input
              type="radio"
              name="payment"
              value="bank"
              checked={paymentMethod === "bank"}
              onChange={() => setPaymentMethod("bank")}
            /> Bank
          </div>
        </div>
        {paymentMethod === "gcash" && (
          <div style={{ marginBottom: 10 }}>
            <label>GCash Number: </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              required
              style={{ padding: 8, width: 200 }}
            />
          </div>
        )}
        {paymentMethod === "bank" && (
          <>
            <div style={{ marginBottom: 10 }}>
              <label>Account Number: </label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                required
                style={{ padding: 8, width: 200 }}
              />
            </div>
            <div style={{ marginBottom: 10 }}>
              <label>CVC: </label>
              <input
                type="text"
                value={cvc}
                onChange={(e) => setCvc(e.target.value)}
                required
                style={{ padding: 8, width: 200 }}
              />
            </div>
          </>
        )}
        <div style={{ marginBottom: 10 }}>
          <label>Payment Verification Code: </label>
          <input
            type="text"
            value={paymentVerification}
            onChange={(e) => setPaymentVerification(e.target.value)}
            required
            style={{ padding: 8, width: 200 }}
          />
        </div>
        <div style={{ marginBottom: 10 }}>
          <label>Confirm Authorization: </label>
          <input
            type="checkbox"
            checked={authorizationConfirmed}
            onChange={(e) => setAuthorizationConfirmed(e.target.checked)}
            required
          />
        </div>
        <button type="submit" style={{ padding: 10, background: "#007AFF", color: "white", border: "none", cursor: "pointer" }}>
          Proceed Payment
        </button>
      </form>
    </div>
  );
};

export default UpgradePage;
