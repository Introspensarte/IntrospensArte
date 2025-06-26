import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ARISTAS, ACTIVITY_TYPES } from "@/lib/constants";
import { calculateTraces } from "@/lib/trace-calculator";

const activitySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  date: z.string().min(1, "La fecha es requerida"),
  wordCount: z.number().min(1, "Debe tener al menos 1 palabra"),
  type: z.string().min(1, "El tipo es requerido"),
  responses: z.number().optional().nullable(),
  link: z.string().url("Debe ser una URL válida").optional().or(z.literal("")).or(z.undefined()),
  imageUrl: z.string().url("Debe ser una URL válida de imagen").min(1, "La URL de imagen es requerida"),
  description: z.string().min(1, "La descripción es requerida"),
  arista: z.string().min(1, "La arista es requerida"),
  album: z.string().min(1, "El álbum es requerido"),
});

type ActivityForm = z.infer<typeof activitySchema>;

export default function UploadActivity() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [calculatedTraces, setCalculatedTraces] = useState(0);

  const form = useForm<ActivityForm>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      name: "",
      date: new Date().toISOString().split('T')[0],
      wordCount: undefined,
      type: "",
      responses: undefined,
      link: "",
      imageUrl: "",
      description: "",
      arista: "",
      album: "",
    },
  });

  const watchType = form.watch("type");
  const watchWordCount = form.watch("wordCount");
  const watchResponses = form.watch("responses");

  useEffect(() => {
    if (watchType && watchWordCount && watchWordCount > 0) {
      const traces = calculateTraces(watchType, watchWordCount, watchResponses);
      setCalculatedTraces(traces);
    } else {
      setCalculatedTraces(0);
    }
  }, [watchType, watchWordCount, watchResponses]);

  const createMutation = useMutation({
    mutationFn: async (data: ActivityForm) => {
      const response = await apiRequest("POST", "/api/activities", {
        ...data,
        userId: user?.id,
        link: data.link || undefined,
        image_url: data.imageUrl,
      });
      return response.json();
    },
    onSuccess: (data) => {
      // Update user stats if returned from API
      if (data.user) {
        // Assuming you have a way to update the user object in your auth context
        // For example, if useAuth returns a function to update the user:
        // updateUser(data.user);
        // If the updateUser function is not available directly, you might need to:
        queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}`] }); // Example: Invalidate user query
      }

      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/activities`] });
      queryClient.invalidateQueries({ queryKey: ["/api/activities"] });
      queryClient.invalidateQueries({ queryKey: ["/api/rankings"] });

      toast({
        title: "¡Actividad subida!",
        description: `Has ganado ${calculatedTraces} trazos`,
      });

      form.reset();
      setCalculatedTraces(0);
    },
    onError: (error: any) => {
      toast({
        title: "Error al subir actividad",
        description: error.message || "Ha ocurrido un error",
        variant: "destructive",
      });
    },
  });

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-light-gray">Debes iniciar sesión para subir actividades</p>
      </div>
    );
  }

  const onSubmit = (data: ActivityForm) => {
    // Clean the data before submission
    const cleanData = {
      ...data,
      link: data.link?.trim() || undefined,
      responses: data.responses || undefined,
    };

    createMutation.mutate(cleanData);
  };

  const selectedArista = form.watch("arista");
  const availableAlbums = selectedArista ? ARISTAS[selectedArista as keyof typeof ARISTAS]?.albums || [] : [];

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-3xl mx-auto animate-slide-up pt-16">
        <Card className="bg-black/40 backdrop-blur-sm border-medium-gray/20 shadow-2xl">
          <CardHeader>
            <div className="text-center">
              <CardTitle className="font-playfair text-4xl font-bold mb-2">Sube tu actividad</CardTitle>
              <div className="decorative-line mb-4"></div>
              <p className="text-light-gray">Comparte tu creación con la comunidad</p>
            </div>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-light-gray">Nombre de la actividad</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Título de tu obra"
                            className="bg-dark-graphite border-medium-gray/30 text-white placeholder-medium-gray focus:border-soft-lavender"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-light-gray">Fecha</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="date"
                            className="bg-dark-graphite border-medium-gray/30 text-white focus:border-soft-lavender"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="wordCount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-light-gray">Número de palabras</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="Ej: 500"
                            value={field.value === undefined ? "" : field.value}
                            onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                            className="bg-dark-graphite border-medium-gray/30 text-white placeholder-medium-gray focus:border-soft-lavender"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-light-gray">Tipo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-dark-graphite border-medium-gray/30 text-white focus:border-soft-lavender">
                              <SelectValue placeholder="Selecciona un tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {ACTIVITY_TYPES.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                {type.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {(watchType === "hilo" || watchType === "rol") && (
                  <FormField
                    control={form.control}
                    name="responses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-light-gray">Respuestas (si aplica)</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="number"
                            placeholder="Número de respuestas"
                            onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                            className="bg-dark-graphite border-medium-gray/30 text-white placeholder-medium-gray focus:border-soft-lavender"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="link"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-light-gray">Link (opcional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="url"
                          placeholder="https://enlace-a-tu-obra.com"
                          className="bg-dark-graphite border-medium-gray/30 text-white placeholder-medium-gray focus:border-soft-lavender"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="imageUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-light-gray">URL de imagen *</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            {...field}
                            type="url"
                            placeholder="https://ejemplo.com/imagen.jpg"
                            className="bg-dark-graphite border-medium-gray/30 text-white placeholder-medium-gray focus:border-soft-lavender"
                          />
                          {field.value && (
                            <div className="mt-2">
                              <img 
                                src={field.value} 
                                alt="Vista previa" 
                                className="w-32 h-32 object-cover rounded border border-medium-gray/30"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.src = "https://via.placeholder.com/150x150/808080/FFFFFF?text=Error";
                                }}
                              />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                      <div className="text-xs text-medium-gray mt-1">
                        <p>Pega aquí la URL de tu imagen desde Facebook, Pinterest, Instagram, etc.</p>
                        <p>Ejemplo: https://i.pinimg.com/564x/...</p>
                      </div>
                    </FormItem>
                  )}
                />

                <div className="grid md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="arista"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-light-gray">Arista</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(value);
                          form.setValue("album", ""); // Reset album when arista changes
                        }} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-dark-graphite border-medium-gray/30 text-white focus:border-soft-lavender">
                              <SelectValue placeholder="Selecciona una arista" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(ARISTAS).map(([key, arista]) => (
                              <SelectItem key={key} value={key}>
                                {arista.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="album"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-light-gray">Álbum</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-dark-graphite border-medium-gray/30 text-white focus:border-soft-lavender">
                              <SelectValue placeholder="Selecciona un álbum" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableAlbums.map((album) => (
                              <SelectItem key={album.id} value={album.id}>
                                {album.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-light-gray">Descripción</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Describe tu creación..."
                          rows={4}
                          className="bg-dark-graphite border-medium-gray/30 text-white placeholder-medium-gray focus:border-soft-lavender resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Calculated Traces Display */}
                <div className="bg-soft-lavender/10 rounded-lg p-4 border border-soft-lavender/20">
                  <div className="flex items-center justify-between">
                    <span className="text-light-gray">Trazos calculados:</span>
                    <span className="text-2xl font-bold text-soft-lavender">{calculatedTraces}</span>
                  </div>
                  <p className="text-xs text-medium-gray mt-2">
                    Los trazos se calculan automáticamente según el tipo y número de palabras
                  </p>
                </div>

                <div className="pt-4">
                  <Button
                    type="submit"
                    disabled={createMutation.isPending}
                    className="w-full glow-button px-8 py-4 rounded-lg text-white font-semibold text-lg tracking-wide transition-all duration-300 hover:scale-105"
                  >
                    {createMutation.isPending ? "Subiendo..." : "Subir actividad"}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}