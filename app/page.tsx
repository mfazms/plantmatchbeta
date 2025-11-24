"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";

// 🔹 Helper function untuk generate particle data
const generateParticles = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    width: Math.random() * 8 + 2,
    height: Math.random() * 8 + 2,
    left: Math.random() * 100,
    top: Math.random() * 100,
    r: 100 + Math.random() * 155,
    g: 200 + Math.random() * 55,
    b: 150 + Math.random() * 105,
    opacity: 0.3 + Math.random() * 0.4,
    delay: Math.random() * 5,
    duration: 5 + Math.random() * 5,
  }));
};

// 🔹 Helper function untuk generate shooting stars
const generateStars = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    top: Math.random() * 50,
    delay: i * 3 + Math.random() * 2,
  }));
};

export default function HomePage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [isHovering, setIsHovering] = useState(false);
  
  // 🔹 ⭐ NEW: State untuk particles (hanya di client)
  const [particles, setParticles] = useState<ReturnType<typeof generateParticles>>([]);
  const [stars, setStars] = useState<ReturnType<typeof generateStars>>([]);
  const [isMounted, setIsMounted] = useState(false);

  // 🔹 ⭐ Generate particles hanya di client-side
  useEffect(() => {
    setParticles(generateParticles(15));
    setStars(generateStars(3));
    setIsMounted(true);
  }, []);

  // Track mouse for parallax effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth - 0.5) * 20,
        y: (e.clientY / window.innerHeight - 0.5) * 20,
      });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <main className="relative h-screen flex flex-col bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 text-white overflow-hidden">
      {/* ⭐ SUPER INTERACTIVE BACKGROUND */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large animated gradient orbs */}
        <div 
          className="absolute top-10 left-10 w-96 h-96 bg-gradient-to-br from-emerald-400/30 to-teal-400/20 rounded-full blur-3xl animate-pulse"
          style={{
            transform: `translate(${mousePosition.x * 0.5}px, ${mousePosition.y * 0.5}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        ></div>
        <div 
          className="absolute bottom-10 right-10 w-[500px] h-[500px] bg-gradient-to-br from-teal-400/30 to-emerald-400/20 rounded-full blur-3xl animate-pulse" 
          style={{ 
            animationDelay: '1s',
            transform: `translate(${-mousePosition.x * 0.3}px, ${-mousePosition.y * 0.3}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        ></div>
        <div 
          className="absolute top-1/2 left-1/2 w-80 h-80 bg-gradient-to-br from-green-400/20 to-emerald-300/10 rounded-full blur-3xl animate-pulse" 
          style={{ 
            animationDelay: '2s',
            transform: `translate(${mousePosition.x * 0.2}px, ${mousePosition.y * 0.2}px)`,
            transition: 'transform 0.3s ease-out'
          }}
        ></div>
        
        {/* Animated grid pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)',
            backgroundSize: '50px 50px',
            animation: 'gridMove 20s linear infinite'
          }}></div>
        </div>

        {/* 🔹 ⭐ FIXED: Multiple floating particles - only render after mount */}
        {isMounted && particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute rounded-full animate-float"
            style={{
              width: `${particle.width}px`,
              height: `${particle.height}px`,
              left: `${particle.left}%`,
              top: `${particle.top}%`,
              background: `rgba(${particle.r}, ${particle.g}, ${particle.b}, ${particle.opacity})`,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
            }}
          ></div>
        ))}

        {/* 🔹 ⭐ FIXED: Shooting stars effect - only render after mount */}
        {isMounted && stars.map((star) => (
          <div
            key={`star-${star.id}`}
            className="absolute w-1 h-1 bg-white rounded-full animate-shooting-star"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              animationDelay: `${star.delay}s`,
            }}
          ></div>
        ))}
      </div>

      {/* ⭐ HERO SECTION - PERFECTLY CENTERED */}
      <section className="relative z-10 flex-1 flex items-center justify-center px-6">
        <div className="mx-auto max-w-6xl w-full grid md:grid-cols-2 items-center gap-12">
          {/* ⭐ LOGO WITH MEGA EFFECTS */}
          <div className="flex justify-center md:justify-end animate-fadeIn">
            <div 
              className="relative group cursor-pointer"
              onMouseEnter={() => setIsHovering(true)}
              onMouseLeave={() => setIsHovering(false)}
            >
              {/* Multi-layer glow effect */}
              <div className="absolute inset-0 bg-emerald-400/40 rounded-full blur-3xl animate-pulse group-hover:bg-emerald-300/60 transition-all duration-500"></div>
              <div className="absolute inset-0 bg-teal-400/30 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '0.5s' }}></div>
              
              {/* Rotating ring */}
              <div className="absolute inset-0 rounded-full border-2 border-emerald-300/30 animate-spin-slow group-hover:border-emerald-300/60 transition-all"></div>
              <div className="absolute inset-4 rounded-full border border-teal-300/20 animate-spin-slow-reverse" style={{ animationDelay: '1s' }}></div>
              
              <Image
                src="/hero.png"
                alt="PlantMatch logo"
                width={480}
                height={480}
                priority
                className={`relative w-full max-w-[340px] h-auto object-contain drop-shadow-2xl 
                          transform transition-all duration-700 ease-out
                          ${isHovering ? 'scale-110 rotate-3' : 'scale-100 rotate-0'}`}
                style={{
                  filter: isHovering ? 'drop-shadow(0 0 30px rgba(52, 211, 153, 0.8))' : 'drop-shadow(0 20px 40px rgba(0, 0, 0, 0.3))'
                }}
              />
            </div>
          </div>

          {/* ⭐ TEXT WITH MEGA ANIMATIONS */}
          <div className="text-center md:text-left space-y-6 animate-slideInRight">
            {/* Title with extreme glow */}
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight relative animate-fadeIn">
              <span className="relative inline-block">
                {/* Multiple glow layers */}
                <span className="absolute inset-0 blur-2xl bg-gradient-to-r from-emerald-400 via-teal-400 to-green-400 opacity-60 animate-pulse"></span>
                <span className="absolute inset-0 blur-lg bg-gradient-to-r from-emerald-300 to-teal-300 opacity-40"></span>
                <span className="relative bg-gradient-to-r from-emerald-50 via-white to-teal-50 bg-clip-text text-transparent animate-shimmer-text">
                  PlantMatch
                </span>
              </span>
            </h1>

            {/* Subtitle with typewriter effect */}
            <p className="text-emerald-50 text-lg md:text-xl leading-relaxed max-w-md mx-auto md:mx-0 animate-fadeIn backdrop-blur-sm bg-emerald-900/20 p-4 rounded-lg border border-emerald-400/20" 
               style={{ animationDelay: '0.2s' }}>
              Plants, like people, need the right environment to flourish.
              When the place feels right, growth comes naturally. So find the
              one that fits — not to change it, but to grow together.
            </p>

            {/* ⭐ SUPER INTERACTIVE BUTTON */}
            <div className="animate-fadeIn" style={{ animationDelay: '0.4s' }}>
              <Link
                href="/login"
                className="relative inline-flex items-center gap-3 rounded-full bg-white text-emerald-800 px-10 py-4 
                         font-bold text-lg overflow-hidden group
                         shadow-[0_0_30px_rgba(52,211,153,0.3)]
                         hover:shadow-[0_0_50px_rgba(52,211,153,0.8)]
                         hover:scale-110 active:scale-95
                         transition-all duration-300
                         border-2 border-emerald-200"
              >
                {/* Animated gradient background */}
                <div className="absolute inset-0 bg-gradient-to-r from-emerald-400 via-teal-400 to-emerald-400 opacity-0 
                              group-hover:opacity-20 transition-opacity duration-300"></div>
                
                {/* Multi-layer shimmer */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent 
                              translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-200/40 to-transparent 
                              translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700" 
                     style={{ transitionDelay: '0.1s' }}></div>
                
                {/* Pulsing glow on hover */}
                <div className="absolute inset-0 rounded-full bg-emerald-400/0 group-hover:bg-emerald-400/20 
                              group-hover:animate-ping opacity-0 group-hover:opacity-100"></div>
                
                <span className="relative z-10 flex items-center gap-3">
                  <span>Explore plants</span>
                  <svg 
                    className="w-6 h-6 transform group-hover:translate-x-2 group-hover:rotate-12 transition-all duration-300" 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </span>

                {/* Sparkles on hover */}
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping"></span>
                <span className="absolute -bottom-1 -left-1 w-2 h-2 bg-teal-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{ animationDelay: '0.2s' }}></span>
              </Link>
            </div>

            {/* ⭐ ANIMATED FEATURE BADGES */}
            <div className="flex flex-wrap gap-3 pt-4 animate-fadeIn" style={{ animationDelay: '0.6s' }}>
              {[
                { icon: "✨", text: "Smart Recommendations", color: "emerald" },
                { icon: "🎯", text: "Personalized Care Tips", color: "teal" }
              ].map((badge, idx) => (
                <div 
                  key={idx}
                  className={`group flex items-center gap-2 px-4 py-2 rounded-full 
                            bg-gradient-to-r from-emerald-800/50 to-teal-800/50 
                            border border-${badge.color}-400/30
                            backdrop-blur-sm
                            hover:border-${badge.color}-400/60
                            hover:shadow-[0_0_20px_rgba(52,211,153,0.4)]
                            transition-all duration-300
                            cursor-pointer hover:scale-105`}
                >
                  <span className="text-lg group-hover:scale-125 transition-transform duration-300">
                    {badge.icon}
                  </span>
                  <span className="text-sm font-medium text-emerald-100">
                    {badge.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ⭐ FOOTER - FIXED AT BOTTOM (NO NEED TO SCROLL) */}
      <footer className="relative z-10 w-full text-center py-4 border-t border-emerald-700/50 backdrop-blur-md bg-emerald-900/30">
        <p className="text-sm text-emerald-200 animate-fadeIn">
          © {new Date().getFullYear()}{" "}
          <span className="text-emerald-300 font-bold bg-gradient-to-r from-emerald-300 to-teal-300 bg-clip-text text-transparent">
            PlantMatch
          </span>
          {" "}— Find the Plant That Fits You
        </p>
      </footer>
    </main>
  );
}