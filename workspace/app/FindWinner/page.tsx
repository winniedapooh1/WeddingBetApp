"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Navbar from '../components/navBar';
import { getFirestore, collection, getDocs, query } from "firebase/firestore";

// Initialize Firestore
const db = getFirestore();

// A simple Modal component
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

interface UserScore {
  userId: string;
  userName: string;
  score: number;
}

export default function FindWinnerPage() {
  const { currentUser, loading, isAdmin, isAdminLoading } = useAuth();
  const router = useRouter();

  const [userScores, setUserScores] = useState<UserScore[]>([]);
  const [winningUsers, setWinningUsers] = useState<string[]>([]);
  const [highestScore, setHighestScore] = useState<number>(0);
  const [loadingResults, setLoadingResults] = useState(false);
  const [modalMessage, setModalMessage] = useState("");

  // Effect hook to handle access control
  useEffect(() => {
    // Redirect if not an admin after loading is complete
    if (!isAdminLoading && !isAdmin) {
      router.push('/'); // Redirect to home or a permission denied page
    }
  }, [isAdmin, isAdminLoading, router]);

  const findWinner = async () => {
    if (!currentUser) {
      setModalMessage("You must be logged in to find the winner.");
      return;
    }
    if (!isAdmin) {
      setModalMessage("You do not have administrative privileges to perform this action.");
      return;
    }

    setLoadingResults(true);
    setUserScores([]);
    setWinningUsers([]);
    setHighestScore(0);

    try {
      // 1. Fetch the Answer Key
      const keysCollectionRef = collection(db, 'keys');
      const keysSnapshot = await getDocs(query(keysCollectionRef));
      
      if (keysSnapshot.empty) {
        setModalMessage("No answer key found. Please ensure an admin has submitted one.");
        setLoadingResults(false);
        return;
      }
      // Assuming only one answer key document for now, or taking the first one
      const answerKeyDoc = keysSnapshot.docs[0];
      const answerKey = answerKeyDoc.data().answers;

      // 2. Fetch all User Answers
      const answersCollectionRef = collection(db, 'answers');
      const answersSnapshot = await getDocs(query(answersCollectionRef));

      if (answersSnapshot.empty) {
        setModalMessage("No user answers found yet.");
        setLoadingResults(false);
        return;
      }

      const scores: { [userId: string]: { userName: string; score: number; userId: string } } = {}; // Added userId to the type

      // 3. Compare and Score each user's submission
      answersSnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const userId = data.userId;
        const userName = data.userName;
        const userAnswers = data.answers;
        let currentScore = 0;

        for (const betId in userAnswers) {
          if (userAnswers.hasOwnProperty(betId) && answerKey.hasOwnProperty(betId)) {
            if (userAnswers[betId] === answerKey[betId]) {
              currentScore++;
            }
          }
        }

        // Store the highest score for this user if they submitted multiple times
        if (!scores[userId] || currentScore > scores[userId].score) {
          scores[userId] = { userName, score: currentScore, userId: userId }; // Ensure userId is included here
        }
      });

      const calculatedUserScores: UserScore[] = Object.values(scores);
      setUserScores(calculatedUserScores);

      // 4. Identify Winner(s)
      let maxScore = 0;
      if (calculatedUserScores.length > 0) {
        maxScore = Math.max(...calculatedUserScores.map(s => s.score));
      }
      
      const winners = calculatedUserScores.filter(s => s.score === maxScore && maxScore > 0);
      
      setHighestScore(maxScore);
      setWinningUsers(winners.map(w => w.userName));

      if (winners.length > 0) {
        setModalMessage(`Winner(s) found! Highest score: ${maxScore}`);
      } else {
        setModalMessage("No winners found yet (or no correct answers).");
      }

    } catch (error) {
      console.error("Error finding winner:", error);
      setModalMessage("An error occurred while trying to find the winner. Please check console for details.");
    } finally {
      setLoadingResults(false);
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
            Find Wedding Bet Winner
          </h1>

          <div className="text-center mb-8">
            <button
              onClick={findWinner}
              className="bg-purple-300 hover:bg-purple-400 text-white font-semibold py-3 px-8 rounded-full text-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
              disabled={loadingResults}
            >
              {loadingResults ? 'Calculating...' : 'Find Winner'}
            </button>
          </div>

          {loadingResults && (
            <p className="text-center text-gray-600 mt-4">Calculating results, please wait...</p>
          )}

          {!loadingResults && winningUsers.length > 0 && (
            <section className="bg-white shadow-md rounded-xl p-6 border border-rose-100 mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4 text-center">
                🎉 Winner(s)! 🎉
              </h2>
              <p className="text-xl text-center text-gray-700 mb-4">
                Highest Score: <span className="font-bold text-rose-500">{highestScore}</span> correct answers
              </p>
              <ul className="list-disc list-inside text-gray-700 text-center">
                {winningUsers.map((name, index) => (
                  <li key={index} className="text-lg font-medium">
                    {name}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {!loadingResults && userScores.length > 0 && (
            <section className="bg-white shadow-md rounded-xl p-6 border border-rose-100">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">All Participant Scores</h2>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Participant
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userScores.sort((a, b) => b.score - a.score).map((user, index) => (
                      <tr key={user.userId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.userName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.score}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          )}
          {!loadingResults && userScores.length === 0 && !winningUsers.length && (
            <p className="text-center text-gray-500">Click "Find Winner" to calculate results.</p>
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
