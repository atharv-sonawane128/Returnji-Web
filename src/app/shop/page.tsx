"use client";

import React, { useState, useEffect } from "react";
import CircularProductScroller from "@/components/CircularProductScroller";
import { ProductCardThumbnail, ProductDetail } from "@/components/ProductCardThumbnail";
import { ProductDetailSheet } from "@/components/ProductDetailSheet";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ArrowUpDown, ChevronDown } from "lucide-react";
import { db } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";

const CATEGORIES = ["All Products", "Stickers", "Keychains", "Bundles", "Customize"];

const SHOP_PRODUCTS: ProductDetail[] = [
  {
    id: "prod-1",
    title: "Returnji QR Stickers",
    price: 29.0,
    mrp: 49.0,
    weight: "Single Sticker",
    brand: "ReturnJi",
    rating: 0,
    reviewCount: "0",
    description:
      "A durable, weather-resistant QR sticker that helps lost items find their way back to you. Perfect for bottles, notebooks, laptops, bags, and other everyday essentials.",
    imageUrl: "/mockup.png",
    images: ["/mockup.png", "/mockup_sticker_01.png", "/sticker_03.png"],
    badge: "BEST SELLER",
    badgeColor: "mint",
    ctaLabel: "Pre-Order",
  },
  {
    id: "prod-2",
    title: "Returnji QR Keychain",
    price: 89.0,
    mrp: 129.0,
    weight: "Single Keychain",
    brand: "ReturnJi",
    rating: 0,
    reviewCount: "0",
    description:
      "A premium QR-enabled keychain designed for keys, backpacks, luggage, and valuables. If found, anyone can scan the QR code and securely help return your item.",
    imageUrl: "/mockup (6).png",
    images: ["/mockup (6).png", "/returnji_keychain.jpg", "/keychain_mockup_01.png", "/keychain_mockup_02.png"],
    badge: "PREMIUM",
    badgeColor: "gray",
    ctaLabel: "Pre-Order",
  },
  {
    id: "prod-3",
    title: "Returnji Bundle",
    price: 369.0,
    mrp: 420.0,
    weight: "Combo Pack (2 Keychains + 8 Stickers)",
    brand: "ReturnJi",
    rating: 0,
    reviewCount: "0",
    description:
      "The complete protection pack for travelers and everyday users. Includes 2 Returnji QR Keychains and 8 QR Stickers to safeguard all your important belongings.",
    imageUrl: "/returnji_bundle.jpg",
    images: ["/returnji_bundle.jpg", "/Bundle_mockup.png", "/Bundle_mockup-two.png"],
    badge: "SAVE 10%",
    badgeColor: "green",
    ctaLabel: "Pre-Order",
  },
  {
    id: "prod-4",
    title: "Returnji Student Bundle",
    price: 249.0,
    mrp: 320.0,
    weight: "Student Combo (1 Keychain + 8 Stickers)",
    brand: "ReturnJi",
    rating: 0,
    reviewCount: "0",
    description:
      "Designed for students who carry multiple essentials every day. Includes 8 QR Stickers and 1 QR keychain to protect water bottles, notebooks, calculators, ID card holders, and more.",
    imageUrl: "/returnji_student_bundle.jpg",
    images: ["/returnji_student_bundle.jpg", "/Keychain.png"],
    badge: "BUNDLE SAVE 20%",
    badgeColor: "amber",
    ctaLabel: "Pre-Order",
  },
  {
    id: "prod-5",
    title: "Customize Your QR-Sticker",
    price: 29.0,
    mrp: 49.0,
    weight: "Custom Single Sticker",
    brand: "ReturnJi",
    rating: 0,
    reviewCount: "0",
    description:
      "Create a QR sticker that's uniquely yours. Personalize it with custom colors, designs, logos, and themes while keeping Returnji's smart recovery technology built in.",
    imageUrl: "/returnji_custom_sticker.png",
    images: ["/returnji_custom_sticker.png", "/sticker_mockup.png"],
    badge: "NEW ARRIVAL",
    badgeColor: "mint",
    ctaLabel: "Pre-Order",
  },
  {
    id: "prod-6",
    title: "Customize Your QR-Keychain",
    price: 129.0,
    mrp: 179.0,
    weight: "Custom Single Keychain",
    brand: "ReturnJi",
    rating: 0,
    reviewCount: "0",
    description:
      "Design a one-of-a-kind QR keychain with your favorite colors, photos, artwork, or branding. Combine personal style with powerful lost-and-found protection.",
    imageUrl: "/returnji_custom_keychain.png",
    images: ["/returnji_custom_keychain.png", "/Keychain.png"],
    badge: "NEW ARRIVAL",
    badgeColor: "mint",
    ctaLabel: "Pre-Order",
  },
];

