"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, orderBy, onSnapshot, doc, updateDoc, addDoc, serverTimestamp } from "firebase/firestore";
import Link from "next/link";
import { Package, Calendar, Clock, Filter, ArrowRight, Loader2, CheckCircle2, MapPin, Truck, ShoppingBag, Box, ChevronDown, ChevronUp, Key, Star, Check } from "lucide-react";

export default function MyOrdersPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("recent"); // "recent", "current_month", "last_month", "all"
  const [permissionError, setPermissionError] = useState(false);
  const [ratingModalOrder, setRatingModalOrder] = useState(null);
  const [selectedRating, setSelectedRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [ratingComment, setRatingComment] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Real-time Firestore subscription to update tracking live
  useEffect(() => {
    if (!authLoading && user) {
      setLoading(true);
      setPermissionError(false);
      const ordersRef = collection(db, "orders");
      const q = query(ordersRef, where("userId", "==", user.uid));

      const unsubscribe = onSnapshot(
        q,
        async (snapshot) => {
          const fetchedOrders = [];
          
          // Also fetch user's ratings to match existing reviews
          let ratedOrdersMap = {};
          try {
            const ratingsSnapshot = await getDocs(query(collection(db, "ratings"), where("userId", "==", user.uid)));
            ratingsSnapshot.forEach(docSnap => {
              const d = docSnap.data();
              if (d.orderId) {
                ratedOrdersMap[d.orderId] = Number(d.rating) || 5;
              }
            });
          } catch (rErr) {
            console.warn("Could not query ratings collection:", rErr);
          }

          snapshot.forEach((doc) => {
            const data = doc.data();
            if (data.paymentStatus !== "pending") {
              const isRated = Boolean(data.ratingSubmitted || ratedOrdersMap[doc.id]);
              const score = data.ratingScore || ratedOrdersMap[doc.id] || 5;
              fetchedOrders.push({
                id: doc.id,
                ...data,
                ratingSubmitted: isRated,
                ratingScore: score
              });
            }
          });

          // Sort descending by createdAt
          fetchedOrders.sort((a, b) => {
            const timeA = a.createdAt?.seconds || 0;
            const timeB = b.createdAt?.seconds || 0;
            return timeB - timeA;
          });

          setOrders(fetchedOrders);
          setLoading(false);
        },
        (error) => {
          console.error("Realtime subscription error:", error);
          if (error?.code === "permission-denied" || error?.message?.includes("permissions")) {
            setPermissionError(true);
          }
          setLoading(false);
        }
      );

      return () => unsubscribe();
    }
  }, [user, authLoading]);

  // Filter & Sort Logic
  const getFilteredOrders = () => {
    if (!orders || orders.length === 0) return [];

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    switch (filter) {
      case "recent":
        return orders.slice(0, 10);

      case "current_month":
        return orders.filter((order) => {
          if (!order.createdAt) return false;
          const orderDate = order.createdAt.seconds 
            ? new Date(order.createdAt.seconds * 1000)
            : new Date(order.createdAt);
          return orderDate.getFullYear() === currentYear && orderDate.getMonth() === currentMonth;
        });

      case "last_month":
        return orders.filter((order) => {
          if (!order.createdAt) return false;
          const orderDate = order.createdAt.seconds 
            ? new Date(order.createdAt.seconds * 1000)
            : new Date(order.createdAt);
          const targetMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const targetYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return orderDate.getFullYear() === targetYear && orderDate.getMonth() === targetMonth;
        });

      case "all":
      default:
        return orders;
    }
  };

  const filteredOrders = getFilteredOrders();

  const formatDate = (timestamp) => {
    if (!timestamp) return "N/A";
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusBadge = (status) => {
    switch (status?.toLowerCase()) {
      case "delivered":
        return <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold"><CheckCircle2 className="w-3.5 h-3.5" /> Delivered</span>;
      case "shipped":
        return <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold"><Truck className="w-3.5 h-3.5" /> Shipped</span>;
      case "processing":
        return <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-xs font-bold"><Clock className="w-3.5 h-3.5" /> Processing</span>;
      default:
        return <span className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold"><Clock className="w-3.5 h-3.5" /> Order Placed</span>;
    }
  };

  const getPaymentBadge = (status) => {
    if (status?.toLowerCase() === "paid") {
      return <span className="bg-emerald-100 text-emerald-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Paid</span>;
    }
    return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Pending</span>;
  };

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-bright-white pt-28 pb-20 px-4 flex flex-col items-center justify-center font-bricolage">
        <Loader2 className="w-10 h-10 animate-spin text-dark-green mb-4" />
        <p className="text-dark-green font-semibold">Loading your orders...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-bright-white pt-24 pb-20 px-4 sm:px-6 lg:px-8 font-bricolage">
      <div className="max-w-5xl mx-auto">
        
        {/* Header & Filter Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-ultra text-4xl sm:text-5xl text-dark-green tracking-tight">MY ORDERS</h1>
            <p className="text-dark-green/70 text-sm mt-1">Track and review all your Returnji purchases</p>
          </div>

          <div className="flex items-center gap-2 bg-light-beige/50 border border-gray-200 rounded-2xl px-4 py-2 self-start sm:self-auto">
            <Filter className="w-4 h-4 text-dark-green" />
            <span className="text-xs font-bold text-dark-green uppercase">Sort by:</span>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="bg-transparent text-sm font-bold text-dark-green focus:outline-none cursor-pointer"
            >
              <option value="recent">Recent (Last 10)</option>
              <option value="current_month">Current Month</option>
              <option value="last_month">Last Month</option>
              <option value="all">All Time</option>
            </select>
          </div>
        </div>

        {/* Permission Error Banner */}
        {permissionError && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 text-amber-800 text-sm font-medium">
            ⚠️ <strong>Firestore Security Rules required:</strong> Read access to the <code>orders</code> collection is blocked by your Firebase rules. Update your Firestore Rules in the Firebase Console to permit logged-in users to read their orders.
          </div>
        )}

        {/* Empty State */}
        {filteredOrders.length === 0 ? (
          <div className="bg-light-beige/30 border border-gray-200 rounded-3xl p-12 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-light-beige flex items-center justify-center mb-4 text-dark-green">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-2xl font-bold text-dark-green mb-2">No orders found</h3>
            <p className="text-dark-green/70 max-w-md mb-6">
              {filter === "all" 
                ? "You haven't placed any orders yet. Explore our shop to safeguard your belongings!" 
                : "No orders match the selected filter criteria."}
            </p>
            <Link
              href="/shop"
              className="inline-flex items-center gap-2 bg-dark-green text-light-beige px-8 py-4 rounded-full font-bold hover:opacity-90 transition-opacity"
            >
              Explore Shop <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ) : (
          /* Orders List */
          <div className="space-y-6">
            {filteredOrders.map((order) => (
              <OrderCard 
                key={order.id} 
                order={order} 
                formatDate={formatDate} 
                getPaymentBadge={getPaymentBadge} 
                getStatusBadge={getStatusBadge} 
                onOpenRatingModal={(targetOrder) => {
                  setRatingModalOrder(targetOrder);
                  setSelectedRating(5);
                  setRatingComment("");
                }}
              />
            ))}
          </div>
        )}

      </div>

      {/* Rating Modal (Dark Green Theme matching reference image) */}
      {ratingModalOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 font-bricolage">
          <div className="bg-[#0f291e] text-light-beige border border-emerald-900/60 w-full max-w-lg rounded-[2.5rem] p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-emerald-900/50 pb-4">
              <div>
                <h3 className="font-ultra text-2xl text-white tracking-wide">Rate Your Order</h3>
                <p className="text-xs text-emerald-400 mt-1 font-semibold">Order ID: {ratingModalOrder.id.slice(0, 10)}</p>
              </div>
              <button 
                onClick={() => setRatingModalOrder(null)}
                className="text-gray-400 hover:text-white text-xl font-bold w-8 h-8 rounded-full flex items-center justify-center hover:bg-white/10 transition-colors"
              >
                ✕
              </button>
            </div>

            {/* List of items being rated */}
            <div>
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2">PRODUCTS IN THIS ORDER:</p>
              <div className="space-y-2 max-h-36 overflow-y-auto pr-1 scrollbar-hide">
                {ratingModalOrder.items?.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 bg-[#091c14] p-3 rounded-2xl border border-emerald-900/40">
                    <OrderItemImage item={item} className="w-10 h-10" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{item.name}</p>
                      <p className="text-[11px] text-emerald-400 font-medium mt-0.5">Qty: {item.quantity}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Interactive 5-Star Rating Selector */}
            <div className="text-center bg-[#091c14] p-6 rounded-2xl border border-emerald-900/40 space-y-3">
              <p className="text-xs font-bold text-emerald-400 uppercase tracking-wider">OVERALL PRODUCT & DELIVERY SCORE</p>
              <div className="flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => {
                  const active = (hoverRating || selectedRating) >= star;
                  return (
                    <button
                      key={star}
                      type="button"
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(0)}
                      onClick={() => setSelectedRating(star)}
                      className="p-1 cursor-pointer transition-transform hover:scale-125 focus:outline-none"
                    >
                      <Star className={`w-8 h-8 ${active ? 'fill-amber-400 text-amber-400' : 'text-emerald-900'}`} />
                    </button>
                  );
                })}
              </div>
              <p className="text-xs font-bold text-amber-400 flex items-center justify-center gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>
                  {selectedRating === 5 && "Fantastic! Perfect score"}
                  {selectedRating === 4 && "Great experience"}
                  {selectedRating === 3 && "Good product"}
                  {selectedRating === 2 && "Could be better"}
                  {selectedRating === 1 && "Needs improvement"}
                </span>
              </p>
            </div>

            {/* Review Comment (Optional) */}
            <div>
              <label className="block text-xs font-bold text-emerald-400 mb-2">Your Review / Experience (Optional)</label>
              <textarea
                rows={3}
                placeholder="Share details about the product build quality, campus dropzone delivery..."
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                className="w-full px-4 py-3 bg-[#091c14] border border-emerald-900/60 rounded-2xl text-xs text-emerald-100 placeholder-emerald-800 focus:outline-none focus:border-emerald-400 transition-all resize-none font-bricolage"
              />
            </div>

            {/* Submit Action */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRatingModalOrder(null)}
                className="flex-1 py-3.5 px-5 bg-[#17382a] text-emerald-100 rounded-2xl font-bold text-sm hover:bg-[#1f4a38] transition-all cursor-pointer border border-emerald-900/40"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingRating}
                onClick={async () => {
                  if (!ratingModalOrder) return;
                  try {
                    setIsSubmittingRating(true);
                    const now = new Date();

                    // 1. Add review entries for every product item in this order
                    if (ratingModalOrder.items && Array.isArray(ratingModalOrder.items)) {
                      for (const item of ratingModalOrder.items) {
                        try {
                          await addDoc(collection(db, "ratings"), {
                            orderId: ratingModalOrder.id,
                            userId: user?.uid || ratingModalOrder.userId || "guest",
                            userName: user?.displayName || ratingModalOrder.customerName || "Verified Customer",
                            productId: item.productId || item.id || "",
                            productName: item.name || "",
                            rating: selectedRating,
                            comment: ratingComment,
                            createdAt: now
                          });
                        } catch (e) {
                          console.warn("Could not save to 'ratings' collection (check Firestore Security Rules):", e);
                        }
                      }
                    }

                    // 2. Mark order as rated in Firestore
                    try {
                      const orderRef = doc(db, "orders", ratingModalOrder.id);
                      await updateDoc(orderRef, {
                        ratingSubmitted: true,
                        ratingScore: selectedRating,
                        ratingComment: ratingComment,
                        ratedAt: now
                      });
                    } catch (orderUpdateErr) {
                      console.warn("Could not update order doc:", orderUpdateErr);
                    }

                    // Update local state in case real-time stream is slow
                    setOrders(prev => prev.map(o => o.id === ratingModalOrder.id ? {
                      ...o,
                      ratingSubmitted: true,
                      ratingScore: selectedRating,
                      ratingComment: ratingComment
                    } : o));

                    setRatingModalOrder(null);
                    setShowSuccessModal(true);
                  } catch (err) {
                    console.error("Error submitting rating:", err);
                    setRatingModalOrder(null);
                    setShowSuccessModal(true);
                  } finally {
                    setIsSubmittingRating(false);
                  }
                }}
                className="flex-1 py-3.5 px-5 bg-[#00c985] text-[#052116] rounded-2xl font-bold text-sm hover:bg-[#00e697] active:scale-95 transition-all shadow-md shadow-[#00c985]/20 disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmittingRating ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit Review"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Thank You Success Modal Popup */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 font-bricolage">
          <div className="bg-bright-white text-dark-green border border-gray-200 w-full max-w-sm rounded-[2.5rem] p-6 sm:p-8 shadow-2xl space-y-5 text-center animate-in zoom-in-95 duration-150">
            <div className="w-16 h-16 rounded-3xl bg-light-beige border border-gray-200 flex items-center justify-center text-dark-green mx-auto text-2xl">
              🎉
            </div>

            <div className="space-y-1.5">
              <h3 className="font-ultra text-2xl text-dark-green">Thank You!</h3>
              <p className="text-xs text-dark-green/70 leading-relaxed">
                Your rating and product reviews have been submitted successfully.
              </p>
            </div>

            <button
              onClick={() => setShowSuccessModal(false)}
              className="w-full py-3.5 px-5 bg-dark-green text-light-beige rounded-2xl font-bold text-sm hover:opacity-95 transition-all shadow-sm cursor-pointer"
            >
              Great, thanks!
            </button>
          </div>
        </div>
      )}
    </main>
  );
}

