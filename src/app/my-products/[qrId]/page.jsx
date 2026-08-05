"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  doc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs,
  orderBy,
  onSnapshot,
  addDoc,
  deleteDoc,
  serverTimestamp
} from "firebase/firestore";
import { getQRProductInfo } from "@/lib/qrProductTypes";
import {
  MessageSquare,
  Edit3,
  Bell,
  ArrowLeft,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Send,
  MapPin,
  Clock,
  CheckCircle2,
  Lock,
  Search,
  Sparkles,
  Award,
  RefreshCw,
  ChevronLeft,
  Trash2
} from "lucide-react";
import Link from "next/link";

export default function ProductManagementPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, loading: authLoading } = useAuth();

  const rawQrId = params?.qrId || "";
  const qrId = decodeURIComponent(rawQrId).trim();
  const initialTab = searchParams.get("tab") || "chats";

  const [activeTab, setActiveTab] = useState(initialTab); // 'chats' | 'details' | 'notifications'
  const [productData, setProductData] = useState(null);
  const [productInfo, setProductInfo] = useState(getQRProductInfo(qrId, null));
  const [loading, setLoading] = useState(true);

  // Details Tab Form State
  const [itemName, setItemName] = useState("");
  const [category, setCategory] = useState("");
  const [reward, setReward] = useState("");
  const [contactNote, setContactNote] = useState("");
  const [status, setStatus] = useState("active");
  const [savingDetails, setSavingDetails] = useState(false);
  const [detailsSuccess, setDetailsSuccess] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  // Chats Tab State (WhatsApp Web Style)
  const defaultChatId = `chat_${qrId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
  const [selectedChatId, setSelectedChatId] = useState(defaultChatId);
  const [chatThreads, setChatThreads] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);
  const [mobileShowChatRoom, setMobileShowChatRoom] = useState(false);
  const messagesEndRef = useRef(null);

  // Notifications & Scans Tab State
  const [notifications, setNotifications] = useState([]);
  const [scans, setScans] = useState([]);
  const [loadingNotifications, setLoadingNotifications] = useState(false);

  // 1. Fetch Product Data
  const fetchProductData = async () => {
    if (!qrId) return;
    setLoading(true);

    let data = null;
    try {
      const snap = await getDoc(doc(db, "qrcodes", qrId));
      if (snap.exists()) {
        data = snap.data();
      }
    } catch (e) {
      console.warn("Firestore product read notice (checking local storage):", e?.message);
    }

    // Fallback to local storage if Firestore missing/permission issue
    if (!data) {
      try {
        const saved = JSON.parse(localStorage.getItem("returnji_user_tags") || "[]");
        data = saved.find((t) => t.qrId === qrId || t.id === qrId);
      } catch (e) {}
    }

    if (data) {
      setProductData(data);
      setItemName(data.itemName || "");
      setCategory(data.category || "");
      setReward(data.reward || 0);
      setContactNote(data.contactNote || "");
      setStatus(data.status === "lost" ? "lost" : "active");

      const info = getQRProductInfo(qrId, data);
      setProductInfo(info);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchProductData();
  }, [qrId, user]);

  // 2. Real-time Chat Messages Listener for active chat
  useEffect(() => {
    if (!selectedChatId) return;

    let unsubscribe = () => {};
    try {
      const messagesRef = collection(db, "chats", selectedChatId, "messages");
      const q = query(messagesRef, orderBy("createdAt", "asc"));

      unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const fetched = [];
          const seenIds = new Set();
          snapshot.forEach((docSnap) => {
            if (!seenIds.has(docSnap.id)) {
              seenIds.add(docSnap.id);
              fetched.push({ id: docSnap.id, ...docSnap.data() });
            }
          });
          setMessages(fetched);

          // Update real chat threads list if messages exist
          if (fetched.length > 0) {
            const lastMsg = fetched[fetched.length - 1];
            setChatThreads([
              {
                id: selectedChatId,
                finderName: "Finder Chat 1 (Live Session)",
                lastMessage: lastMsg?.text || "Chat started",
                updatedAt: "Live",
                unread: false
              }
            ]);
          } else {
            setChatThreads([]);
          }
        },
        (err) => {
          console.warn("Real-time chat listener notice:", err?.message);
        }
      );
    } catch (e) {}

    return () => unsubscribe();
  }, [selectedChatId]);

  // Auto scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message as Owner
  const handleSendMessage = async (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim() || !selectedChatId || sendingMessage) return;

    setSendingMessage(true);
    setInputText("");

    const newMsg = {
      text: text.trim(),
      senderRole: "Owner",
      senderId: user ? user.uid : "owner",
      senderName: "Owner",
      createdAt: serverTimestamp()
    };

    try {
      const messagesRef = collection(db, "chats", selectedChatId, "messages");
      await addDoc(messagesRef, newMsg);
    } catch (e) {
      console.warn("Firestore send message notice (updating local feed):", e?.message);
      // Fallback local feed update
      setMessages((prev) => [
        ...prev,
        {
          id: `local_${Date.now()}`,
          text: text.trim(),
          senderRole: "Owner",
          senderName: "Owner",
          createdAt: { toDate: () => new Date() }
        }
      ]);
    } finally {
      setSendingMessage(false);
    }
  };

  // Delete Complete Chat
  const [deletingChat, setDeletingChat] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDeleteChat = async () => {
    if (!selectedChatId) return;
    setDeletingChat(true);

    try {
      // 1. Delete all message documents in subcollection
      const messagesRef = collection(db, "chats", selectedChatId, "messages");
      const snap = await getDocs(messagesRef);
      const deletePromises = snap.docs.map((docSnap) => deleteDoc(docSnap.ref));
      await Promise.all(deletePromises);

      // 2. Delete parent chat document
      try {
        await deleteDoc(doc(db, "chats", selectedChatId));
      } catch (e) {}

    } catch (e) {
      console.warn("Firestore delete chat notice:", e?.message);
    }

    // Reset local feed state
    setMessages([]);
    setChatThreads([]);
    setDeletingChat(false);
    setShowDeleteConfirm(false);
  };

  // 3. Fetch Notifications & Scans for this Product (Real Data Only)
  useEffect(() => {
    if (!qrId || !user) return;
    setLoadingNotifications(true);

    async function loadNotifications() {
      const notifs = [];
      const scanLogs = [];

      try {
        const notifQuery = query(
          collection(db, "notifications"),
          where("qrId", "==", qrId)
        );
        const notifSnap = await getDocs(notifQuery);
        notifSnap.forEach((docSnap) => {
          notifs.push({ id: docSnap.id, ...docSnap.data() });
        });
      } catch (e) {}

      try {
        const scanQuery = query(
          collection(db, "scans"),
          where("qrId", "==", qrId)
        );
        const scanSnap = await getDocs(scanQuery);
        scanSnap.forEach((docSnap) => {
          scanLogs.push({ id: docSnap.id, ...docSnap.data() });
        });
      } catch (e) {}

      setNotifications(notifs);
      setScans(scanLogs);
      setLoadingNotifications(false);
    }

    loadNotifications();
  }, [qrId, user]);

  // 4. Handle Saving Details & Status Toggle
  const handleSaveDetails = async (e) => {
    e.preventDefault();
    setSavingDetails(true);
    setDetailsError("");
    setDetailsSuccess(false);

    const updatedFields = {
      itemName: itemName.trim(),
      category: category,
      reward: Number(reward || 0),
      contactNote: contactNote.trim(),
      status: status
    };

    try {
      const tagRef = doc(db, "qrcodes", qrId);
      await updateDoc(tagRef, {
        ...updatedFields,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("Firestore updateDoc permission notice (updating local storage):", err?.message);
    }

    // Update local storage backup
    try {
      const saved = JSON.parse(localStorage.getItem("returnji_user_tags") || "[]");
      const updated = saved.map((t) => {
        if (t.id === qrId || t.qrId === qrId) {
          return { ...t, ...updatedFields };
        }
        return t;
      });
      localStorage.setItem("returnji_user_tags", JSON.stringify(updated));
    } catch (e) {}

    setProductData((prev) => ({ ...prev, ...updatedFields }));
    setDetailsSuccess(true);
    setSavingDetails(false);
    setTimeout(() => setDetailsSuccess(false), 3000);
  };

  const QUICK_REPLIES = [
    "Thank you so much! Where can I meet you?",
    "Can you please drop it at the nearest Returnji Dropzone?",
    "I appreciate your help! What time suits you?"
  ];

  if (authLoading || loading) {
    return (
      <div className="h-screen bg-light-beige/50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-700 font-medium font-bricolage">Loading Product Management Hub...</p>
      </div>
    );
  }

  const isLost = status === "lost";

  return (
    <div className="h-screen max-h-screen overflow-hidden flex flex-col bg-light-beige/50 font-bricolage">
      
      {/* TOP HEADER */}
      <header className="bg-white border-b border-gray-200 px-4 sm:px-6 lg:px-8 py-3 shrink-0 z-30 shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            <Link
              href="/my-products"
              className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-700 flex items-center justify-center shrink-0"
              title="Back to My Products"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-200">
                  {qrId}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                  isLost ? "bg-red-500 text-white animate-pulse" : "bg-emerald-100 text-emerald-800"
                }`}>
                  {isLost ? "🚨 Reported Lost" : "🟢 Safe with Owner"}
                </span>
              </div>
              <h1 className="text-lg sm:text-2xl font-extrabold text-dark-green mt-0.5 line-clamp-1">
                {itemName || productData?.itemName || "Returnji Product Hub"}
              </h1>
            </div>
          </div>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <Link
              href={`/scan/${encodeURIComponent(qrId)}`}
              target="_blank"
              className="w-full sm:w-auto px-4 py-2 bg-emerald-50 text-emerald-900 font-bold rounded-xl text-xs hover:bg-emerald-100 transition-all flex items-center justify-center gap-1.5 border border-emerald-200/80"
            >
              <ExternalLink className="w-3.5 h-3.5 text-emerald-700" /> Preview Finder Scan Page
            </Link>
          </div>

        </div>
      </header>

      {/* MOBILE TOP TAB BAR (< md) */}
      <div className="px-4 pt-3 shrink-0 md:hidden">
        <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-white rounded-2xl border border-gray-200/80 shadow-2xs">
          <button
            onClick={() => {
              setActiveTab("chats");
              setMobileShowChatRoom(false);
            }}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "chats"
                ? "bg-dark-green text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <MessageSquare className="w-4 h-4 text-emerald-400" />
            <span>Chats</span>
            {chatThreads.length > 0 && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-emerald-500 text-white font-extrabold">
                {chatThreads.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("details")}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "details"
                ? "bg-dark-green text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Edit3 className="w-4 h-4 text-amber-400" />
            <span>Details</span>
          </button>

          <button
            onClick={() => setActiveTab("notifications")}
            className={`py-2.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === "notifications"
                ? "bg-dark-green text-white shadow-xs"
                : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            <Bell className="w-4 h-4 text-sky-400" />
            <span>Alerts</span>
            {(notifications.length > 0 || scans.length > 0) && (
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-sky-500 text-white font-extrabold">
                {notifications.length + scans.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* MAIN CONTAINER (DESKTOP SIDEBAR + CONTENT AREA - ZERO BROWSER SCROLL) */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-6 lg:p-8 flex flex-col md:flex-row gap-6 overflow-hidden min-h-0">
        
        {/* DESKTOP SIDEBAR (>= md) */}
        <aside className="hidden md:flex w-60 lg:w-64 shrink-0 h-full bg-white rounded-3xl p-4 shadow-sm border border-gray-200/80 flex-col justify-between overflow-y-auto">
          <div className="space-y-2">
            
            {/* 1. CHATS TAB */}
            <button
              onClick={() => setActiveTab("chats")}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-between transition-all cursor-pointer ${
                activeTab === "chats"
                  ? "bg-dark-green text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <MessageSquare className="w-5 h-5 text-emerald-400" />
                <span>Finder Chats</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === "chats" ? "bg-emerald-500 text-white" : "bg-emerald-100 text-emerald-800"
              }`}>
                {chatThreads.length}
              </span>
            </button>

            {/* 2. DETAILS & STATUS TAB */}
            <button
              onClick={() => setActiveTab("details")}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-between transition-all cursor-pointer ${
                activeTab === "details"
                  ? "bg-dark-green text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <span>Details & Status</span>
              </div>
              {isLost && (
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              )}
            </button>

            {/* 3. NOTIFICATIONS TAB */}
            <button
              onClick={() => setActiveTab("notifications")}
              className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-between transition-all cursor-pointer ${
                activeTab === "notifications"
                  ? "bg-dark-green text-white shadow-md"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-sky-400" />
                <span>Notifications</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                activeTab === "notifications" ? "bg-sky-500 text-white" : "bg-sky-100 text-sky-800"
              }`}>
                {notifications.length + scans.length}
              </span>
            </button>

          </div>

          {/* SIDEBAR FOOTER CARD */}
          <div className="pt-6 border-t border-gray-100 mt-6 text-xs text-gray-500 space-y-2">
            <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
              <ShieldCheck className="w-4 h-4" /> Returnji Security Active
            </div>
            <p className="text-[11px] leading-relaxed">
              Your phone number is hidden. All finder interactions are routed through secure anonymous chats.
            </p>
          </div>
        </aside>

        {/* MAIN PANEL CONTENT */}
        <main className="flex-1 h-full bg-white rounded-3xl shadow-sm border border-gray-200/80 overflow-hidden flex flex-col min-h-0">
          
          {/* TAB 1: CHATS (WHATSAPP WEB RESPONSIVE LAYOUT) */}
          {activeTab === "chats" && (
            <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden min-h-0">
              
              {/* LEFT CHAT LIST COLUMN */}
              <div className={`w-full md:w-72 lg:w-80 border-r border-gray-200 bg-gray-50/50 flex-col shrink-0 h-full overflow-hidden ${
                mobileShowChatRoom ? "hidden md:flex" : "flex"
              }`}>
                <div className="p-4 border-b border-gray-200 bg-white shrink-0">
                  <h3 className="font-extrabold text-base text-dark-green mb-2">Finder Chats</h3>
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    <input
                      type="text"
                      placeholder="Search chats..."
                      className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-xs bg-gray-50 focus:bg-white focus:outline-none font-medium"
                    />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto divide-y divide-gray-100 min-h-0">
                  {chatThreads.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 text-xs leading-relaxed space-y-2">
                      <p className="font-semibold text-gray-700">No finder chat threads yet.</p>
                      <p className="text-[11px] text-gray-500">
                        When a finder scans your lost QR tag, their live chat session will appear here.
                      </p>
                    </div>
                  ) : (
                    chatThreads.map((thread) => {
                      const isSelected = thread.id === selectedChatId;
                      return (
                        <button
                          key={thread.id}
                          onClick={() => {
                            setSelectedChatId(thread.id);
                            setMobileShowChatRoom(true);
                          }}
                          className={`w-full p-4 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                            isSelected ? "bg-emerald-50 border-l-4 border-emerald-600" : "hover:bg-gray-100/80"
                          }`}
                        >
                          <div className="w-10 h-10 rounded-full bg-dark-green text-light-beige font-bold flex items-center justify-center text-sm shrink-0">
                            {thread.finderName.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                              <h4 className="font-bold text-sm text-dark-green truncate">{thread.finderName}</h4>
                              <span className="text-[10px] text-gray-400 shrink-0">{thread.updatedAt}</span>
                            </div>
                            <p className="text-xs text-gray-600 truncate">{thread.lastMessage}</p>
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* RIGHT ACTIVE CHAT ROOM WINDOW */}
              <div className={`flex-1 flex-col bg-light-beige/30 h-full overflow-hidden min-h-0 ${
                mobileShowChatRoom ? "flex" : "hidden md:flex"
              }`}>
                
                {/* Chat Header */}
                <div className="p-3.5 sm:p-4 bg-white border-b border-gray-200 flex items-center justify-between shadow-2xs shrink-0">
                  <div className="flex items-center gap-3">
                    {/* Mobile Back Button to Chat List */}
                    <button
                      onClick={() => setMobileShowChatRoom(false)}
                      className="md:hidden p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700"
                      title="Back to Chat List"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>

                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-emerald-700 text-white font-bold flex items-center justify-center text-sm shrink-0">
                      F
                    </div>
                    <div>
                      <h3 className="font-bold text-sm sm:text-base text-dark-green">Finder Chat (Live Room)</h3>
                      <p className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                        <Lock className="w-3 h-3" /> Anonymous • Phone Hidden
                      </p>
                    </div>
                  </div>

                  {/* Delete Complete Chat Button */}
                  {messages.length > 0 && (
                    <button
                      onClick={() => setShowDeleteConfirm(true)}
                      className="px-3 py-1.5 rounded-xl text-red-600 hover:bg-red-50 border border-red-200 transition-all flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                      title="Delete Complete Chat"
                    >
                      <Trash2 className="w-4 h-4 text-red-600 shrink-0" />
                      <span className="hidden sm:inline">Delete Chat</span>
                    </button>
                  )}
                </div>

                {/* Messages Feed */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 min-h-0">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                      <div className="w-14 h-14 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center text-xl">
                        💬
                      </div>
                      <h4 className="font-bold text-dark-green text-base sm:text-lg">No Messages Yet</h4>
                      <p className="text-xs sm:text-sm text-gray-600 max-w-sm leading-relaxed">
                        When an honest finder scans your lost QR code, live messages will appear here in real time.
                      </p>
                      {status !== "lost" && (
                        <button
                          onClick={() => setActiveTab("details")}
                          className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 bg-red-500 text-white rounded-2xl text-xs font-bold hover:bg-red-600 transition-all shadow-xs cursor-pointer"
                        >
                          <AlertTriangle className="w-4 h-4" /> Switch Status to "Lost"
                        </button>
                      )}
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const isOwnerMsg =
                        msg.senderRole === "Owner" ||
                        msg.senderName === "Owner" ||
                        (user && msg.senderId === user.uid) ||
                        (user?.displayName && msg.senderName === user.displayName);

                      return (
                        <div
                          key={msg.id}
                          className={`flex flex-col ${isOwnerMsg ? "items-end" : "items-start"} space-y-1 mb-2`}
                        >
                          <span className={`text-[10px] font-bold px-1 ${
                            isOwnerMsg ? "text-emerald-800" : "text-gray-500"
                          }`}>
                            {isOwnerMsg ? "Owner" : "Finder"}
                          </span>
                          <div
                            className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-xs sm:text-sm shadow-xs leading-relaxed ${
                              isOwnerMsg
                                ? "bg-dark-green text-white rounded-br-none"
                                : "bg-white text-gray-900 border border-gray-200/90 rounded-bl-none font-medium"
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

                {/* Quick Reply Chips */}
                {messages.length > 0 && (
                  <div className="p-2.5 bg-white/95 border-t border-gray-200/60 flex flex-wrap gap-1.5 shrink-0">
                    {QUICK_REPLIES.map((reply, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(reply)}
                        className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200/80 rounded-full text-xs font-bold transition-colors cursor-pointer"
                      >
                        + {reply}
                      </button>
                    ))}
                  </div>
                )}

                {/* Input Bar */}
                <div className="p-3 sm:p-4 bg-white border-t border-gray-200 shrink-0">
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleSendMessage();
                    }}
                    className="flex items-center gap-2"
                  >
                    <input
                      type="text"
                      placeholder="Type your message to finder..."
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-2xl text-xs sm:text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                    />
                    <button
                      type="submit"
                      disabled={sendingMessage || !inputText.trim()}
                      className="p-3 bg-dark-green text-white rounded-2xl hover:bg-dark-green/90 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: DETAILS & STATUS */}
          {activeTab === "details" && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 max-w-3xl min-h-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-dark-green">Product Details & Lost Status</h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  Update item information and switch product status between Safe and Lost.
                </p>
              </div>

              {detailsSuccess && (
                <div className="p-4 bg-emerald-100 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2 border border-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Details & Product Status Updated Successfully!
                </div>
              )}

              {detailsError && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-xs font-semibold">
                  {detailsError}
                </div>
              )}

              <form onSubmit={handleSaveDetails} className="space-y-5">
                
                {/* STATUS TOGGLE CARDS */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                    Product Lost Status Toggle
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setStatus("active")}
                      className={`p-4 rounded-2xl text-left border-2 transition-all cursor-pointer ${
                        status === "active"
                          ? "border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-200"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <ShieldCheck className="w-5 h-5 text-emerald-700" />
                        <span className="font-extrabold text-sm text-emerald-900">🟢 Active (Safe with Owner)</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Finders scanning your QR tag will see that your product is safe with its owner.
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setStatus("lost")}
                      className={`p-4 rounded-2xl text-left border-2 transition-all cursor-pointer ${
                        status === "lost"
                          ? "border-red-500 bg-red-50/60 ring-2 ring-red-200"
                          : "border-gray-200 bg-white hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <span className="font-extrabold text-sm text-red-900">🚨 Reported Lost</span>
                      </div>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Activates live finder recovery page with chat, GPS location sharing, and dropzone hub links.
                      </p>
                    </button>
                  </div>
                </div>

                {/* Item Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Item Name / Description
                  </label>
                  <input
                    type="text"
                    required
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    placeholder="e.g. Returnji QR Keychain - Office Keys"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  >
                    <option value="Keys & Valuables">Keys & Valuables</option>
                    <option value="Water Bottle & Lunch Box">Water Bottle & Lunch Box</option>
                    <option value="Notebooks & Textbooks">Notebooks & Textbooks</option>
                    <option value="Laptops & Tablets">Laptops & Tablets</option>
                    <option value="Earbuds & Audio Cases">Earbuds & Audio Cases</option>
                    <option value="Travel Backpack">Travel Backpack</option>
                    <option value="Other Personal Assets">Other Personal Assets</option>
                  </select>
                </div>

                {/* Cash Reward */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Finder Cash Reward (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={reward}
                    onChange={(e) => setReward(e.target.value)}
                    placeholder="e.g. 250"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Finder Note */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Finder Instructions Note
                  </label>
                  <textarea
                    rows={3}
                    value={contactNote}
                    onChange={(e) => setContactNote(e.target.value)}
                    placeholder="e.g. Please send a chat message or drop at nearest metro hub."
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none font-medium"
                  />
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <button
                    type="submit"
                    disabled={savingDetails}
                    className="w-full sm:w-auto px-8 py-3.5 bg-dark-green text-white font-bold rounded-2xl text-sm hover:bg-dark-green/90 transition-all shadow-md cursor-pointer disabled:opacity-50"
                  >
                    {savingDetails ? "Saving Details..." : "Save Product Details"}
                  </button>
                </div>

              </form>
            </div>
          )}

          {/* TAB 3: NOTIFICATIONS & LOCATIONS (REAL DATA ONLY) */}
          {activeTab === "notifications" && (
            <div className="flex-1 overflow-y-auto p-5 sm:p-8 space-y-6 min-h-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-extrabold text-dark-green">Scanned Locations & Finder Notifications</h2>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  GPS location scans and instant finder alerts sent for this product.
                </p>
              </div>

              {loadingNotifications ? (
                <div className="py-12 text-center text-gray-500 text-sm font-medium">
                  Loading notifications...
                </div>
              ) : notifications.length === 0 && scans.length === 0 ? (
                <div className="p-8 sm:p-12 bg-gray-50 rounded-3xl border border-gray-200/80 text-center space-y-3">
                  <div className="w-14 h-14 bg-sky-100 text-sky-800 rounded-full flex items-center justify-center mx-auto text-xl mb-1">
                    🔔
                  </div>
                  <h4 className="font-bold text-base sm:text-lg text-dark-green">No Location Scans Yet</h4>
                  <p className="text-xs sm:text-sm text-gray-600 max-w-sm mx-auto leading-relaxed">
                    When someone scans your lost QR code and shares their GPS location, coordinates and Google Maps directions will appear here in real time.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {notifications.map((notif) => (
                    <div
                      key={notif.id}
                      className="p-4 sm:p-5 rounded-2xl border border-gray-200/90 bg-emerald-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl shrink-0 mt-0.5">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-dark-green mb-0.5">{notif.title}</h4>
                          <p className="text-xs text-gray-600 mb-2">{notif.message}</p>
                          {notif.mapsLink && (
                            <a
                              href={notif.mapsLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> View Scanned Location on Google Maps
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {scans.map((scan) => (
                    <div
                      key={scan.id}
                      className="p-4 sm:p-5 rounded-2xl border border-gray-200/90 bg-sky-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2.5 bg-sky-100 text-sky-800 rounded-xl shrink-0 mt-0.5">
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-dark-green mb-0.5">
                            📍 Scanned near ({scan.latitude?.toFixed(4)}, {scan.longitude?.toFixed(4)})
                          </h4>
                          <p className="text-xs text-gray-600 mb-2">GPS coordinates logged by finder browser.</p>
                          {scan.mapsLink && (
                            <a
                              href={scan.mapsLink}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:underline"
                            >
                              <ExternalLink className="w-3.5 h-3.5" /> Open Google Maps <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </main>
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
                This will permanently delete all message history for this finder conversation. This action cannot be undone.
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
