"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from '../app/components/navBar';
import { getFirestore, collection, onSnapshot, query } from "firebase/firestore";

// Initialize Firestore
const db = getFirestore();

interface DisplayedWinner {
  userId: string;
  userName: string;
  score: number;
}

export default function Home() {
  const [displayedWinners, setDisplayedWinners] = useState<DisplayedWinner[]>([]);
  const [loadingWinners, setLoadingWinners] = useState(true);

  useEffect(() => {
    const homepageWinnersCollectionRef = collection(db, 'homepageWinners');
    const q = query(homepageWinnersCollectionRef);

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const winnersArray: DisplayedWinner[] = [];
      querySnapshot.forEach((doc) => {
        winnersArray.push({
          userId: doc.data().userId,
          userName: doc.data().userName,
          score: doc.data().score,
        });
      });
      setDisplayedWinners(winnersArray);
      setLoadingWinners(false);
    }, (error) => {
      console.error("Error fetching homepage winners:", error);
      setLoadingWinners(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  return (
    <div className="font-sans min-h-screen flex flex-col bg-rose-50">
      {/* Navbar */}
      <Navbar />

      {/* Main Content */}
      <main className="flex-grow flex flex-col items-center justify-center text-center px-6 py-16 bg-rose-50 text-gray-800">
        <h1 className="text-5xl md:text-6xl font-extrabold mb-6 text-rose-500 leading-tight">
          Welcome to Wedding Wagers!
        </h1>
        <p className="text-xl md:text-2xl mb-8 max-w-2xl text-gray-700">
          Where love meets friendly competition 💍<br /> Place your bets on the big day's best moments!
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link
            href="/bets"
            className="bg-rose-400 hover:bg-rose-500 text-white font-semibold py-3 px-8 rounded-full text-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
          >
            View All Bets
          </Link>
          <Link
            href="/about"
            className="bg-purple-300 hover:bg-purple-400 text-white font-semibold py-3 px-8 rounded-full text-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
          >
            Learn More
          </Link>
        </div>

        {/* Winner Display Section */}
        <div className="mt-12 opacity-90 bg-white shadow-md rounded-xl p-6 border border-rose-100 w-full max-w-md">
          <h2 className="text-3xl font-bold text-rose-500 mb-4">Official Winners</h2>
          {loadingWinners ? (
            <p className="text-gray-600">Loading winners...</p>
          ) : displayedWinners.length > 0 ? (
            <ul className="list-none p-0">
              {displayedWinners.map((winner) => (
                <li key={winner.userId} className="text-xl text-gray-700 mb-2">
                  <span className="font-semibold">{winner.userName}</span> - {winner.score} Correct!
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xl text-gray-700">Winner to be determined. Stay tuned!</p>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-rose-100 text-gray-600 p-4 text-center">
        <div className="container mx-auto text-sm">
          &copy; {new Date().getFullYear()} Wedding Wagers. Made with 💕
        </div>
      </footer>
    </div>
  );
}