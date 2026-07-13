import ProductShowcase from "@/components/ProductShowcase";

export const metadata = {
  title: "Shop Tags | Returnji",
  description: "Browse our collection of smart QR tags, stickers, and keychains.",
};

export default function ShopPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-start bg-bright-white selection:bg-dark-green selection:text-bright-white flex-1">
      <div className="w-full">
        <ProductShowcase />
      </div>
    </main>
  );
}
