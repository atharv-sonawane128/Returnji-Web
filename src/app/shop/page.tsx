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
    price: 39.0,
    mrp: 49.0,
    weight: "Single Sticker",
    brand: "ReturnJi",
    rating: 0,
    reviewCount: "0",
    description:
      "A durable, weather-resistant QR sticker that helps lost items find their way back to you. Perfect for bottles, notebooks, laptops, bags, and other everyday essentials.",
    imageUrl: "/sticker_one.png",
    images: ["/sticker_one.png", "/sticker_two.png"],
    badge: "BEST SELLER",
    badgeColor: "mint",
    ctaLabel: "Order Now",
  },
  {
    id: "prod-2",
    title: "Returnji QR Keychain",
    price: 89.0,
    mrp: 119.0,
    weight: "Single Keychain",
    brand: "ReturnJi",
    rating: 0,
    reviewCount: "0",
    description:
      "A premium QR-enabled keychain designed for keys, backpacks, luggage, and valuables. If found, anyone can scan the QR code and securely help return your item.",
    imageUrl: "/keychain_one.png",
    images: ["/keychain_one.png", "/keychain_two.png", "/keychain_three.png"],
    badge: "PREMIUM",
    badgeColor: "gray",
    ctaLabel: "Order Now",
  },
  {
    id: "prod-3",
    title: "Returnji Small QR Sticker",
    price: 49.0,
    mrp: 69.0,
    weight: "Single Sticker",
    brand: "ReturnJi",
    rating: 0,
    reviewCount: "0",
    description:
      "A compact QR sticker specially designed for earbuds and earbud cases. If your earbuds are lost, anyone can scan the QR code to securely notify you and help return them—without revealing your personal information.",
    imageUrl: "/small_sticker_one.png",
    images: ["/small_sticker_one.png", "/small_sticker_two.jpeg"],
    badge: "PERFECT",
    badgeColor: "gray",
    ctaLabel: "Order Now",
  },
  {
    id: "prod-3b",
    title: "Returnji Sticker Bundle",
    price: 149.0,
    mrp: 176.0,
    weight: "Sticker Pack ( 2 QR Stickers + 2 Small Stickers )",
    brand: "ReturnJi",
    rating: 0,
    reviewCount: "0",
    description:
      "An all-in-one pack of QR stickers designed for your laptops, water bottles, earbuds, and everyday accessories.",
    imageUrl: "/sticker_bundle_one.png",
    images: ["/sticker_bundle_one.png", "/small_sticker_two.jpeg", "/sticker_two.png"],
    badge: "SAVE 15%",
    badgeColor: "mint",
    ctaLabel: "Order Now",
  },
  {
    id: "prod-4",
    title: "Returnji Bundle",
    price: 159.0,
    mrp: 177.0,
    weight: "Combo Pack ( 1 Keychains + 1 Sticker + 1 Small Sticker )",
    brand: "ReturnJi",
    rating: 0,
    reviewCount: "0",
    description:
      "The complete protection pack for travelers and everyday users. Includes 1 Returnji QR Keychains and 1 QR Sticker and 1 small sticker to safeguard all your important belongings.",
    imageUrl: "/bundle_mockup_minor.jpeg",
    images: ["/bundle_mockup_minor.jpeg",],
    badge: "SAVE 10%",
    badgeColor: "green",
    ctaLabel: "Order Now",
  },
  {
    id: "prod-5",
    title: "Returnji Student Bundle",
    price: 249.0,
    mrp: 320.0,
    weight: "Student Combo (1 Keychain + 3 Stickers + 3 Small Stickers)",
    brand: "ReturnJi",
    rating: 0,
    reviewCount: "0",
    description:
      "Designed for students who carry multiple essentials every day. Includes 3 QR Stickers and 1 QR keychain and 3 small stickers to protect water bottles, notebooks, calculators, ID card holders, and more.",
    imageUrl: "/mockup_bundle_major.jpeg",
    images: ["/mockup_bundle_major.jpeg"],
    badge: "BUNDLE SAVE 20%",
    badgeColor: "amber",
    ctaLabel: "Order Now",
  },
  {
    id: "prod-6",
    title: "Customize Your QR-Sticker",
    price: 29.0,
    mrp: 49.0,
    weight: "Custom Single Sticker",
    brand: "ReturnJi",
    rating: 0,
    reviewCount: "0",
    description:
      "Create a QR sticker that's uniquely yours. Personalize it with custom colors, designs, logos, and themes while keeping Returnji's smart recovery technology built in.",
    imageUrl: "/custom_stickers_one.jpeg",
    images: ["/custom_stickers_one.jpeg", "/sticker_bundle_one.png"],
    badge: "NEW ARRIVAL",
    badgeColor: "mint",
    ctaLabel: "Coming Soon",
  },
  {
    id: "prod-7",
    title: "Customize Your QR-Keychain",
    price: 129.0,
    mrp: 179.0,
    weight: "Custom Single Keychain",
    brand: "ReturnJi",
    rating: 0,
    reviewCount: "0",
    description:
      "Design a one-of-a-kind QR keychain with your favorite colors, photos, artwork, or branding. Combine personal style with powerful lost-and-found protection.",
    imageUrl: "/custom_keychain_one.png",
    images: ["/custom_keychain_one.png"],
    badge: "NEW ARRIVAL",
    badgeColor: "mint",
    ctaLabel: "Coming Soon",
  },
];

export default function ShopPage() {
  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [activeCategory, setActiveCategory] = useState("All Products");
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});

  const { addToCart, removeFromCart, updateQuantity, cartItems, setIsCartOpen, setDirectCheckoutItem } = useCart();
  const { user } = useAuth();
  const router = useRouter();

  // Keep cartQuantities local state synced with CartContext cartItems
  useEffect(() => {
    const quantitiesMap: Record<string, number> = {};
    if (cartItems && Array.isArray(cartItems)) {
      cartItems.forEach((item: any) => {
        if (item?.product?.id) {
          quantitiesMap[item.product.id] = item.quantity;
        }
      });
    }
    setCartQuantities(quantitiesMap);
  }, [cartItems]);

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
    addToCart({
      id: product.id,
      name: product.title,
      price: `₹${product.price.toFixed(2)}`,
      image: product.imageUrl,
      desc: product.description,
    });
  };

  const handleUpdateQuantity = (id: string, newQty: number) => {
    setCartQuantities((prev) => ({
      ...prev,
      [id]: newQty,
    }));

    const existingItem = (cartItems || []).find((item: any) => item.product?.id === id);
    const targetProduct = SHOP_PRODUCTS.find((p) => p.id === id);

    if (!targetProduct) return;

    const formattedProduct = {
      id: targetProduct.id,
      name: targetProduct.title,
      price: `₹${targetProduct.price.toFixed(2)}`,
      image: targetProduct.imageUrl,
      desc: targetProduct.description,
    };

    if (newQty <= 0) {
      if (existingItem) {
        removeFromCart(id);
      }
    } else if (!existingItem) {
      addToCart(formattedProduct);
      if (newQty > 1) {
        updateQuantity(id, newQty - 1);
      }
    } else {
      const delta = newQty - existingItem.quantity;
      if (delta !== 0) {
        updateQuantity(id, delta);
      }
    }
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
        onAddToCart={handleAddToCart}
        onOrderNow={handlePreOrder}
      />
    </main>
  );
}