export default function ShopPage() {
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [activeCategory, setActiveCategory] = useState("All Products");
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});

  const { addToCart, setIsCartOpen, setDirectCheckoutItem } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  const handlePreOrder = (product: ProductDetail) => {
    if (!user) {
      router.push("/login");
    } else {
      setDirectCheckoutItem({
        product: {
          id: product.id,
          name: product.title,
          price: `₹${product.price.toFixed(2)}`,
          image: product.imageUrl,
          desc: product.description,
        },
        quantity: cartQuantities[product.id] || 1,
      });
      router.push("/checkout");
    }
  };

  const handleAddToCart = (product: ProductDetail) => {
    if (!user) {
      router.push("/login");
    } else {
      addToCart({
        id: product.id,
        name: product.title,
        price: `₹${product.price.toFixed(2)}`,
        image: product.imageUrl,
        desc: product.description,
      });
      setIsCartOpen(true);
    }
  };

  const handleUpdateQuantity = (id: string, newQty: number) => {
    setCartQuantities((prev) => ({
      ...prev,
      [id]: newQty,
    }));
  };

  const [productRatingsMap, setProductRatingsMap] = useState<Record<string, { total: number; count: number }>>({});

  useEffect(() => {
    const fetchRatings = async () => {
      try {
        const snapshot = await getDocs(collection(db, "ratings"));
        const map: Record<string, { total: number; count: number }> = {};
        
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          const pId = data.productId;
          const pName = (data.productName || "").toLowerCase().trim();
          const score = Number(data.rating) || 5;

          // Map by ID
          if (pId) {
            if (!map[pId]) map[pId] = { total: 0, count: 0 };
            map[pId].total += score;
            map[pId].count += 1;
          }

          // Also map by title matching for matching products
          SHOP_PRODUCTS.forEach((prod) => {
            if (pName && prod.title.toLowerCase().trim().includes(pName) || pName.includes(prod.title.toLowerCase().trim())) {
              if (!map[prod.id]) map[prod.id] = { total: 0, count: 0 };
              map[prod.id].total += score;
              map[prod.id].count += 1;
            }
          });
        });

        setProductRatingsMap(map);
      } catch (err) {
        console.warn("Could not fetch product ratings:", err);
      }
    };

    fetchRatings();
  }, []);

  // Category Filtering & Dynamic Rating Attachment
  const filteredProducts = SHOP_PRODUCTS.filter((p) => {
    if (activeCategory === "All Products") return true;
    if (activeCategory === "Stickers") return p.title.toLowerCase().includes("sticker");
    if (activeCategory === "Keychains") return p.title.toLowerCase().includes("keychain");
    if (activeCategory === "Bundles") return p.title.toLowerCase().includes("bundle");
    if (activeCategory === "Customize") return p.title.toLowerCase().includes("customize");
    return true;
  }).map((p) => {
    const ratingStats = productRatingsMap[p.id];
    if (ratingStats && ratingStats.count > 0) {
      const avgRating = Number((ratingStats.total / ratingStats.count).toFixed(1));
      return {
        ...p,
        rating: avgRating,
        reviewCount: ratingStats.count,
      };
    }
    return p;
  });

  return (
    <main className="min-h-screen bg-stone-50/50 py-6 px-4 sm:px-6 lg:px-8 pb-24">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Category Filter Tabs Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 border-b border-stone-200/80 no-scrollbar select-none">
          {CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap cursor-pointer shrink-0 ${isActive
                  ? "bg-[#EAE5D9] text-[#2C3E35] shadow-xs"
                  : "text-stone-500 hover:text-stone-900 hover:bg-stone-100"
                  }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <ProductCardThumbnail
              key={product.id}
              product={product}
              onSelect={setSelectedProduct}
              onPreOrder={handlePreOrder}
              onAddToCart={handleAddToCart}
              cartQuantity={cartQuantities[product.id] || 0}
              onUpdateQuantity={handleUpdateQuantity}
            />
          ))}
        </div>
      </div>

      {/* Product Detail Bottom Sheet */}
      <ProductDetailSheet
        product={selectedProduct}
        allProducts={filteredProducts}
        onSelectProduct={(newProduct) => setSelectedProduct({ ...newProduct })}
        onClose={() => setSelectedProduct(null)}
        cartQuantity={selectedProduct ? cartQuantities[selectedProduct.id] || 0 : 0}
        onUpdateQuantity={handleUpdateQuantity}
      />
    </main>
  );
}
