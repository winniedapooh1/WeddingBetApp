"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext'; // Assuming you have AuthContext
import { sendEmailVerification, getAuth, User } from 'firebase/auth'; // Import getAuth and User type
import { auth } from '../lib/firebase'; // Import the auth instance

export default function VerifyEmailPage() {
  const { currentUser: contextUser } = useAuth(); // Get user from context
  const [userInstance, setUserInstance] = useState<User | null>(null); // State to hold the current Firebase User instance
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0); // Cooldown in seconds

  useEffect(() => {
    // Attempt to get the current user directly from Firebase Auth
    const authInstance = getAuth();
    const unsubscribe = authInstance.onAuthStateChanged((user) => {
      if (user) {
        setUserInstance(user);
      } else {
        // If no user is found, clear the user instance
        setUserInstance(null);
      }
    });

    // Cleanup timer
    let timer: NodeJS.Timeout;
    if (cooldown > 0) {
      timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    }

    return () => {
      unsubscribe(); // Unsubscribe from auth state changes
      clearTimeout(timer); // Clear the cooldown timer
    };
  }, [cooldown]);

  const handleResendVerification = async () => {
    // Use the userInstance obtained from onAuthStateChanged
    if (!userInstance) {
      setError("No user is logged in or signed up. Please sign up first.");
      return;
    }
    if (cooldown > 0) {
      setMessage(`Please wait ${cooldown} seconds before resending.`);
      return;
    }

    try {
      await sendEmailVerification(userInstance); // Use the fetched user instance
      setMessage("Verification email sent! Check your inbox.");
      setError("");
      setCooldown(60); // Set cooldown for 60 seconds
    } catch (err: any) {
      console.error("Error resending verification email:", err);
      // Specific error handling for common verification issues
      if (err.code === 'auth/too-many-requests') {
        setError("Too many requests to send verification email. Please try again later.");
      } else if (err.code === 'auth/user-disabled') {
        setError("Your account has been disabled. Please contact support.");
      } else {
        setError(`Failed to resend verification email: ${err.message}.`);
      }
      setMessage("");
    }
  };

  return (
    <div className="font-sans min-h-screen flex items-center justify-center bg-rose-50 text-gray-700">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md text-center">
        <h2 className="text-3xl font-bold text-rose-500 mb-6">Verify Your Email</h2>
        <p className="mb-4">
          A verification email has been sent to your address. Please check your inbox (and spam folder) and click the link to activate your account.
        </p>
        <p className="mb-6">
          You won't be able to log in until your email is verified.
        </p>

        {message && <p className="text-green-600 mb-4">{message}</p>}
        {error && <p className="text-red-500 mb-4">{error}</p>}

        <div className="flex flex-col gap-4">
          <button
            onClick={handleResendVerification}
            disabled={cooldown > 0 || !userInstance} // Disable if no userInstance
            className={`bg-rose-500 text-white font-semibold py-2 px-5 rounded-full text-lg shadow-md transition duration-300 ${
              cooldown > 0 || !userInstance ? 'opacity-50 cursor-not-allowed' : 'hover:bg-rose-600'
            }`}
          >
            {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend Verification Email'}
          </button>
          <Link href="/login" className="bg-purple-300 hover:bg-purple-400 text-white font-semibold py-2 px-5 rounded-full text-lg shadow-md transition duration-300 inline-block">
            Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
