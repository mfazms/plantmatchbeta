'use client';
import Link from "next/link";
import Image from "next/image";
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { auth } from "../../lib/firebaseConfig";
import { signInWithEmailAndPassword } from "firebase/auth";

export default function LoginPage() {
  const router = useRouter(); 
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      alert(`Selamat datang, ${user.email}`);
      router.push('/rekomendasi');
    } catch (err: any) {
      alert("Login gagal: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] grid grid-cols-1 md:grid-cols-[40%_1fr] text-gray-900 bg-white">
      {/* KIRI: Branding */}
      <div className="flex flex-col items-center justify-center px-12 py-10 bg-emerald-800 text-white md:h-[100dvh]">
        <Image
          src="/hero.png"
          alt="PlantMatch Logo"
          width={160}
          height={160}
          priority
          className="mb-6 object-contain"
        />
        <h1 className="text-4xl font-extrabold tracking-tight mb-0 mt-6">
          Hello Again!
        </h1>
        <p className="text-lg text-emerald-100 text-center max-w-sm mt-2">
          Welcome back to PlantMatch.
        </p>
      </div>

      {/* KANAN: Form Login */}
      <div className="flex items-center justify-center bg-white p-12 md:h-[100dvh]"> 
        <div className="w-full max-w-md">
          <h2 className="text-center text-4xl font-extrabold text-emerald-800 mb-2">
            Log In
          </h2>
          <p className="text-center text-lg text-gray-500 mb-8">
            Sign in to continue your plant matching journey.
          </p>

          {/* FORM LOGIN */}
          <form className="space-y-6" onSubmit={handleSubmit}> 
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white text-gray-900"
                placeholder="example@email.com" 
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white text-gray-900"
                placeholder="Minimum 6 characters"
              />
            </div>

            {/* Tombol Login */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-3.5 px-4 rounded-lg shadow-lg text-lg font-bold 
                            text-white ${
                              loading
                                ? "bg-emerald-400 cursor-not-allowed"
                                : "bg-emerald-600 hover:bg-emerald-700"
                            } focus:outline-none focus:ring-4 focus:ring-emerald-300 transition-all`}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </div>
          </form>

          {/* Link ke Register */}
          <p className="text-center text-sm pt-6 mt-6 text-gray-600">
            Don't have an account?{" "}
            <Link 
              href="/register" 
              className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Register here
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
