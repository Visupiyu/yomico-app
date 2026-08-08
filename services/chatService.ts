import {
  addDoc,
  collection,
  doc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

import {
  auth,
  db,
} from "../firebase/firebase";


export async function createChat(
  productId: string,
  productName: string,
  vendorId: string,
  vendorName: string
) {

  const user =
    auth.currentUser;

  if (!user) {
    throw new Error(
      "User is not logged in"
    );
  }

  const chatRef =
    await addDoc(
      collection(
        db,
        "chats"
      ),
      {
        customerId:
          user.uid,

        customerEmail:
          user.email || "",

        customerName:
          user.displayName ||
          "Customer",

        sellerId:
          vendorId,

        sellerName:
          vendorName,

        productId:
          productId,

        productName:
          productName,

        lastMessage:
          "",

        lastSender:
          "",

        sellerUnread:
          0,

        customerUnread:
          0,

        lastMessageAt:
          serverTimestamp(),
      }
    );

  return chatRef.id;
}


export async function sendMessage(
  chatId: string,
  text: string
) {

  const user =
    auth.currentUser;

  if (!user) {
    throw new Error(
      "User is not logged in"
    );
  }

  const messageRef =
    await addDoc(
      collection(
        db,
        "messages"
      ),
      {
        chatId:
          chatId,

        senderId:
          user.uid,

        senderRole:
          "customer",

        senderName:
          user.displayName ||
          "Customer",

        text:
          text.trim(),

        createdAt:
          serverTimestamp(),
      }
    );

  return messageRef.id;
}