"use client";

import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { X, Plus, Minus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function CartDrawer() {
  const { isCartOpen, setIsCartOpen, cartItems, updateQuantity, removeFromCart, cartTotal, setDirectCheckoutItem } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  // Prevent background scrolling when cart is open
  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => { document.body.style.overflow = "unset"; };
  }, [isCartOpen]);

  if (!isCartOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-dark-green/30 backdrop-blur-sm z-[60] transition-opacity"
        onClick={() => setIsCartOpen(false)}
      />
      
      {/* Drawer */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-bright-white shadow-2xl z-[70] transform transition-transform duration-300 flex flex-col translate-x-0">
        
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-100 flex justify-between items-center bg-light-beige/30">
          <h2 className="font-bricolage text-xl font-bold text-dark-green">Your Cart</h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="p-2 hover:bg-bright-white rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-dark-green" />
          </button>
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-y-auto px-6 py-6 scrollbar-hide">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-70">
              <div className="w-20 h-20 bg-light-beige rounded-full flex items-center justify-center mb-4">
                <span className="text-3xl">🛒</span>
              </div>
              <p className="font-bricolage text-lg font-semibold text-dark-green">Your cart is empty</p>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="mt-4 px-6 py-2 bg-dark-green text-light-beige rounded-full font-bricolage text-sm font-bold hover:opacity-90"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {cartItems.map((item) => (
                <div key={item.product.id} className="flex gap-4">
                  <div className="w-24 h-24 bg-[#f5f5f5] rounded-2xl overflow-hidden shrink-0 relative border border-gray-100">
                    <img 
                      src={item.product.image} 
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex flex-col flex-1 py-1">
                    <div className="flex justify-between items-start">
                      <h3 className="font-bricolage font-bold text-dark-green leading-tight text-sm pr-4">
                        {item.product.name}
                      </h3>
                      <button 
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-dark-green font-bold mt-1 text-sm">{item.product.price}</div>
                    
                    <div className="mt-auto flex items-center gap-4 bg-light-beige w-fit px-3 py-1.5 rounded-full">
                      <button 
                        onClick={() => updateQuantity(item.product.id, -1)}
                        className="text-dark-green/70 hover:text-dark-green"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="font-bricolage font-bold text-sm w-4 text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.product.id, 1)}
                        className="text-dark-green/70 hover:text-dark-green"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {cartItems.length > 0 && (
          <div className="p-6 border-t border-gray-100 bg-bright-white">
            <div className="flex justify-between items-center mb-6">
              <span className="font-bricolage text-lg text-dark-green/70">Subtotal</span>
              <span className="font-bricolage text-2xl font-bold text-dark-green">₹{cartTotal.toFixed(2)}</span>
            </div>
            <button 
              onClick={() => {
                setIsCartOpen(false);
                setDirectCheckoutItem(null); // Ensure we checkout the cart, not a leftover direct item
                if (!user) {
                  router.push('/login');
                } else if (!user.phoneNumber) {
                  router.push('/verify-phone');
                } else {
                  router.push('/checkout');
                }
              }}
              className="w-full block text-center bg-dark-green text-light-beige py-4 rounded-2xl font-bricolage font-bold text-lg hover:opacity-90 transition-opacity"
            >
              Proceed to Checkout
            </button>
          </div>
        )}
      </div>
    </>
  );
}
