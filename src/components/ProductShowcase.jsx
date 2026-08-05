"use client";

import { useState } from "react";
import { ShoppingCart, ArrowUpDown } from "lucide-react";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

const CATEGORIES = ["All Products", "Stickers", "Keychains", "Bundles", "Customize"];

import { PRODUCTS } from "../data/products";

export default function ProductShowcase() {
  const [activeTab, setActiveTab] = useState("All Products");
  const [sortBy, setSortBy] = useState("Popular");
  const [isSortOpen, setIsSortOpen] = useState(false);
  const { addToCart, setIsCartOpen, setDirectCheckoutItem } = useCart();
  const { user, loginWithGoogle } = useAuth();
  const router = useRouter();

  const handlePreOrder = (product) => {
    if (!user) {
      router.push('/login');
    } else if (!user.phoneNumber) {
      router.push('/verify-phone');
    } else {
      setDirectCheckoutItem({ product, quantity: 1 });
      router.push('/checkout');
    }
  };

  const handleAddToCart = (product) => {
    addToCart(product);
    setIsCartOpen(true);
  };

  const filteredProducts = PRODUCTS.filter(p =>
    activeTab === "All Products" || p.category === activeTab
  ).sort((a, b) => {
    if (sortBy === "Price: Low to High") {
      const priceA = parseFloat(a.price.replace(/[^0-9.]/g, ''));
      const priceB = parseFloat(b.price.replace(/[^0-9.]/g, ''));
      return priceA - priceB;
    } else if (sortBy === "Price: High to Low") {
      const priceA = parseFloat(a.price.replace(/[^0-9.]/g, ''));
      const priceB = parseFloat(b.price.replace(/[^0-9.]/g, ''));
      return priceB - priceA;
    }
    return 0;
  });

  return (
    <section id="shop" className="w-full px-4 sm:px-6 pb-16 pt-6 md:pt-8 bg-bright-white">
      <div className="max-w-7xl mx-auto">
        <h2 className="sr-only">Shop Products</h2>

        {/* Filter and Sort Bar */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-6 md:gap-4 w-full">
          {/* Categories */}
          <div className="flex flex-wrap md:flex-nowrap md:overflow-x-auto gap-2 scrollbar-hide w-full">
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setActiveTab(category)}
                className={`px-5 py-2.5 rounded-full font-bricolage text-sm whitespace-nowrap transition-colors ${activeTab === category
                    ? "bg-light-beige text-dark-green font-bold"
                    : "bg-transparent text-[#8a8175] hover:text-dark-green font-semibold"
                  }`}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Sort Dropdown */}
          <div className="relative shrink-0">
            <button
              onClick={() => setIsSortOpen(!isSortOpen)}
              className="flex items-center gap-2 ml-2 md:ml-0 font-bricolage text-[#5c544a] hover:text-dark-green transition-colors font-bold text-sm"
            >
              <ArrowUpDown className="w-4 h-4" />
              Sort: {sortBy}
            </button>

            {isSortOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsSortOpen(false)}
                />
                <div className="absolute left-2 md:left-auto md:right-0 top-full mt-2 w-48 bg-bright-white rounded-xl shadow-lg border border-gray-100 py-2 z-20 flex flex-col font-bricolage text-sm font-semibold text-dark-green">
                  {["Popular", "Price: Low to High", "Price: High to Low"].map((option) => (
                    <button
                      key={option}
                      onClick={() => {
                        setSortBy(option);
                        setIsSortOpen(false);
                      }}
                      className={`px-4 py-2 text-left hover:bg-light-beige transition-colors ${sortBy === option ? 'text-dark-green bg-light-beige' : ''}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-bright-white rounded-[2rem] sm:rounded-[2.5rem] p-4 sm:p-5 flex flex-col shadow-lg hover:shadow-2xl border border-gray-100 transition-shadow group cursor-pointer">

              {/* Image Container */}
              <div className="relative aspect-[4/3] rounded-3xl sm:rounded-[2rem] overflow-hidden mb-5 sm:mb-6 bg-[#f5f5f5]">
                {product.badge && (
                  <div className={`absolute top-4 left-4 z-10 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider ${product.badgeColor}`}>
                    {product.badge}
                  </div>
                )}
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              {/* Content */}
              <div className="flex flex-col flex-grow px-2">
                <div className="flex justify-between items-start mb-3 gap-3">
                  <h3 className="font-bricolage font-bold text-dark-green text-lg sm:text-xl leading-tight">
                    {product.name}
                  </h3>
                  <span className="font-bricolage font-bold text-dark-green text-lg sm:text-xl whitespace-nowrap shrink-0">
                    {product.price}
                  </span>
                </div>

                <p className="font-bricolage text-dark-green/70 text-xs sm:text-sm leading-relaxed mb-6 sm:mb-8 flex-grow">
                  {product.desc}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-3 mt-auto">
                  <button
                    onClick={() => handlePreOrder(product)}
                    className="flex-1 bg-dark-green text-light-beige py-3 sm:py-3.5 rounded-xl sm:rounded-2xl font-bricolage font-bold text-sm sm:text-base hover:opacity-90 transition-opacity"
                  >
                    Order Now
                  </button>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="shrink-0 bg-light-beige text-dark-green p-3 sm:p-3.5 rounded-xl sm:rounded-2xl hover:bg-[#e0d9cc] transition-colors"
                  >
                    <ShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
