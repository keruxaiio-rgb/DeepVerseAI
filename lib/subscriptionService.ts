import { db } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import type { User, Subscription } from '../types/api';

// Subscription status checking service
export class SubscriptionService {
  // Check user's subscription status
  static async getUserSubscription(userId: string): Promise<User | null> {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() } as User;
      }
      return null;
    } catch (error) {
      console.error('Error fetching user subscription:', error);
      return null;
    }
  }

  // Check if user has active subscription
  static async hasActiveSubscription(userId: string): Promise<boolean> {
    try {
      const user = await this.getUserSubscription(userId);
      if (!user) return false;

      // Check if subscription is active and not expired
      if (user.subscriptionStatus === 'active') {
        if (user.subscriptionEndDate) {
          const now = new Date();
          const endDate = new Date(user.subscriptionEndDate);
          return endDate > now;
        }
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking subscription status:', error);
      return false;
    }
  }

  // Update user subscription status
  static async updateSubscriptionStatus(
    userId: string,
    status: User['subscriptionStatus'],
    additionalData?: Partial<User>
  ): Promise<boolean> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        subscriptionStatus: status,
        ...additionalData,
        lastLogin: new Date(),
      });
      return true;
    } catch (error) {
      console.error('Error updating subscription status:', error);
      return false;
    }
  }

  // Get user's subscription details
  static async getUserSubscriptionDetails(userId: string): Promise<Subscription | null> {
    try {
      const q = query(
        collection(db, 'subscriptions'),
        where('userId', '==', userId),
        where('status', '==', 'active')
      );

      const querySnapshot = await getDocs(q);
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0];
        return { id: doc.id, ...doc.data() } as Subscription;
      }
      return null;
    } catch (error) {
      console.error('Error fetching subscription details:', error);
      return null;
    }
  }

  // Check referral limit
  static async canAddReferral(userId: string): Promise<boolean> {
    try {
      const user = await this.getUserSubscription(userId);
      if (!user) return false;

      return user.activeReferrals < user.referralLimit;
    } catch (error) {
      console.error('Error checking referral limit:', error);
      return false;
    }
  }

  // Add referral and update bonus
  static async addReferral(referrerId: string, refereeId: string): Promise<boolean> {
    try {
      // Check if referrer can add more referrals
      if (!(await this.canAddReferral(referrerId))) {
        return false;
      }

      const userRef = doc(db, 'users', referrerId);
      const user = await this.getUserSubscription(referrerId);

      if (!user) return false;

      // Update active referrals count
      await updateDoc(userRef, {
        activeReferrals: user.activeReferrals + 1,
      });

      // Calculate bonus (10% of monthly subscription = ₱29.90)
      const bonusAmount = 29.90;
      const currentBonus = user.referralBonus || 0;

      await updateDoc(userRef, {
        referralBonus: currentBonus + bonusAmount,
      });

      return true;
    } catch (error) {
      console.error('Error adding referral:', error);
      return false;
    }
  }

  // Check if user can access premium feature
  static async canAccessPremium(userId: string): Promise<boolean> {
    // Special handling for admin/creator email
    if (userId === 'kerux.ai.io@gmail.com') {
      return true; // Admin has unlimited access
    }

    const hasActiveSub = await this.hasActiveSubscription(userId);
    const user = await this.getUserSubscription(userId);

    // Allow access if user has active subscription OR is admin
    return hasActiveSub || (user?.role === 'admin');
  }

  // Get access level for user
  static async getAccessLevel(userId: string): Promise<'free' | 'pending' | 'premium' | 'admin'> {
    try {
      // Special handling for admin/creator email
      if (userId === 'kerux.ai.io@gmail.com') {
        return 'admin'; // Creator always has admin access
      }

      const user = await this.getUserSubscription(userId);
      if (!user) return 'free';

      if (user.role === 'admin') return 'admin';
      if (user.subscriptionStatus === 'pending') return 'pending';
      if (user.subscriptionStatus === 'active') return 'premium';
      if (user.subscriptionStatus === 'trial') return 'premium'; // Trial users get premium access

      return 'free';
    } catch (error) {
      console.error('Error getting access level:', error);
      return 'free';
    }
  }

  // Check subscription expiration and send notifications
  static async checkExpirationAndNotify(userId: string): Promise<{
    isExpiringSoon: boolean;
    daysUntilExpiry: number;
    shouldNotify: boolean;
  }> {
    try {
      const user = await this.getUserSubscription(userId);
      if (!user || !user.subscriptionEndDate) {
        return { isExpiringSoon: false, daysUntilExpiry: 0, shouldNotify: false };
      }

      const now = new Date();
      const endDate = new Date(user.subscriptionEndDate);
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      const isExpiringSoon = daysUntilExpiry <= 7 && daysUntilExpiry > 0;
      const shouldNotify = isExpiringSoon; // Add more complex logic here

      return { isExpiringSoon, daysUntilExpiry, shouldNotify };
    } catch (error) {
      console.error('Error checking expiration:', error);
      return { isExpiringSoon: false, daysUntilExpiry: 0, shouldNotify: false };
    }
  }
}

// Access control middleware functions
export const AccessControl = {
  // Check access for premium features
  async requirePremium(userId: string): Promise<{ allowed: boolean; message?: string }> {
    const canAccess = await SubscriptionService.canAccessPremium(userId);

    if (canAccess) {
      return { allowed: true };
    }

    const user = await SubscriptionService.getUserSubscription(userId);
    if (user?.subscriptionStatus === 'pending') {
      return {
        allowed: false,
        message: 'Your payment is being processed. You will have access once payment is confirmed.'
      };
    }

    return {
      allowed: false,
      message: 'Premium subscription required. Please upgrade to access this feature.'
    };
  },

  // Check access for AI interactions
  async requireAI(userId: string): Promise<{ allowed: boolean; message?: string }> {
    const accessLevel = await SubscriptionService.getAccessLevel(userId);

    switch (accessLevel) {
      case 'admin':
      case 'premium':
        return { allowed: true };

      case 'pending':
        return {
          allowed: false,
          message: 'Your payment is being processed. AI access will be available once confirmed.'
        };

      case 'free':
      default:
        return {
          allowed: false,
          message: 'AI access requires a premium subscription. Please upgrade to continue.'
        };
    }
  },

  // Redirect based on access level
  getRedirectPath(userId: string): Promise<string> {
    return SubscriptionService.getAccessLevel(userId).then(level => {
      switch (level) {
        case 'admin':
        case 'premium':
          return '/chat';
        case 'pending':
          return '/upgrade?status=pending';
        case 'free':
        default:
          return '/upgrade';
      }
    });
  }
};
