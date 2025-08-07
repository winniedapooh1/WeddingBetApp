"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "../context/AuthContext";
import Navbar from '../components/navBar';
import { getFirestore, collection, getDocs, query, addDoc, deleteDoc } from "firebase/firestore";

// Initialize Firestore
const db = getFirestore();

// Custom Modal Component for general messages
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

// Modal Component to display user's answers
interface UserAnswersModalProps {
  userScore: UserScore;
  allBets: any[]; // All original bets (questions)
  userSubmittedAnswers: { [betId: string]: string }; // The specific user's answers
  onClose: () => void;
}

const UserAnswersModal = ({ userScore, allBets, userSubmittedAnswers, onClose }: UserAnswersModalProps) => {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div className="relative bg-white rounded-lg shadow-xl p-8 max-w-2xl w-full mx-auto max-h-[90vh] overflow-y-auto">
        <h3 className="text-2xl font-semibold text-gray-900 mb-6 text-center">
          Answers for {userScore.userName}
        </h3>
        <div className="space-y-4 mb-6">
          {allBets.map((bet) => (
            <div key={bet.id} className="p-4 border border-gray-200 rounded-lg">
              <p className="font-semibold text-gray-800 mb-1">{bet.question}</p>
              <p className="text-gray-700">
                Your Answer: <span className="font-medium">{userSubmittedAnswers[bet.id] || "No answer provided"}</span>
              </p>
            </div>
          ))}
        </div>
        <div className="flex justify-center">
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
};

interface UserScore {
  userId: string;
  userName: string;
  score: number;
  isSelected: boolean; // New property for checkbox selection
  userSubmittedAnswers: { [betId: string]: string }; // Store the user's raw answers for modal
}

export default function FindWinnerPage() {
  const { currentUser, loading, isAdmin, isAdminLoading } = useAuth();
  const router = useRouter();

  const [userScores, setUserScores] = useState<UserScore[]>([]);
  const [winningUsers, setWinningUsers] = useState<string[]>([]);
  const [highestScore, setHighestScore] = useState<number>(0);
  const [loadingResults, setLoadingResults] = useState(false);
  const [modalMessage, setModalMessage] = useState("");
  const [userAnswersModalOpen, setUserAnswersModalOpen] = useState(false);
  const [selectedUserForModal, setSelectedUserForModal] = useState<UserScore | null>(null);
  const [allBets, setAllBets] = useState<any[]>([]); // To store all bets for the answers modal

  // Effect hook to handle access control
  useEffect(() => {
    if (!isAdminLoading && !isAdmin) {
      router.push('/');
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
      // 1. Fetch all Bets (questions)
      const betsCollectionRef = collection(db, 'bets');
      const betsSnapshot = await getDocs(query(betsCollectionRef));
      const fetchedBets = betsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllBets(fetchedBets); // Store all bets for the modal

      // 2. Fetch the Answer Key
      const keysCollectionRef = collection(db, 'keys');
      const keysSnapshot = await getDocs(query(keysCollectionRef));
      
      if (keysSnapshot.empty) {
        setModalMessage("No answer key found. Please ensure an admin has submitted one.");
        setLoadingResults(false);
        return;
      }
      const answerKeyDoc = keysSnapshot.docs[0];
      const answerKey = answerKeyDoc.data().answers;

      // 3. Fetch all User Answers
      const answersCollectionRef = collection(db, 'answers');
      const answersSnapshot = await getDocs(query(answersCollectionRef));

      if (answersSnapshot.empty) {
        setModalMessage("No user answers found yet.");
        setLoadingResults(false);
        return;
      }

      const scores: { [userId: string]: { userName: string; score: number; userId: string; userSubmittedAnswers: { [betId: string]: string } } } = {};

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
          scores[userId] = { userName, score: currentScore, userId: userId, userSubmittedAnswers: userAnswers };
        }
      });

      const calculatedUserScores: UserScore[] = Object.values(scores).map(score => ({
        ...score,
        isSelected: false // Initialize selection state
      }));
      setUserScores(calculatedUserScores);

      // 4. Identify Winner(s) (based on highest score)
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

  const handleCheckboxChange = (userId: string) => {
    setUserScores(prevScores => 
      prevScores.map(score => 
        score.userId === userId ? { ...score, isSelected: !score.isSelected } : score
      )
    );
  };

  const handleViewAnswers = (user: UserScore) => {
    setSelectedUserForModal(user);
    setUserAnswersModalOpen(true);
  };

  const handleDisplayWinnersOnHomepage = async () => {
    const selectedWinners = userScores.filter(user => user.isSelected);

    if (selectedWinners.length === 0) {
      setModalMessage("Please select at least one winner to display on the homepage.");
      return;
    }

    try {
      // Clear existing homepage winners (optional, but good for fresh display)
      const homepageWinnersCollectionRef = collection(db, 'homepageWinners');
      const existingWinnersSnapshot = await getDocs(query(homepageWinnersCollectionRef));
      const deletePromises = existingWinnersSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Add selected winners to homepageWinners collection
      for (const winner of selectedWinners) {
        await addDoc(homepageWinnersCollectionRef, {
          userName: winner.userName,
          score: winner.score,
          userId: winner.userId,
          displayedAt: new Date(),
        });
      }
      setModalMessage("Selected winner(s) displayed on homepage successfully!");
    } catch (error) {
      console.error("Error displaying winners on homepage:", error);
      setModalMessage("Failed to display winners on homepage. Please try again.");
    }
  };


  if (loading || isAdminLoading) {
    return (
      <div className="font-sans min-h-screen flex flex-col items-center justify-center bg-rose-50 text-gray-700">
        <p className="mt-4">Loading user status...</p>
      </div>
    );
  }

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
              <div className="overflow-x-auto mb-4">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Select
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Participant
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Score
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {userScores.sort((a, b) => b.score - a.score).map((user) => (
                      <tr key={user.userId}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            checked={user.isSelected}
                            onChange={() => handleCheckboxChange(user.userId)}
                            className="h-4 w-4 text-rose-600 focus:ring-rose-500 border-gray-300 rounded"
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {user.userName}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {user.score}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <button
                            onClick={() => handleViewAnswers(user)}
                            className="text-purple-600 hover:text-purple-900"
                          >
                            View Answers
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="text-center mt-4">
                <button
                  onClick={handleDisplayWinnersOnHomepage}
                  className="bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2 px-6 rounded-full text-lg shadow-md transition duration-300 ease-in-out transform hover:-translate-y-1 hover:scale-105"
                >
                  Display Selected Winners on Homepage
                </button>
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

      {userAnswersModalOpen && selectedUserForModal && (
        <UserAnswersModal
          userScore={selectedUserForModal}
          allBets={allBets}
          userSubmittedAnswers={selectedUserForModal.userSubmittedAnswers}
          onClose={() => setUserAnswersModalOpen(false)}
        />
      )}
    </div>
  );
}
