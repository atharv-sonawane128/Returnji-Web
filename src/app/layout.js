import { Ultra, Bricolage_Grotesque } from "next/font/google";
import Navbar from "@/components/Navbar";
import ConditionalFooter from "@/components/ConditionalFooter";
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
  metadataBase: new URL("https://returnji.com"),
  icons: {
    icon: "/web_logo.png",
    shortcut: "/web_logo.png",
    apple: "/web_logo.png",
  },
  openGraph: {
    title: "Returnji | Get your lost item back",
    description: "Smart QR-tag startup Returnji",
    url: "https://returnji.com",
    siteName: "Returnji",
    images: [
      {
        url: "/web_logo.png",
        width: 1200,
        height: 630,
        alt: "Returnji Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Returnji | Get your lost item back",
    description: "Smart QR-tag startup Returnji",
    images: ["/web_logo.png"],
  },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="en"
      className={`${ultra.variable} ${bricolage.variable} antialiased`}
    >
      <head>
        <link rel="icon" href="/web_logo.png" type="image/png" sizes="any" />
        <link rel="shortcut icon" href="/web_logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/web_logo.png" />
        <meta property="og:title" content="Returnji | Get your lost item back" />
        <meta property="og:description" content="Smart QR-tag startup Returnji" />
        <meta property="og:image" content="https://returnji.com/web_logo.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://returnji.com/web_logo.png" />
      </head>
      <body className="font-bricolage bg-light-beige text-dark-green min-h-screen flex flex-col">
        <AuthProvider>
          <CartProvider>
            <Navbar />
            <CartDrawer />
            {children}
            <ConditionalFooter />
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
