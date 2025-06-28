import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  signature: z.string().min(1, "La firma es requerida").startsWith("#", "La firma debe comenzar con #"),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      signature: "#",
    },
  });

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/login", data);
      const { user } = await response.json();
      
      login(user);
      
      toast({
        title: "¡Bienvenido de vuelta!",
        description: `Hola ${user.fullName}`,
      });
      
      setLocation("/portal");
    } catch (error: any) {
      toast({
        title: "Error de autenticación",
        description: error.message || "Firma no encontrada",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md mx-auto w-full animate-slide-up">
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-medium-gray/20 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="font-playfair text-4xl font-bold mb-2">Iniciar Sesión</h2>
            <div className="decorative-line mb-4"></div>
            <p className="text-light-gray">Accede a tu espacio creativo</p>
          </div>

          {/* Login Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="signature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-light-gray">Firma</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Tu firma (ej: #MiFirma)"
                        className="bg-dark-graphite border-medium-gray/30 text-white placeholder-medium-gray focus:border-soft-lavender uppercase"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="w-full glow-button px-8 py-4 rounded-lg text-white font-semibold text-lg tracking-wide transition-all duration-300 hover:scale-105"
                >
                  {isLoading ? "Ingresando..." : "Ingresar al portal"}
                </Button>
              </div>
            </form>
          </Form>

          <div className="text-center mt-6">
            <Link href="/register">
              <span className="text-soft-lavender hover:text-white transition-colors cursor-pointer">
                ¿No tienes cuenta? Regístrate aquí
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
