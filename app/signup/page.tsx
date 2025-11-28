"use client";

import React, { useState, useEffect } from "react";
import { auth, db } from "../../firebase";
import { createUserWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, OAuthProvider } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import type { User } from "../../types/api";

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    height: "100vh",
    background: "#F7F7FA",
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial',
  },
  form: {
    background: "white",
    padding: 40,
    borderRadius: 12,
    boxShadow: "0 8px 24px rgba(0,0,0,0.1)",
    width: 400,
    textAlign: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: 700,
    color: "#333",
    marginBottom: 20,
  },
  input: {
    width: "100%",
    padding: 12,
    marginBottom: 15,
    border: "1px solid #ddd",
    borderRadius: 8,
    fontSize: 16,
  },
  button: {
    width: "100%",
    padding: 12,
    border: "none",
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    marginBottom: 10,
  },
  primaryBtn: {
    background: "#34C759",
    color: "white",
  },
  googleBtn: {
    background: "#DB4437",
    color: "white",
  },
  appleBtn: {
    background: "#000",
    color: "white",
  },
  link: {
    color: "#007AFF",
    cursor: "pointer",
    textDecoration: "underline",
  },
};

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");

  // Get referral key from URL parameters
  const referralKey = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('ref') : null;

  const handleEmailSignup = async () => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      // Save user to Firestore
      const userDoc: User = {
        id: user.uid,
        email,
        role: email === 'kerux.ai.io@gmail.com' ? 'admin' :
              email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? 'admin' :
              email === process.env.NEXT_PUBLIC_DEMO_EMAIL ? 'demo' : 'free',
        subscriptionStatus: email === 'kerux.ai.io@gmail.com' ? 'active' : 'none',
        referralLimit: email === 'kerux.ai.io@gmail.com' ? 999999 : 50, // Unlimited for creator
        activeReferrals: 0,
        fullName,
        lastLogin: new Date(),
      };
      await setDoc(doc(db, "users", user.uid), userDoc);
      window.location.href = '/chat';
    } catch (error) {
      console.error("Signup error:", error);
      alert("Signup failed");
    }
  };

  const handleGoogleSignup = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // Save user to Firestore
      const userDoc: User = {
        id: user.uid,
        email: user.email || "",
        role: user.email === 'kerux.ai.io@gmail.com' ? 'admin' :
              user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? 'admin' :
              user.email === process.env.NEXT_PUBLIC_DEMO_EMAIL ? 'demo' : 'free',
        subscriptionStatus: user.email === 'kerux.ai.io@gmail.com' ? 'active' : 'none',
        referralLimit: user.email === 'kerux.ai.io@gmail.com' ? 999999 : 50, // Unlimited for creator
        activeReferrals: 0,
        fullName: user.displayName || "",
        lastLogin: new Date(),
      };
      await setDoc(doc(db, "users", user.uid), userDoc);
      window.location.href = '/chat';
    } catch (error) {
      console.error("Google signup error:", error);
      alert("Google signup failed");
    }
  };

  const handleAppleSignup = async () => {
    const provider = new OAuthProvider('apple.com');
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      // Save user to Firestore
      const userDoc: User = {
        id: user.uid,
        email: user.email || "",
        role: user.email === 'kerux.ai.io@gmail.com' ? 'admin' :
              user.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL ? 'admin' :
              user.email === process.env.NEXT_PUBLIC_DEMO_EMAIL ? 'demo' : 'free',
        subscriptionStatus: user.email === 'kerux.ai.io@gmail.com' ? 'active' : 'none',
        referralLimit: user.email === 'kerux.ai.io@gmail.com' ? 999999 : 50, // Unlimited for creator
        activeReferrals: 0,
        fullName: user.displayName || "",
        lastLogin: new Date(),
      };
      await setDoc(doc(db, "users", user.uid), userDoc);
      window.location.href = '/chat';
    } catch (error) {
      console.error("Apple signup error:", error);
      alert("Apple signup failed");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.form}>
        <h2 style={styles.title}>Sign Up for DeepVerse AI</h2>
        <input
          type="text"
          placeholder="Full Name"
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          style={styles.input}
        />
        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          style={styles.input}
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={styles.input}
        />
        <button style={{ ...styles.button, ...styles.primaryBtn }} onClick={handleEmailSignup}>
          Sign Up
        </button>
        <button style={{ ...styles.button, ...styles.googleBtn }} onClick={handleGoogleSignup}>
          Sign Up with Google
        </button>
        <button style={{ ...styles.button, ...styles.appleBtn }} onClick={handleAppleSignup}>
          Sign Up with Apple
        </button>
        <p>
          Already have an account? <span style={styles.link} onClick={() => window.location.href = '/login'}>Login</span>
        </p>
      </div>
    </div>
  );
}
