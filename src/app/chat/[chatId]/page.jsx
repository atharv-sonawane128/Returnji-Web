"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  doc,
  getDoc,
  getDocs,
  deleteDoc
} from "firebase/firestore";
import { 
  Send, 
  ShieldCheck, 
  MessageSquare, 
  CheckCheck, 
  MapPin, 
  Award, 
  Lock,
  ArrowLeft,
  Building2,
  Trash2
} from "lucide-react";
import Link from "next/link";

function ChatRoomContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawChatId = params?.chatId || "";
  const chatId = decodeURIComponent(rawChatId).trim();
  const queryQrId = searchParams.get("qrId") || "";

  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [tagDetails, setTagDetails] = useState(null);

  const messagesEndRef = useRef(null);

  // Determine user role (Finder vs Owner)
  const isOwner = user && tagDetails && tagDetails.ownerId === user.uid;
  const senderRole = isOwner ? "Owner" : "Finder";

  // Fetch tag details if qrId is passed
  useEffect(() => {
    async function fetchTag() {
      const targetId = queryQrId || chatId.replace("chat_", "");
      if (!targetId) return;

      let found = null;
      try {
        const snap = await getDoc(doc(db, "qrcodes", targetId));
        if (snap.exists()) {
          found = snap.data();
        }
      } catch (e) {
        console.warn("Firestore tag read notice for chat (using local fallback):", e?.message);
      }

      if (!found) {
        try {
          const saved = JSON.parse(localStorage.getItem("returnji_user_tags") || "[]");
          found = saved.find((t) => t.qrId === targetId || t.id === targetId);
        } catch (err) {}
      }

      if (found) {
        setTagDetails(found);
      }
    }
    fetchTag();
  }, [chatId, queryQrId]);

  // Listen to messages in real-time
  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, "chats", chatId, "messages");
    const q = query(messagesRef, orderBy("createdAt", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = [];
      snapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
      setMessages(fetched);
    }, (error) => {
      console.error("Error listening to chat messages:", error);
    });

    return () => unsubscribe();
  }, [chatId]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message
  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || !chatId) return;

    setSending(true);
    try {
      const messagesRef = collection(db, "chats", chatId, "messages");
      await addDoc(messagesRef, {
        text: text.trim(),
        senderRole,
        senderId: user ? user.uid : "anonymous_finder",
        senderName: isOwner ? (user.displayName || "Owner") : "Finder",
        createdAt: serverTimestamp()
      });

      if (!textToSend) setInputText("");
    } catch (e) {
      console.error("Error sending message:", e);
    } finally {
      setSending(false);
    }
  };

  // Delete Complete Chat
  const [deletingChat, setDeletingChat] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteChat = async () => {
    if (!chatId) return;
    setDeletingChat(true);

    try {
      // 1. Delete all message documents
      const messagesRef = collection(db, "chats", chatId, "messages");
      const snap = await getDocs(messagesRef);
      const deletePromises = snap.docs.map((docSnap) => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);

      // 2. Delete parent chat document
      try {
        await deleteDoc(doc(db, "chats", chatId));
      } catch (e) {}
    } catch (e) {
      console.warn("Firestore delete chat notice:", e?.message);
    }

    setMessages([]);
    setDeletingChat(false);
    setShowDeleteConfirm(false);
  };

  const QUICK_REPLIES = isOwner ? [
    "Thank you so much! Where can I meet you?",
    "Can you please drop it at the nearest Returnji Dropzone?",
    "I appreciate your help! What time suits you?"
  ] : [
    "Hi! I found your lost item with the Returnji QR tag.",
    "I am currently near your item's last location.",
    "I can drop this off at a nearby Returnji Dropzone.",
    "Please let me know when you'd like to pick it up!"
  ];

  return (
    <div className="min-h-screen bg-light-beige/50 py-6 px-3 sm:px-6 flex flex-col items-center">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-gray-100 flex flex-col h-[85vh] overflow-hidden">

        {/* CHAT HEADER */}
        <div className="p-4 sm:p-5 bg-dark-green text-white flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-3">
            <Link 
              href={queryQrId ? `/scan/${queryQrId}` : "/"}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition-all text-white"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-base sm:text-lg">
                  {tagDetails?.itemName ? `Chat: ${tagDetails.itemName}` : "Returnji Anonymous Chat"}
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-white">
                  LIVE
                </span>
              </div>
              <p className="text-xs text-emerald-200 flex items-center gap-1">
                <Lock className="w-3 h-3" /> Anonymous • Phone numbers hidden
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {tagDetails?.reward > 0 && (
              <div className="hidden sm:flex items-center gap-1 px-3 py-1 bg-amber-400 text-amber-950 font-black rounded-full text-xs shadow-xs">
                <Award className="w-3.5 h-3.5" /> Reward: ₹{tagDetails.reward}
              </div>
            )}
            {messages.length > 0 && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 rounded-xl bg-white/10 hover:bg-red-500 hover:text-white transition-all text-white/80"
                title="Delete Complete Chat"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* REWARD BANNER (MOBILE) */}
        {tagDetails?.reward > 0 && (
          <div className="sm:hidden bg-amber-100 border-b border-amber-200 px-4 py-2 text-xs font-bold text-amber-900 flex items-center justify-between">
            <span className="flex items-center gap-1"><Award className="w-4 h-4 text-amber-600" /> Cash Reward Offered by Owner</span>
            <span className="text-amber-950 font-extrabold">₹{tagDetails.reward}</span>
          </div>
        )}

        {/* MESSAGES LIST AREA */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50/70">
          
          {/* Welcome Message */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center max-w-md mx-auto my-2 text-xs text-emerald-950">
            <ShieldCheck className="w-6 h-6 text-emerald-700 mx-auto mb-1" />
            <strong className="block text-sm text-emerald-900 mb-1">Returnji Secure Messenger</strong>
            You are connected directly with the {isOwner ? "Finder" : "Item Owner"}. Coordinate pickup or dropoff safely.
          </div>

          {messages.length === 0 ? (
            <div className="text-center text-gray-400 text-xs py-10">
              No messages yet. Send a message below or use a quick template!
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.senderRole === senderRole || (user && msg.senderId === user.uid);
              return (
                <div
                  key={msg.id}
                  className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                >
                  <div className="text-[10px] text-gray-400 px-1 mb-0.5">
                    {msg.senderName || msg.senderRole}
                  </div>
                  <div
                    className={`max-w-[80%] sm:max-w-[70%] px-4 py-3 rounded-2xl text-sm font-medium shadow-2xs ${
                      isMe 
                        ? "bg-emerald-600 text-white rounded-br-none" 
                        : "bg-white text-gray-900 border border-gray-200 rounded-bl-none"
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* QUICK SUGGESTED REPLIES */}
        <div className="p-2 sm:p-3 bg-white border-t border-gray-100 flex gap-2 overflow-x-auto no-scrollbar scrollbar-none [::-webkit-scrollbar]:hidden" style={{ msOverflowStyle: 'none', scrollbarWidth: 'none' }}>
          {QUICK_REPLIES.map((reply, i) => (
            <button
              key={i}
              onClick={() => handleSendMessage(reply)}
              className="px-3.5 py-1.5 bg-gray-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-900 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border border-gray-200 shrink-0 cursor-pointer"
            >
              + {reply}
            </button>
          ))}
        </div>

        {/* CHAT INPUT FORM */}
        <form
          onSubmit={(e) => { e.preventDefault(); handleSendMessage(); }}
          className="p-3 sm:p-4 bg-white border-t border-gray-200 flex items-center gap-2"
        >
          <input
            type="text"
            placeholder="Type your message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            className="p-3 bg-dark-green text-white rounded-xl hover:bg-dark-green/90 transition-all disabled:opacity-50"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 font-bricolage">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl border border-gray-100 text-center animate-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mx-auto text-xl">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-gray-900">Delete Complete Chat?</h3>
              <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                This will permanently delete all message history for this conversation. This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2.5 px-4 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteChat}
                disabled={deletingChat}
                className="flex-1 py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition-colors shadow-xs cursor-pointer disabled:opacity-50"
              >
                {deletingChat ? "Deleting..." : "Yes, Delete"}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function ChatRoomPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-light-beige flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ChatRoomContent />
    </Suspense>
  );
}
