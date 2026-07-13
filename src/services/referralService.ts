import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  increment 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { UserWallet, Referral, WalletTransaction } from "../types";

/**
 * Helper to generate a short, uppercase unique referral code.
 */
function generateReferralCode(name: string = "user"): string {
  const cleanName = name.replace(/[^a-zA-Z]/g, "").substring(0, 4).toUpperCase() || "MATE";
  const randomHex = Math.floor(1000 + Math.random() * 9000);
  return `${cleanName}${randomHex}`;
}

/**
 * Retrieves the wallet for a user. If it doesn't exist, initializes a fresh wallet ledger
 * with a newly generated unique referral code.
 */
export async function getUserWallet(userId: string, userName?: string): Promise<UserWallet> {
  const walletDocRef = doc(db, "wallets", userId);
  try {
    const docSnap = await getDoc(walletDocRef);
    if (docSnap.exists()) {
      return docSnap.data() as UserWallet;
    }

    // Create fresh wallet
    const referralCode = generateReferralCode(userName);
    const newWallet: UserWallet = {
      userId,
      balance: 0,
      accruedCashback: 0,
      referralCode,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(walletDocRef, newWallet);
    return newWallet;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `wallets/${userId}`);
    throw err;
  }
}

/**
 * Creates a pending referral log entry for a newly referred email address.
 */
export async function createReferral(
  referrerId: string, 
  referredEmail: string, 
  referralCode: string
): Promise<Referral> {
  const id = `${referrerId}_${referredEmail.replace(/[^a-zA-Z0-9]/g, "")}`;
  const referralRef = doc(db, "referrals", id);
  try {
    const newReferral: Referral = {
      id,
      referrerId,
      referredEmail: referredEmail.toLowerCase().trim(),
      referralCode,
      status: "pending",
      rewardAmount: 150, // Standard reward on sign up + KYC
      rewardClaimed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await setDoc(referralRef, newReferral);
    return newReferral;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `referrals/${id}`);
    throw err;
  }
}

/**
 * Tracks a successful signup of a referred user and credits initial signup bonus.
 */
export async function recordReferralSignup(referredEmail: string): Promise<void> {
  const cleanEmail = referredEmail.toLowerCase().trim();
  const referralsRef = collection(db, "referrals");
  const q = query(referralsRef, where("referredEmail", "==", cleanEmail), where("status", "==", "pending"));

  try {
    const snap = await getDocs(q);
    if (snap.empty) return; // No pending referral matches this signup

    const refDoc = snap.docs[0];
    const referralData = refDoc.data() as Referral;

    // Update status to signed_up
    await updateDoc(doc(db, "referrals", refDoc.id), {
      status: "signed_up",
      updatedAt: new Date().toISOString(),
    });

    // Credit referrer wallet with signup bonus
    const referrerId = referralData.referrerId;
    const walletRef = doc(db, "wallets", referrerId);

    await updateDoc(walletRef, {
      balance: increment(150),
      accruedCashback: increment(150),
      updatedAt: new Date().toISOString(),
    });

    // Log Wallet transaction
    const transCollection = collection(db, "wallet_transactions");
    const tx: WalletTransaction = {
      id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId: referrerId,
      type: "credit",
      amount: 150,
      description: `Referral Signup Bonus (${cleanEmail})`,
      status: "completed",
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(transCollection, tx.id), tx);

  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `referrals/signup/${cleanEmail}`);
  }
}

/**
 * Triggers full completion of referral payouts once the referred user completes a transaction.
 */
