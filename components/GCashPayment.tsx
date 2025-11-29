"use client";

import React, { useState } from 'react';

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
  paymentUrl?: string;
  sourceId?: string;
}

interface GCashPaymentProps {
  onSuccess: (data: PaymentData) => void;
  onBack: () => void;
  amount?: number;
  userId?: string;
  planType?: string;
}

const GCashPayment: React.FC<GCashPaymentProps> = ({
  onSuccess,
  onBack,
  amount = 299,
  userId = 'current-user-id',
  planType = 'premium'
}) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribeNow = async () => {
    setIsProcessing(true);

    try {
      // Call the new GCash source creation API
      const response = await fetch('/api/create-gcash-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          userId,
          planType,
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to create payment source');

      if (data.checkout_url) {
        // Immediately redirect to PayMongo GCash checkout page
        console.log('Redirecting to GCash checkout:', data.checkout_url);
        window.location.href = data.checkout_url;
      } else {
        throw new Error('No checkout URL received');
      }

    } catch (error) {
      alert(`Payment failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
        >
          ← Back to Menu
        </button>
        <h3 className="font-semibold text-lg">Subscribe to Premium</h3>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border border-blue-200">
        <div className="text-center space-y-4">
          <div className="text-3xl font-bold text-gray-800">₱{amount}</div>
          <div className="text-sm text-gray-600">Monthly Premium Subscription</div>
          <div className="text-xs text-gray-500">Auto-renews monthly</div>
        </div>
      </div>

      <div className="space-y-3 text-sm text-gray-600">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Unlimited AI conversations</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Advanced AI models</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span>Priority support</span>
        </div>
      </div>

      <button
        onClick={handleSubscribeNow}
        disabled={isProcessing}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {isProcessing ? 'Creating Payment...' : 'Subscribe Now with GCash'}
      </button>

      <div className="text-xs text-center text-gray-500">
        You will be redirected to GCash to complete your payment securely.
        <br />
        No verification codes or additional steps required.
      </div>
    </div>
  );
};

export default GCashPayment;
