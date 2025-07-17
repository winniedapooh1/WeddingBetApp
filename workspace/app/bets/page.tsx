"use client";

import { useState } from "react";
import Link from "next/link";

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
  const [selections, setSelections] = useState<{ [key: number]: string }>({});

  const handleSelect = (betId: number, option: string) => {
    setSelections((prev) => ({ ...prev, [betId]: option }));
  };

  return (
    <div className="bg-rose-50 min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-white shadow-md border-b border-rose-100">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <Link href="/" className="text-rose-500 text-3xl font-extrabold tracking-wide">
            Wedding Wagers
          </Link>
          <ul className="flex space-x-6">
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
          </ul>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-extrabold text-rose-500 text-center mb-10">
            Place Your Bets 💍
          </h1>

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
                        className={`cursor-pointer px-4 py-2 rounded-full border transition duration-200 ${
                          selections[bet.id] === option
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
        </div>
      </main>
    </div>
  );
}
