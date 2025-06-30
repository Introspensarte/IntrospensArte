
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { MessageSquare, HelpCircle, AlertCircle, Lightbulb, ExternalLink } from "lucide-react";

const supportTicketSchema = z.object({
  type: z.enum(['reclamo', 'sugerencia', 'problema', 'contacto']),
  subject: z.string().min(5, "El asunto debe tener al menos 5 caracteres"),
  description: z.string().min(10, "La descripción debe tener al menos 10 caracteres"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  isAnonymous: z.boolean().default(false),
});

type SupportTicketForm = z.infer<typeof supportTicketSchema>;

export default function Support() {
  const { toast } = useToast();
  const [selectedType, setSelectedType] = useState<string>("reclamo");

  const form = useForm<SupportTicketForm>({
    resolver: zodResolver(supportTicketSchema),
    defaultValues: {
      type: "reclamo",
      subject: "",
      description: "",
      email: "",
      isAnonymous: false,
    },
  });

  const submitTicketMutation = useMutation({
    mutationFn: async (data: SupportTicketForm) => {
      const response = await apiRequest("POST", "/api/support/tickets", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Ticket enviado",
        description: "Tu solicitud ha sido enviada exitosamente. Te contactaremos pronto.",
      });
      form.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Ha ocurrido un error al enviar tu solicitud",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: SupportTicketForm) => {
    submitTicketMutation.mutate(data);
  };

  const faqItems = [
    {
      question: "¿Cómo puedo subir una actividad?",
      answer: "Ve a la sección 'Sube tu actividad' desde el portal principal. Completa todos los campos requeridos incluyendo nombre, descripción, tipo de actividad, arista y álbum."
    },
    {
      question: "¿Cómo se calculan los trazos?",
      answer: "Los trazos se calculan según el tipo de actividad y número de palabras. Narrativa: 300+ trazos, Microcuento: 100 trazos, Drabble: 200 trazos, etc. También hay bonus por respuestas en hilos y rol."
    },
    {
      question: "¿Qué son las aristas?",
      answer: "Las aristas son dimensiones creativas: Introspección, Nostalgia, Amor, Fantasía, Misterio y Actividades Express. Cada una tiene álbumes específicos para organizar las actividades."
    },
    {
      question: "¿Cómo funciona el sistema de rangos?",
      answer: "Los rangos se asignan por bimestres completados y son gestionados únicamente por los administradores. Van desde 'Alma en tránsito' hasta 'Arquitecto del alma'."
    },
    {
      question: "¿Puedo editar mi actividad después de subirla?",
      answer: "Sí, puedes editar tus actividades desde tu perfil. Solo podrás modificar actividades que hayas creado tú mismo."
    }
  ];

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-6xl mx-auto animate-slide-up pt-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-playfair text-5xl font-bold mb-4 text-soft-lavender">Centro de Soporte</h1>
          <div className="decorative-line mb-4"></div>
          <p className="text-light-gray text-lg">Estamos aquí para ayudarte</p>
        </div>

        <Tabs defaultValue="formulario" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-black/40 border border-medium-gray/20">
            <TabsTrigger value="formulario" className="data-[state=active]:bg-soft-lavender/20 data-[state=active]:text-soft-lavender">
              <MessageSquare className="w-4 h-4 mr-2" />
              Contacto y Formularios
            </TabsTrigger>
            <TabsTrigger value="faq" className="data-[state=active]:bg-soft-lavender/20 data-[state=active]:text-soft-lavender">
              <HelpCircle className="w-4 h-4 mr-2" />
              Preguntas Frecuentes
            </TabsTrigger>
          </TabsList>

          {/* Formularios de soporte */}
          <TabsContent value="formulario" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Formulario principal */}
              <Card className="bg-black/40 backdrop-blur-sm border-medium-gray/20">
                <CardHeader>
                  <CardTitle className="font-playfair text-2xl">Enviar Solicitud</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <FormField
                        control={form.control}
                        name="type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-light-gray">Tipo de solicitud</FormLabel>
                            <Select onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedType(value);
                            }} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger className="bg-dark-graphite border-medium-gray/30 text-white">
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="reclamo">
                                  <div className="flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-2 text-red-400" />
                                    Reclamo
                                  </div>
                                </SelectItem>
                                <SelectItem value="sugerencia">
                                  <div className="flex items-center">
                                    <Lightbulb className="w-4 h-4 mr-2 text-yellow-400" />
                                    Sugerencia
                                  </div>
                                </SelectItem>
                                <SelectItem value="problema">
                                  <div className="flex items-center">
                                    <AlertCircle className="w-4 h-4 mr-2 text-orange-400" />
                                    Reportar Problema
                                  </div>
                                </SelectItem>
                                <SelectItem value="contacto">
                                  <div className="flex items-center">
                                    <MessageSquare className="w-4 h-4 mr-2 text-blue-400" />
                                    Contacto General
                                  </div>
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-light-gray">Asunto</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Describe brevemente tu solicitud"
                                className="bg-dark-graphite border-medium-gray/30 text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-light-gray">Descripción detallada</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Proporciona todos los detalles posibles..."
                                rows={6}
                                className="bg-dark-graphite border-medium-gray/30 text-white resize-none"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="isAnonymous"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border border-medium-gray/30 p-3">
                            <div className="space-y-0.5">
                              <FormLabel className="text-light-gray">Solicitud anónima</FormLabel>
                              <div className="text-sm text-medium-gray">
                                Marcar si prefieres mantener tu identidad privada
                              </div>
                            </div>
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="rounded border-medium-gray/30"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      {!form.watch("isAnonymous") && (
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-light-gray">Email de contacto (opcional)</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="email"
                                  placeholder="tu.email@ejemplo.com"
                                  className="bg-dark-graphite border-medium-gray/30 text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <Button
                        type="submit"
                        disabled={submitTicketMutation.isPending}
                        className="w-full glow-button"
                      >
                        {submitTicketMutation.isPending ? "Enviando..." : "Enviar Solicitud"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Información de contacto */}
              <div className="space-y-6">
                <Card className="bg-black/40 backdrop-blur-sm border-medium-gray/20">
                  <CardHeader>
                    <CardTitle className="font-playfair text-xl">Contacto Directo</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-white mb-2">Email</h4>
                      <p className="text-light-gray">introspens.arte@gmail.com</p>
                    </div>
                    
                    <div>
                      <h4 className="font-semibold text-white mb-2">Facebook</h4>
                      <Button
                        asChild
                        variant="outline"
                        className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                      >
                        <a 
                          href="https://www.facebook.com/share/19hgPWZaSd/?mibextid=wwXIfr" 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Mensajería Facebook
                        </a>
                      </Button>
                    </div>

                    <div className="pt-4 border-t border-medium-gray/20">
                      <h4 className="font-semibold text-white mb-2">Tiempo de respuesta</h4>
                      <p className="text-sm text-light-gray">
                        Respondemos a todas las consultas en un plazo de 24-48 horas hábiles.
                      </p>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-black/40 backdrop-blur-sm border-medium-gray/20">
                  <CardHeader>
                    <CardTitle className="font-playfair text-xl">Tipos de Solicitud</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-red-400 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-white">Reclamos</h5>
                        <p className="text-sm text-light-gray">Reporta problemas con el servicio o contenido inapropiado</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <Lightbulb className="w-5 h-5 text-yellow-400 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-white">Sugerencias</h5>
                        <p className="text-sm text-light-gray">Comparte ideas para mejorar la plataforma</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <AlertCircle className="w-5 h-5 text-orange-400 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-white">Problemas</h5>
                        <p className="text-sm text-light-gray">Reporta bugs o errores técnicos</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <MessageSquare className="w-5 h-5 text-blue-400 mt-0.5" />
                      <div>
                        <h5 className="font-medium text-white">Contacto</h5>
                        <p className="text-sm text-light-gray">Consultas generales y información</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* FAQ */}
          <TabsContent value="faq" className="mt-6">
            <Card className="bg-black/40 backdrop-blur-sm border-medium-gray/20">
              <CardHeader>
                <CardTitle className="font-playfair text-2xl">Preguntas Frecuentes</CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {faqItems.map((item, index) => (
                    <AccordionItem key={index} value={`item-${index}`} className="border-medium-gray/20">
                      <AccordionTrigger className="text-white hover:text-soft-lavender">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-light-gray">
                        {item.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
