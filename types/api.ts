export type Role = "user" | "ai";

export type Message = {
  id: string;
  role: Role;
  text: string;
  timestamp?: number;
};

export type ApiPayload = {
  mode: "ask" | "sermon" | "pptx";
  message?: string;
  context?: string[]; // optional flattened context lines
  messages?: Message[]; // full conversation history if available
};

export type ApiResponse = {
  text?: string;
  suggestedPrompt?: string;
  pptxReady?: boolean;
  // if server returns binary pptx, UI will treat it separately (binary handled as ArrayBuffer)
  binary?: ArrayBuffer;
};

export type User = {
  id: string;
  email: string;
  role: 'free' | 'pending_subscriber' | 'subscriber' | 'admin' | 'demo';
  subscriptionStatus: 'none' | 'pending' | 'active' | 'expired' | 'cancelled';
  subscriptionId?: string;
  referralLimit: number; // Maximum active referrals allowed
  activeReferrals: number; // Current active referrals
  fullName: string;
  mobileNumber?: string;
  subscriptionStartDate?: Date;
  subscriptionEndDate?: Date;
  lastLogin?: Date;
  referralBonus?: number;
};

export type Subscription = {
  id: string;
  userId: string;
  tier: 'basic' | 'premium';
  status: 'active' | 'expired' | 'cancelled';
  paymentMethod: 'gcash' | 'bank';
  accountNumber: string;
  fullName: string;
  email: string;
  mobileNumber: string;
  paymentVerification?: string;
  authorizationConfirmed: boolean;
  startDate: Date;
  endDate: Date;
  autoRenew: boolean;
  interval: 'monthly' | 'yearly';
};
