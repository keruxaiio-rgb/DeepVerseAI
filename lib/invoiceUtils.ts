import { db } from '../firebase';
import { collection, query, where, orderBy, limit, getDocs, addDoc } from 'firebase/firestore';

/**
 * Generate a unique invoice number in format: INV-{YYYYMMDD}-{sequential_number}
 * Example: INV-20241229-0001
 */
export async function generateInvoiceNumber(): Promise<string> {
  const today = new Date();
  const dateString = today.toISOString().slice(0, 10).replace(/-/g, ''); // YYYYMMDD format

  // Get the last invoice number for today to determine the sequential number
  const invoicesRef = collection(db, 'invoices');
  const q = query(
    invoicesRef,
    where('dateString', '==', dateString),
    orderBy('sequentialNumber', 'desc'),
    limit(1)
  );

  const querySnapshot = await getDocs(q);

  let sequentialNumber = 1;
  if (!querySnapshot.empty) {
    const lastInvoice = querySnapshot.docs[0].data();
    sequentialNumber = lastInvoice.sequentialNumber + 1;
  }

  // Store the invoice number to prevent duplicates
  await addDoc(invoicesRef, {
    dateString,
    sequentialNumber,
    createdAt: new Date()
  });

  // Format: INV-YYYYMMDD-XXXX (4-digit sequential number)
  const sequentialString = sequentialNumber.toString().padStart(4, '0');
  return `INV-${dateString}-${sequentialString}`;
}

/**
 * Validate invoice number format
 */
export function isValidInvoiceNumber(invoiceNumber: string): boolean {
  const pattern = /^INV-\d{8}-\d{4}$/;
  return pattern.test(invoiceNumber);
}

/**
 * Extract date from invoice number
 */
export function getInvoiceDate(invoiceNumber: string): Date | null {
  if (!isValidInvoiceNumber(invoiceNumber)) return null;

  const dateString = invoiceNumber.substring(4, 12); // Extract YYYYMMDD
  const year = parseInt(dateString.substring(0, 4));
  const month = parseInt(dateString.substring(4, 6)) - 1; // Month is 0-indexed
  const day = parseInt(dateString.substring(6, 8));

  return new Date(year, month, day);
}
