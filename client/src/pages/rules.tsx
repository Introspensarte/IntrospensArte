
import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

export default function Rules() {
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [, setLocation] = useLocation();

  const handleAccept = () => {
    if (acceptedTerms) {
      setLocation("/register");
    }
  };

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-4xl mx-auto animate-slide-up pt-16">
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-medium-gray/20 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="font-playfair text-4xl font-bold mb-2 text-soft-lavender">Reglas</h2>
            <div className="decorative-line mb-4"></div>
            <p className="text-light-gray">Primero lo primero</p>
          </div>

          <div className="text-light-gray leading-relaxed space-y-6">
            <div>
              <h3 className="text-xl font-bold text-soft-lavender mb-3">Para poder participar</h3>
              <p>Tienes que agregar a la administración, poner el proyecto como tu trabajo o enlace social y llevar tu código en el perfil. Si no lo haces, es probable que no pases la limpieza.</p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-soft-lavender mb-3">Chat de anuncios</h3>
              <p>Estar en el chat de anuncios es obligatorio, ya que es por el único medio por el que se comunicará cualquier tipo de tema. Solo la administración puede escribir ahí, así que no interrumpas o eso podrá llevarte a una sanción.</p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-soft-lavender mb-3">Sé responsable</h3>
              <p>Para permanecer deberán cumplir con mínimo 4 actividades por bimestre o cumplir con el puntaje mínimo solicitado. Al igual que la cronología deberá entregarse a tiempo. No es opcional, sino no podrás pasar la limpieza.</p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-soft-lavender mb-3">Si cambias de cuenta, avisa</h3>
              <p>Si cierras tu cuenta o te mudas, tienes 72 horas para avisar. Si no, tu lugar será liberado. Cambios de cuenta o de firma se podrán realizar solo hasta dos semanas antes de la limpieza.</p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-soft-lavender mb-3">Respeto y convivencia</h3>
              <p>Nada de insultos, acoso, burlas ni toxicidad. Aquí se viene a compartir, no a joder a los demás.</p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-soft-lavender mb-3">Cero tolerancia a la intolerancia</h3>
              <p>Cualquier muestra de odio (racismo, homofobia, machismo, violencia, etc.) es motivo de expulsión inmediata. No hay segundas oportunidades.</p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-soft-lavender mb-3">Privacidad ante todo</h3>
              <p>No compartas información personal ni tuya ni de otros. Tampoco esta permitido la interacción como usuarios. Respeta los límites.</p>
            </div>

            <div>
              <h3 className="text-xl font-bold text-soft-lavender mb-3">Si hay problemas, soluciónalos bien</h3>
              <p>Si surge un conflicto, resuélvanlo con hablándolo con madurez. Si necesitan ayuda, la administración estará para mediar, pero sin caer en dramas innecesarios.</p>
            </div>
          </div>

          {/* Checkbox de términos y condiciones */}
          <div className="mt-8 p-4 border border-medium-gray/30 rounded-lg bg-dark-graphite/30">
            <div className="flex items-center space-x-3">
              <Checkbox 
                id="terms" 
                checked={acceptedTerms}
                onCheckedChange={setAcceptedTerms}
                className="data-[state=checked]:bg-soft-lavender data-[state=checked]:border-soft-lavender"
              />
              <label htmlFor="terms" className="text-light-gray cursor-pointer">
                Acepto los términos y condiciones del proyecto
              </label>
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-center space-x-4 mt-8">
            <Link href="/">
              <Button variant="outline" className="px-8 py-3 rounded-lg border-medium-gray/30 text-light-gray hover:bg-medium-gray/30 hover:text-white">
                Cancelar
              </Button>
            </Link>
            
            <Button 
              onClick={handleAccept}
              disabled={!acceptedTerms}
              className={`px-8 py-3 rounded-lg font-semibold transition-all duration-300 ${
                acceptedTerms 
                  ? 'glow-button text-white hover:scale-105' 
                  : 'bg-medium-gray/30 text-medium-gray cursor-not-allowed'
              }`}
            >
              Aceptar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
