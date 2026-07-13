"use client";

import { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [directCheckoutItem, setDirectCheckoutItem] = useState(null);

  // Load from localStorage on mount (optional but good practice)
  useEffect(() => {
    try {
      const savedCart = localStorage.getItem("returnji_cart");
      if (savedCart) {
        setCartItems(JSON.parse(savedCart));
      }
    } catch (error) {
      console.error("Failed to load cart from local storage", error);
    }
  }, []);

  // Save to localStorage when cart changes
  useEffect(() => {
    try {
      localStorage.setItem("returnji_cart", JSON.stringify(cartItems));
    } catch (error) {
      console.error("Failed to save cart to local storage", error);
    }
  }, [cartItems]);

  const addToCart = (product) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find(item => item.product.id === product.id);
      if (existingItem) {
        return prevItems.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevItems, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCartItems((prevItems) => prevItems.filter(item => item.product.id !== productId));
  };
  
  const updateQuantity = (productId, delta) => {
    setCartItems((prevItems) => prevItems.map(item => {
      if (item.product.id === productId) {
        const newQty = item.quantity + delta;
        if (newQty < 1) return item; // Min quantity is 1
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  }

  const clearCart = () => {
    setCartItems([]);
  }

  const cartTotal = cartItems.reduce((total, item) => {
    const price = parseFloat(item.product.price.replace(/[^0-9.]/g, ''));
    return total + (price * item.quantity);
  }, 0);

  return (
    <CartContext.Provider value={{
      cartItems,
      addToCart,
      removeFromCart,
      updateQuantity,
      clearCart,
      cartTotal,
      isCartOpen,
      setIsCartOpen,
      directCheckoutItem,
      setDirectCheckoutItem
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  return useContext(CartContext);
}
