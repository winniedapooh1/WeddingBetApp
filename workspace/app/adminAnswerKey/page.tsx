"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Navbar from '../components/navBar';
import { getFirestore, collection, onSnapshot, addDoc, doc } from "firebase/firestore";
import { use } from "react";

// Initialize Firestore
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

export default function AdminAnswerKeyPage() {
  const [correctAnswers, setCorrectAnswers] = useState<{ [key: string]: string }>({});
  const [bets, setBets] = useState<any[]>([]);
  const [modalMessage, setModalMessage] = useState("");
  const { currentUser, loading } = useAuth();
  const router = useRouter();

  // You would implement real admin authentication logic here.
  // For this example, we'll just check if a user is logged in.
  useEffect(() => {
    if (!loading && !currentUser) {
      router.push('/login');
    }

    if (currentUser) {
      // Set up real-time listener for bets from Firestore
      const q = collection(db, 'bets');
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const betsArray: any[] = [];
        querySnapshot.forEach((doc) => {
          betsArray.push({ id: doc.id, ...doc.data() });
        });
        setBets(betsArray);
      });
      return () => unsubscribe();
    }
  }, [currentUser, loading, router]);

  const handleSelect = (betId: string, option: string) => {
    setCorrectAnswers((prev) => ({ ...prev, [betId]: option }));
  };

  const handleTextChange = (betId: string, value: string) => {
    setCorrectAnswers((prev) => ({ ...prev, [betId]: value }));
  };

  const handleAnswerKeySubmission = async () => {
    if (!currentUser) {
      setModalMessage("You must be logged in as an admin to perform this action.");
      return;
    }

    // Validate that all bets have an answer
    if (Object.keys(correctAnswers).length !== bets.length) {
      setModalMessage("Please provide an answer for all questions before submitting.");
      return;
    }

    try {
      // Create a single document object for all of the correct answers
      const answerKeyData = {
        submittedBy: currentUser.uid,
        submittedAt: new Date(),
        answers: correctAnswers, // Store the entire object of correct answers
      };

      // Save the single document to the 'keys' collection
      await addDoc(collection(db, 'keys'), answerKeyData);
      
      setModalMessage("The answer key has been submitted successfully! ✅");
      setCorrectAnswers({}); // Clear selections after submission
    } catch (error) {
      console.error("Error submitting answer key: ", error);
      setModalMessage("Failed to submit answer key. Please try again.");
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
            Create Answer Key
          </h1>

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
                            checked={correctAnswers[bet.id] === option}
                            onChange={() => handleSelect(bet.id, option)}
                          />
                          <div
                            className={`cursor-pointer px-4 py-2 rounded-full border transition duration-200 ${
                              correctAnswers[bet.id] === option
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
                        value={correctAnswers[bet.id] || ""}
                        onChange={(e) => handleTextChange(bet.id, e.target.value)}
                        className="w-full px-4 py-2 rounded-full border border-gray-300 text-gray-700 focus:border-rose-400 focus:ring-rose-400"
                        placeholder="Enter the correct answer here..."
                      />
                    </div>
                  )}
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500">No active bets available to create an answer key for.</p>
            )}
          </div>
          {bets.length > 0 && (
            <button
              onClick={handleAnswerKeySubmission}
              className="w-full mt-8 bg-purple-300 hover:bg-purple-400 text-white font-semibold py-3 px-8 rounded-full text-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
            >
              Submit Answer Key
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
