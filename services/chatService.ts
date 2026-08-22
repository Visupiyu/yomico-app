import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  serverTimestamp,
  where,
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

  const chatsRef =
    collection(
      db,
      "chats"
    );

  // Reuse the existing conversation for this customer/product/seller
  // instead of creating a new "chats" doc every time — messages are
  // keyed by chatId, so creating a fresh chat on every visit made the
  // customer's previous conversation with this seller unreachable
  // each time they reopened it.
  const existingChatQuery =
    query(
      chatsRef,
      where(
        "customerId",
        "==",
        user.uid
      ),
      where(
        "productId",
        "==",
        productId
      ),
      where(
        "sellerId",
        "==",
        vendorId
      )
    );

  const existingChats =
    await getDocs(
      existingChatQuery
    );

  if (!existingChats.empty) {
    return existingChats.docs[0].id;
  }

  const chatRef =
    await addDoc(
      chatsRef,
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