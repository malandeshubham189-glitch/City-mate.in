import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { PaymentTransaction, UserProfile } from "../types";

// Dynamic commission rate configuration
export const COMMISSION_RATES = {
  premium_booking: 0.05,  // 5% cut on room bookings
  property_deposit: 0.02, // 2% processing cut on tokenized security deposits
  affiliate_referral: 0.08 // 8% split on Packers & Movers or allied B2B super-app leads
};

/**
 * Loads the external Razorpay Checkout SDK dynamically in the document head.
 */
export function initializeRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.hasOwnProperty("Razorpay")) {
      resolve(true);
      return;
    }
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}

/**
 * Calculates the split commission based on transaction purpose.
 */
export function calculateSplitCommission(
  amount: number, 
  purpose: keyof typeof COMMISSION_RATES
) {
  const rate = COMMISSION_RATES[purpose] || 0.05;
  const platformCut = Number((amount * rate).toFixed(2));
  const vendorPayout = Number((amount - platformCut).toFixed(2));
  return {
    commissionRate: rate,
    platformCut,
    vendorPayout
  };
}

/**
 * Contact the backend API to initialize a secure Razorpay order.
 * Tracks lifecycle as 'initiated'.
 */
export async function initiatePaymentTransaction(params: {
  bookingId: string;
  amount: number;
  purpose: "premium_booking" | "property_deposit" | "affiliate_referral";
  user: { uid: string; name: string; email: string };
}): Promise<{ orderId: string; transactionId: string; amount: number; platformCut: number; isMock?: boolean }> {
  try {
    const { bookingId, amount, purpose, user } = params;
    
    // Call the server endpoint to create a secure order record and compute cuts
    const res = await fetch("/api/payments/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bookingId, amount, purpose, user })
    });
    
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || "Failed to initiate server-side Razorpay order");
    }
    
    return await res.json();
  } catch (error) {
    console.error("initiatePaymentTransaction error:", error);
    throw error;
  }
}

/**
 * Securely verifies signature on the server to prevent tamper-based captures.
 * Promotes status from 'initiated' -> 'captured'.
 */
export async function verifyAndCapturePayment(params: {
  transactionId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}): Promise<boolean> {
  try {
    const res = await fetch("/api/payments/verify-signature", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params)
    });
    
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || "Signature verification failed at gateway");
    }
    
    const data = await res.json();
    return data.success === true;
  } catch (error) {
    console.error("verifyAndCapturePayment error:", error);
    throw error;
  }
}

/**
 * Initiates a secure refund request for captured transactions.
 * Demotes state from 'captured' -> 'refunded' and handles ledger reversals.
 */
export async function refundCapturedTransaction(transactionId: string): Promise<boolean> {
  try {
    const res = await fetch("/api/payments/refund", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ transactionId })
    });
    
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      throw new Error(errBody.error || "Refund processing failed");
    }
    
    const data = await res.json();
    return data.success === true;
  } catch (error) {
    console.error("refundCapturedTransaction error:", error);
    throw error;
  }
}

/**
 * Real-time listener for current user's transactional financial ledger logs.
 */
export function listenUserPaymentTransactions(
  userId: string,
  onUpdate: (transactions: PaymentTransaction[]) => void
) {
  const colRef = collection(db, "payment_transactions");
  const q = query(
    colRef, 
    where("userId", "==", userId), 
    orderBy("createdAt", "desc")
  );
  
  return onSnapshot(q, (snapshot) => {
    const list: PaymentTransaction[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as PaymentTransaction);
    });
    onUpdate(list);
  }, (err) => {
    console.error("listenUserPaymentTransactions error:", err);
    handleFirestoreError(err, OperationType.GET, "payment_transactions");
  });
}

/**
 * Real-time listener for ALL global transactions (for Admins).
 */
export function listenAllPaymentTransactions(
  onUpdate: (transactions: PaymentTransaction[]) => void
) {
  const colRef = collection(db, "payment_transactions");
  const q = query(colRef, orderBy("createdAt", "desc"));
  
  return onSnapshot(q, (snapshot) => {
    const list: PaymentTransaction[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as PaymentTransaction);
    });
    onUpdate(list);
  }, (err) => {
    console.error("listenAllPaymentTransactions error:", err);
  });
}
