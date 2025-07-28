// app/login/page.tsx
"use client"; // This is a Client Component

import React, { useState } from 'react'; // <-- ADDED 'React' import here
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase'; // <-- VERIFY THIS PATH (see explanation below)
// If you want more specific error handling, you can import FirebaseError:
// import { FirebaseError } from 'firebase/app'; // Or firebase/auth, firebase/firestore depending on version

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLoginMode) {
        // Log In
        await signInWithEmailAndPassword(auth, email, password);
        console.log('User logged in!');
      } else {
        // Sign Up
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Store user information in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          createdAt: new Date(),
          // You can add more fields here, like displayName, etc.
        });
        console.log('User signed up and info stored in Firestore!', user);
      }
      router.push('/'); // Redirect to homepage after successful auth
    } catch (err: any) { // Keep 'any' for simplicity or import FirebaseError for better typing
      // You could check for specific Firebase error codes here:
      // if (err instanceof FirebaseError) {
      //   console.error('Firebase Auth Error:', err.code, err.message);
      //   setError(err.message); // Or map specific codes to user-friendly messages
      // } else {
      //   console.error('Generic Error:', err);
      //   setError('An unexpected error occurred.');
      // }
      console.error('Authentication error:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans min-h-screen flex items-center justify-center bg-rose-50">
      <div className="bg-white p-8 rounded-lg shadow-xl w-full max-w-md">
        <h2 className="text-3xl font-bold text-center mb-6 text-rose-500">
          {isLoginMode ? 'Login' : 'Sign Up'}
        </h2>

        {error && (
          <p className="text-red-500 text-center mb-4 text-sm">{error}</p>
        )}

        <form onSubmit={handleAuth}>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 text-sm font-semibold mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-rose-300"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className="mb-6">
            <label htmlFor="password" className="block text-gray-700 text-sm font-semibold mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-rose-300"
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          <div className="flex flex-col gap-4">
            <button
              type="submit"
              className={`bg-rose-500 hover:bg-rose-600 text-white font-bold py-2 px-4 rounded-full transition duration-300 ease-in-out ${
                loading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={loading}
            >
              {loading ? (isLoginMode ? 'Logging In...' : 'Signing Up...') : (isLoginMode ? 'Login' : 'Sign Up')}
            </button>
            <button
              type="button"
              onClick={() => setIsLoginMode(!isLoginMode)}
              className="text-center text-rose-500 hover:text-rose-600 text-sm"
              disabled={loading}
            >
              {isLoginMode ? 'Need an account? Sign Up' : 'Already have an account? Login'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}