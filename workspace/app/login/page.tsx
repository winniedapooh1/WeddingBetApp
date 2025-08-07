"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';

// Password rules definition
const passwordRules = [
  { regex: /.{8,}/, message: "At least 8 characters" },
  { regex: /[A-Z]/, message: "At least one uppercase letter" },
  { regex: /[a-z]/, message: "At least one lowercase letter" },
  { regex: /[0-9]/, message: "At least one number" },
  { regex: /[^A-Za-z0-9]/, message: "At least one special character" },
];

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState(''); // New state for confirm password
  const [name, setName] = useState('');
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // State for confirm password visibility
  const [passwordRulesMet, setPasswordRulesMet] = useState<boolean[]>(
    new Array(passwordRules.length).fill(false)
  );
  const [passwordFocused, setPasswordFocused] = useState(false);

  const router = useRouter();

  // Effect to update password rules met status
  useEffect(() => {
    if (!isLoginMode) {
      const newRulesMet = passwordRules.map(rule => rule.regex.test(password));
      setPasswordRulesMet(newRulesMet);
    }
  }, [password, isLoginMode]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLoginMode) {
        // Log In
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        if (!user.emailVerified) {
          setError('Please verify your email address before logging in. Check your inbox for a verification link.');
          setLoading(false);
          // Optionally, you can resend verification email here
          // await sendEmailVerification(user);
          // console.log('Verification email resent.');
          return;
        }
        console.log('User logged in!');
        router.push('/');
      } else {
        // Sign Up
        if (password !== confirmPassword) {
          setError('Passwords do not match.');
          setLoading(false);
          return;
        }
        if (passwordRulesMet.some(met => !met)) {
          setError('Password does not meet all requirements.');
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Send email verification
        await sendEmailVerification(user);

        // Store user information in Firestore
        await setDoc(doc(db, 'users', user.uid), {
          name: name,
          email: user.email,
          createdAt: new Date(),
        });
        console.log('User signed up and info stored in Firestore!', user);
        
        // Redirect to a page informing the user to verify their email
        router.push('/verify-email'); 
      }
    } catch (err: any) {
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
          {!isLoginMode && (
            <div className="mb-4">
              <label htmlFor="name" className="block text-gray-700 text-sm font-semibold mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-rose-300"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}
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
          <div className="mb-4 relative"> {/* Added relative for positioning toggle */}
            <label htmlFor="password" className="block text-gray-700 text-sm font-semibold mb-2">
              Password
            </label>
            <input
              type={showPassword ? 'text' : 'password'}
              id="password"
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-rose-300 pr-10" // Added pr-10 for toggle icon
              placeholder="********"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 mt-7"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.879 16.121A4.995 4.995 0 0112 15c1.464 0 2.842.556 3.879 1.579m-4.243 4.243L19.5 19.5m-1.414-1.414L10.879 7.879m-4.243 4.243L1.5 4.5" />
                </svg>
              ) : (
                <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              )}
            </button>
          </div>

          {!isLoginMode && passwordFocused && (
            <div className="mb-4 text-sm text-gray-600">
              <p className="font-semibold mb-1">Password must contain:</p>
              <ul className="list-none p-0">
                {passwordRules.map((rule, index) => (
                  <li key={index} className={`flex items-center ${passwordRulesMet[index] ? 'text-green-600' : 'text-red-500'}`}>
                    {passwordRulesMet[index] ? (
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    )}
                    {rule.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {!isLoginMode && (
            <div className="mb-6 relative"> {/* Added relative for positioning toggle */}
              <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-semibold mb-2">
                Confirm Password
              </label>
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:ring-2 focus:ring-rose-300 pr-10" // Added pr-10 for toggle icon
                placeholder="********"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 mt-7"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? (
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.879 16.121A4.995 4.995 0 0112 15c1.464 0 2.842.556 3.879 1.579m-4.243 4.243L19.5 19.5m-1.414-1.414L10.879 7.879m-4.243 4.243L1.5 4.5" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          )}

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