function OrderCard({ order, formatDate, getPaymentBadge, getStatusBadge, onOpenRatingModal }) {
  const [showTracking, setShowTracking] = useState(false);

  // Map tracking stage to index (0-3)
  const currentStage = order.userTrackingStatus || 
    (order.adminStatus === 'delivered' || order.status === 'delivered' ? 'delivered' :
     order.adminStatus === 'at_dropzone' || order.status === 'at_dropzone' ? 'at_dropzone' :
     order.adminStatus === 'packing' || order.status === 'packing' ? 'packing' : 'confirmed');
  
  const stages = [
    { key: "confirmed", title: "Order Confirmed", desc: "Order placed and confirmed", icon: ShoppingBag },
    { key: "packing", title: "Packing", desc: "Your items are being packed", icon: Box },
    { key: "at_dropzone", title: "At Dropzone", desc: "Order reached your dropzone location", icon: Truck },
    { key: "delivered", title: "Delivered", desc: "Order handed over to customer", icon: MapPin },
  ];

  const getStageIndex = (stageKey) => {
    switch(stageKey) {
      case "confirmed": return 0;
      case "packing": return 1;
      case "at_dropzone": return 2;
      case "delivered": return 3;
      default: return 0;
    }
  };

  const activeIndex = getStageIndex(currentStage);

  return (
    <div className="bg-white border border-gray-200 rounded-3xl p-6 sm:p-8 shadow-sm hover:shadow-md transition-shadow">
      {/* Order Meta Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-gray-100">
        <div>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Order ID</span>
          <span className="font-mono text-sm font-bold text-dark-green">{order.id}</span>
        </div>
        <div>
          <span className="text-xs text-gray-400 font-bold uppercase tracking-wider block">Date</span>
          <span className="text-sm font-semibold text-dark-green flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-dark-green/60" />
            {formatDate(order.createdAt)}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {getPaymentBadge(order.paymentStatus)}
          <button
            onClick={() => setShowTracking(!showTracking)}
            className="inline-flex items-center gap-1.5 bg-dark-green text-light-beige px-4 py-1.5 rounded-full text-xs font-bold hover:bg-dark-green/90 transition-colors shadow-sm"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Track Order</span>
            {showTracking ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Track Order Timeline (Matching image layout) */}
      {showTracking && (
        <div className="my-6 p-6 bg-slate-50/70 border border-slate-200/80 rounded-3xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-200/60">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 bg-white px-3 py-1 rounded-full border border-slate-200">
              Timeline
            </span>
            <span className={`text-xs font-bold px-3 py-1 rounded-full ${
              activeIndex === 3 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-sky-100 text-sky-800'
            }`}>
              ● {activeIndex === 3 ? 'Completed' : 'In Progress'}
            </span>
          </div>

          {/* Vertical Timeline */}
          <div className="space-y-6 relative pl-2">
            {stages.map((stg, i) => {
              const IconComp = stg.icon;
              const isPassed = i <= activeIndex;
              const isCurrent = i === activeIndex;

              return (
                <div key={stg.key} className="flex items-start gap-4 relative">
                  {/* Vertical Connecting Line */}
                  {i < stages.length - 1 && (
                    <div className={`absolute left-[19px] top-[38px] w-[2px] h-[calc(100%+8px)] ${
                      i < activeIndex ? 'bg-emerald-500' : 'bg-slate-200'
                    }`} />
                  )}

                  {/* Circle Icon Badge */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10 transition-colors ${
                    isPassed 
                      ? 'bg-emerald-600 text-white shadow-sm ring-4 ring-emerald-50' 
                      : 'bg-white border-2 border-slate-200 text-slate-400'
                  }`}>
                    <IconComp className="w-5 h-5" />
                  </div>

                  {/* Text Details */}
                  <div className="pt-1 flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className={`text-sm font-bold ${isPassed ? 'text-slate-900' : 'text-slate-400'}`}>
                        {stg.title}
                      </h4>
                      <span className="text-xs text-slate-400 font-medium">
                        {isPassed ? formatDate(order.createdAt) : ''}
                      </span>
                    </div>
                    <p className={`text-xs mt-0.5 ${isPassed ? 'text-slate-600' : 'text-slate-400'}`}>
                      {stg.desc}
                    </p>

                    {/* Show Pickup OTP if At Dropzone stage */}
                    {stg.key === "at_dropzone" && (isCurrent || activeIndex === 2) && (
                      <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        <div className="pr-2">
                          <p className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                            <Key className="w-3.5 h-3.5 text-emerald-700 shrink-0" /> Dropzone Pickup OTP
                          </p>
                          <p className="text-[11px] leading-tight text-emerald-700 mt-1">Show this OTP to dropzone manager for verification</p>
                        </div>
                        <div className="bg-emerald-600 text-white font-mono font-ultra text-xl sm:text-2xl tracking-widest px-3.5 py-1.5 rounded-xl shadow-inner shrink-0 self-start sm:self-auto">
                          {order.pickupOtp || String(Math.abs((order.id || "").split("").reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)) % 900000 + 100000)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {activeIndex === 3 && (
            <div className="mt-6 pt-4 border-t border-slate-200/60 flex flex-col sm:flex-row items-center justify-between gap-3">
              {order.ratingSubmitted ? (
                <div className="flex items-center gap-2 text-emerald-800 bg-emerald-100/80 px-4 py-2 rounded-full text-xs font-bold w-full sm:w-auto justify-center">
                  <Star className="w-4 h-4 fill-emerald-600 text-emerald-600" />
                  <span>Delivery & Products Rated ({order.ratingScore || 5}/5 ⭐)</span>
                </div>
              ) : (
                <button
                  onClick={() => onOpenRatingModal(order)}
                  className="w-full sm:w-auto bg-emerald-50 text-emerald-700 border border-emerald-200 px-6 py-3 rounded-full font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-100 transition-colors shadow-xs"
                >
                  <Star className="w-4 h-4 text-emerald-600 fill-emerald-100" /> Rate this delivery
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Items List */}
      <div className="py-6 space-y-4">
        {order.items && order.items.map((item, index) => (
          <div key={index} className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <OrderItemImage item={item} className="w-14 h-14" />
              <div>
                <h4 className="font-bold text-dark-green text-base">{item.name}</h4>
                <p className="text-xs text-gray-500 font-medium">Qty: {item.quantity}</p>
              </div>
            </div>
            <div className="text-right">
              <span className="font-bold text-dark-green text-base">
                {typeof item.price === "string" ? item.price : `₹${item.price}`}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Footer: Details & Total */}
      <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        {order.deliveryDetails?.isStudent && order.deliveryDetails?.dropzone ? (
          <div className="flex items-center gap-2 text-xs font-semibold text-dark-green/80 bg-light-beige/40 px-3 py-2 rounded-xl">
            <MapPin className="w-4 h-4 text-dark-green" />
            <span>Student Dropzone: <strong className="text-dark-green">{order.deliveryDetails.dropzone}</strong></span>
          </div>
        ) : (
          <div className="text-xs text-gray-500 font-medium">
            Delivering to: <span className="font-bold text-dark-green">{order.customerName || order.email}</span>
          </div>
        )}

        <div className="self-end sm:self-auto flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-500">Total Paid:</span>
          <span className="font-ultra text-2xl text-dark-green">₹{order.totalAmount?.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}

function OrderItemImage({ item, className = "w-14 h-14" }) {
  const [hasError, setHasError] = useState(false);

  const getSrc = () => {
    if (!item) return null;
    let src = item.image || item.imageUrl || item.product?.image || item.product?.imageUrl || null;
    if (typeof src === "object" && src !== null) {
      src = src.src || src.url || src.imageUrl || null;
    }
    if (typeof src !== "string" || !src.trim()) return null;
    src = src.trim();

    if (src === "[object Object]" || src === "undefined" || src === "null") return null;

    if (!src.startsWith("/") && !src.startsWith("http://") && !src.startsWith("https://") && !src.startsWith("data:")) {
      src = "/" + src;
    }
    return src;
  };

  const imageSrc = getSrc();

  if (imageSrc && !hasError) {
    return (
      <img
        src={imageSrc}
        alt={item.name || "Product image"}
        onError={() => setHasError(true)}
        className={`${className} object-cover rounded-2xl border border-gray-200 bg-stone-100 shrink-0`}
      />
    );
  }

  return (
    <div className={`${className} rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-800 shrink-0`}>
      <Package className="w-5 h-5 text-emerald-700" />
    </div>
  );
}
