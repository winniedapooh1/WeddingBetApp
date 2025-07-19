import Link from "next/link";

export default function Home() {
  return (
    <div className="font-sans min-h-screen flex flex-col bg-rose-50">
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

        {/* Optional image or flair */}
        <div className="mt-12 opacity-90">
          {/* <Image
            src="/wedding-rings.svg"
            alt="Wedding Rings"
            width={200}
            height={200}
          /> */}
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
