"use client";

import Link from 'next/link';

export default function VerifyEmailPage() {
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
        <Link href="/login" className="bg-purple-300 hover:bg-purple-400 text-white font-semibold py-2 px-5 rounded-full text-lg shadow-md transition duration-300">
          Back to Login
        </Link>
      </div>
    </div>
  );
}
