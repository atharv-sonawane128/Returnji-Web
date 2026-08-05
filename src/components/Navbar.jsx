"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, ShoppingBag, User, Tag, Package, LogIn, LogOut, X } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname();
  const router = useRouter();
  const { cartItems, setIsCartOpen } = useCart();
  const { user, logout } = useAuth();

  const cartItemCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const navBg = "bg-bright-white";

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      if (currentScrollY > lastScrollY && currentScrollY > 50) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <>
      {/* Top Navbar */}
      <nav className={`w-full ${navBg} px-4 md:px-6 py-4 sticky top-0 z-40 shadow-sm md:shadow-none transition-transform duration-300 ${isVisible ? "translate-y-0" : "-translate-y-full"}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Link href="/" className="font-extrabold text-2xl tracking-tighter text-dark-green">
              Returnji
            </Link>
          </div>

          <div className="flex items-center space-x-4 md:space-x-8">
            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8 font-bricolage font-semibold text-sm tracking-wide">
              <Link href="/" className="hover:opacity-70 transition-opacity">HOME</Link>
              <Link href="/shop" className="hover:opacity-70 transition-opacity">SHOP</Link>
              {user && (
                <>
                  <Link href="/my-products" className="hover:opacity-70 transition-opacity text-dark-green font-bold">MY PRODUCTS</Link>
                  <Link href="/orders" className="hover:opacity-70 transition-opacity text-dark-green font-bold">MY ORDERS</Link>
                </>
              )}
            </div>
            
            {!user ? (
              <Link
                href="/login"
                className="hidden sm:flex items-center gap-2 bg-dark-green text-light-beige px-6 py-3 rounded-full font-bricolage font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <LogIn className="w-4 h-4" />
                SIGN IN
              </Link>
            ) : (
              <div className="hidden sm:flex items-center gap-4">
                <div className="flex items-center gap-2 font-bricolage font-semibold text-sm text-dark-green">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt="User" className="w-8 h-8 rounded-full border border-gray-200" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-dark-green text-light-beige flex items-center justify-center font-bold">
                      {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                    </div>
                  )}
                  <span className="hidden lg:block truncate max-w-[100px]">{user.displayName?.split(' ')[0]}</span>
                </div>
                <button
                  onClick={logout}
                  className="text-dark-green hover:opacity-70 transition-opacity p-2 cursor-pointer"
                  title="Log out"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            )}

            {/* Shopping Bag Button (Header) */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 hover:bg-light-beige rounded-full transition-colors text-dark-green cursor-pointer"
            >
              <ShoppingBag className="w-6 h-6" />
              {cartItemCount > 0 && (
                <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full transform translate-x-1/4 -translate-y-1/4">
                  {cartItemCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Navigation Bar (md:hidden) */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-bright-white/95 backdrop-blur-md border-t border-stone-200/80 shadow-lg px-4 py-2 flex items-center justify-around font-bricolage select-none">
        {/* Home Tab */}
        <Link
          href="/"
          onClick={() => setIsProfileMenuOpen(false)}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            pathname === "/" ? "text-dark-green font-bold scale-105" : "text-stone-500 font-medium hover:text-dark-green"
          }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[11px] tracking-tight">Home</span>
        </Link>

        {/* Shop Tab */}
        <Link
          href="/shop"
          onClick={() => setIsProfileMenuOpen(false)}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all ${
            pathname === "/shop" ? "text-dark-green font-bold scale-105" : "text-stone-500 font-medium hover:text-dark-green"
          }`}
        >
          <ShoppingBag className="w-5 h-5" />
          <span className="text-[11px] tracking-tight">Shop</span>
        </Link>

        {/* Profile Tab */}
        <button
          type="button"
          onClick={() => {
            if (!user) {
              router.push("/login");
            } else {
              setIsProfileMenuOpen(!isProfileMenuOpen);
            }
          }}
          className={`flex flex-col items-center gap-1 py-1 px-4 rounded-xl transition-all cursor-pointer ${
            pathname === "/my-products" || pathname === "/orders" || isProfileMenuOpen
              ? "text-dark-green font-bold scale-105"
              : "text-stone-500 font-medium hover:text-dark-green"
          }`}
        >
          <User className="w-5 h-5" />
          <span className="text-[11px] tracking-tight">Profile</span>
        </button>
      </div>

      {/* Profile Popover Sheet for Mobile */}
      {isProfileMenuOpen && user && (
        <>
          {/* Dark Backdrop */}
          <div
            className="md:hidden fixed inset-0 bg-black/40 z-50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsProfileMenuOpen(false)}
          />

          {/* Profile Menu Card Floating above Bottom Bar */}
          <div className="md:hidden fixed bottom-16 left-4 right-4 z-50 bg-bright-white rounded-3xl p-5 shadow-2xl border border-stone-200 space-y-4 font-bricolage animate-in slide-in-from-bottom-4">
            {/* User Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-stone-100">
              {user.photoURL ? (
                <img src={user.photoURL} alt="User" className="w-10 h-10 rounded-full border border-stone-200" referrerPolicy="no-referrer" />
              ) : (
                <div className="w-10 h-10 rounded-full bg-dark-green text-light-beige flex items-center justify-center font-bold text-base">
                  {user.displayName?.charAt(0) || user.email?.charAt(0) || "U"}
                </div>
              )}
              <div className="truncate flex-1">
                <h4 className="font-bold text-dark-green text-base truncate">{user.displayName || "My Profile"}</h4>
                <p className="text-xs text-stone-500 truncate">{user.email || user.phoneNumber || ""}</p>
              </div>
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen(false)}
                className="p-1 text-stone-400 hover:text-stone-700 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Options: My Products & My Orders */}
            <div className="space-y-1">
              <Link
                href="/my-products"
                onClick={() => setIsProfileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-light-beige/50 text-dark-green font-bold text-sm transition-colors"
              >
                <Tag className="w-4.5 h-4.5 text-dark-green" />
                <span>MY PRODUCTS</span>
              </Link>

              <Link
                href="/orders"
                onClick={() => setIsProfileMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-light-beige/50 text-dark-green font-bold text-sm transition-colors"
              >
                <Package className="w-4.5 h-4.5 text-dark-green" />
                <span>MY ORDERS</span>
              </Link>
            </div>

            {/* Sign Out Button */}
            <div className="pt-2 border-t border-stone-100">
              <button
                type="button"
                onClick={() => {
                  setIsProfileMenuOpen(false);
                  logout();
                }}
                className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-2xl font-bold text-sm hover:bg-red-100 transition-colors cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                SIGN OUT
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}
