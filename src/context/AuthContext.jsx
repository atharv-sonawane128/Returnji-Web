"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { auth, googleProvider, db } from "@/lib/firebase";
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  signOut, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  updateProfile,
  RecaptchaVerifier,
  linkWithPhoneNumber,
  PhoneAuthProvider
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from Auth and try to fetch additional data from Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            // Merge firestore phone number if it doesn't exist on auth profile
            // This way user.phoneNumber is populated anywhere in the app
            const mergedUser = {
              ...currentUser,
              phoneNumber: currentUser.phoneNumber || data.phone,
              role: data.role || 'user',
              isAdmin: data.role === 'admin'
            };
            setUser(mergedUser);
          } else {
            setUser(currentUser);
          }
        } catch (e) {
          console.error("Error fetching user data", e);
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      return result;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  };

  const loginWithEmail = async (email, password) => {
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      return result;
    } catch (error) {
      console.error("Error signing in with Email:", error);
      throw error;
    }
  };

  const signupWithEmail = async (email, password, name, phone) => {
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(result.user, { displayName: name });
      
      // Save phone number in Firestore since Email Auth doesn't support phone natively
      await setDoc(doc(db, "users", result.user.uid), {
        name,
        email,
        phone
      });
      
      // Trigger a manual re-evaluation of user state so context picks up the phone number
      const updatedUser = { ...result.user, phoneNumber: phone };
      setUser(updatedUser);
      
      return result;
    } catch (error) {
      console.error("Error signing up:", error);
      throw error;
    }
  };

  const sendPhoneVerification = async (phoneNumber, recaptchaVerifier) => {
    if (!auth.currentUser) throw new Error("No user logged in");
    try {
      // linkWithPhoneNumber is the method to attach phone to current Google user
      const confirmationResult = await linkWithPhoneNumber(auth.currentUser, phoneNumber, recaptchaVerifier);
      return confirmationResult;
    } catch (error) {
      console.error("Error sending OTP:", error);
      throw error;
    }
  };

  const setupRecaptcha = (containerId) => {
    if (window.recaptchaVerifier) {
      window.recaptchaVerifier.clear();
      window.recaptchaVerifier = null;
    }
    window.recaptchaVerifier = new RecaptchaVerifier(auth, containerId, {
      'size': 'invisible'
    });
    return window.recaptchaVerifier;
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      loginWithGoogle, 
      loginWithEmail, 
      signupWithEmail, 
      sendPhoneVerification,
      setupRecaptcha,
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
