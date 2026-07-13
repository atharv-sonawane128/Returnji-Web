import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function CheckoutSuccessPage() {
  return (
    <main className="min-h-screen bg-bright-white pt-24 px-4 flex flex-col items-center justify-center text-center">
      <div className="max-w-md mx-auto space-y-6">
        <div className="flex justify-center mb-8">
          <CheckCircle2 className="w-24 h-24 text-dark-green" />
        </div>
        <h1 className="font-ultra text-4xl sm:text-5xl text-dark-green leading-tight">
          ORDER<br />CONFIRMED
        </h1>
        <p className="font-bricolage text-dark-green/80 text-lg">
          Thank you for your pre-order! We'll send you an email confirmation with your order details and tracking info once it ships.
        </p>
        <div className="pt-8">
          <Link 
            href="/" 
            className="inline-block bg-dark-green text-light-beige px-10 py-4 rounded-full font-bricolage font-bold hover:opacity-90 transition-opacity"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </main>
  );
}
