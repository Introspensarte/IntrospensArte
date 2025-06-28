
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Information() {
  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-4xl mx-auto animate-slide-up pt-16">
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-medium-gray/20 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="font-playfair text-4xl font-bold mb-2 text-soft-lavender">Información</h2>
            <div className="decorative-line mb-4"></div>
          </div>

          <div className="text-light-gray leading-relaxed space-y-6">
            {/* Sobre el proyecto */}
            <section>
              <h3 className="text-2xl font-bold text-soft-lavender mb-4">Sobre el proyecto</h3>
              <p className="mb-4">
                Para lograr que cada personaje se sienta más real, más vivo y más suyo, <span className="font-bold text-soft-lavender">𝐈𝐧𝐭𝐫𝐨𝐬𝐩𝐞𝐧𝐬/𝒂𝒓𝒕𝒆/</span> se construye a partir de cinco aristas que funcionan como el corazón de este proyecto, donde cada una invita a explorar distintas capas de la identidad, la mente y la rutina.
              </p>
              
              <p className="mb-4">Estas aristas son:</p>
              
              <div className="space-y-4">
                <div className="border border-medium-gray/30 rounded-lg p-4">
                  <h4 className="font-bold text-soft-lavender mb-2">I. Inventario de la Vida</h4>
                  <p className="mb-2">Explora lo inmediato, cotidiano y concreto del personaje: sus hábitos diarios, sus elecciones pequeñas que dicen mucho, su salud, sus costumbres y la forma en que vive cada día. Aquí entran preguntas sobre rutinas, compras, sentidos y descuidos.</p>
                </div>

                <div className="border border-medium-gray/30 rounded-lg p-4">
                  <h4 className="font-bold text-soft-lavender mb-2">II. Mapa del Inconsciente</h4>
                  <p className="mb-2">Se adentra en el territorio simbólico, los sueños, recuerdos distorsionados y universos alternativos del personaje. Investiga sus pensamientos obsesivos, miedos, recuerdos reprimidos y todo aquello que ocurre fuera de su consciencia.</p>
                </div>

                <div className="border border-medium-gray/30 rounded-lg p-4">
                  <h4 className="font-bold text-soft-lavender mb-2">III. Ecos del Corazón</h4>
                  <p className="mb-2">Se enfoca en las emociones profundas, vínculos afectivos, cicatrices emocionales, ternura, traiciones, pérdidas y momentos de extrema vulnerabilidad que forman la parte más humana del personaje.</p>
                </div>

                <div className="border border-medium-gray/30 rounded-lg p-4">
                  <h4 className="font-bold text-soft-lavender mb-2">IV. Reflejos en el Tiempo</h4>
                  <p className="mb-2">Aborda lo trascendental, lo místico y espiritual: creencias, memorias de otras vidas, intuiciones y conexiones que parecen ir más allá de una sola existencia. Se centra en la parte del personaje que busca sentido o se siente parte de algo más grande.</p>
                </div>

                <div className="border border-medium-gray/30 rounded-lg p-4">
                  <h4 className="font-bold text-soft-lavender mb-2">V. Galería del Alma</h4>
                  <p className="mb-2">Es la dimensión creativa y expresiva del personaje: cómo se muestra al mundo a través del arte, el estilo, la escritura, las palabras no dichas, los bocetos y cualquier forma de creación que refleje su esencia.</p>
                </div>

                <div className="border border-medium-gray/30 rounded-lg p-4">
                  <h4 className="font-bold text-soft-lavender mb-2">VI. Actividades Express</h4>
                  <p className="mb-2">Ejercicios de escritura rápida y creaciones instantáneas para explorar diferentes aspectos del personaje de manera dinámica.</p>
                </div>
              </div>
              
              <p>
                Cada una alberga actividades diversos estilos de actividades que van desde lo cotidiano hasta lo más intimo, para así conocer mejor a tu personaje y saber cómo reacciona a la vida.
              </p>
            </section>

            {/* Sobre las actividades */}
            <section>
              <h3 className="text-2xl font-bold text-soft-lavender mb-4">Sobre las actividades</h3>
              
              <p className="mb-4">
                Las actividades que encontrarás aquí están pensadas para hacerte sentir el personaje desde adentro, no solo escribirlo. Por lo que podrás encontrar actividades cómo:
              </p>
              
              <div className="space-y-3">
                <div>
                  <strong className="text-soft-lavender">Exploración de la cotidianidad:</strong> Actividades sobre diferentes rutinas, gustos o decisiones cotidianas.
                </div>
                <div>
                  <strong className="text-soft-lavender">Reflexión onírica:</strong> Espacios para explorar tus sueños, recuerdos y/o universos alternativos.
                </div>
                <div>
                  <strong className="text-soft-lavender">Conexión emocional:</strong> Drabbles y actividades que exploran las emociones de cada personaje y sus posibles reacciones.
                </div>
                <div>
                  <strong className="text-soft-lavender">Viaje en el tiempo:</strong> Encuentros con versiones anteriores o futuras del personaje.
                </div>
                <div>
                  <strong className="text-soft-lavender">Desarrollo personal:</strong> Actividades para explorar el estilo de vida, salud y bienestar del personaje.
                </div>
                <div>
                  <strong className="text-soft-lavender">Construcción de identidad:</strong> Con base en que toma sus decisiones, cual es su forma de relacionarse y dilemas personales.
                </div>
                <div>
                  <strong className="text-soft-lavender">Creatividad y expresión:</strong> Espacios para compartir arte, textos y obras creadas por el personaje.
                </div>
              </div>
            </section>
          </div>

          {/* Botón Siguiente */}
          <div className="text-center mt-8">
            <Link href="/sistemas">
              <Button className="glow-button px-8 py-4 rounded-lg text-white font-semibold text-lg tracking-wide transition-all duration-300 hover:scale-105">
                Siguiente
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
