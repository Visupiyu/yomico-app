import { useEffect, useState } from "react";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../firebase/firebase";

// Live unread customer-notification count for the bottom-tab "Notifications"
// badge. Reads the SAME existing `notifications` collection/filter the Home
// header bell used (userId == me, role == "customer", read == false) — this is
// not a new notification system, just a live count of existing docs. Returns 0
// while signed out. Used by AppNavigator to set tabBarBadge.
export function useUnreadNotifications(): number {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let unsubSnap: (() => void) | null = null;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (unsubSnap) {
        unsubSnap();
        unsubSnap = null;
      }
      if (!user) {
        setCount(0);
        return;
      }
      const q = query(
        collection(db, "notifications"),
        where("userId", "==", user.uid),
        where("role", "==", "customer"),
        where("read", "==", false),
      );
      unsubSnap = onSnapshot(
        q,
        (snap) => setCount(snap.size),
        () => setCount(0),
      );
    });

    return () => {
      if (unsubSnap) unsubSnap();
      unsubAuth();
    };
  }, []);

  return count;
}
