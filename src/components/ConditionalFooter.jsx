"use client";

import { usePathname } from "next/navigation";
import Footer from "@/components/Footer";

export default function ConditionalFooter() {
  const pathname = usePathname();

  // Hide footer on My Products hub and Chat pages for a clean full-screen app layout
  if (
    pathname?.startsWith("/my-products") ||
    pathname?.startsWith("/chat")
  ) {
    return null;
  }

  return <Footer />;
}
