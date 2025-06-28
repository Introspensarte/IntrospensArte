import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest } from "@/lib/queryClient";

const registerSchema = z.object({
  fullName: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  age: z.number().min(13, "Debes ser mayor de 13 años").max(120, "Edad inválida"),
  birthday: z.string().regex(/^\d{2}\/\d{2}$/, "Formato debe ser DD/MM"),
  faceClaim: z.string().min(1, "Face claim es requerido"),
  signature: z.string().min(2, "La firma debe tener al menos 2 caracteres").startsWith("#", "La firma debe comenzar con #"),
  motivation: z.string().min(10, "La motivación debe tener al menos 10 caracteres"),
  facebookLink: z.string().url("Debe ser una URL válida").optional().or(z.literal("")),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useAuth();

  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      fullName: "",
      age: undefined,
      birthday: "",
      faceClaim: "",
      signature: "#",
      motivation: "",
      facebookLink: "",
    },
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/register", {
        ...data,
        facebookLink: data.facebookLink || undefined,
      });

      if (!response.ok) {
        const errorData = await response.json();
        
        // Show special styling for quota full message
        if (errorData.message?.includes("Cupos Cubiertos")) {
          toast({
            title: "🚫 Cupos Cubiertos",
            description: errorData.message,
            variant: "destructive",
            duration: 8000, // Show longer for important message
          });
        } else {
          toast({
            title: "Error en el registro",
            description: errorData.message || "Ha ocurrido un error inesperado",
            variant: "destructive",
          });
        }
        return;
      }

      const { user } = await response.json();
      login(user);

      toast({
        title: "¡Registro exitoso!",
        description: `Bienvenido a Introspens/arte, ${user.fullName}!`,
      });

      // Dar tiempo para que el usuario vea el mensaje antes de redirigir
      setTimeout(() => {
        setLocation("/portal");
      }, 1500);

    } catch (error: any) {
      toast({
        title: "Error en el registro",
        description: error.message || "Ha ocurrido un error inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-2xl mx-auto animate-slide-up pt-16">
        <div className="bg-black/40 backdrop-blur-sm rounded-2xl p-8 border border-medium-gray/20 shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="font-playfair text-4xl font-bold mb-2">Registro</h2>
            <div className="decorative-line mb-4"></div>
            <p className="text-light-gray">Únete a nuestra comunidad artística</p>
          </div>

          {/* Registration Form */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-light-gray">Nombre y Apellido</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Tu nombre completo"
                          className="bg-dark-graphite border-medium-gray/30 text-white placeholder-medium-gray focus:border-soft-lavender"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="age"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-light-gray">Edad</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="Tu edad"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          className="bg-dark-graphite border-medium-gray/30 text-white placeholder-medium-gray focus:border-soft-lavender"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="birthday"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-light-gray">Cumpleaños (dd/mm)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ej: 15/07"
                        className="bg-dark-graphite border-medium-gray/30 text-white placeholder-medium-gray focus:border-soft-lavender"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="faceClaim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-light-gray">Face Claim</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Tu face claim"
                        className="bg-dark-graphite border-medium-gray/30 text-white placeholder-medium-gray focus:border-soft-lavender"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="signature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-light-gray">Firma (con #)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Ej: #MiFirma"
                        className="bg-dark-graphite border-medium-gray/30 text-white placeholder-medium-gray focus:border-soft-lavender uppercase"
                        onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                      />
                    </FormControl>
                    <p className="text-xs text-medium-gray mt-1">
                      *recuerda que para cambiar tu firma debes acercarte a un administrador.
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="motivation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-light-gray">¿Por qué desea ingresar?</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Comparte tu motivación para unirte..."
                        rows={4}
                        className="bg-dark-graphite border-medium-gray/30 text-white placeholder-medium-gray focus:border-soft-lavender resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="facebookLink"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-light-gray">Link de Facebook (opcional)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="url"
                        placeholder="https://facebook.com/tu-perfil"
                        className="bg-dark-graphite border-medium-gray/30 text-white placeholder-medium-gray focus:border-soft-lavender"
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
                  {isLoading ? "Creando cuenta..." : "Crear cuenta"}
                </Button>
              </div>
            </form>
          </Form>

          <div className="text-center mt-6">
            <Link href="/login">
              <span className="text-soft-lavender hover:text-white transition-colors cursor-pointer">
                ¿Ya tienes cuenta? Inicia sesión
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}