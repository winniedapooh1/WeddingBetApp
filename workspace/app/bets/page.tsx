"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Navbar from '../components/navBar';
import { getFirestore, collection, onSnapshot, addDoc, doc, getDoc } from "firebase/firestore";

// Initialize Firestore. This call will automatically use the default app instance
// that is initialized in your `../lib/firebase` file.
const db = getFirestore();

// A simple Modal component to replace alert() and confirm()
const CustomModal = ({ message, onClose }: { message: string, onClose: () => void }) => (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
    <div className="relative bg-white rounded-lg shadow-xl p-8 max-w-sm w-full mx-auto text-center">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Notification</h3>
      <p className="text-gray-700 mb-6">{message}</p>
      <div className="flex justify-center space-x-4">
        <button
          onClick={onClose}
          className="px-6 py-2 bg-rose-500 text-white rounded-lg font-semibold hover:bg-rose-600 transition-colors"
        >
          Close
        </button>
      </div>
    </div>
  </div>
);

export default function BetsPage() {
  const [selections, setSelections] = useState<{ [key: string]: string }>({});
  const [bets, setBets] = useState<any[]>([]);
  const [modalMessage, setModalMessage] = useState("");
  const [userName, setUserName] = useState<string | null>(null); // New state for the user's name

  const { currentUser, loading } = useAuth();
  const router = useRouter();

  // Effect hook to handle authentication-based redirection and data fetching
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }

    if (currentUser) {
      // Set up real-time listener for bets from Firestore
      const q = collection(db, 'bets');
      const unsubscribeBets = onSnapshot(q, (querySnapshot) => {
        const betsArray: any[] = [];
        querySnapshot.forEach((doc) => {
          betsArray.push({ id: doc.id, ...doc.data() });
        });
        setBets(betsArray);
      });

      // Fetch the user's name from the 'users' collection
      const fetchUserName = async () => {
        const userDocRef = doc(db, 'users', currentUser.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          setUserName(userDocSnap.data().name);
        }
      };
      
      fetchUserName();

      return () => unsubscribeBets();
    }
  }, [currentUser, loading, router]);

  const handleSelect = (betId: string, option: string) => {
    setSelections((prev) => ({ ...prev, [betId]: option }));
  };

  const handleTextChange = (betId: string, value: string) => {
    setSelections((prev) => ({ ...prev, [betId]: value }));
  };

  const handleBetSubmission = async () => {
    if (!currentUser) {
      setModalMessage("You must be logged in to submit bets.");
      return;
    }

    // Validate that all bets have been answered
    if (Object.keys(selections).length !== bets.length) {
      setModalMessage("Please answer all questions before submitting.");
      return;
    }

    try {
      // Create an array of user bet objects
      const userBetData = Object.entries(selections).map(([betId, userAnswer]) => {
        const bet = bets.find(b => b.id === betId);
        return {
          userId: currentUser.uid,
          betId,
          betQuestion: bet?.question || 'Unknown Question',
          userAnswer,
          submittedAt: new Date(),
        };
      });

      // Save each bet to the 'userBets' collection
      for (const bet of userBetData) {
        await addDoc(collection(db, 'userBets'), bet);
      }
      
      setModalMessage("Your bets have been submitted! 🎉");
      setSelections({}); // Clear selections after submission
    } catch (error) {
      console.error("Error submitting bets: ", error);
      setModalMessage("Failed to submit bets. Please try again.");
    }
  };

  if (loading || (!currentUser && !loading)) {
    return (
      <div className="font-sans min-h-screen flex items-center justify-center bg-rose-50 text-gray-700">
        {loading ? 'Loading bets...' : 'Redirecting to login...'}
      </div>
    );
  }

  return (
    <div className="bg-rose-50 min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-extrabold text-rose-500 text-center mb-10">
            Place Your Bets 💍
          </h1>
          {currentUser && (
            <p className="text-xl md:text-2xl mb-8 max-w-2xl text-gray-700 text-center mx-auto">
              Welcome, {userName || currentUser.email}!
            </p>
          )}

          <div className="grid gap-8">
            {bets.length > 0 ? (
              bets.map((bet) => (
                <div
                  key={bet.id}
                  className="bg-white shadow-md rounded-xl p-6 border border-rose-100"
                >
                  <h2 className="text-2xl font-semibold text-gray-800 mb-4">
                    {bet.question}
                  </h2>
                  {bet.type === "multiple-choice" && (
                    <div className="grid gap-3">
                      {bet.options.map((option: string) => (
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
                  )}
                  {bet.type === "open-ended" && (
                    <div>
                      <input
                        type="text"
                        value={selections[bet.id] || ""}
                        onChange={(e) => handleTextChange(bet.id, e.target.value)}
                        className="w-full px-4 py-2 rounded-full border border-gray-300 text-gray-700 focus:border-rose-400 focus:ring-rose-400"
                        placeholder="Type your answer here..."
                      />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">No active bets available right now. Check back later!</p>
            )}
          </div>
          {bets.length > 0 && (
            <button
              onClick={handleBetSubmission}
              className="w-full mt-8 bg-purple-300 hover:bg-purple-400 text-white font-semibold py-3 px-8 rounded-full text-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
            >
              Submit Bets
            </button>
          )}
        </div>
      </main>

      {modalMessage && (
        <CustomModal
          message={modalMessage}
          onClose={() => setModalMessage("")}
        />
      )}
    </div>
  );
}
