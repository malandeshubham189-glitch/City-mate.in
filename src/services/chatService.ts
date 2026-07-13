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
  onSnapshot,
  increment,
  writeBatch,
  serverTimestamp
} from "firebase/firestore";
import { db, handleFirestoreError, OperationType } from "../lib/firebase";
import { P2PChatMessage, ChatConversation, UserPresence } from "../types";

/**
 * Update the current user's real-time presence.
 */
export async function updateUserPresence(userId: string, status: "online" | "offline"): Promise<void> {
  const presenceRef = doc(db, "presence", userId);
  try {
    await setDoc(presenceRef, {
      userId,
      status,
      lastActive: new Date().toISOString()
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `presence/${userId}`);
  }
}

/**
 * Real-time subscription to user's conversations.
 */
export function subscribeToConversations(
  userId: string,
  onUpdate: (conversations: ChatConversation[]) => void
) {
  const convCol = collection(db, "conversations");
  const q = query(
    convCol,
    where("participants", "array-contains", userId),
    orderBy("lastMessageTime", "desc")
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const list: ChatConversation[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as ChatConversation);
      });
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, `conversations_sub/${userId}`);
    }
  );
}

/**
 * Real-time subscription to active conversation messages.
 * We fetch from the subcollection `conversations/{conversationId}/messages`.
 */
export function subscribeToMessages(
  conversationId: string,
  onUpdate: (messages: P2PChatMessage[]) => void
) {
  const messagesCol = collection(db, "conversations", conversationId, "messages");
  const q = query(messagesCol, orderBy("timestamp", "asc"));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: P2PChatMessage[] = [];
      snapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as P2PChatMessage);
      });
      onUpdate(list);
    },
    (err) => {
      handleFirestoreError(err, OperationType.LIST, `messages_sub/${conversationId}`);
    }
  );
}

/**
 * Subscribe to multiple users' real-time presence.
 */
export function subscribeToPresence(
  userIds: string[],
  onUpdate: (presences: Record<string, "online" | "offline">) => void
) {
  if (userIds.length === 0) {
    onUpdate({});
    return () => {};
  }

  // To support firestore limits, split into chunks of 10 if larger, but we normally have 1-2 active chat peers
  const q = query(collection(db, "presence"), where("userId", "in", userIds.slice(0, 10)));

  return onSnapshot(
    q,
    (snapshot) => {
      const presences: Record<string, "online" | "offline"> = {};
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as UserPresence;
        presences[data.userId] = data.status;
      });
      onUpdate(presences);
    },
    (err) => {
      console.warn("Presence subscript failed or rules block:", err);
    }
  );
}

/**
 * Sets the current user's typing status inside a conversation's metadata.
 */
export async function updateTypingStatus(
  conversationId: string,
  userId: string,
  isTyping: boolean
): Promise<void> {
  const convRef = doc(db, "conversations", conversationId);
  try {
    await updateDoc(convRef, {
      [`typing.${userId}`]: isTyping
    });
  } catch (err) {
    // Non-blocking typing state update
    console.debug("Typing status update skipped:", err);
  }
}

/**
 * Send a message inside the conversations subcollection, and update parent snippet/timestamps.
 */
export async function sendChatMessage(
  conversationId: string,
  senderId: string,
  senderName: string,
  content: string,
  recipientId: string,
  mediaUrl?: string,
  mediaType?: "image" | "document" | "map"
): Promise<void> {
  const messagesCol = collection(db, "conversations", conversationId, "messages");
  const timestamp = new Date().toISOString();
  
  const msgDocRef = doc(messagesCol);
  const msgPayload: P2PChatMessage = {
    id: msgDocRef.id,
    conversationId,
    senderId,
    senderName,
    content,
    timestamp,
    read: false,
    ...(mediaUrl ? { mediaUrl, mediaType } : {})
  };

  try {
    // Write message doc
    await setDoc(msgDocRef, msgPayload);

    // Update parent conversation meta snippet and increment unread count for recipient
    const convRef = doc(db, "conversations", conversationId);
    await updateDoc(convRef, {
      lastMessageText: mediaUrl ? `Sent a media attachment (${mediaType})` : content,
      lastMessageTime: timestamp,
      [`unreadCount.${recipientId}`]: increment(1)
    });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `conversations/${conversationId}/messages`);
    throw err;
  }
}

/**
 * Resets the current user's unread counter and marks all incoming unread messages as read.
 */
export async function markConversationAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const convRef = doc(db, "conversations", conversationId);
  try {
    // 1. Reset parent unreadCount key
    await updateDoc(convRef, {
      [`unreadCount.${userId}`]: 0
    });

    // 2. Query any unread messages from other peer in subcollection and batch mark them as read
    const messagesCol = collection(db, "conversations", conversationId, "messages");
    const q = query(messagesCol, where("read", "==", false));
    const snap = await getDocs(q);

    if (!snap.empty) {
      const batch = writeBatch(db);
      snap.docs.forEach((d) => {
        if (d.data().senderId !== userId) {
          batch.update(d.ref, { read: true });
        }
      });
      await batch.commit();
    }
  } catch (err) {
    console.warn("Read confirmation sync failed or skipped:", err);
  }
}

/**
 * Creates or retrieves a conversation doc between two participants.
 */
export async function startOrGetConversation(
  userId1: string,
  name1: string,
  userId2: string,
  name2: string
): Promise<string> {
  const participants = [userId1, userId2].sort();
  const conversationId = `conv_${participants[0]}_${participants[1]}`;
  const convRef = doc(db, "conversations", conversationId);

  try {
    const snap = await getDoc(convRef);
    if (snap.exists()) {
      return conversationId;
    }

    const newConv: ChatConversation = {
      id: conversationId,
      participants,
      participantNames: {
        [userId1]: name1,
        [userId2]: name2
      },
      lastMessageText: "Chat initialized.",
      lastMessageTime: new Date().toISOString(),
      unreadCount: {
        [userId1]: 0,
        [userId2]: 0
      },
      typing: {
        [userId1]: false,
        [userId2]: false
      }
    };

    await setDoc(convRef, newConv);
    return conversationId;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, `conversations/${conversationId}`);
    throw err;
  }
}
