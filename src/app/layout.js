import { Ultra, Bricolage_Grotesque } from "next/font/google";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import CartDrawer from "@/components/CartDrawer";
import "./globals.css";

const ultra = Ultra({
  variable: "--font-ultra",
  weight: "400",
  subsets: ["latin"],
});

const bricolage = Bricolage_Grotesque({
  variable: "--font-bricolage",
  subsets: ["latin"],
});

export const metadata = {
  title: "Returnji | Get your lost item back",
  description: "Smart QR-tag startup Returnji",
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${ultra.variable} ${bricolage.variable} antialiased`}
    >
      <body className="font-bricolage bg-light-beige text-dark-green min-h-screen flex flex-col">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <CartDrawer />
            {children}
            <Footer />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
