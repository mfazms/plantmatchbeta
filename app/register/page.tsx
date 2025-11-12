"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { auth, db } from "../../lib/firebaseConfig"; // ✅ pastikan path sesuai
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

export default function RegisterPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Update nama tampilan
      await updateProfile(user, { displayName });

      // Simpan data user di Firestore
      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName,
        createdAt: new Date(),
      });

      alert("Registrasi berhasil! Silakan login.");
      router.push("/login");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] grid grid-cols-1 md:grid-cols-[40%_1fr] text-gray-900 bg-white">
      {/* BAGIAN KIRI */}
      <div className="flex flex-col items-center justify-center px-12 py-10 bg-emerald-800 text-white shadow-2xl shadow-black/50 md:h-[100dvh]">
        <Image
          src="/hero.png"
          alt="PlantMatch Logo"
          width={220}
          height={220}
          priority
          className="mb-6 object-contain drop-shadow-lg"
        />
        <h1 className="text-4xl font-extrabold tracking-tight mb-0 mt-6">
          Welcome!
        </h1>
        <p className="text-lg text-emerald-100 text-center max-w-sm mt-2">
          You're one step away from finding the perfect plant for you.
        </p>
      </div>

      {/* BAGIAN KANAN */}
      <div className="flex items-center justify-center bg-white p-12 md:h-[100dvh]">
        <div className="w-full max-w-md">
          <h2 className="text-center text-4xl font-extrabold text-emerald-800 mb-2">
            Create Account
          </h2>
          <p className="text-center text-lg text-gray-500 mb-8">
            Start your journey to find the plant that fits you.
          </p>

          {/* FORM REGISTER */}
          <form className="space-y-6" onSubmit={handleRegister}>
            {/* Username */}
            <div>
              <label
                htmlFor="username"
                className="block text-sm font-semibold text-gray-700 mb-1"
              >
                Username
              </label>
              <input
                id="username"
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                           placeholder-gray-400 focus:outline-none focus:ring-2 
                           focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white text-gray-900"
                placeholder="Enter your username"
              />
            </div>

            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-semibold text-gray-700 mb-1"
              >
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                           placeholder-gray-400 focus:outline-none focus:ring-2 
                           focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white text-gray-900"
                placeholder="example@email.com"
              />
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-semibold text-gray-700 mb-1"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm 
                           placeholder-gray-400 focus:outline-none focus:ring-2 
                           focus:ring-emerald-500 focus:border-emerald-500 transition-all bg-white text-gray-900"
                placeholder="Minimum 6 characters"
              />
            </div>

            {/* Tombol Register */}
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
                {loading ? "Registering..." : "Register"}
              </button>
            </div>
          </form>

          {/* Link ke Login */}
          <p className="text-center text-sm pt-6 mt-6 text-gray-600">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors"
            >
              Login here
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
