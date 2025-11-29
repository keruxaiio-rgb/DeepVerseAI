"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "../../lib/authContext";

const SubscriptionLandingPage = () => {
  const { subscriptionStatus, canAccessPremium } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2; // Increment by 2% every interval
      });
    }, 50); // Update every 50ms for smooth animation

    // Complete loading after 3 seconds
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    // Auto-redirect after loading completes
    if (!isLoading) {
      if (canAccessPremium) {
        // User has premium access, redirect to chat
        window.location.href = '/chat';
      } else {
        // User needs subscription, redirect to upgrade page
        window.location.href = '/upgrade?autoOpen=true';
      }
    }
  }, [isLoading, canAccessPremium]);

  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      height: "100vh",
      background: "#F7F7FA",
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    }}>
      {/* DeepVerse Logo */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <img
          src="/deepverse.logo.png"
          alt="DeepVerse AI"
          style={{
            width: 80,
            height: 80,
            borderRadius: 16,
            boxShadow: "0 8px 24px rgba(75,60,188,0.15)",
            marginBottom: 20,
          }}
        />
        <h1 style={{
          fontSize: 28,
          fontWeight: 700,
          color: "#2B2B2B",
          margin: 0,
        }}>
          DeepVerse AI
        </h1>
      </div>

      {/* Loading Animation */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <div style={{
          width: 80,
          height: 80,
          border: "4px solid #E0E0E0",
          borderTop: "4px solid #007AFF",
          borderRadius: "50%",
          animation: "spin 1s linear infinite",
          marginBottom: 24,
        }} />

        <h2 style={{
          fontSize: 20,
          fontWeight: 600,
          color: "#666",
          margin: "0 0 8px 0",
        }}>
          Checking your subscription...
        </h2>

        <p style={{
          fontSize: 14,
          color: "#888",
          margin: 0,
        }}>
          Please wait while we verify your access
        </p>
      </div>

      {/* Progress Bar */}
      <div style={{
        width: 300,
        height: 4,
        background: "#E0E0E0",
        borderRadius: 2,
        overflow: "hidden",
      }}>
        <div style={{
          height: "100%",
          background: "linear-gradient(90deg, #007AFF 0%, #34C759 100%)",
          borderRadius: 2,
          width: `${progress}%`,
          transition: "width 0.1s ease",
        }} />
      </div>

      <p style={{
        fontSize: 12,
        color: "#999",
        marginTop: 16,
      }}>
        {progress}% complete
      </p>

      {/* CSS Animation */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default SubscriptionLandingPage;
