"use client";

import React, { useState, useEffect } from 'react';
import { useSidebar } from '../lib/sidebarContext';
import { SubscriptionService } from '../lib/subscriptionService';
import GCashPayment from './GCashPayment';
import BankPayment from './BankPayment';

interface PaymentData {
  success: boolean;
  paymentId?: string;
  amount?: number;
  currency?: string;
  paymentMethod?: string;
  status?: string;
  userId?: string;
  planType?: string;
  transactionId?: string;
}

const Sidebar: React.FC = () => {
  const { sidebarMode, setSidebarMode, paymentOption, setPaymentOption } = useSidebar();
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Check subscription status on mount
  useEffect(() => {
    const checkSubscription = async () => {
      try {
        // For now, using a placeholder user ID. In production, get from auth context
        const userId = 'current-user-id';
        const hasSubscription = await SubscriptionService.hasActiveSubscription(userId);
        setIsSubscribed(hasSubscription);
      } catch (error) {
        console.error('Error checking subscription:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkSubscription();
  }, []);

  const handleUpgradeClick = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSidebarMode('payment');
      setPaymentOption(null);
      setIsTransitioning(false);
    }, 300);
  };

  const handleBackToMenu = () => {
    setIsTransitioning(true);
    setTimeout(() => {
      setSidebarMode('nav');
      setPaymentOption(null);
      setIsTransitioning(false);
    }, 300);
  };

  const handlePaymentSuccess = async (data: PaymentData) => {
    try {
      // Update subscription status in Firebase
      const userId = 'current-user-id'; // Replace with actual user ID
      await SubscriptionService.updateSubscriptionStatus(
        userId,
        data.status === 'pending_verification' ? 'pending' : 'active',
        {
          subscriptionId: data.transactionId,
          subscriptionStartDate: new Date(),
          subscriptionEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        }
      );

      // Send notification email via Resend
      await fetch('/api/payment/notify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          paymentData: data,
          type: data.paymentMethod === 'bank' ? 'bank_pending' : 'payment_success'
        }),
      });

      // Update local state
      setIsSubscribed(data.status !== 'pending_verification');
      handleBackToMenu();

      if (data.status === 'pending_verification') {
        alert('Payment submitted! You will be notified once verified.');
      } else {
        alert('Payment successful! Welcome to premium!');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      alert('Payment succeeded but there was an error updating your account. Please contact support.');
    }
  };

  const renderNavigation = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-4 border-b">
        <img
          src="/deepverse.logo.png"
          alt="DeepVerse AI"
          className="h-8 w-auto"
        />
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2">
        <a
          href="/chat"
          className="block px-3 py-2 rounded hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors"
        >
          💬 Chat
        </a>
        <a
          href="/upgrade"
          className="block px-3 py-2 rounded hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors"
        >
          📚 Sermons
        </a>
        <a
          href="/upgrade"
          className="block px-3 py-2 rounded hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors"
        >
          📖 Study Tools
        </a>
        <a
          href="/upgrade"
          className="block px-3 py-2 rounded hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors"
        >
          🎵 Hymn Library
        </a>
        <a
          href="/upgrade"
          className="block px-3 py-2 rounded hover:bg-gray-100 text-gray-700 hover:text-gray-900 transition-colors"
        >
          📝 Notes
        </a>
      </nav>

      {/* Upgrade Section */}
      <div className="p-4 border-t">
        {isLoading ? (
          <div className="text-center text-gray-500">Loading...</div>
        ) : isSubscribed ? (
          <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
            <div className="text-green-800 font-medium">✓ Subscribed</div>
            <div className="text-green-600 text-sm">Premium Access Active</div>
          </div>
        ) : (
          <button
            onClick={handleUpgradeClick}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded font-semibold hover:bg-blue-700 transition-colors"
          >
            🚀 Upgrade to Premium
          </button>
        )}
      </div>
    </div>
  );

  const renderPaymentSelector = () => (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={handleBackToMenu}
          className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
        >
          ← Back to Menu
        </button>
        <h3 className="font-semibold">Choose Payment Method</h3>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => setPaymentOption('gcash')}
          className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-blue-500 transition-colors text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              💳
            </div>
            <div>
              <div className="font-medium">GCash</div>
              <div className="text-sm text-gray-600">Instant payment with verification</div>
            </div>
          </div>
        </button>

        <button
          onClick={() => setPaymentOption('bank')}
          className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 transition-colors text-left"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              🏦
            </div>
            <div>
              <div className="font-medium">Bank Transfer</div>
              <div className="text-sm text-gray-600">Manual verification (24-48 hours)</div>
            </div>
          </div>
        </button>
      </div>

      <div className="bg-gray-50 border rounded p-4">
        <h4 className="font-medium mb-2">Premium Benefits</h4>
        <ul className="text-sm text-gray-600 space-y-1">
          <li>✓ Unlimited AI chat interactions</li>
          <li>✓ Full sermon library access</li>
          <li>✓ Advanced study tools</li>
          <li>✓ Hymn library with audio</li>
          <li>✓ Personal notes and bookmarks</li>
        </ul>
        <div className="mt-3 pt-3 border-t">
          <div className="text-lg font-bold text-gray-800">₱299/month</div>
          <div className="text-sm text-gray-600">₱3,588/year (Save 20%)</div>
        </div>
      </div>
    </div>
  );

  const renderPaymentComponent = () => {
    if (paymentOption === 'gcash') {
      return <GCashPayment onSuccess={handlePaymentSuccess} onBack={() => setPaymentOption(null)} />;
    }
    if (paymentOption === 'bank') {
      return <BankPayment onSuccess={handlePaymentSuccess} onBack={() => setPaymentOption(null)} />;
    }
    return renderPaymentSelector();
  };

  return (
    <div className={`w-80 bg-white border-r border-gray-200 h-screen overflow-y-auto transition-all duration-300 ${
      isTransitioning ? 'opacity-50 transform scale-95' : 'opacity-100 transform scale-100'
    }`}>
      {sidebarMode === 'nav' ? renderNavigation() : renderPaymentComponent()}
    </div>
  );
};

export default Sidebar;
