import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertActivitySchema, 
  insertNewsSchema, 
  insertAnnouncementSchema, 
  insertPlannedActivitySchema 
} from "@shared/schema";
import { calculateTraces, calculateExpressActivityTraces } from "../client/src/lib/trace-calculator.js";
import { PushNotificationService } from "./push-notifications";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      const extension = path.extname(file.originalname);
      cb(null, `activity-${uniqueSuffix}${extension}`);
    }
  }),
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo se permiten imágenes.'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

export async function registerRoutes(app: Express): Promise<Server> {
  // File upload route
  app.post("/api/upload-image", upload.single('file'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No se ha subido ningún archivo" });
      }

      const imagePath = req.file.filename;
      res.json({ imagePath });
    } catch (error: any) {
      console.error("Error uploading image:", error);
      res.status(500).json({ message: error.message || "Error al subir la imagen" });
    }
  });

  // Serve uploaded images
  app.get("/api/images/:filename", (req, res) => {
    const filename = req.params.filename;
    const imagePath = path.join(uploadDir, filename);
    
    if (fs.existsSync(imagePath)) {
      res.sendFile(imagePath);
    } else {
      res.status(404).json({ message: "Imagen no encontrada" });
    }
  });

  // User routes
  app.post("/api/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check if signature already exists
      const existingUser = await storage.getUserBySignature(userData.signature);
      if (existingUser) {
        return res.status(400).json({ 
          message: "Esta firma ya está en uso. Por favor elige otra." 
        });
      }

      const user = await storage.createUser(userData);
      res.status(201).json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      console.error("Registration error:", error);

      if (error.code === '23505') { // PostgreSQL unique constraint violation
        return res.status(400).json({ 
          message: "Esta firma ya está registrada. Por favor elige otra." 
        });
      }

      res.status(400).json({ 
        message: error.message || "Error al crear la cuenta" 
      });
    }
  });

  app.post("/api/login", async (req, res) => {
    try {
      const { signature } = req.body;
      if (!signature) {
        return res.status(400).json({ message: "Firma requerida" });
      }

      const user = await storage.getUserBySignature(signature);
      if (!user) {
        return res.status(401).json({ message: "Firma no encontrada" });
      }

      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }
      res.json({ ...user, password: undefined });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const user = await storage.updateUser(id, updates);

      // Enviar notificación a administradores
      await PushNotificationService.sendNotificationToAdmins({
        title: "Perfil Actualizado",
        body: `${user.signature} ha actualizado su perfil`,
        type: "profile_update",
        url: `/usuario/${user.id}`
      });

      res.json({ ...user, password: undefined });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/rankings", async (req, res) => {
    try {
      const rankings = await storage.getUserRankings();
      res.json(rankings.map(user => ({ ...user, password: undefined })));
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Activity routes
  app.post("/api/activities", async (req, res) => {
    try {
      console.log("Received activity data:", req.body);

      // Extract userId from request body
      const { userId, ...activityData } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "ID de usuario requerido" });
      }

      // Clean and validate the activity data
      const cleanData = {
        name: activityData.name?.trim(),
        date: new Date(activityData.date), // Convert string to Date object
        word_count: parseInt(activityData.wordCount) || 0,
        type: activityData.type,
        responses: activityData.responses ? parseInt(activityData.responses) : undefined,
        link: activityData.link?.trim() || undefined,
        image_path: activityData.imagePath?.trim() || "",
        description: activityData.description?.trim(),
        arista: activityData.arista,
        album: activityData.album,
      };

      // Validate using schema - make image_path optional
      const validatedData = {
        ...cleanData,
        image_path: cleanData.image_path || "", // Ensure it's never undefined
      };

      console.log("Validated data:", validatedData);

      // Calculate traces based on activity type and word count
      const traces = calculateTraces(validatedData.type, validatedData.word_count, validatedData.responses);

      console.log("Calculated traces:", traces);

      const activity = await storage.createActivity({
        ...validatedData,
        userId: parseInt(userId),
        traces,
      });

      console.log("Created activity:", activity);

      // Update user stats after creating activity
      await storage.updateUserStats(parseInt(userId));

      // Get updated user stats
      const updatedUser = await storage.getUser(parseInt(userId));

      // Notificar a todos los usuarios sobre nueva actividad
      if (updatedUser) {
        await PushNotificationService.broadcastNotification({
          title: "Nueva Actividad",
          body: `${updatedUser.signature} ha subido: ${activity.name}`,
          type: "new_activity",
          url: "/activities"
        });
      }

      res.json({ 
        activity, 
        user: updatedUser ? { ...updatedUser, password: undefined } : null 
      });
    } catch (error: any) {
      console.error("Activity creation error:", error);

      if (error.name === 'ZodError') {
        const errorMessages = error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`);
        return res.status(400).json({ 
          message: "Datos inválidos: " + errorMessages.join(", ") 
        });
      }

      res.status(400).json({ message: error.message || "Error al crear la actividad" });
    }
  });

  app.get("/api/activities", async (req, res) => {
    try {
      const activities = await storage.getAllActivities();
      res.json(activities);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/users/:id/activities", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const activities = await storage.getUserActivities(userId, limit);
      res.json(activities);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // News routes
  app.post("/api/news", async (req, res) => {
    try {
      const newsData = insertNewsSchema.parse(req.body);
      const { authorId } = req.body;

      if (!authorId) {
        return res.status(400).json({ message: "ID de autor requerido" });
      }

      const newsItem = await storage.createNews({
        ...newsData,
        authorId: parseInt(authorId),
      });

      // Notificar a todos los usuarios sobre nueva noticia
      await PushNotificationService.broadcastNotification({
        title: "Nueva Noticia",
        body: newsData.title,
        type: "news",
        url: "/news"
      });

      res.json(newsItem);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/news", async (req, res) => {
    try {
      const news = await storage.getAllNews();
      res.json(news);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Announcement routes
  app.post("/api/announcements", async (req, res) => {
    try {
      const announcementData = insertAnnouncementSchema.parse(req.body);
      const { authorId } = req.body;

      if (!authorId) {
        return res.status(400).json({ message: "ID de autor requerido" });
      }

      const announcement = await storage.createAnnouncement({
        ...announcementData,
        authorId: parseInt(authorId),
      });

      // Notificar a todos los usuarios sobre nuevo aviso
      await PushNotificationService.broadcastNotification({
        title: "Nuevo Aviso",
        body: announcementData.title,
        type: "announcement",
        url: "/announcements"
      });

      res.json(announcement);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/announcements", async (req, res) => {
    try {
      const announcements = await storage.getAllAnnouncements();
      res.json(announcements);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Planned activities routes
  app.post("/api/planned-activities", async (req, res) => {
    try {
      const activityData = insertPlannedActivitySchema.parse(req.body);
      const { authorId } = req.body;

      if (!authorId) {
        return res.status(400).json({ message: "ID de autor requerido" });
      }

      const activity = await storage.createPlannedActivity({
        ...activityData,
        authorId: parseInt(authorId),
      });

      res.json(activity);
    } catch (error: any) {
      res.status(400).json({ message: error.message });
    }
  });

  app.get("/api/planned-activities", async (req, res) => {
    try {
      const activities = await storage.getAllPlannedActivities();
      res.json(activities);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Like routes
  app.post("/api/activities/:id/like", async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "ID de usuario requerido" });
      }

      const result = await storage.toggleLike(activityId, parseInt(userId));
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Comment routes
  app.post("/api/activities/:id/comments", async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const { userId, content } = req.body;

      if (!userId || !content) {
        return res.status(400).json({ message: "ID de usuario y contenido requeridos" });
      }

      const comment = await storage.createComment({
        activityId,
        userId: parseInt(userId),
        content: content.trim()
      });

      res.json(comment);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/activities/:id/comments", async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const comments = await storage.getActivityComments(activityId);
      res.json(comments);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Notification routes
  app.get("/api/users/:id/notifications", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const notifications = await storage.getUserNotifications(userId);
      res.json(notifications);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/notifications/:id/read", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.markNotificationAsRead(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Get likes count for an activity
  app.get("/api/activities/:id/likes", async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const count = await storage.getLikesCount(activityId);
      res.json({ count });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Check if user liked an activity
  app.get("/api/activities/:id/likes/:userId", async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);
      const isLiked = await storage.isLikedByUser(activityId, userId);
      res.json({ liked: isLiked });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update activity
  app.put("/api/activities/:id", upload.single('file'), async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const { userId, name, date, wordCount, type, responses, link, imagePath, description, arista, album } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "ID de usuario requerido" });
      }

      // Check if activity exists and belongs to user
      const activity = await storage.getActivity(activityId);
      if (!activity) {
        return res.status(404).json({ message: "Actividad no encontrada" });
      }

      if (activity.userId !== parseInt(userId)) {
        return res.status(403).json({ message: "No tienes permisos para editar esta actividad" });
      }

      // Handle image upload if new file is provided
      let finalImagePath = imagePath || activity.image_path;
      if (req.file) {
        finalImagePath = req.file.filename;
      }

      // Calculate new traces
      const traces = calculateTraces(type, parseInt(wordCount) || 0, responses ? parseInt(responses) : undefined);

      // Clean and validate the activity data
      const cleanData = {
        name: name?.trim(),
        date: date ? new Date(date) : activity.date, // Convert string to Date object
        word_count: parseInt(wordCount) || activity.word_count,
        type: type,
        responses: responses ? parseInt(responses) : undefined,
        link: link?.trim() || undefined,
        image_path: finalImagePath,
        description: description?.trim(),
        arista: arista,
        album: album,
      };

      // Validate using schema (make image_path optional for updates)
      const validatedData = {
        ...cleanData,
        image_path: finalImagePath || activity.image_path, // Keep existing if no new image
      };

      // Update the activity
      const updatedActivity = await storage.updateActivity(activityId, {
        ...validatedData,
        userId: parseInt(userId),
        traces,
      });

      // Update user stats after updating activity
      await storage.updateUserStats(parseInt(userId));

      // Get updated user stats
      const updatedUser = await storage.getUser(parseInt(userId));

      res.json({ 
        activity: updatedActivity, 
        user: updatedUser ? { ...updatedUser, password: undefined } : null 
      });
    } catch (error: any) {
      console.error("Error updating activity:", error);

      if (error.name === 'ZodError') {
        const errorMessages = error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`);
        return res.status(400).json({ 
          message: "Datos inválidos: " + errorMessages.join(", ") 
        });
      }

      res.status(500).json({ message: error.message || "Failed to update activity" });
    }
  });

  // Refresh user stats endpoint
  app.post("/api/users/:id/refresh-stats", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      
      console.log(`Manual stats refresh requested for user ${userId}`);
      
      await storage.updateUserStats(userId);
      const user = await storage.getUser(userId);
      
      console.log(`Stats refreshed for user ${userId}: ${user?.totalActivities} activities, ${user?.totalWords} words, ${user?.totalTraces} traces`);
      
      res.json({ 
        success: true, 
        user: { ...user, password: undefined },
        message: "Estadísticas actualizadas correctamente"
      });
    } catch (error: any) {
      console.error("Error refreshing user stats:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Delete activity
  app.delete("/api/activities/:id", async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const { userId } = req.body;

      if (!userId) {
        return res.status(400).json({ message: "ID de usuario requerido" });
      }

      // Check if activity exists and belongs to user
      const activity = await storage.getActivity(activityId);
      if (!activity) {
        return res.status(404).json({ message: "Actividad no encontrada" });
      }

      if (activity.userId !== parseInt(userId)) {
        return res.status(403).json({ message: "No tienes permisos para eliminar esta actividad" });
      }

      await storage.deleteActivity(activityId, parseInt(userId));

      // Update user stats after deleting activity
      await storage.updateUserStats(parseInt(userId));

      // Get updated user stats
      const updatedUser = await storage.getUser(parseInt(userId));

      res.json({ 
        success: true, 
        user: updatedUser ? { ...updatedUser, password: undefined } : null 
      });
    } catch (error: any) {
      console.error("Error deleting activity:", error);
      res.status(500).json({ message: error.message });
    }
  });

  

  const httpServer = createServer(app);
  return httpServer;
}