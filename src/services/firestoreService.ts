import { 
  collection, 
  doc, 
  setDoc, 
  addDoc, 
  getDoc, 
  getDocs, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy,
  runTransaction
} from "firebase/firestore";
import { 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from "firebase/storage";
import { db, storage, handleFirestoreError, OperationType } from "../lib/firebase";
import { 
  Listing, 
  UserProfile, 
  Enquiry, 
  Review, 
  Favourite, 
  Booking, 
  ListingReport, 
  Invoice 
} from "../types";

// ============================================================================
// FIREBASE STORAGE SERVICE
// ============================================================================

/**
 * Uploads an image file to Firebase Storage under the specified folder and returns the download URL.
 */
export async function uploadListingImage(file: File, ownerId: string): Promise<string> {
  try {
    const filename = `${Date.now()}_${file.name.replace(/[^a-zA-Z0-9.]/g, "_")}`;
    const storageRef = ref(storage, `owners/${ownerId}/listings/${filename}`);
    
    // Perform upload
    const snapshot = await uploadBytes(storageRef, file);
    const downloadURL = await getDownloadURL(snapshot.ref);
    return downloadURL;
  } catch (err) {
    console.error("Storage upload error:", err);
    throw new Error("Failed to upload image to secure cloud storage.");
  }
}

/**
 * Deletes an image from Firebase Storage by its secure download URL.
 */
export async function deleteStorageImage(imageUrl: string): Promise<void> {
  try {
    if (!imageUrl || !imageUrl.includes("firebasestorage.googleapis.com")) {
      return; // Skip non-Firebase local or Unsplash URLs
    }
    const decodedUrl = decodeURIComponent(imageUrl);
    const pathStartIndex = decodedUrl.indexOf("/o/") + 3;
    const pathEndIndex = decodedUrl.indexOf("?alt=media");
    if (pathStartIndex === -1 || pathEndIndex === -1) return;
    
    const fullPath = decodedUrl.substring(pathStartIndex, pathEndIndex);
    const storageRef = ref(storage, fullPath);
    await deleteObject(storageRef);
  } catch (err) {
    console.warn("Storage deletion warning (safe to ignore if already deleted):", err);
  }
}


// ============================================================================
// LISTINGS SERVICE
// ============================================================================

/**
 * Subscribes to real-time updates for all listings.
 */
export function listenAllListings(onUpdate: (listings: Listing[]) => void, onError?: (err: Error) => void) {
  const colRef = collection(db, "listings");
  const q = query(colRef, orderBy("createdAt", "desc"));
  
  return onSnapshot(q, (snapshot) => {
    const list: Listing[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as Listing);
    });
    onUpdate(list);
  }, (err) => {
    console.error("listenAllListings error:", err);
    if (onError) onError(err);
  });
}

/**
 * Creates a new listing in Firestore.
 */
export async function createListing(listingData: Omit<Listing, "id">): Promise<string> {
  try {
    const colRef = collection(db, "listings");
    const docRef = await addDoc(colRef, {
      ...listingData,
      createdAt: new Date().toISOString()
    });
    
    // Update document to self-contain its ID as a standard practice
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, "listings");
    throw err;
  }
}

/**
 * Updates an existing listing.
 */
export async function updateListing(listingId: string, updates: Partial<Listing>): Promise<void> {
  try {
    const docRef = doc(db, "listings", listingId);
    await updateDoc(docRef, updates);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `listings/${listingId}`);
  }
}

/**
 * Deletes a listing and cleans up associated storage images.
 */
export async function deleteListing(listingId: string, imagesToClean: string[]): Promise<void> {
  try {
    // Delete from Firestore
    const docRef = doc(db, "listings", listingId);
    await deleteDoc(docRef);

    // Clean up images in background asynchronously
    if (imagesToClean && imagesToClean.length > 0) {
      imagesToClean.forEach(async (img) => {
        await deleteStorageImage(img);
      });
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `listings/${listingId}`);
  }
}


// ============================================================================
// ENQUIRIES SERVICE
// ============================================================================

/**
 * Subscribes to real-time lead enquiries for a specific owner or sender.
 */
export function listenEnquiries(
  userId: string, 
  role: "user" | "owner" | "admin",
  onUpdate: (enquiries: Enquiry[]) => void
) {
  const colRef = collection(db, "enquiries");
  let q = query(colRef, orderBy("createdAt", "desc"));
  
  if (role === "owner") {
    q = query(colRef, where("ownerId", "==", userId), orderBy("createdAt", "desc"));
  } else if (role === "user") {
    q = query(colRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
  }

  return onSnapshot(q, (snapshot) => {
    const list: Enquiry[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as Enquiry);
    });
    onUpdate(list);
  }, (err) => {
    console.error("listenEnquiries error:", err);
  });
}

/**
 * Creates an inquiry.
 */
export async function createEnquiry(enquiry: Omit<Enquiry, "id">): Promise<string> {
  try {
    const colRef = collection(db, "enquiries");
    const docRef = await addDoc(colRef, {
      ...enquiry,
      createdAt: new Date().toISOString()
    });
    await updateDoc(docRef, { id: docRef.id });
    
    // Increment enquiries count on listing
    try {
      const listingRef = doc(db, "listings", enquiry.listingId);
      await runTransaction(db, async (transaction) => {
        const listingSnap = await transaction.get(listingRef);
        if (listingSnap.exists()) {
          const currentCount = listingSnap.data().enquiriesCount || 0;
          transaction.update(listingRef, { enquiriesCount: currentCount + 1 });
        }
      });
    } catch (countErr) {
      console.warn("Could not increment listing enquiry counters:", countErr);
    }
    
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, "enquiries");
    throw err;
  }
}


