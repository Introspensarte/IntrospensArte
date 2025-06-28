
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function Systems() {
  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-4xl mx-auto animate-slide-up pt-16">
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-medium-gray/20 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="font-playfair text-4xl font-bold mb-2 text-soft-lavender">Sistemas</h2>
            <div className="decorative-line mb-4"></div>
          </div>

          <div className="text-light-gray leading-relaxed space-y-8">
            {/* Sistema de Ingreso */}
            <section>
              <h3 className="text-2xl font-bold text-soft-lavender mb-4">Sistema de Ingreso</h3>
              <p className="mb-4">¿Te va interesando el proyecto? Solo tienes que seguir los siguientes pasos para ingresar, en orden:</p>
              
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-soft-lavender mb-2">1. Leer todo con calma.</h4>
                  <p>Explora el carrd, entiende la idea del proyecto y asegúrate de que va contigo.</p>
                </div>
                
                <div>
                  <h4 className="font-bold text-soft-lavender mb-2">2. Agregar a la administración.</h4>
                  <p>Es obligatorio tenerla añadida y colocar el proyecto como trabajo o enlace social junto al código escogido por ti como puesto de trabajo.</p>
                </div>
                
                <div>
                  <h4 className="font-bold text-soft-lavender mb-2">3. Registrarte en la Plataforma.</h4>
                  <p>Deberás registrarte en esta pagina y una vez que te hayas registrado, deberás mandar un mensaje a la pagina de Facebook con tu Firma, para que los administradores te hagan llegar los links de los grupos y del Chat de Avisos sin problemas.</p>
                </div>
                
                <div>
                  <h4 className="font-bold text-soft-lavender mb-2">4. Unirte los grupos del proyecto.</h4>
                  <p>Obligatorio. Esto es para que puedan encontrar y compartir las actividades a realizar en el proyecto.</p>
                </div>
                
                <div>
                  <h4 className="font-bold text-soft-lavender mb-2">5. Comenzar a escribir.</h4>
                  <p>Una vez dentro, ya puedes participar en todas las actividades disponibles del bimestre actual.</p>
                </div>
              </div>
            </section>

            {/* Sistema de Grados */}
            <section>
              <h3 className="text-2xl font-bold text-soft-lavender mb-4">Sistema de Grados</h3>
              
              <p className="text-center italic text-soft-lavender mb-4">Aquí no se compite, se florece.</p>
              <p className="mb-6">Tu crecimiento en el proyecto se mide por constancia y cariño. Cada vez que pasas una limpieza, evolucionas. Y con cada etapa, ganas una medalla:</p>
              
              <div className="space-y-4">
                <div className="border border-medium-gray/30 rounded-lg p-4">
                  <h4 className="font-bold text-soft-lavender mb-2">Alma en tránsito (Ingreso)</h4>
                  <p className="mb-2">Acabas de llegar. Estás conociendo el espacio.</p>
                  <p className="text-sm text-medium-gray">— Sin medallas aún. Estás sembrando.</p>
                </div>
                
                <div className="border border-medium-gray/30 rounded-lg p-4">
                  <h4 className="font-bold text-soft-lavender mb-2">Voz en boceto (Pasas la primera limpieza)</h4>
                  <p className="mb-2">Ya dejaste tu primera huella, una voz empieza a dibujarse.</p>
                  <p className="text-sm text-medium-gray">— Medalla: "Susurros que germinan".</p>
                </div>
                
                <div className="border border-medium-gray/30 rounded-lg p-4">
                  <h4 className="font-bold text-soft-lavender mb-2">Narrador de atmósferas (Pasas la segunda limpieza)</h4>
                  <p className="mb-2">Comienzas a habitar el espacio con más fuerza. Tu personaje tiene más forma y fondo.</p>
                  <p className="text-sm text-medium-gray">— Medalla: "Excelente narrador".</p>
                </div>
                
                <div className="border border-medium-gray/30 rounded-lg p-4">
                  <h4 className="font-bold text-soft-lavender mb-2">Escritor de introspecciones (Pasas la tercera limpieza)</h4>
                  <p className="mb-2">Tus personajes ya se sienten vivos. Las capas emocionales se hacen profundas.</p>
                  <p className="text-sm text-medium-gray">— Medalla: "Lector de huellas".</p>
                </div>
                
                <div className="border border-medium-gray/30 rounded-lg p-4">
                  <h4 className="font-bold text-soft-lavender mb-2">Arquitecto del alma (Pasas la sexta limpieza o cumpliste 1 año dentro)</h4>
                  <p className="mb-2">Has construido no solo una personaje integral, sino te haz convertido en un experto en la creación de estos.</p>
                  <p className="text-sm text-medium-gray">— Medalla: "Arquitecto de Personajes"</p>
                </div>
              </div>
            </section>

            {/* Sistema de Puntos */}
            <section>
              <h3 className="text-2xl font-bold text-soft-lavender mb-4">Sistema de Puntos</h3>
              <p className="mb-4">
                Cada paso creativo deja una marca. Y por pequeños que parezcan, suman.
              </p>
              <p className="mb-4">
                Los Trazos son la forma en la que como proyecto valoramos tu entrega, tu constancia y tu arte creativo.
              </p>
              <p className="mb-4">
                Por lo que este será el sistema de valoración del proyecto:
              </p>
              
              {/* Tabla de Sistema de Trazos */}
              <div className="bg-dark-graphite/50 rounded-lg p-4 border border-medium-gray/30">
                <div className="grid grid-cols-2 gap-4 text-center font-semibold text-soft-lavender border-b border-medium-gray/30 pb-2 mb-4">
                  <div>Tipo de Actividad</div>
                  <div>Trazos</div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="grid grid-cols-2 gap-4">
                    <div>Microcuento (1-100 palabras)</div>
                    <div className="text-center">100 trazos</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>Drabble (101-200 palabras)</div>
                    <div className="text-center">200 trazos</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>Narrativa (201-499 palabras)</div>
                    <div className="text-center">300 trazos</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>Narrativa (+500 palabras)</div>
                    <div className="text-center">300 + 100 por cada 500 palabras adicionales</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>Encuesta</div>
                    <div className="text-center">100 trazos</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>Collage</div>
                    <div className="text-center">150 trazos</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>Poemas</div>
                    <div className="text-center">150 trazos</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>Pinturas</div>
                    <div className="text-center">200 trazos</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>Interpretación</div>
                    <div className="text-center">200 trazos</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>Hilo (base)</div>
                    <div className="text-center">100 trazos + 50 por cada 5 respuestas</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>Rol (base)</div>
                    <div className="text-center">250 trazos + 150 por cada 5 respuestas</div>
                  </div>
                  <div className="grid grid-cols-2 gap-4 font-semibold text-soft-lavender">
                    <div>Actividad Tardía</div>
                    <div className="text-center">100 trazos (fijo)</div>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Botón Siguiente */}
          <div className="text-center mt-8">
            <Link href="/integrantes">
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
