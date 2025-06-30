import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import axios from "axios";
import * as cheerio from "cheerio";
import { storage } from "./storage";
import { 
  insertUserSchema, 
  insertActivitySchema, 
  insertNewsSchema, 
  insertAnnouncementSchema, 
  insertPlannedActivitySchema,
  bonusHistory,
  supportTickets
} from "@shared/schema";
import { db } from "./db";
// Server-side trace calculation function
function calculateTraces(type: string, wordCount: number, responses?: number, album?: string): number {
  console.log(`Calculating traces for type: ${type}, wordCount: ${wordCount}, responses: ${responses}, album: ${album}`);

  // Special case for "Actividad Tardía" - always 100 traces regardless of type or word count
  if (album === "actividad-tardia") {
    console.log("Actividad Tardía detected - assigning 100 traces");
    return 100;
  }

  let traces = 0;

  switch (type.toLowerCase()) {
    case 'microcuento':
      // 1 a 100 palabras: 100 trazos
      if (wordCount >= 1 && wordCount <= 100) {
        traces = 100;
      } else {
        // Si excede 100 palabras, se considera como drabble o narrativa
        traces = calculateTraces(wordCount <= 200 ? 'drabble' : 'narrativa', wordCount);
      }
      break;

    case 'drabble':
      // 101 a 200 palabras: 200 trazos
      if (wordCount >= 101 && wordCount <= 200) {
        traces = 200;
      } else if (wordCount <= 100) {
        traces = calculateTraces('microcuento', wordCount);
      } else {
        traces = calculateTraces('narrativa', wordCount);
      }
      break;

    case 'narrativa':
      // 201 o más palabras: base de 300 trazos (201 a 499 palabras)
      // +100 trazos por cada 500 palabras adicionales
      if (wordCount >= 201) {
        if (wordCount <= 499) {
          traces = 300; // Base para 201-499 palabras
        } else {
          // Calcular trazos adicionales por cada bloque de 500 palabras
          const additionalBlocks = Math.floor((wordCount - 500) / 500) + 1;
          traces = 300 + (additionalBlocks * 100);
        }
      } else if (wordCount <= 100) {
        traces = calculateTraces('microcuento', wordCount);
      } else {
        traces = calculateTraces('drabble', wordCount);
      }
      break;

    case 'hilo':
      // 5 trazos por cada 280 palabras + bonus por respuestas
      traces = Math.floor(wordCount / 280) * 5;
      if (responses && responses > 0) {
        traces += responses * 2; // 2 trazos adicionales por respuesta
      }
      break;

    case 'rol':
      // 3 trazos por cada 50 palabras + bonus por respuestas
      traces = Math.floor(wordCount / 50) * 3;
      if (responses && responses > 0) {
        traces += responses * 2; // 2 trazos adicionales por respuesta
      }
      break;

    case 'otro':
      // 5 trazos por cada 100 palabras
      traces = Math.floor(wordCount / 100) * 5;
      break;

    default:
      // Default: 1 trazo por cada 20 palabras
      traces = Math.floor(wordCount / 20);
      break;
  }

  // Minimum 1 trace if there are words
  if (wordCount > 0 && traces === 0) {
    traces = 1;
  }

  console.log(`Calculated ${traces} traces for ${type} with ${wordCount} words`);
  return traces;
}
import { PushNotificationService } from "./push-notifications";
import { desc, eq, asc, and, isNull, isNotNull, gte, ne, exists, inArray, count, sql, lt } from "drizzle-orm";
import { users } from "@shared/schema";

