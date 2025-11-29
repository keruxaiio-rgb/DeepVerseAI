"use client";

import React, { useEffect, useState } from "react";

const styles: Record<string, React.CSSProperties> = {
  loading: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "linear-gradient(135deg, #4B3CBC 0%, #8E6AFF 100%)",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
    color: "white",
  },
  logoContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginBottom: 40,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 20,
    boxShadow: "0 8px 24px rgba(0,0,0,0.3)",
    marginBottom: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 700,
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 18,
    opacity: 0.9,
    textAlign: "center",
    maxWidth: 400,
  },
  loadingIndicator: {
    display: "flex",
    alignItems: "center",
    gap: 12,
    marginTop: 40,
  },
  spinner: {
    width: 24,
    height: 24,
    border: "3px solid rgba(255,255,255,0.3)",
    borderTop: "3px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  loadingText: {
    fontSize: 16,
    fontWeight: 500,
  },
};

export default function LoadingPage() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Simulate loading progress
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          // Redirect to upgrade page after loading
          setTimeout(() => {
            window.location.href = '/upgrade';
          }, 500);
          return 100;
        }
        return prev + 2;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  return (
    <div style={styles.loading}>
      <div style={styles.logoContainer}>
        <img
          src="/deepverse.logo.png"
          alt="DeepVerse AI"
          style={styles.logo}
          onError={(e) => ((e.currentTarget as HTMLImageElement).src = "/deepverse.logo.png")}
        />
        <h1 style={styles.title}>Welcome to DeepVerse AI</h1>
        <p style={styles.subtitle}>
          Your AI-powered theological assistant is being prepared...
        </p>
      </div>

      <div style={styles.loadingIndicator}>
        <div style={styles.spinner}></div>
        <span style={styles.loadingText}>
          Setting up your experience... {progress}%
        </span>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
