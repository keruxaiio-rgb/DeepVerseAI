"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User as FirebaseUser, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import type { User } from '../types/api';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userData: User | null;
  userRole: 'user' | 'admin' | 'demo';
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'unsubscribed' | 'pending';
  loading: boolean;
  isAuthenticated: boolean;
  trialDaysLeft: number;
  checkTrialExpiration: () => Promise<boolean>;
  canAccessPremium: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userData, setUserData] = useState<User | null>(null);
  const [userRole, setUserRole] = useState<'user' | 'admin' | 'demo'>('user');
  const [subscriptionStatus, setSubscriptionStatus] = useState<'trial' | 'active' | 'expired' | 'unsubscribed' | 'pending'>('trial');
  const [loading, setLoading] = useState(true);
  const [trialDaysLeft, setTrialDaysLeft] = useState(0);

  // Check if user is admin based on environment variable
  const isAdminEmail = (email: string | null): boolean => {
    const adminEmail = process.env.NEXT_PUBLIC_ADMIN_EMAIL;
    return adminEmail ? email === adminEmail : false;
  };

  // Check if user is demo based on environment variable
  const isDemoEmail = (email: string | null): boolean => {
    const demoEmail = process.env.NEXT_PUBLIC_DEMO_EMAIL;
    return demoEmail ? email === demoEmail : false;
  };

  // Calculate trial days left
  const calculateTrialDaysLeft = (trialEndsAt: Date): number => {
    const now = new Date();
    const diffTime = trialEndsAt.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  };

  // Check if trial has expired and update status
  const checkTrialExpiration = async (): Promise<boolean> => {
    if (!userData || !currentUser) return false;

    if (userData.subscriptionStatus === 'trial' && userData.trialEndsAt) {
      const now = new Date();
      if (now >= userData.trialEndsAt) {
        // Trial expired - update status
        try {
          const { doc, updateDoc } = await import('firebase/firestore');
          const userDocRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userDocRef, {
            subscriptionStatus: 'expired',
            lastLogin: new Date(),
          });
          setSubscriptionStatus('expired');
          setTrialDaysLeft(0);
          return true; // Trial expired
        } catch (error) {
          console.error('Error updating expired trial:', error);
        }
      }
    }
    return false; // Trial still active
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);

      if (user) {
        try {
          // Get user data from Firestore
          const userDocRef = doc(db, 'users', user.uid);
          const userDocSnap = await getDoc(userDocRef);

          if (userDocSnap.exists()) {
            const data = userDocSnap.data() as User;
            setUserData(data);

            // Determine role based on environment variables first
            let role: 'user' | 'admin' | 'demo' = 'user';
            let status: 'trial' | 'active' | 'expired' | 'unsubscribed' | 'pending' = 'trial';

            if (isAdminEmail(user.email)) {
              role = 'admin';
              status = 'active'; // Admin always has active subscription
            } else if (isDemoEmail(user.email)) {
              role = 'demo';
              status = 'active'; // Demo always has active subscription
            } else {
              role = data.role || 'user';
              status = data.subscriptionStatus || 'trial';

              // Check trial expiration
              if (status === 'trial' && data.trialEndsAt) {
                const daysLeft = calculateTrialDaysLeft(data.trialEndsAt);
                setTrialDaysLeft(daysLeft);

                if (daysLeft <= 0) {
                  // Trial expired
                  status = 'expired';
                  // Update in database
                  try {
                    const { updateDoc } = await import('firebase/firestore');
                    await updateDoc(userDocRef, {
                      subscriptionStatus: 'expired',
                      lastLogin: new Date(),
                    });
                  } catch (error) {
                    console.error('Error updating expired trial:', error);
                  }
                }
              }
            }

            setUserRole(role);
            setSubscriptionStatus(status);
          } else {
            // User document doesn't exist - should not happen for authenticated users
            console.error('User document missing for authenticated user');
            setUserData(null);
            setUserRole('user');
            setSubscriptionStatus('trial');
            setTrialDaysLeft(3);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          setUserData(null);
          setUserRole('user');
          setSubscriptionStatus('trial');
          setTrialDaysLeft(3);
        }
      } else {
        setUserData(null);
        setUserRole('user');
        setSubscriptionStatus('trial');
        setTrialDaysLeft(0);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Determine if user can access premium features
  const canAccessPremium = userRole === 'admin' ||
                          userRole === 'demo' ||
                          subscriptionStatus === 'active' ||
                          subscriptionStatus === 'trial';

  const value: AuthContextType = {
    currentUser,
    userData,
    userRole,
    subscriptionStatus,
    loading,
    isAuthenticated: !!currentUser,
    trialDaysLeft,
    checkTrialExpiration,
    canAccessPremium,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
