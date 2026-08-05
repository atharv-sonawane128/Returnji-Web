"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, ShoppingBag, LogIn, LogOut } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const pathname = usePathname();
  const { cartItems, setIsCartOpen } = useCart();
  const { user, loginWithGoogle, logout } = useAuth();

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
    <nav className={`w-full ${navBg} px-4 md:px-6 py-4 sticky top-0 z-50 shadow-sm md:shadow-none transition-transform duration-300 ${isVisible ? "translate-y-0" : "-translate-y-full"}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link href="/" className="font-extrabold text-2xl tracking-tighter text-dark-green">
            Returnji
          </Link>
        </div>

        <div className="flex items-center space-x-4 md:space-x-8">
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
                className="text-dark-green hover:opacity-70 transition-opacity p-2"
                title="Log out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          )}

          <button
            onClick={() => setIsCartOpen(true)}
            className="relative p-2 hover:bg-light-beige rounded-full transition-colors text-dark-green"
          >
            <ShoppingBag className="w-6 h-6" />
            {cartItemCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full transform translate-x-1/4 -translate-y-1/4">
                {cartItemCount}
              </span>
            )}
          </button>
          <button
            className="md:hidden p-2 hover:bg-bright-white rounded-full transition-colors"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X className="w-6 h-6 text-dark-green" /> : <Menu className="w-6 h-6 text-dark-green" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className={`md:hidden absolute top-full left-0 w-full ${navBg} border-t border-gray-100 flex flex-col px-4 py-4 space-y-4 shadow-md font-bricolage font-semibold`}>
          <Link href="/" onClick={() => setIsOpen(false)} className="py-2 text-dark-green">HOME</Link>
          <Link href="/shop" onClick={() => setIsOpen(false)} className="py-2 text-dark-green">SHOP</Link>
          {user && (
            <>
              <Link href="/my-products" onClick={() => setIsOpen(false)} className="py-2 text-dark-green font-bold">MY PRODUCTS</Link>
              <Link href="/orders" onClick={() => setIsOpen(false)} className="py-2 text-dark-green font-bold">MY ORDERS</Link>
            </>
          )}
          <div className="border-t border-gray-100 pt-4 flex flex-col space-y-3">
            {!user ? (
              <Link
                href="/login"
                onClick={() => setIsOpen(false)}
                className="flex items-center justify-center gap-2 bg-dark-green text-light-beige py-3 rounded-full font-bricolage font-semibold hover:opacity-90 transition-opacity"
              >
                <LogIn className="w-4 h-4" />
                SIGN IN
              </Link>
            ) : (
              <button
                onClick={() => {
                  setIsOpen(false);
                  logout();
                }}
                className="flex items-center justify-center gap-2 bg-red-50 text-red-600 py-3 rounded-full font-bricolage font-semibold hover:bg-red-100 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                SIGN OUT
              </button>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
