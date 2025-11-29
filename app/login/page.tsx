"use client";

import React, { useState } from "react";
import { auth, db } from "../../firebase";
import { signInWithEmailAndPassword, signInWithPopup, signInWithRedirect, getRedirectResult, GoogleAuthProvider, OAuthProvider, GithubAuthProvider } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
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
    background: "#007AFF",
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
  githubBtn: {
    background: "#24292e",
    color: "white",
  },
  link: {
    color: "#007AFF",
    cursor: "pointer",
    textDecoration: "underline",
  },
};

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleEmailLogin = async () => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Check if user document exists in Firestore
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // User document doesn't exist - this shouldn't happen for valid logins
        alert("Account data not found. Please contact support.");
        return;
      }

      // User authenticated successfully - redirect to subscription landing page
      // The landing page will check subscription status and redirect appropriately
      window.location.href = '/subscription-landing';
    } catch (error: unknown) {
      console.error("Login error:", error);
      let errorMessage = "Login failed";
      if (error && typeof error === 'object' && 'code' in error) {
        const authError = error as { code: string };
        if (authError.code === 'auth/user-not-found') {
          errorMessage = "No account found with this email. Please sign up first.";
        } else if (authError.code === 'auth/wrong-password') {
          errorMessage = "Incorrect password. Please try again.";
        } else if (authError.code === 'auth/invalid-email') {
          errorMessage = "Please enter a valid email address.";
        } else if (authError.code === 'auth/user-disabled') {
          errorMessage = "This account has been disabled.";
        } else if (authError.code === 'auth/too-many-requests') {
          errorMessage = "Too many failed login attempts. Please try again later.";
        }
      }
      alert(errorMessage);
    }
  };

  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document already exists
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Create new user document with trial
        const userDoc: User = {
          id: user.uid,
          email: user.email || "",
          role: 'user', // New OAuth users start as regular users
          subscriptionStatus: 'trial',
          referralLimit: 50,
          activeReferrals: 0,
          fullName: user.displayName || "",
          trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days trial
          lastLogin: new Date(),
        };
        await setDoc(userDocRef, userDoc);
      }

      window.location.href = '/subscription-landing';
    } catch (error) {
      console.error("Google login error:", error);
      alert("Google login failed");
    }
  };

  const handleAppleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, new OAuthProvider('apple.com'));
      const user = result.user;

      // Check if user document already exists
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Create new user document with trial
        const userDoc: User = {
          id: user.uid,
          email: user.email || "",
          role: 'user', // New OAuth users start as regular users
          subscriptionStatus: 'trial',
          referralLimit: 50,
          activeReferrals: 0,
          fullName: user.displayName || "",
          trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days trial
          lastLogin: new Date(),
        };
        await setDoc(userDocRef, userDoc);
      }

      window.location.href = '/subscription-landing';
    } catch (error: unknown) {
      console.error("Apple login error:", error);
      let errorMessage = "Apple login failed";
      if (error && typeof error === 'object' && 'message' in error) {
        errorMessage = `Apple login failed: ${String(error.message)}`;
      }
      alert(errorMessage);
    }
  };

  const handleGitHubLogin = async () => {
    const provider = new GithubAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Check if user document already exists
      const userDocRef = doc(db, "users", user.uid);
      const userDocSnap = await getDoc(userDocRef);

      if (!userDocSnap.exists()) {
        // Create new user document with trial
        const userDoc: User = {
          id: user.uid,
          email: user.email || "",
          role: 'user', // New OAuth users start as regular users
          subscriptionStatus: 'trial',
          referralLimit: 50,
          activeReferrals: 0,
          fullName: user.displayName || "",
          trialEndsAt: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days trial
          lastLogin: new Date(),
        };
        await setDoc(userDocRef, userDoc);
      }

      window.location.href = '/subscription-landing';
    } catch (error) {
      console.error("GitHub login error:", error);
      alert("GitHub login failed");
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.form}>
        <h2 style={styles.title}>Login to DeepVerse AI</h2>
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
        <button style={{ ...styles.button, ...styles.primaryBtn }} onClick={handleEmailLogin}>
          Login
        </button>
        <button style={{ ...styles.button, ...styles.googleBtn }} onClick={handleGoogleLogin}>
          Login with Google
        </button>
        <button style={{ ...styles.button, ...styles.appleBtn }} onClick={handleAppleLogin}>
          Login with Apple
        </button>
        <button style={{ ...styles.button, ...styles.githubBtn }} onClick={handleGitHubLogin}>
          Login with GitHub
        </button>



        <p>
          Do not have an account? <span style={styles.link} onClick={() => window.location.href = '/signup'}>Sign Up</span>
        </p>
      </div>
    </div>
  );
}
