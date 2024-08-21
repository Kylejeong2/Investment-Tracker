import Link from 'next/link';
import { auth } from '@clerk/nextjs/server';

export default function Home() {
  const { userId } = auth();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col justify-center items-center">
      <h1 className="text-5xl font-bold mb-8 text-blue-400">ZFellow's Investment Tracker</h1>
      <p className="text-xl mb-8 text-center max-w-2xl">
        Literally see where your investments are in real time.
      </p>
      {userId ? (
        <Link href="/dashboard" className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition duration-300">
          Go to Dashboard
        </Link>
      ) : (
        <div className="space-x-4">
          <Link href="/sign-in" className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-blue-700 transition duration-300">
            Sign In
          </Link>
          <Link href="/sign-up" className="bg-green-600 text-white px-6 py-3 rounded-lg text-lg font-semibold hover:bg-green-700 transition duration-300">
            Sign Up
          </Link>
        </div>
      )}
    </div>
  );
}