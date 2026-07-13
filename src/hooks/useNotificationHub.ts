import { useState, useEffect, useCallback } from "react";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc, 
  addDoc,
  writeBatch
} from "firebase/firestore";
import { db } from "../lib/firebase";
import { AppNotification } from "../types";

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: "info" | "success" | "alert" | "message";
}

export function useNotificationHub(userId: string | undefined) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [loading, setLoading] = useState(false);

  // Trigger a visual ephemeral toast
  const triggerToast = useCallback((title: string, message: string, type: ToastItem["type"] = "info") => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, message, type }]);
    
    // Automatically dismiss after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Listen to firestore updates
  useEffect(() => {
    if (!userId) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setLoading(true);
    const colRef = collection(db, "notifications");
    
    // Query notifications for the active user
    const q = query(
      colRef,
      where("userId", "==", userId)
    );

    let isFirstLoad = true;

    const unsub = onSnapshot(q, (snapshot) => {
      const list: AppNotification[] = [];
      let unread = 0;
      
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const item = { 
          id: docSnap.id, 
          userId: data.userId || "",
          title: data.title || data.text || "System Notification",
          message: data.message || data.text || "",
          type: data.type || "info",
          read: data.read ?? false,
          createdAt: data.createdAt || new Date().toISOString()
        } as AppNotification;
        
        list.push(item);
        if (!item.read) {
          unread++;
        }
      });

      // Sort client-side to avoid requiring composite indexes
      list.sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });

      // If we receive a NEW unread notification after the initial load, trigger an instant premium toast alert!
      if (!isFirstLoad && list.length > notifications.length) {
        const newItems = list.filter(item => !notifications.some(existing => existing.id === item.id));
        newItems.forEach(item => {
          if (!item.read) {
            const toastType = item.type === "email_and_push" ? "success" : (item.type as any) || "info";
            triggerToast(item.title, item.message, toastType);
          }
        });
      }

      setNotifications(list);
      setUnreadCount(unread);
      setLoading(false);
      isFirstLoad = false;
    }, (error) => {
      console.error("useNotificationHub error listening to notifications:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [userId, triggerToast, notifications.length]);

  // Mark single notification as read
  const markAsRead = async (id: string) => {
    try {
      const docRef = doc(db, "notifications", id);
      await updateDoc(docRef, { read: true });
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Mark all notifications as read in a writeBatch
  const markAllAsRead = async () => {
    if (!userId || notifications.length === 0) return;
    try {
      const batch = writeBatch(db);
      const unreadList = notifications.filter((n) => !n.read);
      
      unreadList.forEach((n) => {
        const docRef = doc(db, "notifications", n.id);
        batch.update(docRef, { read: true });
      });

      await batch.commit();
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  // Create/Broadcast notification helper
  const addNotification = async (title: string, message: string, type: AppNotification["type"] = "info") => {
    if (!userId) return;
    try {
      await addDoc(collection(db, "notifications"), {
        userId,
        title,
        message,
        type,
        read: false,
        createdAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error creating notification:", error);
    }
  };

  return {
    notifications,
    unreadCount,
    toasts,
    loading,
    markAsRead,
    markAllAsRead,
    addNotification,
    triggerToast,
    dismissToast
  };
}