// Configure multer for file uploads
const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Image extraction utilities
async function extractImageFromUrl(url: string): Promise<string | null> {
  try {
    // Check if URL is a direct image
    if (isDirectImageUrl(url)) {
      return await downloadAndSaveImage(url);
    }

    // Extract image from webpage
    const response = await axios.get(url, {
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const $ = cheerio.load(response.data);

    // Priority order for finding images
    let imageUrl = null;

    // 1. Try og:image meta tag
    imageUrl = $('meta[property="og:image"]').attr('content');

    // 2. Try twitter:image meta tag
    if (!imageUrl) {
      imageUrl = $('meta[name="twitter:image"]').attr('content');
    }

    // 3. Try first relevant img tag
    if (!imageUrl) {
      const imgTags = $('img');
      for (let i = 0; i < imgTags.length; i++) {
        const src = $(imgTags[i]).attr('src');
        if (src && !src.includes('icon') && !src.includes('logo') && !src.includes('avatar')) {
          imageUrl = src;
          break;
        }
      }
    }

    if (imageUrl) {
      // Make URL absolute if relative
      if (imageUrl.startsWith('/')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.protocol}//${urlObj.host}${imageUrl}`;
      } else if (imageUrl.startsWith('//')) {
        const urlObj = new URL(url);
        imageUrl = `${urlObj.protocol}${imageUrl}`;
      }

      return await downloadAndSaveImage(imageUrl);
    }

    return null;
  } catch (error) {
    console.error('Error extracting image from URL:', error);
    return null;
  }
}

function isDirectImageUrl(url: string): boolean {
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp'];
  const urlLower = url.toLowerCase();
  return imageExtensions.some(ext => urlLower.includes(ext));
}

async function downloadAndSaveImage(imageUrl: string): Promise<string | null> {
  try {
    const response = await axios.get(imageUrl, {
      responseType: 'stream',
      timeout: 10000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const extension = getImageExtension(imageUrl) || '.jpg';
    const filename = `extracted-${uniqueSuffix}${extension}`;
    const filepath = path.join(uploadDir, filename);

    const writer = fs.createWriteStream(filepath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => resolve(`/uploads/${filename}`));
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Error downloading image:', error);
    return null;
  }
}

function getImageExtension(url: string): string | null {
  const match = url.match(/\.(jpg|jpeg|png|gif|webp|bmp)(\?|$)/i);
  return match ? `.${match[1].toLowerCase()}` : null;
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
  // Health check route
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Test bonus history table
  app.get("/api/test-bonus-history", async (req, res) => {
    try {
      const result = await db.select().from(bonusHistory).limit(5);
      res.json({ 
        status: "ok", 
        tableExists: true, 
        sampleData: result,
        count: result.length 
      });
    } catch (error: any) {
      res.json({ 
        status: "error", 
        tableExists: false, 
        error: error.message 
      });
    }
  });

  // User routes
  // Get all users for members page
  app.get("/api/users", async (req, res) => {
    try {
      const allUsers = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          signature: users.signature,
          birthday: users.birthday,
          rank: users.rank,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(users.createdAt);

      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Error del servidor" });
    }
  });

  // Get single user profile
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID de usuario inválido" });
      }

      // Update user stats first to ensure fresh data
      await storage.updateUserStats(userId);

      const user = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          age: users.age,
          birthday: users.birthday,
          faceClaim: users.faceClaim,
          signature: users.signature,
          motivation: users.motivation,
          facebookLink: users.facebookLink,
          rank: users.rank,
          totalTraces: users.totalTraces,
          totalWords: users.totalWords,
          totalActivities: users.totalActivities,
          role: users.role,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, userId))
        .limit(1);

      if (user.length === 0) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      res.json(user[0]);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Error del servidor" });
    }
  });

  app.post("/api/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);

      // Check user limit (70 users maximum)
      const totalUsers = await db.select({ count: count() }).from(users);
      const userCount = totalUsers[0]?.count || 0;

      if (userCount >= 70) {
        return res.status(400).json({ 
          message: "Cupos Cubiertos. Lo lamentamos mucho, este bimestre ya se han llenado todos los cupos disponibles. No te preocupes, puedes estar atento a nuestra página de Facebook para cuando volvamos a abrir cupos o anunciemos cuándo es el próximo bimestre. ¡Esperamos tenerte con nosotros pronto!" 
        });
      }

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

  app.put("/api/users/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;

      // Log the update for debugging
      console.log(`Updating user ${id} with:`, updates);

      const user = await storage.updateUser(id, updates);

      // Enviar notificación a administradores si no es una actualización administrativa
      if (!req.body.adminUpdate) {
        await PushNotificationService.sendNotificationToAdmins({
          title: "Perfil Actualizado",
          body: `${user.signature} ha actualizado su perfil`,
          type: "profile_update",
          url: `/usuario/${user.id}`
        });
      } else {
        // Si es una actualización administrativa, notificar al usuario afectado
        await storage.createNotification({
          userId: id,
          title: "Perfil Actualizado por Admin",
          content: "Un administrador ha actualizado tu perfil. Los cambios se reflejarán inmediatamente.",
          type: "admin_update"
        });
      }

      console.log(`User ${id} updated successfully:`, { ...user, password: undefined });

      res.json({ ...user, password: undefined });
    } catch (error: any) {
      console.error(`Error updating user ${id}:`, error);
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

      // Default image URL for activities
      const defaultImageUrl = "https://scontent.fpaz4-1.fna.fbcdn.net/v/t39.30808-6/489621375_122142703550426409_3085208440656935630_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=f727a1&_nc_ohc=k3C3nz46gW8Q7kNvwEYXQMV&_nc_oc=AdlXTRXFUrbiz7_hzcNduekaNgHmAeCPpHG_b3rp6XzBiffhfuO7oNx93k1uitgo5XXgdbQoAK9TyLTs8jl1cX5Z&_nc_zt=23&_nc_ht=scontent.fpaz4-1.fna&_nc_gid=25gzNMflzPt7ADWJVLmBQw&oh=00_AfNXDgfInFQk4CqIfy1P4v2_xNYSyNMF68AHIhUVm8ARiw&oe=68620DAA";

      // Process image from link if provided
      let finalImageUrl = activityData.image_url?.trim() || defaultImageUrl;

      if (activityData.link?.trim()) {
        console.log('Extracting image from link:', activityData.link);
        const extractedImageUrl = await extractImageFromUrl(activityData.link.trim());
        if (extractedImageUrl) {
          finalImageUrl = extractedImageUrl;
          console.log('Successfully extracted image:', extractedImageUrl);
        }
      }

      // Clean and validate the activity data
      const cleanData = {
        name: activityData.name?.trim(),
        date: new Date(activityData.date), // Convert string to Date object
        word_count: parseInt(activityData.wordCount) || 0,
        type: activityData.type,
        responses: activityData.responses ? parseInt(activityData.responses) : undefined,
        link: activityData.link?.trim() || undefined,
        image_url: finalImageUrl,
        description: activityData.description?.trim(),
        arista: activityData.arista,
        album: activityData.album,
      };

      // Validate using schema
      const validatedData = {
        ...cleanData,
        image_url: cleanData.image_url || "", // Ensure it's never undefined
      };

      console.log("Validated data:", validatedData);

      // Calculate traces based on activity type and word count
      const traces = calculateTraces(validatedData.type, validatedData.word_count, validatedData.responses, validatedData.album);

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

  app.put("/api/news/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { title, content } = req.body;

      if (!title || !content) {
        return res.status(400).json({ message: "Título y contenido requeridos" });
      }

      const updatedNews = await storage.updateNews(id, { title, content });
      res.json(updatedNews);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/news/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteNews(id);
      res.json({ success: true });
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
    } catch (error) {
      console.error("Error fetching announcements:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get viewers for a specific news item
  app.get("/api/news/:id/viewers", async (req, res) => {
    try {
      const newsId = parseInt(req.params.id);
      const viewers = await storage.getNewsViewers(newsId);
      res.json(viewers);
    } catch (error) {
      console.error("Error fetching news viewers:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Get viewers for a specific announcement
  app.get("/api/announcements/:id/viewers", async (req, res) => {
    try {
      const announcementId = parseInt(req.params.id);
      const viewers = await storage.getAnnouncementViewers(announcementId);
      res.json(viewers);
    } catch (error) {
      console.error("Error fetching announcement viewers:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  app.put("/api/announcements/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { title, content } = req.body;

      if (!title || !content) {
        return res.status(400).json({ message: "Título y contenido requeridos" });
      }

      const updatedAnnouncement = await storage.updateAnnouncement(id, { title, content });
      res.json(updatedAnnouncement);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/announcements/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteAnnouncement(id);
      res.json({ success: true });
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
    // First, move expired activities to "actividad-tardia"
    const now = new Date();
    await storage.moveExpiredActivitiesToTardia();

    const activities = await storage.getAllPlannedActivities();
    res.json(activities);
  } catch (error: any) {
    console.error("Error fetching planned activities:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

  // Update planned activity
  app.put("/api/planned-activities/:id", async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const updatedActivity = await storage.updatePlannedActivity(activityId, req.body);
      res.json(updatedActivity);
    } catch (error) {
      console.error("Error updating planned activity:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Delete planned activity
  app.delete("/api/planned-activities/:id", async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      await storage.deletePlannedActivity(activityId);
      res.json({ message: "Actividad eliminada exitosamente" });
    } catch (error) {
      console.error("Error deleting planned activity:", error);
      res.status(500).json({ message: "Error interno del servidor" });
    }
  });

  // Check and move expired express activities
  app.post("/api/admin/check-expired-activities", async (req, res) => {
    try {
      await storage.moveExpiredActivitiesToTardia();
      res.json({ success: true, message: "Actividades expiradas actualizadas" });
    } catch (error) {
      console.error("Error checking expired activities:", error);
      res.status(500).json({ message: "Error interno del servidor" });
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
      const activityId = parseInt(req.params/id);
      const userId = parseInt(req.params.userId);
      const isLiked = await storage.isLikedByUser(activityId, userId);
      res.json({ liked: isLiked });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Update activity
  app.put("/api/activities/:id", async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const { userId, name, date, wordCount, type, responses, link, imageUrl, description, arista, album } = req.body;

      console.log("Updating activity:", activityId, "with data:", req.body);

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

      // Calculate new traces
      const traces = calculateTraces(type, parseInt(wordCount) || 0, responses ? parseInt(responses) : undefined, album);

      // Default image URL for activities
      const defaultImageUrl = "https://scontent.fpaz4-1.fna.fbcdn.net/v/t39.30808-6/489621375_122142703550426409_3085208440656935630_n.jpg?_nc_cat=111&ccb=1-7&_nc_sid=f727a1&_nc_ohc=k3C3nz46gW8Q7kNvwEYXQMV&_nc_oc=AdlXTRXFUrbiz7_hzcNduekaNgHmAeCPpHG_b3rp6XzBiffhfuO7oNx93k1uitgo5XXgdbQoAK9TyLTs8jl1cX5Z&_nc_zt=23&_nc_ht=scontent.fpaz4-1.fna&_nc_gid=25gzNMflzPt7ADWJVLmBQw&oh=00_AfNXDgfInFQk4CqIfy1P4v2_xNYSyNMF68AHIhUVm8ARiw&oe=68620DAA";

      // Process image from link if provided but no imageUrl
      let finalImageUrl = imageUrl?.trim() || activity.image_url || defaultImageUrl;

      if (link?.trim() && (!imageUrl || imageUrl.trim() === "")) {
        console.log('Extracting image from link for update:', link);
        const extractedImageUrl = await extractImageFromUrl(link.trim());
        if (extractedImageUrl) {
          finalImageUrl = extractedImageUrl;
          console.log('Successfully extracted image for update:', extractedImageUrl);
        }
      }

      // Clean and validate the activity data
      const cleanData = {
        name: name?.trim(),
        date: date ? new Date(date) : activity.date,
        word_count: parseInt(wordCount) || activity.word_count,
        type: type,
        responses: responses ? parseInt(responses) : activity.responses,
        link: link?.trim() || activity.link,
        image_url: finalImageUrl,
        description: description?.trim(),
        arista: arista,
        album: album,
        traces,
      };

      console.log("Clean data for update:", cleanData);

      // Update the activity
      const updatedActivity = await storage.updateActivity(activityId, cleanData);

      // Update user stats after updating activity
      await storage.updateUser(parseInt(userId));

      // Get updated user stats
      const updatedUser = await storage.getUser(parseInt(userId));

      console.log("Activity updated successfully:", updatedActivity.id);

      res.json({ 
        activity: updatedActivity, 
        user: updatedUser ? { ...updatedUser, password: undefined } : null,
        success: true
      });
    } catch (error: any) {
      console.error("Error updating activity:", error);

      if (error.name === 'ZodError') {
        const errorMessages = error.errors.map((err: any) => `${err.path.join('.')}: ${err.message}`);
        return res.status(400).json({ 
          message: "Datos inválidos: " + errorMessages.join(", ") 
        });
      }

      res.status(500).json({ message: error.message || "Error al actualizar la actividad" });
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

  // Manual traces assignment endpoint
  app.post("/api/users/:id/assign-traces", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { additionalTraces, reason, adminId } = req.body;

      if (!additionalTraces || additionalTraces <= 0) {
        return res.status(400).json({ message: "Cantidad de trazos inválida" });
      }

      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Usuario no encontrado" });
      }

      const newTotal = (user.totalTraces || 0) + parseInt(additionalTraces);

      await storage.updateUser(userId, { totalTraces: newTotal });

      // Create bonus history entry
      await storage.createBonusHistory({
        userId,
        title: "Asignación Manual de Trazos",
        traces: parseInt(additionalTraces),
        type: "admin_assignment",
        assignedById: adminId || null,
        reason: reason || "Asignación manual de trazos"
      });

      // Crear notificación para el usuario
      await storage.createNotification({
        userId,
        title: "Trazos Asignados",
        content: `Se te han asignado ${additionalTraces} trazos adicionales. ${reason ? `Motivo: ${reason}` : ''}`,
        type: "trace_assignment"
      });

      const updatedUser = await storage.getUser(userId);

      res.json({ 
        success: true, 
        user: { ...updatedUser, password: undefined },
        message: `${additionalTraces} trazos asignados correctamente`
      });
    } catch (error: any) {
      console.error("Error assigning traces:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get user bonus history
  app.get("/api/users/:id/bonus-history", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      console.log(`Getting bonus history for user ${userId}`);

      if (isNaN(userId)) {
        return res.status(400).json({ message: "ID de usuario inválido" });
      }

      const bonusHistory = await storage.getUserBonusHistory(userId);
      console.log(`Found ${bonusHistory.length} bonus history entries for user ${userId}`);
      res.json(bonusHistory);
    } catch (error: any) {
      console.error("Error getting bonus history:", error);
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

  // Get all trace assignments (admin only)
  app.get("/api/admin/trace-assignments", async (req, res) => {
    try {
      const { adminId } = req.query;

      if (!adminId) {
        return res.status(400).json({ message: "ID de administrador requerido" });
      }

      // Verify admin permissions
      const admin = await storage.getUser(parseInt(adminId as string));
      if (!admin || (admin.role !== "admin" && admin.signature !== "#INELUDIBLE")) {
        return res.status(403).json({ message: "No tienes permisos de administrador" });
      }

      const assignments = await storage.getAllTraceAssignments();
      res.json(assignments);
    } catch (error: any) {
      console.error("Error fetching trace assignments:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin trace assignment
  app.post("/api/admin/assign-traces", async (req, res) => {
    try {
      const { title, date, selectedUsers, reason, tracesAmount, adminId } = req.body;

      if (!adminId) {
        return res.status(400).json({ message: "ID de administrador requerido" });
      }

      // Verify admin permissions - check both role and special signature
      const admin = await storage.getUser(parseInt(adminId));
      if (!admin || (admin.role !== "admin" && admin.signature !== "#INELUDIBLE")) {
        return res.status(403).json({ message: "No tienes permisos de administrador" });
      }

      if (!selectedUsers || selectedUsers.length === 0) {
        return res.status(400).json({ message: "Debes seleccionar al menos un usuario" });
      }

      // Create trace assignment record
      const assignment = await storage.createTraceAssignment({
        title,
        date: new Date(date),
        reason,
        tracesAmount: parseInt(tracesAmount),
        adminId: parseInt(adminId),
        userIds: selectedUsers.map((id: number) => parseInt(id)),
      });

      // Update user traces for each selected user
      for (const userId of selectedUsers) {
        const user = await storage.getUser(parseInt(userId));
        if (user) {
          const newTotal = (user.totalTraces || 0) + parseInt(tracesAmount);
          await storage.updateUser(parseInt(userId), { totalTraces: newTotal });

          // Create bonus history entry
          await storage.createBonusHistory({
            userId: parseInt(userId),
            title: title,
            traces: parseInt(tracesAmount),
            type: "admin_assignment",
            assignedById: parseInt(adminId),
            reason: reason
          });

          // Create notification for each user
          await storage.createNotification({
            userId: parseInt(userId),
            title: "Trazos Asignados",
            content: `Se te han asignado ${tracesAmount} trazos. Motivo: ${reason}`,
            type: "trace_assignment"
          });
        }

        }

      // Create public announcement about trace assignment
      const userNames = [];
      for (const userId of selectedUsers) {
        const user = await storage.getUser(parseInt(userId));
        if (user) {
          userNames.push(user.signature);
        }
      }

      const announcementTitle = "Asignación de Trazos";
      const announcementContent = `Se han asignado ${tracesAmount} trazos a: ${userNames.join(", ")}.\n\nMotivo: ${reason}`;

      await storage.createAnnouncement({
        title: announcementTitle,
        content: announcementContent,
        authorId: parseInt(adminId),
      });

      res.json({ success: true, assignment });
    } catch (error: any) {
      console.error("Error assigning traces:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin activity management - Edit activity
  app.put("/api/admin/activities/:id", async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const { adminId, ...activityData } = req.body;

      if (!adminId) {
        return res.status(400).json({ message: "ID de administrador requerido" });
      }

      // Verify admin permissions - check both role and special signature
      const admin = await storage.getUser(parseInt(adminId));
      if (!admin || (admin.role !== "admin" && admin.signature !== "#INELUDIBLE")) {
        return res.status(403).json({ message: "No tienes permisos de administrador" });
      }

      // Get the activity to know which user to update stats for
      const activity = await storage.getActivity(activityId);
      if (!activity) {
        return res.status(404).json({ message: "Actividad no encontrada" });
      }

      // Calculate new traces
      const traces = calculateTraces(activityData.type, parseInt(activityData.wordCount) || 0, activityData.responses ? parseInt(activityData.responses) : undefined);

      // Clean and validate the activity data
      const cleanData = {
        name: activityData.name?.trim(),
        date: activityData.date ? new Date(activityData.date) : activity.date,
        word_count: parseInt(activityData.wordCount) || activity.word_count,
        type: activityData.type,
        responses: activityData.responses ? parseInt(activityData.responses) : activity.responses,
        link: activityData.link?.trim() || activity.link,
        image_url: activityData.imageUrl?.trim() || activity.image_url,
        description: activityData.description?.trim(),
        arista: activityData.arista,
        album: activityData.album,
      };

      // Update the activity
      const updatedActivity = await storage.updateActivity(activityId, {
        ...cleanData,
        traces,
      });

      // Update user stats
      await storage.updateUserStats(activity.userId);

      res.json({ activity: updatedActivity, success: true });
    } catch (error: any) {
      console.error("Error updating activity (admin):", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin activity management - Delete activity
  app.delete("/api/admin/activities/:id", async (req, res) => {
    try {
      const activityId = parseInt(req.params.id);
      const { adminId } = req.body;

      if (!adminId) {
        return res.status(400).json({ message: "ID de administrador requerido" });
      }

      // Verify admin permissions - check both role and special signature
      const admin = await storage.getUser(parseInt(adminId));
      if (!admin || (admin.role !== "admin" && admin.signature !== "#INELUDIBLE")) {
        return res.status(403).json({ message: "No tienes permisos de administrador" });
      }

      // Get the activity to know which user to update stats for
      const activity = await storage.getActivity(activityId);
      if (!activity) {
        return res.status(404).json({ message: "Actividad no encontrada" });
      }

      // Delete the activity (admin can delete any activity)
      await storage.adminDeleteActivity(activityId);

      // Update user stats
      await storage.updateUserStats(activity.userId);

      res.json({ success: true });
    } catch (error: any) {
      console.error("Error deleting activity (admin):", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin endpoint to remove users below minimum traces threshold
  app.post("/api/admin/remove-inactive-users", async (req, res) => {
    try {
      const { adminId, minimumTraces = 1000 } = req.body;

      if (!adminId) {
        return res.status(400).json({ message: "ID de administrador requerido" });
      }

      // Verify admin permissions - check both role and special signature
      const admin = await storage.getUser(parseInt(adminId));
      if (!admin || (admin.role !== "admin" && admin.signature !== "#INELUDIBLE")) {
        return res.status(403).json({ message: "No tienes permisos de administrador" });
      }

      // Get users below minimum traces threshold (excluding admins)
      const inactiveUsers = await db
        .select({
          id: users.id,
          fullName: users.fullName,
          signature: users.signature,
          totalTraces: users.totalTraces,
        })
        .from(users)
        .where(and(
          lt(users.totalTraces, minimumTraces),
          ne(users.role, "admin")
        ));

      if (inactiveUsers.length === 0) {
        return res.json({ 
          success: true, 
          message: "No hay usuarios por debajo del mínimo de trazos",
          removedCount: 0,
          users: []
        });
      }

      // Remove inactive users
      const userIds = inactiveUsers.map(user => user.id);
      await db.delete(users).where(inArray(users.id, userIds));

      res.json({ 
        success: true, 
        message: `Se eliminaron ${inactiveUsers.length} usuarios por no alcanzar el mínimo de ${minimumTraces} trazos`,
        removedCount: inactiveUsers.length,
        users: inactiveUsers
      });
    } catch (error: any) {
      console.error("Error removing inactive users:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get current user count (for admin dashboard)
  app.get("/api/admin/user-count", async (req, res) => {
    try {
      const totalUsers = await db.select({ count: count() }).from(users);
      const userCount = totalUsers[0]?.count || 0;

      res.json({ 
        totalUsers: userCount,
        availableSlots: Math.max(0, 70 - userCount),
        maxUsers: 70
      });
    } catch (error: any) {
      console.error("Error getting user count:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Refresh all users statistics
  app.post("/api/admin/refresh-all-stats", async (req, res) => {
    try {
      const { adminId } = req.body;

      if (!adminId) {
        return res.status(400).json({ message: "ID de administrador requerido" });
      }

      // Verify admin permissions - check both role and special signature
      const admin = await storage.getUser(parseInt(adminId));
      if (!admin || (admin.role !== "admin" && admin.signature !== "#INELUDIBLE")) {
        return res.status(403).json({ message: "No tienes permisos de administrador" });
      }

      // Get all users
      const allUsers = await db.select({ id: users.id }).from(users);
      let updatedUsers = 0;

      console.log(`Starting bulk stats refresh for ${allUsers.length} users`);

      // Update stats for each user
      for (const user of allUsers) {
        try {
          await storage.updateUserStats(user.id);
          updatedUsers++;
          console.log(`Updated stats for user ${user.id} (${updatedUsers}/${allUsers.length})`);
        } catch (error) {
          console.error(`Error updating stats for user ${user.id}:`, error);
        }
      }

      console.log(`Bulk stats refresh completed: ${updatedUsers}/${allUsers.length} users updated`);

      res.json({ 
        success: true, 
        message: `Estadísticas actualizadas para ${updatedUsers} de ${allUsers.length} usuarios`,
        updatedUsers,
        totalUsers: allUsers.length
      });
    } catch (error: any) {
      console.error("Error refreshing all user stats:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Support tickets routes
  app.post("/api/support/tickets", async (req, res) => {
    try {
      const ticketData = req.body;

      const newTicket = await db.insert(supportTickets).values({
        type: ticketData.type,
        subject: ticketData.subject,
        description: ticketData.description,
        email: ticketData.email || null,
        isAnonymous: ticketData.isAnonymous || false,
        status: "pending",
      }).returning();

      // Notificar a todos los administradores sobre el nuevo ticket
      await PushNotificationService.sendNotificationToAdmins({
        title: "Nuevo Ticket de Soporte",
        body: `Nuevo ${ticketData.type}: ${ticketData.subject}`,
        type: "support_ticket",
        url: "/admin"
      });

      res.json({ success: true, ticket: newTicket[0] });
    } catch (error: any) {
      console.error("Error creating support ticket:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Get all support tickets (admin only)
  app.get("/api/admin/support/tickets", async (req, res) => {
    try {
      const { adminId } = req.query;

      if (!adminId) {
        return res.status(400).json({ message: "ID de administrador requerido" });
      }

      // Verify admin permissions
      const admin = await storage.getUser(parseInt(adminId as string));
      if (!admin || (admin.role !== "admin" && admin.signature !== "#INELUDIBLE")) {
        return res.status(403).json({ message: "No tienes permisos de administrador" });
      }

      const tickets = await db
        .select()
        .from(supportTickets)
        .orderBy(desc(supportTickets.createdAt));

      res.json(tickets);
    } catch (error: any) {
      console.error("Error fetching support tickets:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Update support ticket (admin only)
  app.put("/api/admin/support/tickets/:id", async (req, res) => {
    try {
      const ticketId = parseInt(req.params.id);
      const { adminId, status, adminResponse } = req.body;

      if (!adminId) {
        return res.status(400).json({ message: "ID de administrador requerido" });
      }

      // Verify admin permissions
      const admin = await storage.getUser(parseInt(adminId));
      if (!admin || (admin.role !== "admin" && admin.signature !== "#INELUDIBLE")) {
        return res.status(403).json({ message: "No tienes permisos de administrador" });
      }

      const updateData: any = { status };
      if (adminResponse) {
        updateData.adminResponse = adminResponse;
      }
      if (status === "resolved") {
        updateData.resolvedAt = new Date();
      }

      const [updatedTicket] = await db
        .update(supportTickets)
        .set(updateData)
        .where(eq(supportTickets.id, ticketId))
        .returning();

      res.json({ success: true, ticket: updatedTicket });
    } catch (error: any) {
      console.error("Error updating support ticket:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Clean duplicate bonuses endpoint
  app.post("/api/admin/clean-duplicate-bonuses", async (req, res) => {
    try {
      const { adminId } = req.body;

      if (!adminId) {
        return res.status(400).json({ message: "ID de administrador requerido" });
      }

      // Verify admin permissions - check both role and special signature
      const admin = await storage.getUser(parseInt(adminId));
      if (!admin || (admin.role !== "admin" && admin.signature !== "#INELUDIBLE")) {
        return res.status(403).json({ message: "No tienes permisos de administrador" });
      }

      // Execute cleanup query
      await db.execute(sql`
        WITH ranked_bonuses AS (
          SELECT 
            id,
            user_id,
            ROW_NUMBER() OVER (PARTITION BY user_id, type ORDER BY created_at ASC) as rn
          FROM bonus_history 
          WHERE type = 'registration'
        )
        DELETE FROM bonus_history 
        WHERE id IN (
          SELECT id FROM ranked_bonuses WHERE rn > 1
        )
      `);

      // Get remaining count
      const remainingBonuses = await db.execute(sql`
        SELECT user_id, COUNT(*) as bonus_count 
        FROM bonus_history 
        WHERE type = 'registration' 
        GROUP BY user_id 
        ORDER BY user_id
      `);

      // Refresh all user stats after cleanup
      const allUsers = await db.select({ id: users.id }).from(users);
      for (const user of allUsers) {
        try {
          await storage.updateUserStats(user.id);
        } catch (error) {
          console.error(`Error updating stats for user ${user.id}:`, error);
        }
      }

      res.json({ 
        success: true, 
        message: "Bonus duplicados eliminados y estadísticas actualizadas",
        remainingBonuses: remainingBonuses.rows
      });
    } catch (error: any) {
      console.error("Error cleaning duplicate bonuses:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Calendar events routes
  app.get("/api/calendar-events", async (req, res) => {
    try {
      const events = await storage.getAllCalendarEvents();
      res.json(events);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/calendar-events", async (req, res) => {
    try {
      // Assuming insertCalendarEventSchema is defined in @shared/schema
      const eventData = req.body; //insertCalendarEventSchema.parse(req.body);
      const event = await storage.createCalendarEvent(eventData);
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/calendar-events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const eventData = req.body;
      const event = await storage.updateCalendarEvent(id, eventData);
      res.json(event);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/calendar-events/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCalendarEvent(id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Auto-publish scheduled events
  app.post("/api/calendar-events/auto-publish", async (req, res) => {
    try {
      const publishedCount = await storage.autoPublishScheduledEvents();
      res.json({ publishedCount });
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Support tickets routes
  app.get("/api/support/tickets", async (req, res) => {
    try {
      const tickets = await storage.getAllSupportTickets();
      res.json(tickets);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}