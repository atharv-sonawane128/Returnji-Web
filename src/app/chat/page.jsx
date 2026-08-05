"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { MessageSquare, ShieldCheck, QrCode, ArrowRight, Sparkles, User, Tag } from "lucide-react";
import Link from "next/link";

export default function ChatListPage() {
  const { user, loading: authLoading } = useAuth();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOwnerChats() {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      let fetched = [];

      try {
        const q = query(collection(db, "qrcodes"), where("ownerId", "==", user.uid));
        const snap = await getDocs(q);
        snap.forEach((docSnap) => {
          fetched.push({ id: docSnap.id, ...docSnap.data() });
        });
      } catch (err) {
        console.warn("Firestore chat list query permission notice (using local fallback):", err?.message);
      }

      try {
        const saved = JSON.parse(localStorage.getItem("returnji_user_tags") || "[]");
        const userSaved = saved.filter((t) => !t.ownerId || t.ownerId === user.uid);
        userSaved.forEach((localTag) => {
          const id = localTag.qrId || localTag.id;
          if (!fetched.some((f) => f.id === id || f.qrId === id)) {
            fetched.push({ id, ...localTag });
          }
        });
      } catch (e) {}

      setProducts(fetched);
      setLoading(false);
    }

    fetchOwnerChats();
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-light-beige/50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-700 font-medium font-bricolage">Loading Chat Conversations...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-light-beige/50 py-16 px-4 sm:px-6 lg:px-8 font-bricolage">
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
            <MessageSquare className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-dark-green">Sign In for Owner Chat</h1>
          <p className="text-gray-600 text-sm">
            Please sign in to view your live chat messages with finders who scanned your Returnji QR tags.
          </p>
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-dark-green text-light-beige rounded-2xl font-bold hover:opacity-90 transition-opacity"
          >
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-beige/50 py-10 px-4 sm:px-6 lg:px-8 font-bricolage">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldCheck className="w-4 h-4" /> Secure Anonymous Messaging
          </div>
          <h1 className="text-3xl font-extrabold text-dark-green">Owner Chat Conversations</h1>
          <p className="text-gray-600 text-sm mt-1">
            Select an activated product below to view and reply to live chat messages from finders.
          </p>
        </div>

        {/* Chat Threads List */}
        {products.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 max-w-xl mx-auto space-y-4">
            <div className="w-16 h-16 bg-light-beige text-dark-green rounded-full flex items-center justify-center mx-auto text-2xl">
              💬
            </div>
            <h3 className="text-xl font-bold text-dark-green">No Activated Products Yet</h3>
            <p className="text-gray-600 text-sm">
              Activate your Returnji QR tags in My Products to start receiving chats from finders when an item is lost.
            </p>
            <Link
              href="/my-products"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-dark-green text-white rounded-2xl font-bold text-sm hover:bg-dark-green/90 transition-all mt-2"
            >
              Go to My Products
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {products.map((product) => {
              const qrId = product.qrId || product.id;
              const chatId = `chat_${qrId.replace(/[^a-zA-Z0-9_-]/g, "")}`;
              const isLost = product.status === "lost";

              return (
                <Link
                  key={product.id}
                  href={`/chat/${chatId}?qrId=${encodeURIComponent(qrId)}`}
                  className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm hover:shadow-md border border-gray-100 hover:border-emerald-500 transition-all flex items-center justify-between gap-4 group block"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                      isLost ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-800"
                    }`}>
                      <MessageSquare className="w-6 h-6" />
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-lg text-dark-green group-hover:text-emerald-700 transition-colors">
                          {product.itemName || "Returnji Product"}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                          isLost ? "bg-red-500 text-white" : "bg-emerald-100 text-emerald-800"
                        }`}>
                          {isLost ? "Reported Lost" : "Safe with Owner"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200/60">
                          {qrId}
                        </span>
                        <span>• {product.category || "Asset"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-sm font-bold text-dark-green group-hover:translate-x-1 transition-transform shrink-0">
                    Open Chat <ArrowRight className="w-4 h-4 text-emerald-600" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
