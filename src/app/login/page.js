"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { ArrowLeft, Mail, Lock } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function LoginPage() {
  const { user, loginWithGoogle, loginWithEmail } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If already logged in, redirect to shop
  useEffect(() => {
    if (user) {
      router.push("/shop");
    }
  }, [user, router]);

  const handleGoogleLogin = async () => {
    try {
      setError("");
      await loginWithGoogle();
      // The useEffect will handle redirection based on phone number
    } catch (e) {
      setError("Failed to sign in with Google. Please try again.");
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please fill in both email and password.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      setError("");
      await loginWithEmail(email, password);
    } catch (e) {
      setError("Invalid email or password. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-bright-white flex flex-col items-center justify-center p-4">
      <div className="absolute top-8 left-4 sm:left-8">
        <Link href="/shop" className="inline-flex items-center text-dark-green font-bricolage font-bold hover:opacity-70 transition-opacity">
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Shop
        </Link>
      </div>

      <div className="bg-light-beige/30 p-8 sm:p-12 rounded-[2rem] border border-gray-100 max-w-md w-full space-y-8">
        <div className="text-center space-y-4">
          <h1 className="font-ultra text-4xl text-dark-green">Welcome Back</h1>
          <p className="font-bricolage text-dark-green/70">
            Please sign in to continue with your order or add items to your cart.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-xl font-bricolage text-sm font-semibold text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleEmailLogin} className="space-y-4 font-bricolage">
          <div>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-green/50" />
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email Address" 
                className="w-full pl-12 pr-4 py-3 bg-bright-white border border-gray-200 rounded-xl focus:outline-none focus:border-dark-green focus:ring-1 focus:ring-dark-green transition-colors text-dark-green placeholder-dark-green/50" 
              />
            </div>
          </div>
          <div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-dark-green/50" />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password" 
                className="w-full pl-12 pr-4 py-3 bg-bright-white border border-gray-200 rounded-xl focus:outline-none focus:border-dark-green focus:ring-1 focus:ring-dark-green transition-colors text-dark-green placeholder-dark-green/50" 
              />
            </div>
          </div>
          
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 bg-dark-green text-light-beige py-3 px-6 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSubmitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <div className="relative flex items-center py-4">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink-0 mx-4 text-dark-green/50 font-bricolage text-sm font-semibold">OR</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        <button
          onClick={handleGoogleLogin}
          type="button"
          className="w-full flex items-center justify-center gap-3 bg-bright-white text-dark-green py-3 px-6 rounded-xl font-bricolage font-bold border border-gray-200 hover:bg-gray-50 transition-colors shadow-sm"
        >
          <svg viewBox="0 0 24 24" className="w-5 h-5">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
          </svg>
          Sign in with Google
        </button>

        <p className="text-center font-bricolage text-sm text-dark-green/70">
          Don't have an account?{" "}
          <Link href="/signup" className="text-dark-green font-bold hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </main>
  );
}
