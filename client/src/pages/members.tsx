
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";

interface User {
  id: number;
  fullName: string;
  signature: string;
  birthday: string;
  rank: string;
  createdAt: string;
}

export default function Members() {
  const { data: users = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const response = await apiRequest("GET", "/api/users");
      if (!response.ok) throw new Error("Error al cargar usuarios");
      return response.json();
    },
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-soft-lavender"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-6xl mx-auto animate-slide-up pt-16">
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-medium-gray/20 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="font-playfair text-4xl font-bold mb-2 text-soft-lavender">Integrantes del Proyecto</h2>
            <div className="decorative-line mb-4"></div>
            <p className="text-light-gray">Conoce nuestros integrantes:</p>
          </div>

          {/* Tabla de Integrantes */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-medium-gray/30">
                  <th className="py-4 px-4 text-soft-lavender font-semibold">#</th>
                  <th className="py-4 px-4 text-soft-lavender font-semibold">Nombre</th>
                  <th className="py-4 px-4 text-soft-lavender font-semibold">Firma</th>
                  <th className="py-4 px-4 text-soft-lavender font-semibold">Cumpleaños</th>
                  <th className="py-4 px-4 text-soft-lavender font-semibold">Grado</th>
                  <th className="py-4 px-4 text-soft-lavender font-semibold">Fecha de Ingreso</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, index) => (
                  <tr key={user.id} className="border-b border-medium-gray/20 hover:bg-medium-gray/10 transition-colors">
                    <td className="py-4 px-4 text-light-gray">{index + 1}</td>
                    <td className="py-4 px-4 text-white font-medium">{user.fullName}</td>
                    <td className="py-4 px-4 text-soft-lavender font-mono">{user.signature}</td>
                    <td className="py-4 px-4 text-light-gray">{user.birthday}</td>
                    <td className="py-4 px-4 text-light-gray">{user.rank || 'Alma en tránsito'}</td>
                    <td className="py-4 px-4 text-light-gray">{formatDate(user.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <div className="text-center py-8">
              <p className="text-light-gray">No hay integrantes registrados aún.</p>
            </div>
          )}

          {/* Botones de navegación */}
          <div className="flex gap-4 justify-center mt-8">
            <Link href="/">
              <Button className="glow-button px-8 py-4 rounded-lg text-white font-semibold text-lg tracking-wide transition-all duration-300 hover:scale-105">
                Volver al Inicio
              </Button>
            </Link>
            <Link href="/register">
              <Button className="glow-button px-8 py-4 rounded-lg text-white font-semibold text-lg tracking-wide transition-all duration-300 hover:scale-105">
                Registrarse
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
