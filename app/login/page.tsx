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

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      alert(`Selamat datang, ${user.email}`);
      router.push('/rekomendasi');
    } catch (err: unknown) {
      let message = "Terjadi kesalahan saat login.";
      if (err instanceof Error) {
        message = err.message;
      } else if (typeof err === "object" && err !== null && "message" in err) {
        message = String((err as { message?: unknown }).message ?? message);
      }
      alert("Login gagal: " + message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[100dvh] grid grid-cols-1 md:grid-cols-[40%_1fr] text-gray-900 bg-white">
      {/* ⭐ KIRI: Branding dengan efek aesthetic */}
      <div className="relative flex flex-col items-center justify-center px-12 py-10 bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white md:h-[100dvh] overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-64 h-64 bg-emerald-400/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-20 right-10 w-80 h-80 bg-teal-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          
          {/* Floating particles */}
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full animate-float"
              style={{
                width: `${Math.random() * 6 + 2}px`,
                height: `${Math.random() * 6 + 2}px`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                background: `rgba(${100 + Math.random() * 155}, ${200 + Math.random() * 55}, ${150 + Math.random() * 105}, ${0.3 + Math.random() * 0.3})`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${5 + Math.random() * 5}s`,
              }}
            ></div>
          ))}
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center animate-fadeIn">
          {/* Logo with glow */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-emerald-400/30 rounded-full blur-2xl animate-pulse"></div>
            <Image
              src="/hero.png"
              alt="PlantMatch Logo"
              width={230}
              height={230}
              priority
              className="relative object-contain drop-shadow-2xl transform hover:scale-110 transition-transform duration-500"
            />
          </div>

          {/* Title with gradient */}
          <h1 className="text-5xl font-extrabold tracking-tight mb-2 mt-6 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
            <span className="bg-gradient-to-r from-emerald-100 via-white to-teal-100 bg-clip-text text-transparent">
              Hello Again!
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-emerald-100 text-center max-w-sm mt-3 animate-fadeIn backdrop-blur-sm bg-emerald-900/20 px-6 py-3 rounded-lg border border-emerald-400/20" 
             style={{ animationDelay: '0.4s' }}>
            Welcome back to PlantMatch. Are you ready to continue your plant matching journey?
          </p>

          {/* Decorative elements */}
          <div className="flex gap-2 mt-8 animate-fadeIn" style={{ animationDelay: '0.6s' }}>
            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" style={{ animationDelay: '0.3s' }}></div>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" style={{ animationDelay: '0.6s' }}></div>
          </div>
        </div>
      </div>

      {/* ⭐ KANAN: Form Login dengan efek modern */}
      <div className="flex items-center justify-center bg-gradient-to-br from-gray-50 to-white p-12 md:h-[100dvh] relative overflow-hidden">
        {/* Subtle background pattern */}
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: 'radial-gradient(circle, #10b981 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}></div>

        <div className="relative z-10 w-full max-w-md animate-fadeIn">
          {/* Header with glow effect */}
          <div className="text-center mb-8">
            <h2 className="text-5xl font-extrabold text-transparent bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text mb-3 animate-fadeIn">
              Log In
            </h2>
            <p className="text-lg text-gray-600 animate-fadeIn" style={{ animationDelay: '0.2s' }}>
              Sign in to continue your plant matching journey.
            </p>
          </div>

          {/* Form dengan glass effect */}
          <form className="space-y-6 backdrop-blur-sm bg-white/80 p-8 rounded-2xl border border-emerald-100 shadow-xl animate-fadeIn" 
                onSubmit={handleSubmit}
                style={{ animationDelay: '0.3s' }}>
            
            {/* Email */}
            <div className="group">
              <label htmlFor="email" className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-emerald-600">📧</span>
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="block w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 
                           transition-all bg-white text-gray-900
                           hover:border-emerald-300 group-hover:shadow-md"
                placeholder="example@email.com"
              />
            </div>

            {/* Password */}
            <div className="group">
              <label htmlFor="password" className="block text-sm font-bold text-gray-700 mb-2 flex items-center gap-2">
                <span className="text-emerald-600">🔒</span>
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
                className="block w-full px-4 py-3.5 border-2 border-gray-200 rounded-xl shadow-sm placeholder-gray-400 
                           focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 
                           transition-all bg-white text-gray-900
                           hover:border-emerald-300 group-hover:shadow-md"
                placeholder="Minimum 6 characters"
              />
            </div>

            {/* ⭐ Tombol Login dengan efek interactive */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className={`relative w-full flex justify-center items-center gap-2 py-4 px-4 rounded-xl shadow-lg text-lg font-bold 
                            text-white overflow-hidden group
                            ${loading
                    ? "bg-emerald-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                  } 
                            focus:outline-none focus:ring-4 focus:ring-emerald-300 
                            transition-all duration-300 hover:scale-105 hover:shadow-[0_0_30px_rgba(16,185,129,0.5)] active:scale-95`}
              >
                {/* Shimmer effect */}
                {!loading && (
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent 
                                translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                )}
                
                <span className="relative z-10">{loading ? "Logging in..." : "Login"}</span>
                
                {!loading && (
                  <svg className="relative z-10 w-5 h-5 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                )}
              </button>
            </div>
          </form>

          {/* Link ke Register dengan hover effect */}
          <p className="text-center text-sm pt-8 text-gray-600 animate-fadeIn" style={{ animationDelay: '0.5s' }}>
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-bold text-emerald-600 hover:text-emerald-700 transition-all duration-300 
                       hover:underline decoration-2 underline-offset-4 inline-flex items-center gap-1 group"
            >
              Register here
              <svg className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}