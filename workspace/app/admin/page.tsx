"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Navbar from '../components/navBar';
import { getFirestore, collection, addDoc, onSnapshot, doc, deleteDoc } from "firebase/firestore";

// Initialize Firestore. This call will automatically use the default app instance
// that is initialized in your `../lib/firebase` file.
const db = getFirestore();

// A simple Modal component to replace alert() and confirm()
const CustomModal = ({ message, onClose, onConfirm }: { message: string, onClose: () => void, onConfirm?: () => void }) => (
  <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
    <div className="relative bg-white rounded-lg shadow-xl p-8 max-w-sm w-full mx-auto text-center">
      <h3 className="text-xl font-semibold text-gray-900 mb-4">Notification</h3>
      <p className="text-gray-700 mb-6">{message}</p>
      <div className="flex justify-center space-x-4">
        {onConfirm && (
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition-colors"
          >
            Confirm
          </button>
        )}
        <button
          onClick={onClose}
          className="px-6 py-2 bg-rose-500 text-white rounded-lg font-semibold hover:bg-rose-600 transition-colors"
        >
          {onConfirm ? 'Cancel' : 'Close'}
        </button>
      </div>
    </div>
  </div>
);

export default function AdminPage() {
  const { currentUser, loading, isAdmin, isAdminLoading } = useAuth();
  const router = useRouter();

  // State for new bet form
  const [newBetQuestion, setNewBetQuestion] = useState("");
  const [newBetType, setNewBetType] = useState<"multiple-choice" | "open-ended">("multiple-choice"); // New state for bet type
  const [newBetOptions, setNewBetOptions] = useState<string[]>([""]);

  // State for bets fetched from Firestore
  const [bets, setBets] = useState<any[]>([]);

  // State for modal
  const [modalMessage, setModalMessage] = useState("");
  const [betToDelete, setBetToDelete] = useState<string | null>(null);

  // Effect to handle access control and data fetching
  useEffect(() => {
    // Redirect if not an admin after loading is complete
    if (!isAdminLoading && !isAdmin) {
      router.push('/');
    }

    // Set up real-time listener for bets from Firestore
    if (!loading && currentUser) {
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
  }, [isAdmin, isAdminLoading, router, currentUser, loading]);

  // Handle adding a new option field to the form
  const handleAddOption = () => {
    setNewBetOptions([...newBetOptions, ""]);
  };

  // Handle a change in an option's value
  const handleOptionChange = (index: number, value: string) => {
    const updatedOptions = [...newBetOptions];
    updatedOptions[index] = value;
    setNewBetOptions(updatedOptions);
  };

  // Handle form submission to create a new bet
  const handleCreateBet = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate fields based on bet type
    if (!newBetQuestion || (newBetType === "multiple-choice" && newBetOptions.some(option => option.trim() === ""))) {
      setModalMessage("Please fill out all fields.");
      return;
    }
    
    try {
      const betData = {
        question: newBetQuestion,
        type: newBetType,
        options: newBetType === "multiple-choice" ? newBetOptions.filter(option => option.trim() !== "") : [],
        createdAt: new Date(),
      };

      await addDoc(collection(db, 'bets'), betData);
      setModalMessage("Bet created successfully!");
      setNewBetQuestion("");
      setNewBetType("multiple-choice");
      setNewBetOptions([""]);
    } catch (error) {
      console.error("Error adding document: ", error);
      setModalMessage("Failed to create bet. Please try again.");
    }
  };

  // Handle deleting a bet
  const handleDeleteBet = (betId: string) => {
    setBetToDelete(betId);
    setModalMessage("Are you sure you want to delete this bet?");
  };

  const confirmDelete = async () => {
    if (betToDelete) {
      try {
        await deleteDoc(doc(db, 'bets', betToDelete));
        setModalMessage("Bet deleted successfully!");
        setBetToDelete(null);
      } catch (error) {
        console.error("Error deleting document: ", error);
        setModalMessage("Failed to delete bet. Please try again.");
        setBetToDelete(null);
      }
    }
  };

  if (loading || isAdminLoading) {
    return (
      <div className="font-sans min-h-screen flex flex-col items-center justify-center bg-rose-50 text-gray-700">
        <p className="mt-4">Loading user status...</p>
      </div>
    );
  }

  // Redirect if the user is not an admin
  if (!isAdmin) {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className="bg-rose-50 min-h-screen flex flex-col font-sans">
      <Navbar />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-extrabold text-rose-500 text-center mb-10">
            Admin Dashboard
          </h1>

          {/* Form to create a new bet */}
          <section className="mb-12 p-8 bg-white shadow-md rounded-xl border border-rose-100">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Create New Bet</h2>
            <form onSubmit={handleCreateBet} className="space-y-4">
              <div>
                <label htmlFor="question" className="block text-sm font-medium text-gray-700 mb-1">
                  Bet Question
                </label>
                <input
                  type="text"
                  id="question"
                  value={newBetQuestion}
                  onChange={(e) => setNewBetQuestion(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-400 focus:ring-rose-400 sm:text-sm p-2 text-gray-900"
                  required
                />
              </div>

              <div>
                <label htmlFor="betType" className="block text-sm font-medium text-gray-700 mb-1">
                  Question Type
                </label>
                <select
                  id="betType"
                  value={newBetType}
                  onChange={(e) => setNewBetType(e.target.value as "multiple-choice" | "open-ended")}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-400 focus:ring-rose-400 sm:text-sm p-2 text-gray-900"
                >
                  <option value="multiple-choice">Multiple Choice</option>
                  <option value="open-ended">Open Ended</option>
                </select>
              </div>

              {newBetType === "multiple-choice" && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Options
                  </label>
                  {newBetOptions.map((option, index) => (
                    <div key={index} className="flex items-center mt-2">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-rose-400 focus:ring-rose-400 sm:text-sm p-2 text-gray-900"
                        placeholder={`Option ${index + 1}`}
                        required
                      />
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddOption}
                    className="mt-3 text-sm text-purple-600 hover:text-purple-800"
                  >
                    + Add another option
                  </button>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-purple-300 hover:bg-purple-400 text-white font-semibold py-3 px-8 rounded-full text-lg shadow-md transition duration-300"
              >
                Create Bet
              </button>
            </form>
          </section>

          {/* Display current bets */}
          <section>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">Existing Bets</h2>
            <div className="space-y-4">
              {bets.length > 0 ? (
                bets.map((bet) => (
                  <div
                    key={bet.id}
                    className="bg-white shadow-md rounded-xl p-6 border border-rose-100 flex justify-between items-start"
                  >
                    <div>
                      <h3 className="text-xl font-semibold text-gray-800">{bet.question}</h3>
                      <p className="text-sm text-gray-500 mb-2">Type: {bet.type === "multiple-choice" ? "Multiple Choice" : "Open Ended"}</p>
                      {bet.options.length > 0 && (
                        <ul className="mt-2 list-disc list-inside text-gray-600">
                          {bet.options.map((option: string, index: number) => (
                            <li key={index}>{option}</li>
                          ))}
                        </ul>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteBet(bet.id)}
                      className="text-gray-400 hover:text-red-500 transition duration-300 ml-4 p-1 rounded-full hover:bg-red-100"
                      aria-label="Delete bet"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))
              ) : (
                <p className="text-center text-gray-500">No bets have been created yet.</p>
              )}
            </div>
          </section>
        </div>
      </main>

      {modalMessage && (
        <CustomModal
          message={modalMessage}
          onClose={() => {
            setModalMessage("");
            setBetToDelete(null);
          }}
          onConfirm={betToDelete ? confirmDelete : undefined}
        />
      )}
    </div>
  );
}
