
import { Link } from "wouter";
import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-4xl mx-auto animate-slide-up pt-16">
        {/* Banner Principal */}
        <div className="text-center mb-12">
          <h1 className="font-playfair text-5xl md:text-6xl font-bold mb-6 text-soft-lavender">
            IntrsopensArte
          </h1>
          
          {/* Link a Facebook */}
          <a 
            href="https://facebook.com/introspensarte" 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-flex items-center space-x-2 text-soft-lavender hover:text-white transition-colors mb-8"
          >
            <ExternalLink size={20} />
            <span>Síguenos en Facebook</span>
          </a>
        </div>

        {/* Contenido Principal */}
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-medium-gray/20 shadow-2xl mb-8">
          <div className="text-light-gray leading-relaxed text-lg space-y-4">
            <p>
              Bienvenidos a <span className="font-bold text-soft-lavender">𝐈𝐧𝐭𝐫𝐨𝐬𝐩𝐞𝐧𝐬/𝒂𝒓𝒕𝒆/</span>, somos un proyecto narrativo bimestral enfocado en el desarrollo y exploración de personajes a través de situaciones cotidianas, emociones y recuerdos.
            </p>
            <p>
              Nuestro objetivo es profundizar en la personalidad, historia y reacciones de cada personaje mediante actividades dinámicas y creativas.
            </p>
            <p>
              Aquí encontrarás desafíos narrativos diseñados para explorar desde sus gustos y rutinas, hasta sus miedos y deseos más profundos.
            </p>
            <p>
              Cada actividad está pensada para sumergirte en la introspección y enriquecer la construcción de tu personaje de una manera más entretenida y dinámica.
            </p>
          </div>
        </div>

        {/* Menú de Navegación */}
        <div className="grid md:grid-cols-3 gap-6">
          <Link href="/informacion">
            <Button className="w-full glow-button px-8 py-6 rounded-lg text-white font-semibold text-lg tracking-wide transition-all duration-300 hover:scale-105">
              Información
            </Button>
          </Link>
          
          <Link href="/sistemas">
            <Button className="w-full glow-button px-8 py-6 rounded-lg text-white font-semibold text-lg tracking-wide transition-all duration-300 hover:scale-105">
              Sistemas
            </Button>
          </Link>
          
          <Link href="/integrantes">
            <Button className="w-full glow-button px-8 py-6 rounded-lg text-white font-semibold text-lg tracking-wide transition-all duration-300 hover:scale-105">
              Integrantes
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
