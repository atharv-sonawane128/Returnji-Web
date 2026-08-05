"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, orderBy, doc, updateDoc } from "firebase/firestore";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar 
} from "recharts";
import { Loader2, TrendingUp, Package, Users, DollarSign, CheckCircle, ShieldCheck, KeyRound } from "lucide-react";

export default function AdminDashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  
  const [orders, setOrders] = useState([]);
  const [usersMap, setUsersMap] = useState({});
  const [revenueData, setRevenueData] = useState([]);
  const [isDataLoading, setIsDataLoading] = useState(true);
  const [activeOtpOrder, setActiveOtpOrder] = useState(null); // { order, inputOtp: '', error: '' }

  // Global handler for verifying order OTP
  const handleVerifyOrder = async (targetOrder) => {
    try {
      const orderRef = doc(db, "orders", targetOrder.id);
      await updateDoc(orderRef, {
        adminStatus: "delivered",
        userTrackingStatus: "delivered",
        status: "delivered",
        otpVerifiedAt: new Date()
      });
      setOrders(prev => prev.map(o => o.id === targetOrder.id ? {
        ...o,
        adminStatus: "delivered",
        userTrackingStatus: "delivered",
        status: "delivered"
      } : o));
    } catch (e) {
      console.error("Error verifying OTP:", e);
      alert("Error updating order.");
    }
  };

  // Protect route
  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push("/login");
      } else if (!user.isAdmin) {
        router.push("/");
      }
    }
  }, [user, loading, router]);

  // Fetch data
  useEffect(() => {
    if (user && user.isAdmin) {
      const fetchData = async () => {
        try {
          // Fetch users to map userId to customer name (optional permission check)
          let usersData = {};
          try {
            const usersSnapshot = await getDocs(collection(db, "users"));
            usersSnapshot.forEach(doc => {
              usersData[doc.id] = doc.data();
            });
            setUsersMap(usersData);
          } catch (usersErr) {
            console.warn("Could not fetch full users collection (insufficient permissions):", usersErr);
          }

          // Fetch orders
          try {
            const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            const fetchedOrders = [];
            
            querySnapshot.forEach((doc) => {
              fetchedOrders.push({ id: doc.id, ...doc.data() });
            });
            
            setOrders(fetchedOrders);
            processRevenueData(fetchedOrders);
          } catch (ordersErr) {
            console.error("Error fetching orders:", ordersErr);
          }
        } catch (error) {
          console.error("Error fetching data:", error);
        } finally {
          setIsDataLoading(false);
        }
      };

      fetchData();
    }
  }, [user]);

  // Helper to calculate revenue directly from product prices in the order
  const calculateOrderRevenue = (order) => {
    if (!order.items || !Array.isArray(order.items)) return order.amount || order.totalAmount || 0;
    return order.items.reduce((sum, item) => {
      const priceStr = typeof item.price === 'string' ? item.price : String(item.price || '0');
      const numericPrice = parseFloat(priceStr.replace(/[^0-9.]/g, '')) || 0;
      return sum + (numericPrice * (item.quantity || 1));
    }, 0);
  };

  // Process data for the chart
  const processRevenueData = (ordersData) => {
    const revenueByDate = {};
    
    // Reverse array to process oldest to newest for the chart
    [...ordersData].reverse().forEach(order => {
      // Handle serverTimestamp which might be null if just added, or a Timestamp object
      const dateObj = order.createdAt?.toDate() || new Date();
      const dateStr = dateObj.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
      
      if (!revenueByDate[dateStr]) {
        revenueByDate[dateStr] = { date: dateStr, revenue: 0, ordersCount: 0 };
      }
      
      const orderRevenue = calculateOrderRevenue(order);
      revenueByDate[dateStr].revenue += orderRevenue;
      revenueByDate[dateStr].ordersCount += 1;
    });

    setRevenueData(Object.values(revenueByDate));
  };

  if (loading || isDataLoading) {
    return (
      <main className="min-h-screen bg-bright-white pt-24 px-4 flex justify-center items-center">
        <Loader2 className="w-10 h-10 animate-spin text-dark-green" />
      </main>
    );
  }

  if (!user || !user.isAdmin) {
    return null; // Will redirect in useEffect
  }

  const totalRevenue = orders.reduce((sum, order) => sum + calculateOrderRevenue(order), 0);
  const totalOrders = orders.length;

  return (
    <main className="min-h-screen bg-bright-white pt-24 pb-20 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-ultra text-4xl sm:text-5xl text-dark-green mb-8">Admin Dashboard</h1>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 font-bricolage">
          <div className="bg-light-beige/30 border border-gray-200 rounded-[2rem] p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-dark-green text-light-beige rounded-2xl flex items-center justify-center shrink-0">
              <DollarSign className="w-7 h-7" />
            </div>
            <div>
              <p className="text-dark-green/70 font-semibold text-sm">Total Revenue</p>
              <h2 className="text-3xl font-bold text-dark-green">₹{totalRevenue.toFixed(2)}</h2>
            </div>
          </div>
          
          <div className="bg-light-beige/30 border border-gray-200 rounded-[2rem] p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-dark-green text-light-beige rounded-2xl flex items-center justify-center shrink-0">
              <Package className="w-7 h-7" />
            </div>
            <div>
              <p className="text-dark-green/70 font-semibold text-sm">Total Orders</p>
              <h2 className="text-3xl font-bold text-dark-green">{totalOrders}</h2>
            </div>
          </div>

          <div className="bg-light-beige/30 border border-gray-200 rounded-[2rem] p-6 flex items-center gap-4">
            <div className="w-14 h-14 bg-dark-green text-light-beige rounded-2xl flex items-center justify-center shrink-0">
              <TrendingUp className="w-7 h-7" />
            </div>
            <div>
              <p className="text-dark-green/70 font-semibold text-sm">Avg. Order Value</p>
              <h2 className="text-3xl font-bold text-dark-green">
                ₹{totalOrders > 0 ? (totalRevenue / totalOrders).toFixed(2) : "0.00"}
              </h2>
            </div>
          </div>
        </div>

        {/* Revenue Graph */}
        <div className="bg-bright-white border border-gray-200 rounded-[2rem] p-6 sm:p-8 mb-12 shadow-sm">
          <h2 className="font-ultra text-2xl text-dark-green mb-6">Revenue Overview</h2>
          <div className="h-[400px] w-full">
            {revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={revenueData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#153B25" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#153B25" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis 
                    dataKey="date" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#153B25', fontSize: 12, fontFamily: 'inherit' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#153B25', fontSize: 12, fontFamily: 'inherit' }}
                    tickFormatter={(value) => `₹${value}`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '1rem', 
                      border: 'none', 
                      boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      fontFamily: 'inherit',
                      color: '#153B25'
                    }}
                    formatter={(value) => [`₹${value.toFixed(2)}`, 'Revenue']}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#153B25" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorRevenue)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center font-bricolage text-dark-green/50">
                No revenue data available yet.
              </div>
            )}
          </div>
        </div>

        {/* Recent Orders Table */}
        <div className="bg-bright-white border border-gray-200 rounded-[2rem] overflow-hidden shadow-sm">
          <div className="p-6 sm:p-8 border-b border-gray-200 flex justify-between items-center">
            <h2 className="font-ultra text-2xl text-dark-green">Recent Orders</h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left font-bricolage">
              <thead className="bg-light-beige/30 text-dark-green/70 text-sm">
                <tr>
                  <th className="px-6 py-4 font-semibold">Order ID</th>
                  <th className="px-6 py-4 font-semibold">Date</th>
                  <th className="px-6 py-4 font-semibold">Customer</th>
                  <th className="px-6 py-4 font-semibold">Items</th>
                  <th className="px-6 py-4 font-semibold">Dropzone</th>
                  <th className="px-6 py-4 font-semibold">Total</th>
                  <th className="px-6 py-4 font-semibold">Admin Status</th>
                  <th className="px-6 py-4 font-semibold">Tracking Stage</th>
                  <th className="px-6 py-4 font-semibold">Verify OTP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-dark-green text-sm">
                {orders.length > 0 ? (
                  orders.map((order) => {
                    const customer = usersMap[order.userId] || {};
                    const customerName = customer.name || order.customerName || 'N/A';
                    const customerPhone = customer.phone || order.phone || '';
                    const isDelivered = (order.adminStatus === 'delivered') || (order.status === 'delivered') || (order.userTrackingStatus === 'delivered');
                    const isAtDropzone = (order.adminStatus === 'at_dropzone') || (order.userTrackingStatus === 'at_dropzone') || isDelivered;
                    const currentTracking = order.userTrackingStatus || (isDelivered ? 'delivered' : (isAtDropzone ? 'at_dropzone' : 'confirmed'));
                    
                    const handleAdminStatusToggle = async () => {
                      const nextStatus = (order.adminStatus === 'delivered' || isDelivered) ? "confirmed" : (isAtDropzone ? "confirmed" : "at_dropzone");
                      try {
                        const orderRef = doc(db, "orders", order.id);
                        await updateDoc(orderRef, {
                          adminStatus: nextStatus,
                          userTrackingStatus: nextStatus,
                          status: nextStatus
                        });
                        setOrders(prev => prev.map(o => o.id === order.id ? {
                          ...o, 
                          adminStatus: nextStatus, 
                          userTrackingStatus: nextStatus,
                          status: nextStatus 
                        } : o));
                      } catch (err) {
                        console.error("Error updating order status:", err);
                        alert("Failed to update status.");
                      }
                    };

                    const handleTrackingChange = async (newStage) => {
                      try {
                        const orderRef = doc(db, "orders", order.id);
                        const updates = { 
                          userTrackingStatus: newStage,
                          status: newStage,
                          adminStatus: newStage === 'delivered' ? 'delivered' : (newStage === 'at_dropzone' ? 'at_dropzone' : 'confirmed')
                        };
                        await updateDoc(orderRef, updates);
                        setOrders(prev => prev.map(o => o.id === order.id ? { ...o, ...updates } : o));
                      } catch (err) {
                        console.error("Error updating tracking stage:", err);
                      }
                    };

                    const handleVerifyOtp = async (inputOtp) => {
                      if (!inputOtp) return;
                      const expectedOtp = order.pickupOtp || String(Math.abs((order.id || "").split("").reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)) % 900000 + 100000);
                      if (inputOtp.trim() === expectedOtp.trim()) {
                        try {
                          const orderRef = doc(db, "orders", order.id);
                          await updateDoc(orderRef, {
                            adminStatus: "delivered",
                            userTrackingStatus: "delivered",
                            status: "delivered",
                            otpVerifiedAt: new Date()
                          });
                          setOrders(prev => prev.map(o => o.id === order.id ? {
                            ...o,
                            adminStatus: "delivered",
                            userTrackingStatus: "delivered",
                            status: "delivered"
                          } : o));
                          alert("✅ OTP Verified successfully! Order marked as Delivered.");
                        } catch (e) {
                          alert("Error updating order.");
                        }
                      } else {
                        alert("❌ Invalid OTP! Please check with the customer.");
                      }
                    };

                    return (
                      <tr key={order.id} className="hover:bg-light-beige/10 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs" title={order.orderId || order.id}>
                          {(order.orderId || order.id).slice(0, 8)}...
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString('en-GB') : 'Just now'}
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-semibold">{customerName}</div>
                          {customerPhone && <div className="text-dark-green/60 text-xs">{customerPhone}</div>}
                        </td>
                        <td className="px-6 py-4">
                          {order.items?.map((item, i) => (
                            <div key={i} className="whitespace-nowrap">
                              {item.quantity}x {item.name}
                            </div>
                          ))}
                        </td>
                        <td className="px-6 py-4 capitalize whitespace-nowrap">
                          {order.dropzone || order.deliveryDetails?.dropzone || 'N/A'}
                        </td>
                        <td className="px-6 py-4 font-bold whitespace-nowrap">
                          ₹{calculateOrderRevenue(order).toFixed(2)}
                        </td>

                        {/* Admin status toggle (Confirmed / At Dropzone / Delivered checkbox) */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <label className={`inline-flex items-center gap-2 cursor-pointer select-none px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                            order.adminStatus === 'delivered' || (isDelivered && currentTracking === 'delivered')
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200'
                              : isAtDropzone 
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 hover:bg-emerald-200' 
                                : 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100'
                          }`}>
                            <input
                              type="checkbox"
                              checked={isAtDropzone || isDelivered}
                              onChange={handleAdminStatusToggle}
                              className="w-4 h-4 text-dark-green rounded focus:ring-dark-green cursor-pointer"
                            />
                            <span>{order.adminStatus === 'delivered' || (isDelivered && currentTracking === 'delivered') ? "Delivered" : (isAtDropzone ? "At Dropzone" : "Confirmed")}</span>
                          </label>
                        </td>

                        {/* User tracking stage dropdown */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={currentTracking}
                            onChange={(e) => handleTrackingChange(e.target.value)}
                            className="bg-light-beige/40 border border-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-bold text-dark-green focus:outline-none focus:border-dark-green cursor-pointer"
                          >
                            <option value="confirmed">1. Confirmed</option>
                            <option value="packing">2. Packing</option>
                            <option value="at_dropzone">3. At Dropzone</option>
                            <option value="delivered">4. Delivered</option>
                          </select>
                        </td>

                        {/* OTP Verification for Dropzone Manager */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          {isDelivered ? (
                            <span className="text-emerald-700 text-xs font-bold flex items-center gap-1">
                              <CheckCircle className="w-4 h-4 text-emerald-600" /> Verified
                            </span>
                          ) : (
                            <button
                              onClick={() => setActiveOtpOrder({ order, inputOtp: '', error: '' })}
                              className="px-3.5 py-1.5 bg-dark-green text-light-beige rounded-xl text-xs font-bold hover:bg-dark-green/90 transition-all flex items-center gap-1.5 shadow-sm hover:shadow"
                            >
                              <KeyRound className="w-3.5 h-3.5" /> Verify OTP
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="9" className="px-6 py-8 text-center text-dark-green/50">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>

      {/* Custom OTP Verification Modal Popup */}
      {activeOtpOrder && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-150 font-bricolage">
          <div className="bg-bright-white text-dark-green border border-gray-200 w-full max-w-md rounded-[2.5rem] p-6 sm:p-8 shadow-2xl space-y-6 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-200 pb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-light-beige border border-gray-200 flex items-center justify-center text-dark-green">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-ultra text-xl tracking-wide text-dark-green">Verify Pickup OTP</h3>
                  <p className="text-xs text-dark-green/70 font-mono">Order ID: {(activeOtpOrder.order.orderId || activeOtpOrder.order.id).slice(0, 10)}</p>
                </div>
              </div>
              <button 
                onClick={() => setActiveOtpOrder(null)}
                className="text-dark-green/60 hover:text-dark-green text-xl font-bold transition-colors w-8 h-8 rounded-full flex items-center justify-center hover:bg-light-beige/50"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-dark-green/80 mb-2">
                Enter customer's 6-digit OTP:
              </label>
              <input
                type="text"
                maxLength={6}
                autoFocus
                placeholder="e.g. 849201"
                value={activeOtpOrder.inputOtp}
                onChange={(e) => setActiveOtpOrder({ ...activeOtpOrder, inputOtp: e.target.value.replace(/[^0-9]/g, ''), error: '' })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const expected = activeOtpOrder.order.pickupOtp || String(Math.abs((activeOtpOrder.order.id || "").split("").reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)) % 900000 + 100000);
                    if (activeOtpOrder.inputOtp.trim() === expected.trim()) {
                      handleVerifyOrder(activeOtpOrder.order);
                      setActiveOtpOrder(null);
                    } else {
                      setActiveOtpOrder({ ...activeOtpOrder, error: "❌ Invalid OTP! Please check with customer." });
                    }
                  }
                }}
                className="w-full px-5 py-4 bg-light-beige/30 border border-gray-200 rounded-2xl text-center text-2xl font-mono tracking-widest text-dark-green placeholder-dark-green/30 focus:outline-none focus:border-dark-green focus:ring-1 focus:ring-dark-green transition-all"
              />
              {activeOtpOrder.error && (
                <p className="text-red-600 text-xs font-bold mt-2.5 text-center">
                  {activeOtpOrder.error}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setActiveOtpOrder(null)}
                className="flex-1 py-3.5 px-5 bg-light-beige/60 text-dark-green rounded-2xl font-bold text-sm hover:bg-light-beige transition-all border border-gray-200 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  const expected = activeOtpOrder.order.pickupOtp || String(Math.abs((activeOtpOrder.order.id || "").split("").reduce((acc, char) => (acc << 5) - acc + char.charCodeAt(0), 0)) % 900000 + 100000);
                  if (activeOtpOrder.inputOtp.trim() === expected.trim()) {
                    handleVerifyOrder(activeOtpOrder.order);
                    setActiveOtpOrder(null);
                  } else {
                    setActiveOtpOrder({ ...activeOtpOrder, error: "❌ Invalid OTP! Please check with customer." });
                  }
                }}
                className="flex-1 py-3.5 px-5 bg-dark-green text-light-beige rounded-2xl font-bold text-sm hover:opacity-95 transition-all shadow-sm cursor-pointer"
              >
                Verify & Complete
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