// ============================================================================
// BOOKINGS SERVICE
// ============================================================================

/**
 * Subscribes to visit bookings real-time feed.
 */
export function listenBookings(
  userId: string,
  role: "user" | "owner" | "admin",
  onUpdate: (bookings: Booking[]) => void
) {
  const colRef = collection(db, "bookings");
  let q = query(colRef, orderBy("createdAt", "desc"));

  if (role === "owner") {
    q = query(colRef, where("ownerId", "==", userId), orderBy("createdAt", "desc"));
  } else if (role === "user") {
    q = query(colRef, where("userId", "==", userId), orderBy("createdAt", "desc"));
  }

  return onSnapshot(q, (snapshot) => {
    const list: Booking[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as Booking);
    });
    onUpdate(list);
  }, (err) => {
    console.error("listenBookings error:", err);
  });
}

/**
 * Schedules a new physical relocation booking.
 */
export async function createBooking(booking: Omit<Booking, "id">): Promise<string> {
  try {
    const colRef = collection(db, "bookings");
    const docRef = await addDoc(colRef, {
      ...booking,
      createdAt: new Date().toISOString()
    });
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, "bookings");
    throw err;
  }
}

/**
 * Updates status of a booking.
 */
export async function updateBookingStatus(bookingId: string, status: "pending" | "confirmed" | "rejected"): Promise<void> {
  try {
    const docRef = doc(db, "bookings", bookingId);
    await updateDoc(docRef, { status });
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `bookings/${bookingId}`);
  }
}


// ============================================================================
// REVIEWS SERVICE
// ============================================================================

/**
 * Subscribes to real-time reviews for a specific listing.
 */
export function listenReviews(listingId: string, onUpdate: (reviews: Review[]) => void) {
  const colRef = collection(db, "reviews");
  const q = query(colRef, where("listingId", "==", listingId), orderBy("createdAt", "desc"));

  return onSnapshot(q, (snapshot) => {
    const list: Review[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as Review);
    });
    onUpdate(list);
  }, (err) => {
    console.error("listenReviews error:", err);
  });
}

/**
 * Adds a verified review and automatically recalculates the average score.
 */
export async function addReview(review: Omit<Review, "id">): Promise<string> {
  try {
    const colRef = collection(db, "reviews");
    const docRef = await addDoc(colRef, {
      ...review,
      createdAt: new Date().toISOString()
    });
    await updateDoc(docRef, { id: docRef.id });

    // Recalculate Average Rating on the listing
    const listingRef = doc(db, "listings", review.listingId);
    await runTransaction(db, async (transaction) => {
      const listingSnap = await transaction.get(listingRef);
      if (listingSnap.exists()) {
        const listingData = listingSnap.data();
        const currentCount = listingData.reviewsCount || 0;
        const currentAvg = listingData.rating || 5;

        const newCount = currentCount + 1;
        const newAvg = Number(((currentAvg * currentCount + review.rating) / newCount).toFixed(1));

        transaction.update(listingRef, {
          reviewsCount: newCount,
          rating: newAvg
        });
      }
    });

    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, "reviews");
    throw err;
  }
}


// ============================================================================
// FAVORITES SERVICE
// ============================================================================

/**
 * Subscribes to user bookmarks.
 */
export function listenFavourites(userId: string, onUpdate: (favs: Favourite[]) => void) {
  const colRef = collection(db, "favourites");
  const q = query(colRef, where("userId", "==", userId));

  return onSnapshot(q, (snapshot) => {
    const list: Favourite[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ ...docSnap.data(), id: docSnap.id } as Favourite);
    });
    onUpdate(list);
  }, (err) => {
    console.error("listenFavourites error:", err);
  });
}

/**
 * Toggles a user favorite bookmark.
 */
export async function toggleFavourite(userId: string, listingId: string): Promise<boolean> {
  try {
    const compositeId = `${userId}_${listingId}`;
    const docRef = doc(db, "favourites", compositeId);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      await deleteDoc(docRef);
      return false; // Removed
    } else {
      const fav: Favourite = {
        id: compositeId,
        userId,
        listingId,
        createdAt: new Date().toISOString()
      };
      await setDoc(docRef, fav);
      return true; // Added
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `favourites/${userId}_${listingId}`);
    throw err;
  }
}


// ============================================================================
// REPORTS & INVOICES SERVICE
// ============================================================================

/**
 * Submits a listing safety/spam report.
 */
export async function addReport(report: Omit<ListingReport, "id">): Promise<string> {
  try {
    const colRef = collection(db, "reports");
    const docRef = await addDoc(colRef, {
      ...report,
      createdAt: new Date().toISOString()
    });
    await updateDoc(docRef, { id: docRef.id });
    return docRef.id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, "reports");
    throw err;
  }
}

/**
 * Adds a subscription premium upgrade invoice receipt.
 */
export async function addInvoice(invoice: Omit<Invoice, "id" | "invoiceNumber">): Promise<string> {
  try {
    const colRef = collection(db, "invoices");
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}`;
    const id = `inv_${Date.now()}`;
    const docRef = doc(db, "invoices", id);
    
    const record: Invoice = {
      ...invoice,
      id,
      invoiceNumber,
      invoiceDate: new Date().toISOString()
    };
    
    await setDoc(docRef, record);
    return id;
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, "invoices");
    throw err;
  }
}
