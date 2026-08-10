import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";

import { db } from "../firebase/firebase";

export async function createNotification({
  userId,
  title,
  message,
}: {
  userId: string;
  title: string;
  message: string;
}) {
  await addDoc(collection(db, "notifications"), {
    userId,
    title,
    message,
    read: false,
    createdAt: serverTimestamp(),
  });
}
