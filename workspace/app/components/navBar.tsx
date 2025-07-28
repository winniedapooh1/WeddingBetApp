// components/Navbar.tsx
"use client"; // This is a Client Component

import Link from 'next/link';
import { useAuth } from '../context/page'; // Adjust path
import { auth } from '../lib/firebase'; // Adjust path
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';

export default function Navbar() {
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/login'); // Redirect to login page after logout
    } catch (error: any) {
      console.error('Logout error:', error.message);
    }
  };

  return (
    <nav className="bg-white shadow-md border-b border-rose-100">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <Link href="/" className="text-rose-500 text-3xl font-extrabold tracking-wide">
          Wedding Wagers
        </Link>
        <ul className="flex space-x-6 items-center">
          <li>
            <Link
              href="/"
              className="text-gray-700 hover:text-rose-400 text-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
              Home
            </Link>
          </li>
          <li>
            <Link
              href="/bets"
              className="text-gray-700 hover:text-rose-400 text-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
              Bets
            </Link>
          </li>
          <li>
            <Link
              href="/about"
              className="text-gray-700 hover:text-rose-400 text-lg transition duration-300 ease-in-out transform hover:scale-105"
            >
              About
            </Link>
          </li>
          {/* Login/Logout Button */}
          <li>
            {loading ? (
              <div className="w-24 h-8 bg-gray-200 rounded-full animate-pulse"></div>
            ) : currentUser ? (
              <button
                onClick={handleLogout}
                className="bg-purple-300 hover:bg-purple-400 text-white font-semibold py-2 px-5 rounded-full text-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
              >
                Logout
              </button>
            ) : (
              <Link
                href="/login"
                className="bg-purple-300 hover:bg-purple-400 text-white font-semibold py-2 px-5 rounded-full text-lg shadow-md transition duration-300 ease-in-out transform hover:scale-105"
              >
                Login
              </Link>
            )}
          </li>
        </ul>
      </div>
    </nav>
  );
}