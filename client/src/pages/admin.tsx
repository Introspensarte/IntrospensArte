import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
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
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { ARISTAS, RANKS, MEDALS } from "@/lib/constants";
import { Shield, Users, FileText, MessageSquare, Calendar, Settings, Plus, Edit2, Trash2, Eye } from "lucide-react";
import type { User } from "@shared/schema";

const newsSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  content: z.string().min(1, "El contenido es requerido"),
});

const announcementSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  content: z.string().min(1, "El contenido es requerido"),
});

const plannedActivitySchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  arista: z.string().min(1, "La arista es requerida"),
  album: z.string().min(1, "El álbum es requerido"),
});

const userUpdateSchema = z.object({
  signature: z.string().min(1, "La firma es requerida"),
  role: z.string(),
  rank: z.string(),
  medal: z.string().optional(),
  totalTraces: z.number().min(0),
});

const traceAssignmentSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  date: z.string().min(1, "La fecha es requerida"),
  selectedUsers: z.array(z.number()).min(1, "Selecciona al menos un usuario"),
  reason: z.string().min(1, "La razón es requerida"),
  tracesAmount: z.number().min(1, "La cantidad de trazos debe ser mayor a 0"),
});

type NewsForm = z.infer<typeof newsSchema>;
type AnnouncementForm = z.infer<typeof announcementSchema>;
type PlannedActivityForm = z.infer<typeof plannedActivitySchema>;
type UserUpdateForm = z.infer<typeof userUpdateSchema>;
type TraceAssignmentForm = z.infer<typeof traceAssignmentSchema>;

