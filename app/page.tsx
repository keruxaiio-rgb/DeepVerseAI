"use client";

import React from "react";

const styles: Record<string, React.CSSProperties> = {
  landing: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "#F7F7FA",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
  },
  logo: {
    fontSize: 48,
    fontWeight: 700,
    color: "#4B3CBC",
    marginBottom: 20,
  },
  description: {
    fontSize: 18,
    color: "#666",
    textAlign: "center",
    marginBottom: 40,
    maxWidth: 600,
  },
  buttons: {
    display: "flex",
    gap: 20,
  },
  button: {
    padding: "15px 30px",
    borderRadius: 12,
    border: "none",
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    boxShadow: "0 6px 16px rgba(75,60,188,0.12)",
  },
  loginBtn: {
    background: "#007AFF",
    color: "white",
  },
  signupBtn: {
    background: "#34C759",
    color: "white",
  },
};

export default function LandingPage() {
  return (
    <div style={styles.landing}>
      <h1 style={styles.logo}>DeepVerse AI</h1>
      <p style={styles.description}>
        Experience advanced AI-powered theological insights and sermon preparation.
        Ask questions, generate sermons, and create presentations with seminary-level depth.
      </p>
      <div style={styles.buttons}>
        <button style={{ ...styles.button, ...styles.loginBtn }} onClick={() => window.location.href = '/login'}>
          Login
        </button>
        <button style={{ ...styles.button, ...styles.signupBtn }} onClick={() => window.location.href = '/signup'}>
          Sign Up
        </button>
      </div>
    </div>
  );
}
