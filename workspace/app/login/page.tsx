import { auth } from "../lib/firebase";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

export default function LoginPage() {
  const login = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  return (
    <div className="flex justify-center items-center h-screen">
      <button
        onClick={login}
        className="bg-rose-500 text-white px-6 py-3 rounded-xl shadow-md hover:bg-rose-400"
      >
        Login with Google
      </button>
    </div>
  );
}
