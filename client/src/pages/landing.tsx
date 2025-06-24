import { Link } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import { useEffect } from "react";

export default function Landing() {
  const { user, isLoading } = useAuth();

  // Redirect to portal if user is already logged in
  useEffect(() => {
    if (!isLoading && user) {
      window.location.href = "/portal";
    }
  }, [user, isLoading]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-soft-lavender"></div>
      </div>
    );
  }

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="text-center max-w-2xl animate-fade-in">
        {/* Decorative top line */}
        <div className="decorative-line mb-8"></div>
        
        {/* Main title */}
        <h1 className="font-playfair text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 tracking-tight">
          <span className="text-soft-lavender">Introspens</span>
          <span className="text-soft-lavender italic">/arte</span>
        </h1>
        
        {/* Subtitle with poetic touch */}
        <p className="text-light-gray text-lg md:text-xl mb-12 leading-relaxed font-light italic">
          "Un espacio donde las almas se encuentran a través del arte y la palabra"
        </p>
        
        {/* Decorative middle line */}
        <div className="decorative-line mb-12"></div>
        
        {/* CTA Buttons */}
        <div className="space-y-4 mb-12">
          {/* Primary CTA - Purple glowing button */}
          <Link href="/register">
            <button className="glow-button w-full md:w-auto px-12 py-4 rounded-lg text-white font-semibold text-lg tracking-wide transition-all duration-300 hover:scale-105">
              Ingresa al proyecto
            </button>
          </Link>
          
          {/* Secondary CTA - Gray button */}
          <div className="pt-2">
            <Link href="/login">
              <button className="w-full md:w-auto px-8 py-3 rounded-lg bg-medium-gray/20 text-light-gray border border-medium-gray/30 hover:bg-medium-gray/30 hover:text-white transition-all duration-300">
                Iniciar sesión
              </button>
            </Link>
          </div>
        </div>
        
        {/* Decorative bottom line */}
        <div className="decorative-line"></div>
      </div>
    </div>
  );
}
