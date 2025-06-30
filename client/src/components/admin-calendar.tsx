
import React, { useState, useEffect } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { CalendarIcon, Plus, Edit, Trash2, Eye, EyeOff, Clock } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { ARISTAS } from '@/lib/constants';

// Get available albums based on selected arista
const getAvailableAlbums = (aristaKey: string) => {
  if (!aristaKey || !ARISTAS[aristaKey as keyof typeof ARISTAS]) return [];
  return ARISTAS[aristaKey as keyof typeof ARISTAS].albums || [];
};

interface CalendarEvent {
  id?: number;
  title: string;
  content: string;
  type: 'news' | 'announcement' | 'activity';
  scheduledDate: Date;
  publishedDate?: Date;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  visibility: boolean;
  authorId: number;
  arista?: string;
  album?: string;
  deadline?: Date;
  facebookLink?: string;
  description?: string;
  activityCode?: string;
  autoPublished: boolean;
}

const newsSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  content: z.string().min(1, "El contenido es requerido"),
  scheduledDate: z.string().min(1, "La fecha de programación es requerida"),
});

const announcementSchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  content: z.string().min(1, "El contenido es requerido"),
  scheduledDate: z.string().min(1, "La fecha de programación es requerida"),
});

const activitySchema = z.object({
  title: z.string().min(1, "El título es requerido"),
  description: z.string().min(1, "La descripción es requerida"),
  arista: z.string().min(1, "La arista es requerida"),
  album: z.string().min(1, "El álbum es requerido"),
  deadline: z.string().optional(),
  facebookLink: z.string().url().optional().or(z.literal("")),
  activityCode: z.string().optional(),
  scheduledDate: z.string().min(1, "La fecha de programación es requerida"),
});

type NewsForm = z.infer<typeof newsSchema>;
type AnnouncementForm = z.infer<typeof announcementSchema>;
type ActivityForm = z.infer<typeof activitySchema>;