export default function Admin() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  // Queries
  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/rankings"],
    enabled: !!user && user.role === "admin",
  });

  const { data: newsList = [] } = useQuery({
    queryKey: ["/api/news"],
    enabled: !!user && user.role === "admin",
  });

  const { data: announcementsList = [] } = useQuery({
    queryKey: ["/api/announcements"],
    enabled: !!user && user.role === "admin",
  });

  const { data: plannedActivitiesList = [] } = useQuery({
    queryKey: ["/api/planned-activities"],
    enabled: !!user && user.role === "admin",
  });

  // Forms
  const newsForm = useForm<NewsForm>({
    resolver: zodResolver(newsSchema),
    defaultValues: { title: "", content: "" },
  });

  const announcementForm = useForm<AnnouncementForm>({
    resolver: zodResolver(announcementSchema),
    defaultValues: { title: "", content: "" },
  });

  const activityForm = useForm<PlannedActivityForm>({
    resolver: zodResolver(plannedActivitySchema),
    defaultValues: { title: "", description: "", arista: "", album: "" },
  });

  const userForm = useForm<UserUpdateForm>({
    resolver: zodResolver(userUpdateSchema),
    defaultValues: {
      signature: "",
      role: "user",
      rank: "Alma en tránsito",
      medal: "",
      totalTraces: 0,
    },
  });

  const traceAssignmentForm = useForm<TraceAssignmentForm>({
    resolver: zodResolver(traceAssignmentSchema),
    defaultValues: {
      title: "",
      date: new Date().toISOString().split('T')[0],
      selectedUsers: [],
      reason: "",
      tracesAmount: 0,
    },
  });

  // Mutations
  const createNewsMutation = useMutation({
    mutationFn: async (data: NewsForm) => {
      const response = await apiRequest("POST", "/api/news", {
        ...data,
        authorId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({ title: "Noticia publicada", description: "La noticia ha sido creada exitosamente" });
      newsForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createAnnouncementMutation = useMutation({
    mutationFn: async (data: AnnouncementForm) => {
      const response = await apiRequest("POST", "/api/announcements", {
        ...data,
        authorId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({ title: "Aviso publicado", description: "El aviso ha sido creado exitosamente" });
      announcementForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const createActivityMutation = useMutation({
    mutationFn: async (data: PlannedActivityForm) => {
      const response = await apiRequest("POST", "/api/planned-activities", {
        ...data,
        authorId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planned-activities"] });
      toast({ title: "Actividad creada", description: "La actividad ha sido agregada exitosamente" });
      activityForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: UserUpdateForm & { userId: number }) => {
      const { userId, ...updateData } = data;
      const response = await apiRequest("PUT", `/api/users/${userId}`, { 
        ...updateData, 
        adminUpdate: true // Mark as admin update to prevent notification loops
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rankings"] });
      toast({ title: "Usuario actualizado", description: "Los datos del usuario han sido actualizados" });
      setSelectedUser(null);
      userForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteNewsMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/news/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/news"] });
      toast({ title: "Noticia eliminada", description: "La noticia ha sido eliminada exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteAnnouncementMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/announcements/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      toast({ title: "Aviso eliminado", description: "El aviso ha sido eliminado exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deletePlannedActivityMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/planned-activities/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/planned-activities"] });
      toast({ title: "Actividad eliminada", description: "La actividad ha sido eliminada exitosamente" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const assignTracesMutation = useMutation({
    mutationFn: async (data: TraceAssignmentForm) => {
      const response = await apiRequest("POST", "/api/admin/assign-traces", {
        ...data,
        adminId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rankings"] });
      toast({ title: "Trazos asignados", description: "Los trazos han sido asignados exitosamente" });
      traceAssignmentForm.reset();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  // Check admin permissions
  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="bg-black/40 backdrop-blur-sm border-medium-gray/20 p-8">
          <div className="text-center space-y-4">
            <Shield className="w-16 h-16 text-red-500 mx-auto" />
            <h2 className="text-2xl font-bold text-white">Acceso Denegado</h2>
            <p className="text-light-gray">No tienes permisos para acceder al panel de administración</p>
          </div>
        </Card>
      </div>
    );
  }

  const selectedArista = activityForm.watch("arista");
  const availableAlbums = selectedArista ? ARISTAS[selectedArista as keyof typeof ARISTAS]?.albums || [] : [];

  const onSelectUser = (selectedUser: User) => {
    setSelectedUser(selectedUser);
    userForm.reset({
      signature: selectedUser.signature,
      role: selectedUser.role,
      rank: selectedUser.rank || "Alma en tránsito",
      medal: selectedUser.medal || "none",
      totalTraces: selectedUser.totalTraces,
    });
  };

  return (
    <div className="min-h-screen py-20 px-6">
      <div className="max-w-6xl mx-auto animate-slide-up pt-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="font-playfair text-5xl font-bold mb-4 text-purple-300">Panel de Administración</h1>
          <div className="decorative-line mb-4"></div>
          <p className="text-light-gray text-lg">Gestión avanzada de la comunidad</p>
        </div>

        <Tabs defaultValue="content" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-black/40 border border-medium-gray/20">
            <TabsTrigger value="content" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
              <FileText className="w-4 h-4 mr-2" />
              Contenido
            </TabsTrigger>
            <TabsTrigger value="users" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
              <Users className="w-4 h-4 mr-2" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="traces" className="data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
              <Plus className="w-4 h-4 mr-2" />
              Trazos
            </TabsTrigger>
          </TabsList>

          {/* Content Management Tab */}
          <TabsContent value="content" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Create News */}
              <Card className="bg-black/40 backdrop-blur-sm border-medium-gray/20">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-soft-lavender" />
                    <span>Crear Noticia</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...newsForm}>
                    <form onSubmit={newsForm.handleSubmit((data) => createNewsMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={newsForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-light-gray">Título</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Título de la noticia"
                                className="bg-dark-graphite border-medium-gray/30 text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={newsForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-light-gray">Contenido</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Contenido de la noticia..."
                                rows={6}
                                className="bg-dark-graphite border-medium-gray/30 text-white resize-none"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        disabled={createNewsMutation.isPending}
                        className="w-full glow-button"
                      >
                        {createNewsMutation.isPending ? "Publicando..." : "Publicar Noticia"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Create Announcement */}
              <Card className="bg-black/40 backdrop-blur-sm border-medium-gray/20">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-orange-400" />
                    <span>Crear Aviso</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...announcementForm}>
                    <form onSubmit={announcementForm.handleSubmit((data) => createAnnouncementMutation.mutate(data))} className="space-y-4">
                      <FormField
                        control={announcementForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-light-gray">Título</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Título del aviso"
                                className="bg-dark-graphite border-medium-gray/30 text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={announcementForm.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-light-gray">Contenido</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Contenido del aviso..."
                                rows={6}
                                className="bg-dark-graphite border-medium-gray/30 text-white resize-none"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        disabled={createAnnouncementMutation.isPending}
                        className="w-full bg-orange-600 hover:bg-orange-700 text-white"
                      >
                        {createAnnouncementMutation.isPending ? "Publicando..." : "Publicar Aviso"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Create Planned Activity */}
              <Card className="bg-black/40 backdrop-blur-sm border-medium-gray/20 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-green-400" />
                    <span>Crear Actividad</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...activityForm}>
                    <form onSubmit={activityForm.handleSubmit((data) => createActivityMutation.mutate(data))} className="space-y-4">
                      <div className="grid md:grid-cols-2 gap-4">
                        <FormField
                          control={activityForm.control}
                          name="title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-light-gray">Título</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="Título de la actividad"
                                  className="bg-dark-graphite border-medium-gray/30 text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={activityForm.control}
                          name="arista"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-light-gray">Arista</FormLabel>
                              <Select onValueChange={(value) => {
                                field.onChange(value);
                                activityForm.setValue("album", "");
                              }} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-dark-graphite border-medium-gray/30 text-white">
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
                      </div>

                      <FormField
                        control={activityForm.control}
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

                      {/* Deadline field for express activities */}
                      {activityForm.watch("arista") === "express" && (
                        <FormField
                          control={activityForm.control}
                          name="deadline"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-light-gray">Fecha límite</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="datetime-local"
                                  className="bg-dark-graphite border-medium-gray/30 text-white focus:border-soft-lavender"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      <FormField
                        control={activityForm.control}
                        name="facebookLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-light-gray">Link de Facebook (opcional)</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="url"
                                placeholder="https://facebook.com/..."
                                className="bg-dark-graphite border-medium-gray/30 text-white placeholder-medium-gray focus:border-soft-lavender"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={activityForm.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-light-gray">Descripción</FormLabel>
                            <FormControl>
                              <Textarea
                                {...field}
                                placeholder="Descripción de la actividad..."
                                rows={4}
                                className="bg-dark-graphite border-medium-gray/30 text-white resize-none"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <Button
                        type="submit"
                        disabled={createActivityMutation.isPending}
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        {createActivityMutation.isPending ? "Creando..." : "Crear Actividad"}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              {/* Existing News Management */}
              <Card className="bg-black/40 backdrop-blur-sm border-medium-gray/20">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <FileText className="w-5 h-5 text-soft-lavender" />
                    <span>Noticias Publicadas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {newsList.map((newsItem: any) => (
                      <div
                        key={newsItem.id}
                        className="p-4 rounded-lg border border-medium-gray/20 hover:border-soft-lavender/30 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-white mb-1">{newsItem.title}</h4>
                            <p className="text-sm text-light-gray mb-2 line-clamp-2">{newsItem.content}</p>
                            <span className="text-xs text-medium-gray">
                              {new Date(newsItem.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-medium-gray/30 text-blue-400 hover:bg-blue-500/20"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteNewsMutation.mutate(newsItem.id)}
                              className="border-medium-gray/30 text-red-400 hover:bg-red-500/20"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {newsList.length === 0 && (
                      <p className="text-center text-medium-gray py-4">No hay noticias publicadas</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Existing Announcements Management */}
              <Card className="bg-black/40 backdrop-blur-sm border-medium-gray/20">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <MessageSquare className="w-5 h-5 text-orange-400" />
                    <span>Avisos Publicados</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {announcementsList.map((announcement: any) => (
                      <div
                        key={announcement.id}
                        className="p-4 rounded-lg border border-medium-gray/20 hover:border-soft-lavender/30 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-white mb-1">{announcement.title}</h4>
                            <p className="text-sm text-light-gray mb-2 line-clamp-2">{announcement.content}</p>
                            <span className="text-xs text-medium-gray">
                              {new Date(announcement.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-medium-gray/30 text-blue-400 hover:bg-blue-500/20"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteAnnouncementMutation.mutate(announcement.id)}
                              className="border-medium-gray/30 text-red-400 hover:bg-red-500/20"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {announcementsList.length === 0 && (
                      <p className="text-center text-medium-gray py-4">No hay avisos publicados</p>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Planned Activities Management */}
              <Card className="bg-black/40 backdrop-blur-sm border-medium-gray/20 lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-green-400" />
                    <span>Actividades Planificadas</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {plannedActivitiesList.map((activity: any) => (
                      <div
                        key={activity.id}
                        className="p-4 rounded-lg border border-medium-gray/20 hover:border-soft-lavender/30 transition-all"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h4 className="font-semibold text-white mb-1">{activity.title}</h4>
                            <p className="text-sm text-light-gray mb-2 line-clamp-2">{activity.description}</p>
                            <div className="flex gap-2 mb-2">
                              <Badge variant="secondary" className="text-xs bg-blue-500/20 text-blue-400">
                                {activity.arista}
                              </Badge>
                              <Badge variant="secondary" className="text-xs bg-green-500/20 text-green-400">
                                {activity.album}
                              </Badge>
                            </div>
                            <span className="text-xs text-medium-gray">
                              {new Date(activity.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <div className="flex space-x-2 ml-4">
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-medium-gray/30 text-blue-400 hover:bg-blue-500/20"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deletePlannedActivityMutation.mutate(activity.id)}
                              className="border-medium-gray/30 text-red-400 hover:bg-red-500/20"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {plannedActivitiesList.length === 0 && (
                      <p className="text-center text-medium-gray py-4">No hay actividades planificadas</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* User Management Tab */}
          <TabsContent value="users" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-8">
              {/* Users List */}
              <Card className="bg-black/40 backdrop-blur-sm border-medium-gray/20">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="w-5 h-5 text-soft-lavender" />
                    <span>Lista de Usuarios</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    <Accordion type="single" collapsible className="w-full">
                      {users.map((userItem) => (
                        <AccordionItem key={userItem.id} value={`user-${userItem.id}`} className="border-medium-gray/20">
                          <AccordionTrigger className="hover:no-underline">
                            <div className="flex justify-between items-center w-full mr-4">
                              <div className="flex items-center space-x-3">
                                <div>
                                  <h4 className="font-semibold text-white text-left">{userItem.fullName}</h4>
                                  <div className="flex items-center space-x-2 mt-1">
                                    <Badge variant="secondary" className="text-xs bg-soft-lavender/20 text-soft-lavender">
                                      {userItem.signature}
                                    </Badge>
                                    {userItem.role === "admin" && (
                                      <Badge variant="destructive" className="text-xs bg-purple-900/50 text-purple-300">
                                        Admin
                                      </Badge>
                                    )}
                                  </div>
                                  <p className="text-sm text-light-gray mt-1 text-left">{userItem.rank}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-soft-lavender">{userItem.totalTraces}</div>
                                <div className="text-xs text-light-gray">trazos</div>
                              </div>
                            </div>
                          </AccordionTrigger>
                          <AccordionContent>
                            <div className="pt-4 space-y-4">
                              <div className="grid grid-cols-3 gap-4 text-center">
                                <div>
                                  <div className="text-lg font-bold text-soft-lavender">{userItem.totalTraces}</div>
                                  <div className="text-sm text-light-gray">Trazos totales</div>
                                </div>
                                <div>
                                  <div className="text-lg font-bold text-soft-lavender">{userItem.totalWords}</div>
                                  <div className="text-sm text-light-gray">Palabras totales</div>
                                </div>
                                <div>
                                  <div className="text-lg font-bold text-soft-lavender">{userItem.totalActivities}</div>
                                  <div className="text-sm text-light-gray">Actividades</div>
                                </div>
                              </div>

                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-light-gray">Miembro desde:</span>
                                  <span className="text-white">
                                    {new Date(userItem.createdAt!).toLocaleDateString()}
                                  </span>
                                </div>
                                {userItem.medal && userItem.medal !== "none" && (
                                  <div className="flex justify-between">
                                    <span className="text-light-gray">Medalla:</span>
                                    <Badge variant="secondary" className="text-xs bg-gold/20 text-gold">
                                      {userItem.medal}
                                    </Badge>
                                  </div>
                                )}
                              </div>

                              <div className="flex space-x-2 pt-2">
                                <Button
                                  onClick={() => onSelectUser(userItem)}
                                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                                  size="sm"
                                >
                                  <Edit2 className="h-4 w-4 mr-2" />
                                  Editar Perfil
                                </Button>
                                <Button
                                  onClick={() => window.open(`/usuario/${userItem.id}`, '_blank')}
                                  className="flex-1 bg-soft-lavender/20 hover:bg-soft-lavender/30 text-soft-lavender border border-soft-lavender/30"
                                  variant="outline"
                                  size="sm"
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Ver Perfil
                                </Button>
                              </div>
                            </div>
                          </AccordionContent>
                        </AccordionItem>
                      ))}
                    </Accordion>
                  </div>
                </CardContent>
              </Card>

              {/* User Edit Form */}
              {selectedUser && (
                <Card className="bg-black/40 backdrop-blur-sm border-medium-gray/20">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="w-5 h-5 text-purple-400" />
                      <span>Editar Usuario</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Form {...userForm}>
                      <form onSubmit={userForm.handleSubmit((data) => updateUserMutation.mutate({ ...data, userId: selectedUser.id }))} className="space-y-4">
                        <div className="mb-4 p-3 bg-purple-900/20 rounded-lg border border-purple-500/30">
                          <h4 className="font-semibold text-purple-300">{selectedUser.fullName}</h4>
                          <p className="text-sm text-light-gray">ID: {selectedUser.id}</p>
                        </div>

                        <FormField
                          control={userForm.control}
                          name="signature"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-light-gray">Firma</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  className="bg-dark-graphite border-medium-gray/30 text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={userForm.control}
                          name="role"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-light-gray">Rol</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-dark-graphite border-medium-gray/30 text-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="user">Usuario</SelectItem>
                                  <SelectItem value="admin">Administrador</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={userForm.control}
                          name="rank"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-light-gray">Rango</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-dark-graphite border-medium-gray/30 text-white">
                                    <SelectValue />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {RANKS.map((rank) => (
                                    <SelectItem key={rank} value={rank}>
                                      {rank}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={userForm.control}
                          name="totalTraces"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-light-gray">Trazos Totales</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                  className="bg-dark-graphite border-medium-gray/30 text-white"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={userForm.control}
                          name="medal"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-light-gray">Medalla (opcional)</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger className="bg-dark-graphite border-medium-gray/30 text-white">
                                    <SelectValue placeholder="Seleccionar medalla" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="none">Sin medalla</SelectItem>
                                  {MEDALS.map((medal) => (
                                    <SelectItem key={medal} value={medal}>
                                      {medal}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="space-y-4">
                          <div className="bg-purple-900/20 p-3 rounded-lg border border-purple-500/30">
                            <h5 className="text-sm font-medium text-purple-300 mb-2">Asignar Trazos Adicionales</h5>
                            <div className="flex space-x-2">
                              <Input
                                type="number"
                                placeholder="Cantidad"
                                className="bg-dark-graphite border-medium-gray/30 text-white flex-1"
                                id="additionalTraces"
                              />
                              <Button
                                type="button"
                                onClick={() => {
                                  const input = document.getElementById('additionalTraces') as HTMLInputElement;
                                  const additionalTraces = parseInt(input.value) || 0;
                                  if (additionalTraces > 0) {
                                    const currentTraces = userForm.getValues('totalTraces') || 0;
                                    userForm.setValue('totalTraces', currentTraces + additionalTraces);
                                    input.value = '';
                                  }
                                }}
                                className="bg-purple-600 hover:bg-purple-700 text-white"
                              >
                                <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="bg-green-900/20 p-3 rounded-lg border border-green-500/30">
                            <h5 className="text-sm font-medium text-green-300 mb-2">Asignación Directa de Trazos</h5>
                            <div className="grid grid-cols-2 gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  const currentTraces = userForm.getValues('totalTraces') || 0;
                                  userForm.setValue('totalTraces', currentTraces + 50);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white text-xs"
                              >
                                +50
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  const currentTraces = userForm.getValues('totalTraces') || 0;
                                  userForm.setValue('totalTraces', currentTraces + 100);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white text-xs"
                              >
                                +100
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  const currentTraces = userForm.getValues('totalTraces') || 0;
                                  userForm.setValue('totalTraces', currentTraces + 250);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white text-xs"
                              >
                                +250
                              </Button>
                              <Button
                                type="button"
                                size="sm"
                                onClick={() => {
                                  const currentTraces = userForm.getValues('totalTraces') || 0;
                                  userForm.setValue('totalTraces', currentTraces + 500);
                                }}
                                className="bg-green-600 hover:bg-green-700 text-white text-xs"
                              >
                                +500
                              </Button>
                            </div>
                          </div>
                        </div>

                        <div className="flex space-x-2">
                          <Button
                            type="submit"
                            disabled={updateUserMutation.isPending}
                            className="flex-1 glow-button"
                          >
                            {updateUserMutation.isPending ? "Guardando..." : "Guardar Cambios"}
                          </Button>

                          <Button
                            type="button"
                            onClick={() => setSelectedUser(null)}
                            variant="outline"
                            className="border-medium-gray/30 text-light-gray hover:bg-medium-gray/20"
                          >
                            Cancelar
                          </Button>
                        </div>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Trace Assignment Tab */}
          <TabsContent value="traces" className="mt-6">
            <Card className="bg-black/40 backdrop-blur-sm border-medium-gray/20">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Plus className="w-5 h-5 text-gold" />
                  <span>Asignar Trazos a Usuarios</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...traceAssignmentForm}>
                  <form onSubmit={traceAssignmentForm.handleSubmit((data) => assignTracesMutation.mutate(data))} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={traceAssignmentForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-light-gray">Título</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Ej: Trazos de bonificación navideña"
                                className="bg-dark-graphite border-medium-gray/30 text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={traceAssignmentForm.control}
                        name="date"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-light-gray">Fecha</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="date"
                                className="bg-dark-graphite border-medium-gray/30 text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={traceAssignmentForm.control}
                      name="selectedUsers"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-light-gray">Seleccionar Usuarios</FormLabel>
                          <div className="bg-dark-graphite border border-medium-gray/30 rounded-md p-4 max-h-40 overflow-y-auto">
                            <div className="space-y-2">
                              {users.map((userItem) => (
                                <label key={userItem.id} className="flex items-center space-x-3 cursor-pointer hover:bg-medium-gray/10 p-2 rounded">
                                  <input
                                    type="checkbox"
                                    checked={field.value.includes(userItem.id)}
                                    onChange={(e) => {
                                      const newValue = e.target.checked
                                        ? [...field.value, userItem.id]
                                        : field.value.filter(id => id !== userItem.id);
                                      field.onChange(newValue);
                                    }}
                                    className="rounded border-medium-gray/30"
                                  />
                                  <div className="flex-1">
                                    <div className="text-white font-medium">{userItem.fullName}</div>
                                    <div className="text-sm text-light-gray">{userItem.signature}</div>
                                  </div>
                                  <div className="text-soft-lavender font-bold">{userItem.totalTraces} trazos</div>
                                </label>
                              ))}
                            </div>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={traceAssignmentForm.control}
                        name="tracesAmount"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-light-gray">Cantidad de Trazos</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                min="1"
                                placeholder="Ej: 100"
                                onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                                className="bg-dark-graphite border-medium-gray/30 text-white"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="bg-soft-lavender/10 rounded-lg p-4 border border-soft-lavender/20">
                        <div className="text-center">
                          <div className="text-sm text-light-gray">Total de usuarios seleccionados:</div>
                          <div className="text-2xl font-bold text-soft-lavender">
                            {traceAssignmentForm.watch("selectedUsers").length}
                          </div>
                        </div>
                      </div>
                    </div>

                    <FormField
                      control={traceAssignmentForm.control}
                      name="reason"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-light-gray">Razón de la Asignación</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Explica por qué se asignan estos trazos..."
                              rows={3}
                              className="bg-dark-graphite border-medium-gray/30 text-white resize-none"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="submit"
                      disabled={assignTracesMutation.isPending}
                      className="w-full bg-gold hover:bg-gold/80 text-black font-bold"
                    >
                      {assignTracesMutation.isPending ? "Asignando..." : "Asignar Trazos"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}