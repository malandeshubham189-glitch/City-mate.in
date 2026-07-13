import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  getDoc 
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { VerificationRequest } from "../types";

/**
 * Calculations for the trust matrix score.
 * Base score: 20 points
 * Background check flag: 30 points
 * Owner profile completeness: 25 points
 * Document matching flag: 25 points
 */
export function calculateTrustScore(breakdown: {
  backgroundCheck: boolean;
  profileComplete: boolean;
  documentMatch: boolean;
}): number {
  let score = 20;
  if (breakdown.backgroundCheck) score += 30;
  if (breakdown.profileComplete) score += 25;
  if (breakdown.documentMatch) score += 25;
  return Math.min(100, score);
}

/**
 * Creates a verification request.
 */
export async function createVerificationRequest(
  requestData: Omit<VerificationRequest, "id" | "createdAt" | "trustScore">
): Promise<string> {
  try {
    const colRef = collection(db, "verification_requests");
    const trustScore = calculateTrustScore(requestData.scoreBreakdown);
    const docRef = await addDoc(colRef, {
      ...requestData,
      trustScore,
      createdAt: new Date().toISOString()
    });

    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, "verification_requests");
    throw err;
  }
}

/**
 * Listens to incoming verification requests in real-time.
 */
export function listenVerificationRequests(
  onUpdate: (requests: VerificationRequest[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, "verification_requests");
  const q = query(colRef, orderBy("createdAt", "desc"));

  return onSnapshot(q, (snapshot) => {
    const list: VerificationRequest[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as VerificationRequest);
    });
    onUpdate(list);
  }, (err) => {
    console.error("listenVerificationRequests error:", err);
    if (onError) onError(err);
  });
}

/**
 * Updates the status of a verification request and cascades changes to target entities (users/listings).
 */
export async function updateVerificationStatus(
  requestId: string,
  status: "pending" | "verified" | "rejected",
  feedback?: string
): Promise<void> {
  try {
    const reqRef = doc(db, "verification_requests", requestId);
    const reqSnap = await getDoc(reqRef);
    if (!reqSnap.exists()) {
      throw new Error("Verification request not found.");
    }

    const request = reqSnap.data() as VerificationRequest;

    // Update the verification request
    await updateDoc(reqRef, {
      status,
      feedback: feedback || "",
      updatedAt: new Date().toISOString()
    });

    // Cascade changes to user profile or listing
    if (request.type === "user" || request.type === "owner") {
      const userRef = doc(db, "users", request.userId);
      const updates: Record<string, any> = {
        kycStatus: status
      };
      if (request.type === "owner" && status === "verified") {
        updates.isOwnerVerified = true;
      } else if (request.type === "owner" && status === "rejected") {
        updates.isOwnerVerified = false;
      }
      
      // Update the user doc if it exists
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        await updateDoc(userRef, updates);
      }
    } else if (request.type === "listing" && request.targetId) {
      const listingRef = doc(db, "listings", request.targetId);
      const updates: Record<string, any> = {
        isVerified: status === "verified"
      };
      if (status === "verified") {
        updates.status = "active";
      } else if (status === "rejected") {
        updates.status = "rejected";
      }

      // Update the listing doc if it exists
      const listingSnap = await getDoc(listingRef);
      if (listingSnap.exists()) {
        await updateDoc(listingRef, updates);
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `verification_requests/${requestId}`);
    throw err;
  }
}

/**
 * Adjusts the Trust Score breakdown components manually in real-time.
 */
export async function updateVerificationTrustMatrix(
  requestId: string,
  scoreBreakdown: VerificationRequest["scoreBreakdown"]
): Promise<number> {
  try {
    const trustScore = calculateTrustScore(scoreBreakdown);
    const reqRef = doc(db, "verification_requests", requestId);

    await updateDoc(reqRef, {
      scoreBreakdown,
      trustScore,
      updatedAt: new Date().toISOString()
    });

    return trustScore;
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `verification_requests/${requestId}`);
    throw err;
  }
}