const AdminCalendar: React.FC = () => {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'news' | 'announcement' | 'activity'>('news');

  const newsForm = useForm<NewsForm>({
    resolver: zodResolver(newsSchema),
    defaultValues: {
      title: '',
      content: '',
      scheduledDate: new Date().toISOString().slice(0, 16),
    },
  });

  const announcementForm = useForm<AnnouncementForm>({
    resolver: zodResolver(announcementSchema),
    defaultValues: {
      title: '',
      content: '',
      scheduledDate: new Date().toISOString().slice(0, 16),
    },
  });

  const activityForm = useForm<ActivityForm>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      title: '',
      description: '',
      arista: '',
      album: '',
      deadline: '',
      facebookLink: '',
      activityCode: '',
      scheduledDate: new Date().toISOString().slice(0, 16),
    },
  });

  const eventTypes = {
    news: { label: 'Noticia', color: 'bg-blue-500' },
    announcement: { label: 'Aviso', color: 'bg-yellow-500' },
    activity: { label: 'Actividad', color: 'bg-green-500' }
  };

  const statusTypes = {
    draft: { label: 'Borrador', color: 'bg-gray-500' },
    scheduled: { label: 'Programado', color: 'bg-orange-500' },
    published: { label: 'Publicado', color: 'bg-green-600' },
    archived: { label: 'Archivado', color: 'bg-red-500' }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/calendar-events');
      if (response.ok) {
        const data = await response.json();
        setEvents(data.map((event: any) => ({
          ...event,
          scheduledDate: new Date(event.scheduledDate),
          publishedDate: event.publishedDate ? new Date(event.publishedDate) : undefined,
          deadline: event.deadline ? new Date(event.deadline) : undefined,
        })));
      }
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleSubmitNews = async (data: NewsForm) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const eventData = {
        title: data.title,
        content: data.content,
        type: 'news',
        scheduledDate: new Date(data.scheduledDate).toISOString(),
        status: 'scheduled',
        visibility: true,
        authorId: user.id,
      };

      const url = isEditing ? `/api/calendar-events/${selectedEvent?.id}` : '/api/calendar-events';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        await fetchEvents();
        setIsDialogOpen(false);
        resetForms();
        toast({ title: "✓ Noticia programada", description: "La noticia ha sido programada exitosamente" });
      }
    } catch (error) {
      console.error('Error saving news event:', error);
      toast({ title: "Error", description: "Error al programar la noticia", variant: "destructive" });
    }
  };

  const handleSubmitAnnouncement = async (data: AnnouncementForm) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const eventData = {
        title: data.title,
        content: data.content,
        type: 'announcement',
        scheduledDate: new Date(data.scheduledDate).toISOString(),
        status: 'scheduled',
        visibility: true,
        authorId: user.id,
      };

      const url = isEditing ? `/api/calendar-events/${selectedEvent?.id}` : '/api/calendar-events';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        await fetchEvents();
        setIsDialogOpen(false);
        resetForms();
        toast({ title: "✓ Aviso programado", description: "El aviso ha sido programado exitosamente" });
      }
    } catch (error) {
      console.error('Error saving announcement event:', error);
      toast({ title: "Error", description: "Error al programar el aviso", variant: "destructive" });
    }
  };

  const handleSubmitActivity = async (data: ActivityForm) => {
    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const eventData = {
        title: data.title,
        content: data.description,
        description: data.description,
        type: 'activity',
        scheduledDate: new Date(data.scheduledDate).toISOString(),
        status: 'scheduled',
        visibility: true,
        authorId: user.id,
        arista: data.arista,
        album: data.album,
        deadline: data.deadline ? new Date(data.deadline).toISOString() : null,
        facebookLink: data.facebookLink || null,
        activityCode: data.activityCode || null,
      };

      const url = isEditing ? `/api/calendar-events/${selectedEvent?.id}` : '/api/calendar-events';
      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
      });

      if (response.ok) {
        await fetchEvents();
        setIsDialogOpen(false);
        resetForms();
        toast({ title: "✓ Actividad programada", description: "La actividad ha sido programada exitosamente" });
      }
    } catch (error) {
      console.error('Error saving activity event:', error);
      toast({ title: "Error", description: "Error al programar la actividad", variant: "destructive" });
    }
  };

  const handleDeleteEvent = async (eventId: number) => {
    try {
      const response = await fetch(`/api/calendar-events/${eventId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchEvents();
        toast({ title: "Evento eliminado", description: "El evento ha sido eliminado exitosamente" });
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      toast({ title: "Error", description: "Error al eliminar el evento", variant: "destructive" });
    }
  };

  const resetForms = () => {
    newsForm.reset();
    announcementForm.reset();
    activityForm.reset();
    setSelectedEvent(null);
    setIsEditing(false);
    setActiveTab('news');
  };

  const openEditDialog = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsEditing(true);
    setActiveTab(event.type);
    
    if (event.type === 'news') {
      newsForm.reset({
        title: event.title,
        content: event.content,
        scheduledDate: event.scheduledDate.toISOString().slice(0, 16),
      });
    } else if (event.type === 'announcement') {
      announcementForm.reset({
        title: event.title,
        content: event.content,
        scheduledDate: event.scheduledDate.toISOString().slice(0, 16),
      });
    } else if (event.type === 'activity') {
      activityForm.reset({
        title: event.title,
        description: event.description || event.content,
        arista: event.arista || '',
        album: event.album || '',
        deadline: event.deadline ? event.deadline.toISOString().slice(0, 16) : '',
        facebookLink: event.facebookLink || '',
        activityCode: event.activityCode || '',
        scheduledDate: event.scheduledDate.toISOString().slice(0, 16),
      });
    }
    
    setIsDialogOpen(true);
  };

  const getEventsForDate = (date: Date) => {
    return events.filter(event => isSameDay(event.scheduledDate, date));
  };

  const dayEvents = getEventsForDate(selectedDate);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Calendario Inteligente</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForms}>
              <Plus className="w-4 h-4 mr-2" />
              Programar Contenido
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {isEditing ? 'Editar Evento Programado' : 'Programar Nuevo Contenido'}
              </DialogTitle>
            </DialogHeader>

            <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="news">Noticia</TabsTrigger>
                <TabsTrigger value="announcement">Aviso</TabsTrigger>
                <TabsTrigger value="activity">Actividad</TabsTrigger>
              </TabsList>

              <TabsContent value="news" className="space-y-4">
                <Form {...newsForm}>
                  <form onSubmit={newsForm.handleSubmit(handleSubmitNews)} className="space-y-4">
                    <FormField
                      control={newsForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Título de la noticia" />
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
                          <FormLabel>Contenido</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Contenido de la noticia..." rows={4} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={newsForm.control}
                      name="scheduledDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha y Hora de Publicación</FormLabel>
                          <FormControl>
                            <Input {...field} type="datetime-local" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full">
                      {isEditing ? 'Actualizar Noticia' : 'Programar Noticia'}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="announcement" className="space-y-4">
                <Form {...announcementForm}>
                  <form onSubmit={announcementForm.handleSubmit(handleSubmitAnnouncement)} className="space-y-4">
                    <FormField
                      control={announcementForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Título del aviso" />
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
                          <FormLabel>Contenido</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Contenido del aviso..." rows={4} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={announcementForm.control}
                      name="scheduledDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha y Hora de Publicación</FormLabel>
                          <FormControl>
                            <Input {...field} type="datetime-local" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full">
                      {isEditing ? 'Actualizar Aviso' : 'Programar Aviso'}
                    </Button>
                  </form>
                </Form>
              </TabsContent>

              <TabsContent value="activity" className="space-y-4">
                <Form {...activityForm}>
                  <form onSubmit={activityForm.handleSubmit(handleSubmitActivity)} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={activityForm.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Título de la actividad" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={activityForm.control}
                        name="activityCode"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Código de Actividad</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder="Ej: ACT001" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                      <FormField
                        control={activityForm.control}
                        name="arista"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Arista</FormLabel>
                            <Select onValueChange={(value) => {
                              field.onChange(value);
                              activityForm.setValue("album", "");
                            }} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
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
                        control={activityForm.control}
                        name="album"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Álbum</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona un álbum" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {getAvailableAlbums(activityForm.watch("arista")).map((album) => (
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
                      control={activityForm.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descripción</FormLabel>
                          <FormControl>
                            <Textarea {...field} placeholder="Descripción de la actividad..." rows={3} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={activityForm.control}
                      name="scheduledDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fecha y Hora de Publicación</FormLabel>
                          <FormControl>
                            <Input {...field} type="datetime-local" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {activityForm.watch("arista") === "actividades-express" && (
                      <FormField
                        control={activityForm.control}
                        name="deadline"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-2">
                              <Clock className="w-4 h-4" />
                              Fecha Límite (opcional)
                            </FormLabel>
                            <FormControl>
                              <Input {...field} type="datetime-local" />
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
                          <FormLabel>Link de Facebook (opcional)</FormLabel>
                          <FormControl>
                            <Input {...field} type="url" placeholder="https://facebook.com/..." />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button type="submit" className="w-full">
                      {isEditing ? 'Actualizar Actividad' : 'Programar Actividad'}
                    </Button>
                  </form>
                </Form>
              </TabsContent>
            </Tabs>

            {isEditing && (
              <Button
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  resetForms();
                }}
                className="w-full mt-4"
              >
                Cancelar
              </Button>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendario */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Calendario</CardTitle>
          </CardHeader>
          <CardContent>
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              className="rounded-md border"
              locale={es}
              modifiers={{
                hasEvents: (date) => getEventsForDate(date).length > 0,
              }}
              modifiersStyles={{
                hasEvents: { backgroundColor: '#cbbcff', color: 'white' },
              }}
            />
          </CardContent>
        </Card>

        {/* Eventos del día seleccionado */}
        <Card>
          <CardHeader>
            <CardTitle>
              Eventos - {format(selectedDate, 'dd/MM/yyyy', { locale: es })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dayEvents.length === 0 ? (
              <p className="text-gray-500 text-sm">No hay eventos programados para esta fecha</p>
            ) : (
              dayEvents.map((event) => (
                <div key={event.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex justify-between items-start">
                    <h4 className="font-medium text-sm">{event.title}</h4>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditDialog(event)}
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => event.id && handleDeleteEvent(event.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="flex space-x-1">
                    <Badge className={eventTypes[event.type].color}>
                      {eventTypes[event.type].label}
                    </Badge>
                    <Badge className={statusTypes[event.status].color}>
                      {statusTypes[event.status].label}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-gray-600 line-clamp-2">
                    {event.content}
                  </p>
                  
                  {event.activityCode && (
                    <Badge variant="outline" className="text-xs">
                      #{event.activityCode}
                    </Badge>
                  )}
                  
                  {event.autoPublished && (
                    <Badge variant="outline" className="text-xs">
                      Auto-publicado
                    </Badge>
                  )}
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminCalendar;
