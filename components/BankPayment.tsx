"use client";

import React, { useState } from 'react';

interface BankPaymentProps {
  onSuccess: (data: PaymentData) => void;
  onBack: () => void;
}

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

const BankPayment: React.FC<BankPaymentProps> = ({ onSuccess, onBack }) => {
  const [senderName, setSenderName] = useState('');
  const [amountSent, setAmountSent] = useState('');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [depositSlipFile, setDepositSlipFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const bankDetails = {
    bankName: 'BDO Unibank',
    accountName: 'DeepVerse AI Inc.',
    accountNumber: '1234-5678-9012',
    cvcCode: 'BDO123'
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDepositSlipFile(e.target.files[0]);
    }
  };

  const handleSubmitProof = async () => {
    if (!senderName.trim() || !amountSent.trim() || !referenceNumber.trim() || !depositSlipFile) {
      alert('Please fill in all required fields and upload the deposit slip.');
      return;
    }

    if (parseFloat(amountSent) !== 299) {
      alert('Amount sent must be ₱299 for premium subscription.');
      return;
    }

    setIsProcessing(true);

    try {
      // Call payment API for bank transfer
      const response = await fetch('/api/payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: 299,
          paymentMethod: 'bank',
          userId: 'current-user-id', // Replace with actual user ID
          planType: 'premium',
          senderName: senderName.trim(),
          amountSent: parseFloat(amountSent),
          referenceNumber: referenceNumber.trim(),
          // Note: File upload would need to be handled separately, perhaps via FormData
        }),
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Payment proof submission failed');

      // For bank transfer, mark as pending verification
      alert('Payment proof submitted successfully! Your subscription will be activated after verification (usually within 24 hours).');

      onSuccess({ ...data, status: 'pending_verification' });

    } catch (error) {
      alert(`Submission failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
        >
          ← Back to Menu
        </button>
        <h3 className="font-semibold">Bank Transfer Payment</h3>
      </div>

      {/* Bank Details */}
      <div className="bg-gray-50 border rounded p-4 space-y-2">
        <h4 className="font-medium text-gray-800">Bank Transfer Details</h4>
        <div className="text-sm space-y-1">
          <p><span className="font-medium">Bank Name:</span> {bankDetails.bankName}</p>
          <p><span className="font-medium">Account Name:</span> {bankDetails.accountName}</p>
          <p><span className="font-medium">Account Number:</span> {bankDetails.accountNumber}</p>
          <p><span className="font-medium">CVC Code:</span> {bankDetails.cvcCode}</p>
        </div>
        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 mt-3">
          <p className="text-yellow-800 text-sm">
            <strong>Important:</strong> Please transfer exactly ₱299 to the account above.
            Include your full name in the transfer details for faster verification.
          </p>
        </div>
      </div>

      {/* Required Fields */}
      <div className="space-y-3">
        <div>
          <label className="block text-sm font-medium">Sender Name *</label>
          <input
            type="text"
            value={senderName}
            onChange={(e) => setSenderName(e.target.value)}
            placeholder="Full name as it appears on your bank account"
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Amount Sent (₱) *</label>
          <input
            type="number"
            value={amountSent}
            onChange={(e) => setAmountSent(e.target.value)}
            placeholder="299"
            min="299"
            max="299"
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Reference Number *</label>
          <input
            type="text"
            value={referenceNumber}
            onChange={(e) => setReferenceNumber(e.target.value)}
            placeholder="Transaction reference from your bank"
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Deposit Slip Upload *</label>
          <input
            type="file"
            accept="image/*,.pdf"
            onChange={handleFileChange}
            className="w-full p-2 border rounded"
            required
          />
          {depositSlipFile && (
            <p className="text-sm text-gray-600 mt-1">Selected: {depositSlipFile.name}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            Upload a photo or scan of your deposit slip/receipt
          </p>
        </div>
      </div>

      <button
        onClick={handleSubmitProof}
        disabled={isProcessing || !senderName.trim() || !amountSent || !referenceNumber.trim() || !depositSlipFile}
        className="w-full bg-blue-600 text-white py-3 rounded font-semibold disabled:bg-gray-300"
      >
        {isProcessing ? 'Submitting...' : 'Submit Payment Proof'}
      </button>

      <div className="bg-blue-50 border border-blue-200 rounded p-3">
        <p className="text-blue-800 text-sm">
          <strong>Note:</strong> After submission, your payment will be manually verified.
          This usually takes 24-48 hours. You'll receive an email notification once approved.
        </p>
      </div>
    </div>
  );
};

export default BankPayment;
