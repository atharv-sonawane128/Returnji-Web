"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { getQRProductInfo, PRODUCT_CATALOG } from "@/lib/qrProductTypes";
import {
  Tag,
  QrCode,
  ShieldCheck,
  AlertTriangle,
  MessageSquare,
  Edit3,
  ExternalLink,
  Plus,
  CheckCircle2,
  X,
  Sparkles,
  Lock,
  Award,
  RefreshCw,
  ChevronRight
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MyProductsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState(null);

  // Edit Form State
  const [editItemName, setEditItemName] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const [editReward, setEditReward] = useState("");
  const [editContactNote, setEditContactNote] = useState("");
  const [editStatus, setEditStatus] = useState("active"); // 'active' | 'lost'
  const [updating, setUpdating] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState("");

  // Fetch owner's tags from Firestore + localStorage fallback
  const fetchMyProducts = async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    setLoading(true);

    let fetched = [];

    // 1. Try Firestore
    try {
      const q = query(collection(db, "qrcodes"), where("ownerId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      querySnapshot.forEach((docSnap) => {
        fetched.push({ id: docSnap.id, ...docSnap.data() });
      });
    } catch (err) {
      console.warn("Firestore query permission warning (using local fallback):", err?.message);
    }

    // 2. Try localStorage backup
    try {
      const saved = JSON.parse(localStorage.getItem("returnji_user_tags") || "[]");
      const userSaved = saved.filter((t) => !t.ownerId || t.ownerId === user.uid);
      
      // Merge unique
      userSaved.forEach((localTag) => {
        const id = localTag.qrId || localTag.id;
        if (!fetched.some((f) => f.id === id || f.qrId === id)) {
          fetched.push({ id, ...localTag });
        }
      });
    } catch (e) {}

    // Sort by latest updated/registered
    fetched.sort((a, b) => {
      const tA = a.updatedAt?.toMillis ? a.updatedAt.toMillis() : new Date(a.updatedAt || 0).getTime();
      const tB = b.updatedAt?.toMillis ? b.updatedAt.toMillis() : new Date(b.updatedAt || 0).getTime();
      return tB - tA;
    });

    setProducts(fetched);
    setLoading(false);
  };

  useEffect(() => {
    fetchMyProducts();
  }, [user]);

  // Helper to persist tag update in localStorage
  const updateLocalBackup = (tagId, updatedFields) => {
    try {
      const saved = JSON.parse(localStorage.getItem("returnji_user_tags") || "[]");
      const updated = saved.map((t) => {
        if (t.id === tagId || t.qrId === tagId) {
          return { ...t, ...updatedFields };
        }
        return t;
      });
      localStorage.setItem("returnji_user_tags", JSON.stringify(updated));
    } catch (e) {}
  };

  // Open Edit Modal
  const handleOpenEdit = (product) => {
    setEditingProduct(product);
    setEditItemName(product.itemName || "");
    setEditCategory(product.category || "");
    setEditReward(product.reward || 0);
    setEditContactNote(product.contactNote || "");
    setEditStatus(product.status === "lost" ? "lost" : "active");
    setSaveSuccess(false);
    setSaveError("");
  };

  // Quick Status Toggle directly from card
  const handleToggleStatus = async (product) => {
    const newStatus = product.status === "lost" ? "active" : "lost";
    const tagId = product.qrId || product.id;

    try {
      const tagRef = doc(db, "qrcodes", tagId);
      await updateDoc(tagRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("Firestore updateDoc permission notice (updating local backup):", err?.message);
    }

    updateLocalBackup(tagId, { status: newStatus });

    // Update local state instantly
    setProducts((prev) =>
      prev.map((p) => ((p.qrId || p.id) === tagId ? { ...p, status: newStatus } : p))
    );
  };

  // Save changes from Edit Modal
  const handleSaveProductDetails = async (e) => {
    e.preventDefault();
    if (!editingProduct) return;

    setUpdating(true);
    setSaveError("");
    setSaveSuccess(false);

    const tagId = editingProduct.qrId || editingProduct.id;
    const updatedFields = {
      itemName: editItemName.trim(),
      category: editCategory,
      reward: Number(editReward || 0),
      contactNote: editContactNote.trim(),
      status: editStatus
    };

    try {
      const tagRef = doc(db, "qrcodes", tagId);
      await updateDoc(tagRef, {
        ...updatedFields,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("Firestore updateDoc permission notice (saving to local backup):", err?.message);
    }

    updateLocalBackup(tagId, updatedFields);

    // Update local state
    setProducts((prev) =>
      prev.map((p) =>
        (p.qrId || p.id) === tagId
          ? {
              ...p,
              ...updatedFields
            }
          : p
      )
    );

    setSaveSuccess(true);
    setTimeout(() => {
      setEditingProduct(null);
    }, 1000);
    setUpdating(false);
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-light-beige/50 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-700 font-medium font-bricolage">Loading Your Activated Products...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-light-beige/50 py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md mx-auto bg-white rounded-3xl p-8 shadow-xl border border-gray-100 text-center space-y-6">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center mx-auto">
            <QrCode className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-dark-green font-ultra">Sign In to View My Products</h1>
          <p className="text-gray-600 text-sm font-bricolage">
            Please sign in to manage your activated Returnji QR tags, edit item details, change lost status, and chat with finders.
          </p>
          <Link
            href="/login"
            className="w-full inline-flex items-center justify-center gap-2 py-3.5 bg-dark-green text-light-beige rounded-2xl font-bold font-bricolage hover:opacity-90 transition-opacity"
          >
            Sign In Now
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-light-beige/50 py-10 px-4 sm:px-6 lg:px-8 font-bricolage">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
              <ShieldCheck className="w-4 h-4" /> Owner Management Dashboard
            </div>
            <h1 className="text-3xl font-extrabold text-dark-green">My Activated Products</h1>
            <p className="text-gray-600 text-sm mt-1">
              Manage your registered Returnji QR tags, update item details, toggle lost status, and chat live with finders.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={fetchMyProducts}
              className="p-3 text-dark-green hover:bg-gray-100 rounded-2xl border border-gray-200 transition-all"
              title="Refresh Products"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRODUCTS GRID */}
        {products.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center shadow-sm border border-gray-100 max-w-xl mx-auto space-y-4">
            <div className="w-20 h-20 bg-light-beige text-dark-green rounded-full flex items-center justify-center mx-auto text-3xl">
              🏷️
            </div>
            <h3 className="text-2xl font-bold text-dark-green">No Products Activated Yet</h3>
            <p className="text-gray-600 text-sm leading-relaxed">
              You haven't claimed any Returnji QR stickers or keychains yet. Select a product tag from our catalog to claim and activate it!
            </p>
            <Link
              href="/tags"
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-dark-green text-white rounded-2xl font-bold text-sm hover:bg-dark-green/90 transition-all shadow-md mt-2"
            >
              <Tag className="w-4 h-4" /> Browse & Claim Tags
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => {
              const productInfo = getQRProductInfo(product.qrId || product.id, product);
              const isLost = product.status === "lost";
              const chatId = `chat_${(product.qrId || product.id).replace(/[^a-zA-Z0-9_-]/g, "")}`;

              return (
                <div
                  key={product.id}
                  className={`bg-white rounded-3xl p-6 shadow-md border transition-all flex flex-col justify-between relative overflow-hidden ${
                    isLost ? "border-red-300 ring-2 ring-red-100" : "border-gray-100 hover:shadow-xl"
                  }`}
                >
                  <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${productInfo.gradient}`} />

                  <div>
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3 pt-1">
                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${productInfo.badgeBg}`}>
                        {productInfo.badge}
                      </span>

                      {/* Status Badge */}
                      <button
                        onClick={() => handleToggleStatus(product)}
                        title="Click to toggle product status"
                        className={`px-3 py-1 rounded-full text-xs font-black flex items-center gap-1.5 transition-transform active:scale-95 cursor-pointer ${
                          isLost
                            ? "bg-red-500 text-white shadow-xs animate-pulse"
                            : "bg-emerald-100 text-emerald-800 border border-emerald-300"
                        }`}
                      >
                        {isLost ? (
                          <>
                            <AlertTriangle className="w-3.5 h-3.5" /> REPORTED LOST
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5" /> SAFE WITH OWNER
                          </>
                        )}
                      </button>
                    </div>

                    {/* Product Name & Tag ID */}
                    <h3 className="text-xl font-extrabold text-dark-green mb-1 line-clamp-1">
                      {product.itemName || product.productName || "Returnji Protected Tag"}
                    </h3>
                    <div className="flex items-center gap-2 mb-4">
                      <span className="font-mono text-xs font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                        {product.qrId || product.id}
                      </span>
                      <span className="text-xs text-gray-500">• {product.category || "Asset"}</span>
                    </div>

                    {/* Info Card */}
                    <div className="bg-gray-50 rounded-2xl p-3.5 border border-gray-200/80 space-y-2 text-xs mb-6">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500">Reward Offered:</span>
                        <span className="font-bold text-emerald-800">
                          {product.reward > 0 ? `₹${product.reward}` : "No Reward"}
                        </span>
                      </div>
                      {product.contactNote && (
                        <div className="pt-1.5 border-t border-gray-200 text-gray-600 line-clamp-2">
                          <span className="font-bold text-gray-800 block mb-0.5">Note:</span>
                          "{product.contactNote}"
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ACTION BUTTON TO OPEN NEW DEDICATED HUB PAGE */}
                  <div className="pt-2 border-t border-gray-100">
                    <Link
                      href={`/my-products/${encodeURIComponent(product.qrId || product.id)}`}
                      className="w-full py-3.5 px-4 bg-dark-green text-white font-bold rounded-2xl text-xs hover:bg-dark-green/90 transition-all flex items-center justify-center gap-2 shadow-sm group-hover:bg-dark-green/90"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-400" />
                      Manage Product, Chats & Status
                      <ChevronRight className="w-4 h-4 text-white/70" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* EDIT & STATUS MODAL */}
      {editingProduct && (
        <div className="fixed inset-0 bg-dark-green/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-gray-100 space-y-6 relative max-h-[90vh] overflow-y-auto">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {editingProduct.qrId || editingProduct.id}
                </span>
                <h2 className="text-xl font-bold text-dark-green mt-1">Check & Edit Product</h2>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="p-2 hover:bg-gray-100 rounded-full text-gray-500 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {saveSuccess && (
              <div className="p-3 bg-emerald-100 text-emerald-900 rounded-2xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Details & Product Status Updated Successfully!
              </div>
            )}

            {saveError && (
              <div className="p-3 bg-red-50 text-red-600 rounded-2xl text-xs font-semibold">
                {saveError}
              </div>
            )}

            <form onSubmit={handleSaveProductDetails} className="space-y-4">
              {/* Product Status Switch */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-2">
                  Product Status (Active vs Lost)
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setEditStatus("active")}
                    className={`py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      editStatus === "active"
                        ? "bg-emerald-600 text-white border-emerald-700 shadow-md"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4" /> Active (Safe with Owner)
                  </button>

                  <button
                    type="button"
                    onClick={() => setEditStatus("lost")}
                    className={`py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      editStatus === "lost"
                        ? "bg-red-500 text-white border-red-600 shadow-md"
                        : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                    }`}
                  >
                    <AlertTriangle className="w-4 h-4" /> Lost (Enable Finder Chat)
                  </button>
                </div>
                <p className="text-[11px] text-gray-500 mt-2 leading-relaxed">
                  {editStatus === "active"
                    ? "🟢 When set to Active, anyone scanning the QR code will see that the item is safe with its owner."
                    : "🚨 When set to Lost, finders scanning the QR code can initiate live chat, share location, and see dropzones."}
                </p>
              </div>

              {/* Item Name */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Item Name
                </label>
                <input
                  type="text"
                  required
                  value={editItemName}
                  onChange={(e) => setEditItemName(e.target.value)}
                  placeholder="e.g. My Laptop Bag, Office Keys, Earbuds"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Category
                </label>
                <select
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
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
                  value={editReward}
                  onChange={(e) => setEditReward(e.target.value)}
                  placeholder="e.g. 250"
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm font-semibold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Contact Note */}
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Finder Note / Message
                </label>
                <textarea
                  rows={3}
                  value={editContactNote}
                  onChange={(e) => setEditContactNote(e.target.value)}
                  placeholder="e.g. Please leave a chat message or drop off at nearest metro station hub."
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-5 py-2.5 border border-gray-300 rounded-xl font-bold text-xs text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={updating}
                  className="px-6 py-2.5 bg-dark-green text-white rounded-xl font-bold text-xs hover:bg-dark-green/90 transition-all shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {updating ? (
                    <>Saving Changes...</>
                  ) : (
                    <>Save Product Details</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
