import Image from "next/image";
import Link from "next/link";

export default function AboutPage() {
  return (
    <main className="bg-rose-50 min-h-screen">
      {/* Navbar */}
      <nav className="bg-white shadow-md border-b border-rose-100 mb-12">
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
      <div className="max-w-3xl mx-auto text-center">
        <div className="mb-8">
          <Image
            src="/coupleStockImage.jpg"
            alt="Placeholder Wedding"
            width={400}
            height={300}
            className="mx-auto rounded-xl shadow-md"
          />
        </div>
        <h1 className="text-4xl font-extrabold text-rose-500 mb-6">About Wedding Wagers</h1>
        <p className="text-lg text-gray-700 mb-4">
          Wedding Wagers is a fun and lighthearted way to celebrate love and friendly competition. Whether you're betting on the first tear, the last dance, or the cake mishap, we've got you covered.
        </p>
        <p className="text-lg text-gray-700">
          We built this platform to make weddings even more memorable — one prediction at a time. Ready to join the fun?
        </p>
      </div>
    </main>
  );
}
