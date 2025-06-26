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
});

// Notifications table
export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
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

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  activities: many(activities),
  news: many(news),
  announcements: many(announcements),
  plannedActivities: many(plannedActivities),
  notifications: many(notifications),
  bonusHistory: many(bonusHistory),
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
  deadline: z.string().optional(),
  facebookLink: z.string().url().optional(),
});

export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
});

export const insertBonusHistorySchema = createInsertSchema(bonusHistory).omit({
  id: true,
  createdAt: true,
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
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type BonusHistory = typeof bonusHistory.$inferSelect;
export type InsertBonusHistory = z.infer<typeof insertBonusHistorySchema>;