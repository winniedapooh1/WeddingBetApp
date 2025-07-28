// app/bets/page.tsx
"use client"; // This is a Client Component

import { useState, useEffect } from "react"; // Added useEffect
import Link from "next/link";
import { useRouter } from "next/navigation"; // Added useRouter
import { useAuth } from "../context/page"; // Added useAuth
import Navbar from '../components/navBar'; // Ensure this path is correct: '../components/Navbar' if your file is Navbar.tsx

// Mock data - This will be replaced with Firestore data later
const mockBets = [
    {
        id: 1,
        question: "Who will cry first?",
        options: ["Bride", "Groom", "Mother of the Bride", "Best Man"],
    },
    {
        id: 2,
        question: "How long will the first dance last?",
        options: ["Less than 1 min", "1-2 mins", "2-3 mins", "Over 3 mins"],
    },
    {
        id: 3,
        question: "Will someone object during the ceremony?",
        options: ["Yes", "No"],
    },
];

export default function BetsPage() {
    // State for managing user's bet selections
    const [selections, setSelections] = useState<{ [key: number]: string }>({});

    // Get authentication state from AuthContext
    const { currentUser, loading } = useAuth();
    // Get router for redirection
    const router = useRouter();

    // Effect hook to handle authentication-based redirection
    useEffect(() => {
        // If authentication state is no longer loading AND there is no current user,
        // it means the user is not logged in. Redirect them to the login page.
        if (!loading && !currentUser) {
            router.push('/login');
        }
    }, [currentUser, loading, router]); // Dependencies: re-run when these values change

    // Function to handle selection of a bet option
    const handleSelect = (betId: number, option: string) => {
        setSelections((prev) => ({ ...prev, [betId]: option }));
    };

    // --- Conditional Rendering for Authentication State ---
    // If authentication state is still loading, or if there's no current user (and loading is done),
    // display a loading/redirecting message. This prevents flickering and ensures the page
    // doesn't render sensitive content before authentication is confirmed.
    if (loading || (!currentUser && !loading)) {
        return (
            <div className="font-sans min-h-screen flex items-center justify-center bg-rose-50 text-gray-700">
                {loading ? 'Loading bets...' : 'Redirecting to login...'}
            </div>
        );
    }

    // --- Main Page Content (Rendered only if user is authenticated) ---
    return (
        <div className="bg-rose-50 min-h-screen flex flex-col">
            {/* Navbar component, which will show Login/Logout based on auth state */}
            <Navbar />

            {/* Main content area for displaying bets */}
            <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto">
                    <h1 className="text-4xl font-extrabold text-rose-500 text-center mb-10">
                        Place Your Bets 💍
                    </h1>
                    {currentUser && ( // Display welcome message if user is logged in
                        <p className="text-xl md:text-2xl mb-8 max-w-2xl text-gray-700 text-center">
                            Welcome, {currentUser.email}!
                        </p>
                    )}

                    <div className="grid gap-8">
                        {mockBets.map((bet) => (
                            <div
                                key={bet.id}
                                className="bg-white shadow-md rounded-xl p-6 border border-rose-100"
                            >
                                <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                                    {bet.question}
                                </h2>
                                <div className="grid gap-3">
                                    {bet.options.map((option) => (
                                        <label key={option}>
                                            <input
                                                type="radio"
                                                name={`bet-${bet.id}`}
                                                value={option}
                                                className="hidden"
                                                checked={selections[bet.id] === option}
                                                onChange={() => handleSelect(bet.id, option)}
                                            />
                                            <div
                                                className={`cursor-pointer px-4 py-2 rounded-full border transition duration-200 ${selections[bet.id] === option
                                                    ? "bg-rose-400 text-white border-rose-400"
                                                    : "bg-white text-gray-700 border-gray-300 hover:bg-rose-100"
                                                    }`}
                                            >
                                                {option}
                                            </div>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        // IMPORTANT: Replace alert() with a custom modal/message box for production
                        onClick={() => alert("Your bets have been submitted! 🎉")}
                        className="mt-8 bg-purple-300 hover:bg-purple-400 text-white font-semibold py-3 px-8 rounded-full text-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
                    >
                        Submit Bets
                    </button>
                </div>
            </main>
        </div>
    );
}