import {
  users,
  activities,
  news,
  announcements,
  plannedActivities,
  notifications,
  type User,
  type InsertUser,
  type Activity,
  type InsertActivity,
  type News,
  type InsertNews,
  type Announcement,
  type InsertAnnouncement,
  type PlannedActivity,
  type InsertPlannedActivity,
  type Notification,
  type InsertNotification,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql, and } from "drizzle-orm";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserBySignature(signature: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, updates: Partial<User>): Promise<User>;
  getAllUsers(): Promise<User[]>;
  getUserRankings(): Promise<User[]>;

  // Activity operations
  createActivity(activity: InsertActivity & { userId: number; traces: number }): Promise<Activity>;
  getUserActivities(userId: number, limit?: number): Promise<Activity[]>;
  getAllActivities(): Promise<Array<Activity & { user: User }>>;
  updateUserStats(userId: number): Promise<void>;
  updateActivity(activityId: number, updates: Partial<Activity>): Promise<Activity>;
  deleteActivity(activityId: number, userId: number): Promise<boolean>;

  // News operations
  createNews(news: InsertNews & { authorId: number }): Promise<News>;
  getAllNews(): Promise<Array<News & { author: User }>>;

  // Announcement operations
  createAnnouncement(announcement: InsertAnnouncement & { authorId: number }): Promise<Announcement>;
  getAllAnnouncements(): Promise<Array<Announcement & { author: User }>>;

  // Planned activity operations
  createPlannedActivity(activity: InsertPlannedActivity & { authorId: number }): Promise<PlannedActivity>;
  getAllPlannedActivities(): Promise<Array<PlannedActivity & { author: User }>>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<void>;
  createNotificationForAllUsers(title: string, message: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserBySignature(signature: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.signature, signature));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    // Set admin role for #INELUDIBLE signature
    const userData = {
      ...insertUser,
      role: insertUser.signature === "#INELUDIBLE" ? "admin" : "user",
    };

    const [user] = await db.insert(users).values(userData).returning();

    // Create welcome notification
    await this.createNotification({
      userId: user.id,
      title: "¡Bienvenido a Introspens/arte!",
      message: "Te has registrado exitosamente en nuestra comunidad artística.",
    });

    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.totalTraces));
  }

  async getUserRankings(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.totalTraces));
  }

  async createActivity(activityData: InsertActivity & { userId: number; traces: number }): Promise<Activity> {
    const [activity] = await db.insert(activities).values(activityData).returning();

    // Update user stats
    await this.updateUserStats(activityData.userId);

    return activity;
  }

  async getUserActivities(userId: number, limit?: number): Promise<Activity[]> {
    const query = db
      .select({
        id: activities.id,
        name: activities.name,
        date: activities.date,
        word_count: activities.word_count,
        type: activities.type,
        responses: activities.responses,
        link: activities.link,
        image_path: activities.image_path,
        description: activities.description,
        arista: activities.arista,
        album: activities.album,
        traces: activities.traces,
        createdAt: activities.createdAt,
        userId: activities.userId,
      })
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt));

    if (limit) {
      query.limit(limit);
    }

    const userActivities = await query;

    return userActivities.map(activity => ({
      ...activity,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
    }));
  }

  async getAllActivities(): Promise<Array<Activity & { user: User }>> {
    const result = await db
      .select({
        id: activities.id,
        userId: activities.userId,
        name: activities.name,
        date: activities.date,
        word_count: activities.word_count,
        type: activities.type,
        responses: activities.responses,
        link: activities.link,
        image_path: activities.image_path,
        description: activities.description,
        arista: activities.arista,
        album: activities.album,
        traces: activities.traces,
        createdAt: activities.createdAt,
        user: users,
      })
      .from(activities)
      .leftJoin(users, eq(activities.userId, users.id))
      .orderBy(desc(activities.createdAt));

    return result.map(item => ({
      ...item,
      likesCount: 0,
      commentsCount: 0,
      isLiked: false,
    }));
  }

  async updateUserStats(userId: number): Promise<void> {
    try {
      // Verify user exists first
      const user = await this.getUser(userId);
      if (!user) {
        console.warn(`User ${userId} not found, skipping stats update`);
        return;
      }

      // Get fresh data from database to ensure accuracy
      const userActivities = await db
        .select({
          id: activities.id,
          traces: activities.traces,
          word_count: activities.word_count,
        })
        .from(activities)
        .where(eq(activities.userId, userId));

      const totalTraces = userActivities.reduce((sum, activity) => sum + (activity.traces || 0), 0);
      const totalWords = userActivities.reduce((sum, activity) => sum + (activity.word_count || 0), 0);
      const totalActivities = userActivities.length;

      // Update user stats with current database values
      await db
        .update(users)
        .set({
          totalTraces,
          totalWords,
          totalActivities,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId));

      console.log(`Updated stats for user ${userId}: ${totalTraces} traces, ${totalWords} words, ${totalActivities} activities`);
    } catch (error) {
      console.error(`Error updating stats for user ${userId}:`, error);
      // Don't throw the error to prevent cascade failures
    }
  }

  async createNews(newsData: InsertNews & { authorId: number }): Promise<News> {
    const [newsItem] = await db.insert(news).values(newsData).returning();

    // Create notification for all users
    await this.createNotificationForAllUsers(
      "Nueva noticia disponible",
      `Se ha publicado: ${newsItem.title}`
    );

    return newsItem;
  }

  async getAllNews(): Promise<Array<News & { author: User }>> {
    return await db
      .select({
        id: news.id,
        title: news.title,
        content: news.content,
        authorId: news.authorId,
        createdAt: news.createdAt,
        author: users,
      })
      .from(news)
      .leftJoin(users, eq(news.authorId, users.id))
      .orderBy(desc(news.createdAt));
  }

  async createAnnouncement(announcementData: InsertAnnouncement & { authorId: number }): Promise<Announcement> {
    const [announcement] = await db.insert(announcements).values(announcementData).returning();

    // Create notification for all users
    await this.createNotificationForAllUsers(
      "Nuevo aviso",
      `Se ha publicado: ${announcement.title}`
    );

    return announcement;
  }

  async getAllAnnouncements(): Promise<Array<Announcement & { author: User }>> {
    return await db
      .select({
        id: announcements.id,
        title: announcements.title,
        content: announcements.content,
        authorId: announcements.authorId,
        createdAt: announcements.createdAt,
        author: users,
      })
      .from(announcements)
      .leftJoin(users, eq(announcements.authorId, users.id))
      .orderBy(desc(announcements.createdAt));
  }

  async createPlannedActivity(activityData: InsertPlannedActivity & { authorId: number }): Promise<PlannedActivity> {
    const [activity] = await db.insert(plannedActivities).values(activityData).returning();

    // Create notification for all users
    await this.createNotificationForAllUsers(
      "Nueva actividad disponible",
      `Se ha agregado: ${activity.title}`
    );

    return activity;
  }

  async getAllPlannedActivities(): Promise<Array<PlannedActivity & { author: User }>> {
    return await db
      .select({
        id: plannedActivities.id,
        title: plannedActivities.title,
        description: plannedActivities.description,
        arista: plannedActivities.arista,
        album: plannedActivities.album,
        authorId: plannedActivities.authorId,
        createdAt: plannedActivities.createdAt,
        author: users,
      })
      .from(plannedActivities)
      .leftJoin(users, eq(plannedActivities.authorId, users.id))
      .orderBy(desc(plannedActivities.createdAt));
  }

  async createNotification(notificationData: InsertNotification): Promise<Notification> {
    const [notification] = await db.insert(notifications).values(notificationData).returning();
    return notification;
  }

  async getUserNotifications(userId: number): Promise<Notification[]> {
    return await db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async markNotificationAsRead(id: number): Promise<void> {
    await db.update(notifications).set({ read: true }).where(eq(notifications.id, id));
  }

  async createNotificationForAllUsers(title: string, message: string): Promise<void> {
    const allUsers = await this.getAllUsers();

    const notificationData = allUsers.map(user => ({
      userId: user.id,
      title,
      message,
    }));

    await db.insert(notifications).values(notificationData);
  }

  // Like operations
  async toggleLike(activityId: number, userId: number): Promise<{ liked: boolean; likesCount: number }> {
    // Check if like already exists
    const existingLike = await db.query.likes?.findFirst({
      where: (likes, { and, eq }) => and(
        eq(likes.activityId, activityId),
        eq(likes.userId, userId)
      )
    });

    if (existingLike) {
      // Remove like
      await db.delete(likes).where(
        sql`activity_id = ${activityId} AND user_id = ${userId}`
      );
      const likesCount = await this.getLikesCount(activityId);
      return { liked: false, likesCount };
    } else {
      // Add like
      await db.execute(sql`
        INSERT INTO likes (user_id, activity_id, created_at) 
        VALUES (${userId}, ${activityId}, NOW())
      `);
      const likesCount = await this.getLikesCount(activityId);
      return { liked: true, likesCount };
    }
  }

  async getLikesCount(activityId: number): Promise<number> {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count FROM likes WHERE activity_id = ${activityId}
    `);
    return Number(result.rows[0]?.count || 0);
  }

  async isLikedByUser(activityId: number, userId: number): Promise<boolean> {
    const result = await db.execute(sql`
      SELECT 1 FROM likes WHERE activity_id = ${activityId} AND user_id = ${userId} LIMIT 1
    `);
    return result.rows.length > 0;
  }

  // Comment operations
  async createComment(commentData: { activityId: number; userId: number; content: string }): Promise<any> {
    const result = await db.execute(sql`
      INSERT INTO comments (user_id, activity_id, content, created_at) 
      VALUES (${commentData.userId}, ${commentData.activityId}, ${commentData.content}, NOW())
      RETURNING *
    `);
    return result.rows[0];
  }

  async getActivityComments(activityId: number): Promise<any[]> {
    const result = await db.execute(sql`
      SELECT c.*, u.full_name, u.signature 
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.activity_id = ${activityId}
      ORDER BY c.created_at ASC
    `);
    return result.rows;
  }

  async getCommentsCount(activityId: number): Promise<number> {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count FROM comments WHERE activity_id = ${activityId}
    `);
    return Number(result.rows[0]?.count || 0);
  }

  async updateActivity(activityId: number, updates: Partial<Activity>): Promise<Activity> {
    const [activity] = await db
      .update(activities)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(activities.id, activityId))
      .returning();
    return activity;
  }

  async deleteActivity(activityId: number, userId: number): Promise<boolean> {
    // First verify the activity belongs to the user
    const activity = await db
      .select()
      .from(activities)
      .where(and(eq(activities.id, activityId), eq(activities.userId, userId)))
      .limit(1);

    if (activity.length === 0) {
      throw new Error("Actividad no encontrada o no tienes permisos para eliminarla");
    }

    const deletedActivity = activity[0];

    // Delete the activity
    await db.delete(activities).where(eq(activities.id, activityId));

    // Update user statistics
    await db
      .update(users)
      .set({
        totalTraces: sql`${users.totalTraces} - ${deletedActivity.traces}`,
        totalWords: sql`${users.totalWords} - ${deletedActivity.word_count}`,
        totalActivities: sql`${users.totalActivities} - 1`,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId));

    // Update user rank based on new traces
    const updatedUser = await this.getUser(userId);
    if (updatedUser) {
      // Assuming calculateRank is defined somewhere, if not, remove the rank update logic
      // const newRank = this.calculateRank(updatedUser.totalTraces || 0);
      // await db
      //   .update(users)
      //   .set({ rank: newRank })
      //   .where(eq(users.id, userId));
    }

    return true;
  }

  async createNotification(data: {
    userId: number;
    title: string;
    message: string;
    type?: string;
  }): Promise<any> {
    const [notification] = await db
      .insert(notifications)
      .values({
        userId: data.userId,
        title: data.title,
        message: data.message,
        type: data.type || 'general',
        createdAt: new Date(),
        read: false
      })
      .returning();

    return notification;
  }

  async getAdminUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'));
  }

  async getAllUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users);
  }

  async getActivity(activityId: number): Promise<Activity | null> {
    try {
      const [activity] = await db.select().from(activities).where(eq(activities.id, activityId));

      if (!activity) {
        return null;
      }

      return activity;
    } catch (error) {
      console.error("Error getting activity:", error);
      return null;
    }
  }
}

export const storage = new DatabaseStorage();