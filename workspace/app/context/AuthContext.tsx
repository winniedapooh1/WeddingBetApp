"use client"; // This is a Client Component

import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, getFirestore } from 'firebase/firestore'; // Added imports for Firestore
import { auth } from '../lib/firebase';
// Initialize Firestore. Calling getFirestore() without an argument assumes
// a default Firebase app has been initialized elsewhere, which is a common pattern.
const db = getFirestore();

// Extend the AuthContextType to include admin-specific states
interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAdmin: boolean;
  isAdminLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false); // New state for admin status
  const [isAdminLoading, setIsAdminLoading] = useState(true); // New state for admin check loading

  useEffect(() => {
    // Listen for changes in the Firebase Authentication state
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false); // Authentication state has been determined

      // If a user is logged in, check if they are an admin
      if (user) {
        setIsAdminLoading(true); // Start loading the admin check
        const adminDocRef = doc(db, 'admin', user.uid);
        getDoc(adminDocRef).then((docSnap) => {
          // Check if the document exists in the 'admins' collection
          if (docSnap.exists()) {
            setIsAdmin(true);
          } else {
            setIsAdmin(false);
          }
          setIsAdminLoading(false); // Admin check is complete
        }).catch((error) => {
          console.error("Error checking admin status:", error);
          setIsAdmin(false);
          setIsAdminLoading(false);
        });
      } else {
        // If no user is logged in, they are not an admin
        setIsAdmin(false);
        setIsAdminLoading(false);
      }
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // The effect runs once on mount

  return (
    <AuthContext.Provider value={{ currentUser, loading, isAdmin, isAdminLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};