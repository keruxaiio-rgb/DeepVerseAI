import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '../../../firebase';
import { doc, setDoc, updateDoc, increment, collection, addDoc, getDoc } from 'firebase/firestore';
import type { Withdrawal } from '../../../types/api';

export async function POST(request: NextRequest) {
  try {
    // For client-side API calls, we'll use a simpler approach
    // In production, you'd want to verify the Firebase ID token properly
    const { userId, amount, method, accountDetails } = await request.json();

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Validate input
    if (!amount || amount < 50) {
      return NextResponse.json({ error: 'Minimum withdrawal amount is ₱50' }, { status: 400 });
    }

    if (!method || !['gcash', 'bank'].includes(method)) {
      return NextResponse.json({ error: 'Invalid withdrawal method' }, { status: 400 });
    }

    if (!accountDetails) {
      return NextResponse.json({ error: 'Account details are required' }, { status: 400 });
    }

    // Get user data to check balance
    const userDocRef = doc(db, 'users', userId);
    const userDoc = await import('firebase/firestore').then(({ getDoc }) => getDoc(userDocRef));

    if (!userDoc.exists()) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = userDoc.data();
    const availableBalance = userData.referralBonus || 0;

    if (availableBalance < amount) {
      return NextResponse.json({ error: 'Insufficient balance' }, { status: 400 });
    }

    // Create withdrawal request
    const withdrawalData: Omit<Withdrawal, 'id'> = {
      userId,
      amount,
      method,
      accountDetails,
      requestedAt: new Date(),
      status: 'pending',
    };

    // Add to withdrawals collection
    const withdrawalRef = await addDoc(collection(db, 'withdrawals'), withdrawalData);

    // Deduct from user balance (processing fee of ₱10)
    const processingFee = 10;
    const totalDeduction = amount + processingFee;

    await updateDoc(userDocRef, {
      referralBonus: increment(-totalDeduction),
    });

    // TODO: Send notification email when email service is properly configured

    return NextResponse.json({
      success: true,
      withdrawalId: withdrawalRef.id,
      message: 'Withdrawal request submitted successfully'
    });

  } catch (error) {
    console.error('Withdrawal error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Admin endpoints will be implemented when authentication is properly configured
