"use client";

import React, { useState, useEffect } from 'react';

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
  invoice_number?: string;
  qr_code?: string;
  payment_intent_id?: string;
  fallback?: boolean;
}

interface QRPaymentProps {
  onSuccess: (data: PaymentData) => void;
  onBack: () => void;
  amount?: number;
  userId?: string;
  planType?: string;
}

const QRPayment: React.FC<QRPaymentProps> = ({
  onSuccess,
  onBack,
  amount = 299,
  userId = 'current-user-id',
  planType = 'premium'
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [invoiceNumber, setInvoiceNumber] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(false);

  // PayMongo QR code provided by user
  const QR_CODE = 'code_pRQ6tBUFwMxHnGct8GbTuW2c';

  const generateInvoiceAndShowQR = async () => {
    setIsProcessing(true);

    try {
      // Generate invoice number first
      const response = await fetch('/api/create-gcash-source', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          userId,
          planType,
          paymentType: 'qr_static', // Indicate static QR usage
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Failed to generate invoice');

      setInvoiceNumber(data.invoice_number);
      setShowInstructions(true);

      console.log('Invoice generated for QR payment:', data.invoice_number);

    } catch (error) {
      alert(`Failed to generate invoice: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setIsProcessing(false);
    } finally {
      setIsProcessing(false);
    }
  };

  const openPaymentPage = () => {
    // Open PayMongo's QR payment page
    window.open(`https://pm.link/qrph/${QR_CODE}`, '_blank');
  };

  // Auto-check payment status every 30 seconds if invoice was generated
  useEffect(() => {
    if (!invoiceNumber) return;

    const checkInterval = setInterval(async () => {
      try {
        // Check if payment was completed by looking for subscription with this invoice
        const checkResponse = await fetch(`/api/payment/check-invoice?invoice=${invoiceNumber}`);
        const checkData = await checkResponse.json();

        if (checkData.subscription_activated) {
          onSuccess({
            success: true,
            paymentId: `qr_${QR_CODE}`,
            amount: amount,
            status: 'completed',
            invoice_number: invoiceNumber
          });
          clearInterval(checkInterval);
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(checkInterval);
  }, [invoiceNumber, onSuccess, amount]);

  return (
    <div className="p-6 space-y-6 max-w-md mx-auto">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
        >
          ← Back to Menu
        </button>
        <h3 className="font-semibold text-lg">QR Code Payment</h3>
      </div>

      <div className="bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg border border-green-200">
        <div className="text-center space-y-4">
          <div className="text-3xl font-bold text-gray-800">₱{amount}</div>
          <div className="text-sm text-gray-600">Monthly Premium Subscription</div>
          <div className="text-xs text-gray-500">Auto-renews monthly</div>
        </div>
      </div>

      {!invoiceNumber ? (
        <div className="space-y-4">
          <div className="text-center text-sm text-gray-600">
            Generate your invoice and access the QR payment page to complete your subscription.
          </div>

          <button
            onClick={generateInvoiceAndShowQR}
            disabled={isProcessing}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-lg font-semibold text-lg disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {isProcessing ? 'Generating Invoice...' : 'Generate Invoice & Pay'}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded p-4 text-center">
            <div className="text-sm text-blue-800 font-semibold mb-2">Your Invoice Number:</div>
            <div className="text-lg font-bold text-blue-900">{invoiceNumber}</div>
            <div className="text-xs text-blue-600 mt-1">Save this number for your records</div>
          </div>

          {showInstructions && (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded p-4">
                <h4 className="font-semibold text-yellow-800 mb-2">📱 Payment Instructions:</h4>
                <ol className="text-sm text-yellow-700 space-y-1 list-decimal list-inside">
                  <li>Click "Open QR Payment Page" below</li>
                  <li>Scan the QR code with your banking app</li>
                  <li>Pay exactly ₱299 for monthly subscription</li>
                  <li>Your subscription will activate automatically</li>
                </ol>
              </div>

              <button
                onClick={openPaymentPage}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-lg font-semibold text-lg transition-colors"
              >
                🔗 Open QR Payment Page
              </button>

              <div className="text-center text-sm text-gray-600">
                <div className="font-semibold mb-2">Supported Banking Apps:</div>
                <div className="flex flex-wrap justify-center gap-2 text-xs">
                  <span className="bg-gray-100 px-2 py-1 rounded">BPI</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">UnionBank</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">Maya</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">BDO</span>
                  <span className="bg-gray-100 px-2 py-1 rounded">and more</span>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded p-3 text-center">
                <div className="text-sm text-green-800">
                  ⚡ <strong>Automatic Activation:</strong> Your subscription will be activated immediately after payment confirmation.
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QRPayment;