export async function completeReferralReward(referredEmail: string, activityDescription: string): Promise<void> {
  const cleanEmail = referredEmail.toLowerCase().trim();
  const referralsRef = collection(db, "referrals");
  const q = query(referralsRef, where("referredEmail", "==", cleanEmail), where("status", "==", "signed_up"));

  try {
    const snap = await getDocs(q);
    if (snap.empty) return;

    const refDoc = snap.docs[0];
    const referralData = refDoc.data() as Referral;

    const bonusAmount = 350; // Extra conversion reward

    await updateDoc(doc(db, "referrals", refDoc.id), {
      status: "completed",
      rewardAmount: referralData.rewardAmount + bonusAmount,
      rewardClaimed: true,
      updatedAt: new Date().toISOString(),
    });

    const referrerId = referralData.referrerId;
    const walletRef = doc(db, "wallets", referrerId);

    await updateDoc(walletRef, {
      balance: increment(bonusAmount),
      accruedCashback: increment(bonusAmount),
      updatedAt: new Date().toISOString(),
    });

    const transCollection = collection(db, "wallet_transactions");
    const tx: WalletTransaction = {
      id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId: referrerId,
      type: "credit",
      amount: bonusAmount,
      description: `Referral Completion Reward: ${activityDescription}`,
      status: "completed",
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(transCollection, tx.id), tx);

  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `referrals/complete/${cleanEmail}`);
  }
}

/**
 * Directly records cashback referral commissions (e.g. Packers & Movers partner bonus).
 */
export async function addWalletCashback(
  userId: string, 
  amount: number, 
  description: string
): Promise<void> {
  const walletRef = doc(db, "wallets", userId);
  try {
    await updateDoc(walletRef, {
      balance: increment(amount),
      accruedCashback: increment(amount),
      updatedAt: new Date().toISOString(),
    });

    const transCollection = collection(db, "wallet_transactions");
    const tx: WalletTransaction = {
      id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId,
      type: "credit",
      amount,
      description,
      status: "completed",
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(transCollection, tx.id), tx);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `wallets/cashback/${userId}`);
  }
}

/**
 * Submits a withdrawal request, validating balance and recording a debit transaction.
 */
export async function requestWithdrawal(
  userId: string, 
  amount: number, 
  paymentDetails: string
): Promise<void> {
  const walletRef = doc(db, "wallets", userId);
  try {
    const snap = await getDoc(walletRef);
    if (!snap.exists()) {
      throw new Error("No wallet ledger exists for this user profile.");
    }

    const wallet = snap.data() as UserWallet;
    if (wallet.balance < amount) {
      throw new Error("Insufficient rewards balance for withdrawal.");
    }

    // Debit wallet balance
    await updateDoc(walletRef, {
      balance: increment(-amount),
      updatedAt: new Date().toISOString(),
    });

    const transCollection = collection(db, "wallet_transactions");
    const tx: WalletTransaction = {
      id: `tx_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      userId,
      type: "debit",
      amount,
      description: `Withdrawal payout to: ${paymentDetails}`,
      status: "pending", // Pending admin transfer approval
      createdAt: new Date().toISOString(),
    };
    await setDoc(doc(transCollection, tx.id), tx);
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `wallets/withdraw/${userId}`);
    throw err;
  }
}

/**
 * Retrieves past transactions for the rewards wallet ledger.
 */
export async function getWalletTransactions(userId: string): Promise<WalletTransaction[]> {
  const transCollection = collection(db, "wallet_transactions");
  const q = query(transCollection, where("userId", "==", userId), orderBy("createdAt", "desc"));
  try {
    const snap = await getDocs(q);
    const list: WalletTransaction[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as WalletTransaction);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `wallet_transactions/${userId}`);
    return [];
  }
}

/**
 * Retrieves referred users list.
 */
export async function getReferralsList(userId: string): Promise<Referral[]> {
  const refCollection = collection(db, "referrals");
  const q = query(refCollection, where("referrerId", "==", userId), orderBy("createdAt", "desc"));
  try {
    const snap = await getDocs(q);
    const list: Referral[] = [];
    snap.forEach((docSnap) => {
      list.push(docSnap.data() as Referral);
    });
    return list;
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `referrals/${userId}`);
    return [];
  }
}
