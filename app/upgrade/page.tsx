"use client";

import React, { useState, useEffect } from "react";
import GCashPayment from "../../components/GCashPayment";
import QRPayment from "../../components/QRPayment";

const UpgradePage = () => {
  const [showPayment, setShowPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'gcash' | 'qr' | null>(null);

  // Check for autoOpen parameter and show payment
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autoOpen') === 'true') {
      setShowPayment(true);
      // Clean up URL
      const newUrl = window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }
  }, []);

  const handleBack = () => {
    if (paymentMethod) {
      setPaymentMethod(null);
    } else {
      setShowPayment(false);
    }
  };

  const handleSuccess = (data: unknown) => {
    // Payment was successful, redirect or update UI
    console.log('Payment success:', data);
    alert('Payment successful! Your subscription has been activated.');
    window.location.href = '/chat';
  };

  const selectPaymentMethod = (method: 'gcash' | 'qr') => {
    setPaymentMethod(method);
  };

  const renderPaymentComponent = () => {
    if (!paymentMethod) {
      return (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-center mb-6">Choose Payment Method</h3>

          <button
            onClick={() => selectPaymentMethod('qr')}
            className="w-full p-4 border border-green-200 rounded-lg hover:bg-green-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <span className="text-green-600 text-xl">📱</span>
              </div>
              <div>
                <div className="font-semibold text-gray-800">QR Code Payment</div>
                <div className="text-sm text-gray-600">Scan with any banking app</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => selectPaymentMethod('gcash')}
            className="w-full p-4 border border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-left"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-blue-600 text-xl">💳</span>
              </div>
              <div>
                <div className="font-semibold text-gray-800">GCash Direct</div>
                <div className="text-sm text-gray-600">One-click GCash payment</div>
              </div>
            </div>
          </button>
        </div>
      );
    }

    if (paymentMethod === 'qr') {
      return (
        <QRPayment
          onSuccess={handleSuccess}
          onBack={handleBack}
          amount={299}
          userId="current-user-id" // In production, get from auth context
          planType="premium"
        />
      );
    }

    if (paymentMethod === 'gcash') {
      return (
        <GCashPayment
          onSuccess={handleSuccess}
          onBack={handleBack}
          amount={299}
          userId="current-user-id" // In production, get from auth context
          planType="premium"
        />
      );
    }

    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {showPayment ? (
          <div className="bg-white rounded-lg shadow-lg">
            {renderPaymentComponent()}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">Upgrade to Premium</h1>
            <p className="text-gray-600 mb-6">
              Get unlimited access to DeepVerse AI with premium features.
            </p>
            <button
              onClick={() => setShowPayment(true)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-semibold transition-colors"
            >
              Subscribe Now - ₱299/month
            </button>
            <p className="text-sm text-gray-500 mt-4">
              Secure payment powered by PayMongo
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default UpgradePage;
