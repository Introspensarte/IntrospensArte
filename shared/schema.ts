import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  age: integer("age").notNull(),
  birthday: date("birthday").notNull(),
  faceClaim: text("face_claim").notNull(),
  signature: text("signature").notNull().unique(),
  motivation: text("motivation").notNull(),
  facebookLink: text("facebook_link"),
  role: text("role").notNull().default("user"), // user, admin
  rank: text("rank").default("Alma en tránsito"),
  medal: text("medal").default("Bronce"),
  totalTraces: integer("total_traces").default(0),
  totalWords: integer("total_words").default(0),
  totalActivities: integer("total_activities").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Activities table
export const activities = pgTable("activities", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  date: timestamp("date").notNull(),
  word_count: integer("word_count").notNull(),
  type: text("type").notNull(), // narrativa, microcuento, drabble, hilo, rol, otro
  responses: integer("responses"),
  link: text("link"),
  image_url: text("image_url"), // URL de la imagen externa
  description: text("description"),
  arista: text("arista").notNull(),
  album: text("album").notNull(),
  traces: integer("traces").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// News table
export const news = pgTable("news", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Announcements table
export const announcements = pgTable("announcements", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  authorId: integer("author_id").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Planned activities table
export const plannedActivities = pgTable("planned_activities", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  arista: text("arista").notNull(),
  album: text("album").notNull(),
  authorId: integer("author_id").notNull().references(() => users.id),
  deadline: timestamp("deadline"),
  facebookLink: text("facebook_link"),
  createdAt: timestamp("created_at").defaultNow(),
  activityCode: text("activity_code"),
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").default("general").notNull(),
  read: boolean("read").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Bonus history table
export const bonusHistory = pgTable("bonus_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  traces: integer("traces").notNull(),
  type: text("type").notNull(), // 'registration', 'birthday', 'admin_assignment', etc.
  assignedById: integer("assigned_by_id").references(() => users.id),
  reason: text("reason"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Support tickets table
export const supportTickets = pgTable("support_tickets", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // 'reclamo', 'sugerencia', 'problema', 'contacto'
  subject: text("subject").notNull(),
  description: text("description").notNull(),
  email: text("email"),
  isAnonymous: boolean("is_anonymous").default(false).notNull(),
  status: text("status").default("pending").notNull(), // 'pending', 'in_progress', 'resolved', 'closed'
  adminResponse: text("admin_response"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Calendar events table
export const calendarEvents = pgTable("calendar_events", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // 'news', 'announcement', 'activity'
  scheduledDate: timestamp("scheduled_date").notNull(),
  publishedDate: timestamp("published_date"),
  status: text("status").default("draft").notNull(), // 'draft', 'scheduled', 'published', 'archived'
  visibility: boolean("visibility").default(true).notNull(),
  authorId: integer("author_id").references(() => users.id).notNull(),

  // Campos específicos para actividades
  arista: text("arista"),
  album: text("album"),
  deadline: timestamp("deadline"),
  facebookLink: text("facebook_link"),
  description: text("description"),

  // Metadatos
  autoPublished: boolean("auto_published").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  activities: many(activities),
  news: many(news),
  announcements: many(announcements),
  plannedActivities: many(plannedActivities),
  notifications: many(notifications),
  bonusHistory: many(bonusHistory),
  calendarEvents: many(calendarEvents),
}));

export const activitiesRelations = relations(activities, ({ one }) => ({
  user: one(users, {
    fields: [activities.userId],
    references: [users.id],
  }),
}));

export const newsRelations = relations(news, ({ one }) => ({
  author: one(users, {
    fields: [news.authorId],
    references: [users.id],
  }),
}));

export const announcementsRelations = relations(announcements, ({ one }) => ({
  author: one(users, {
    fields: [announcements.authorId],
    references: [users.id],
  }),
}));

export const plannedActivitiesRelations = relations(plannedActivities, ({ one }) => ({
  author: one(users, {
    fields: [plannedActivities.authorId],
    references: [users.id],
  }),
}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const bonusHistoryRelations = relations(bonusHistory, ({ one }) => ({
  user: one(users, {
    fields: [bonusHistory.userId],
    references: [users.id],
  }),
  assignedBy: one(users, {
    fields: [bonusHistory.assignedById],
    references: [users.id],
  }),
}));

export const supportTicketsRelations = relations(supportTickets, ({ }) => ({}));

export const calendarEventsRelations = relations(calendarEvents, ({ one }) => ({
  author: one(users, {
    fields: [calendarEvents.authorId],
    references: [users.id],
  }),
}));

// Insert schemas with proper validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  totalTraces: true,
  totalWords: true,
  totalActivities: true,
  createdAt: true,
  updatedAt: true,
});

export const insertActivitySchema = z.object({
  name: z.string().min(1, "El nombre es requerido"),
  date: z.union([z.string(), z.date()]).transform((val) => {
    if (typeof val === 'string') {
      // Handle YYYY-MM-DD format
      const date = new Date(val + 'T00:00:00.000Z');
      if (isNaN(date.getTime())) {
        throw new Error("Fecha inválida");
      }
      return date;
    }
    return val;
  }),
  word_count: z.number().min(1, "Debe tener al menos 1 palabra"),
  type: z.enum(['narrativa', 'microcuento', 'drabble', 'hilo', 'rol', 'otro']),
  responses: z.number().optional().nullable(),
  link: z.string().url("Debe ser una URL válida").optional().or(z.literal("")).or(z.undefined()),
  image_url: z.string().url("Debe ser una URL válida de imagen").min(1, "La URL de imagen es requerida"),
  description: z.string().min(1, "La descripción es requerida"),
  arista: z.string().min(1, "La arista es requerida"),
  album: z.string().min(1, "El álbum es requerido"),
});

export const insertNewsSchema = createInsertSchema(news).omit({
  id: true,
  authorId: true,
  createdAt: true,
});

export const insertAnnouncementSchema = createInsertSchema(announcements).omit({
  id: true,
  authorId: true,
  createdAt: true,
});

export const insertPlannedActivitySchema = createInsertSchema(plannedActivities).omit({
  id: true,
  createdAt: true,
}).extend({
  deadline: z.string().optional().nullable().transform((val) => {
    if (!val || val === '') return null;
    const date = new Date(val);
    return isNaN(date.getTime()) ? null : date;
  }),
  facebookLink: z.string().url().optional().or(z.literal("")).or(z.undefined()),
  activityCode: z.string().optional(),
});

export const insertBonusHistorySchema = createInsertSchema(bonusHistory).omit({
  id: true,
  createdAt: true,
});

export const insertSupportTicketSchema = createInsertSchema(supportTickets).omit({
  id: true,
  status: true,
  adminResponse: true,
  resolvedAt: true,
  createdAt: true,
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  publishedDate: true,
  autoPublished: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  scheduledDate: z.union([z.string(), z.date()]).transform((val) => {
    if (typeof val === 'string') {
      const date = new Date(val);
      if (isNaN(date.getTime())) {
        throw new Error("Fecha inválida");
      }
      return date;
    }
    return val;
  }),
  deadline: z.union([z.string(), z.date()]).optional().nullable().transform((val) => {
    if (!val || val === '') return null;
    if (typeof val === 'string') {
      const date = new Date(val);
      return isNaN(date.getTime()) ? null : date;
    }
    return val;
  }),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Activity = {
  id?: number;
  userId: number;
  name: string;
  date: Date;
  word_count: number;
  type: string;
  responses?: number | null;
  link?: string | null;
  image_url?: string | null;
  description: string;
  arista: string;
  album: string;
  traces: number;
  createdAt?: Date;
  likesCount?: number;
  commentsCount?: number;
  isLiked?: boolean;
};

export type Like = {
  id?: number;
  userId: number;
  activityId: number;
  createdAt?: Date;
};

export type Comment = {
  id?: number;
  userId: number;
  activityId: number;
  content: string;
  createdAt?: Date;
  user?: User;
};
export type News = typeof news.$inferSelect;
export type InsertNews = z.infer<typeof insertNewsSchema>;
export type Announcement = typeof announcements.$inferSelect;
export type InsertAnnouncement = z.infer<typeof insertAnnouncementSchema>;
export type PlannedActivity = typeof plannedActivities.$inferSelect;
export type InsertPlannedActivity = z.infer<typeof insertPlannedActivitySchema>;
export type InsertNotification = typeof notifications.$inferInsert;
export type Notification = typeof notifications.$inferSelect;

// Notification schema for validation
export const insertNotificationSchema = createInsertSchema(notifications);
export type BonusHistory = typeof bonusHistory.$inferSelect;
export type InsertBonusHistory = z.infer<typeof insertBonusHistorySchema>;
export type SupportTicket = typeof supportTickets.$inferSelect;
export type InsertSupportTicket = z.infer<typeof insertSupportTicketSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;