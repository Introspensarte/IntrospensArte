import {
  users,
  activities,
  news,
  announcements,
  plannedActivities,
  notifications,
  bonusHistory,
  type User,
  type Activity,
  type News,
  type Announcement,
  type PlannedActivity,
  type Notification,
  type BonusHistory,
  type InsertUser,
  type InsertActivity,
  type InsertNews,
  type InsertAnnouncement,
  type InsertPlannedActivity,
  type InsertNotification,
  type InsertBonusHistory,
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
  updateNews(id: number, updates: Partial<News>): Promise<News>;
  deleteNews(id: number): Promise<void>;

  // Announcement operations
  createAnnouncement(announcement: InsertAnnouncement & { authorId: number }): Promise<Announcement>;
  getAllAnnouncements(): Promise<Array<Announcement & { author: User }>>;
  updateAnnouncement(id: number, updates: Partial<Announcement>): Promise<Announcement>;
  deleteAnnouncement(id: number): Promise<void>;

  // Planned activity operations
  createPlannedActivity(activity: InsertPlannedActivity & { authorId: number }): Promise<PlannedActivity>;
  getAllPlannedActivities(): Promise<Array<PlannedActivity & { author: User }>>;

  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  getUserNotifications(userId: number): Promise<Notification[]>;
  markNotificationAsRead(id: number): Promise<void>;
  createNotificationForAllUsers(title: string, message: string): Promise<void>;

  // Bonus History operations
  createBonusHistory(data: InsertBonusHistory): Promise<BonusHistory>;
  getUserBonusHistory(userId: number): Promise<BonusHistory[]>;
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
      totalTraces: 50, // Give 50 initial traces upon registration
    };

    const [user] = await db.insert(users).values(userData).returning();

    // Create registration bonus history entry
    try {
      await this.createBonusHistory({
        userId: user.id,
        title: "Bonus de Registro",
        traces: 50,
        type: "registration",
        reason: "Bonificación por crear una cuenta en Introspens/arte"
      });
      console.log(`Created registration bonus for user ${user.id}`);
    } catch (error) {
      console.error("Error creating registration bonus:", error);
    }

    // Create welcome notification
    await this.createNotification({
      userId: user.id,
      title: "¡Bienvenido a Introspens/arte!",
      message: "Te has registrado exitosamente en nuestra comunidad artística.",
    });

    return user;
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User> {
    // Limpiar valor de medalla si es "none"
    const cleanUpdates = { ...updates };
    if (cleanUpdates.medal === "none") {
      cleanUpdates.medal = null;
    }

    // Asignar medalla automáticamente según el rango
    if (cleanUpdates.rank) {
      switch (cleanUpdates.rank) {
        case "Alma en tránsito":
          cleanUpdates.medal = null;
          break;
        case "Voz en boceto":
          cleanUpdates.medal = "Susurros que germinan";
          break;
        case "Narrador de atmósferas":
          cleanUpdates.medal = "Excelente narrador";
          break;
        case "Escritor de introspecciones":
          cleanUpdates.medal = "Lector de huellas";
          break;
        case "Arquitecto del alma":
          cleanUpdates.medal = "Arquitecto de personajes";
          break;
      }
    }

    const [updatedUser] = await db
      .update(users)
      .set(cleanUpdates)
      .where(eq(users.id, id))
      .returning();

    return updatedUser;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.totalTraces));
  }

  async getUserRankings(): Promise<User[]> {
    return await db.select().from(users).orderBy(desc(users.totalTraces));
  }

  async createActivity(activityData: InsertActivity & { userId: number; traces: number }): Promise<Activity> {
    const [activity] = await db.insert(activities).values(activityData).returning();

    // Update user stats and get updated user data
    await this.updateUserStats(activityData.userId);

    return activity;
  }

  async getUserActivities(userId: number, limit?: number): Promise<Activity[]> {
    let query = db
      .select({
        id: activities.id,
        userId: activities.userId,
        name: activities.name,
        date: activities.date,
        word_count: activities.word_count,
        type: activities.type,
        responses: activities.responses,
        link: activities.link,
        image_url: activities.image_url,
        description: activities.description,
        arista: activities.arista,
        album: activities.album,
        traces: activities.traces,
        createdAt: activities.createdAt,
      })
      .from(activities)
      .where(eq(activities.userId, userId))
      .orderBy(desc(activities.createdAt));

    if (limit) {
      query = query.limit(limit);
    }

    const result = await query;
    return result.map(activity => ({
      ...activity,
      wordCount: activity.word_count, // Ensure compatibility
      imageUrl: activity.image_url, // Ensure image_url mapping
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
        image_url: activities.image_url,
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
      wordCount: item.word_count, // Ensure compatibility
      imageUrl: item.image_url, // Ensure image_url mapping
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

      // Sum up the traces and words from activities
      const activityTraces = userActivities.reduce((sum, activity) => sum + (activity.traces || 0), 0);
      const totalWords = userActivities.reduce((sum, activity) => sum + (activity.word_count || 0), 0);
      const totalActivities = userActivities.length;

      // Add initial 50 traces to activity traces (given at registration)
      const totalTraces = activityTraces + 50;

      // Don't automatically update rank - only admins can change ranks
      // Update user stats with current database values (keeping existing rank)
      const [updatedUser] = await db
        .update(users)
        .set({
          totalTraces,
          totalWords,
          totalActivities,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userId))
        .returning();

      console.log(`Updated stats for user ${userId}: ${totalTraces} traces (${activityTraces} from activities + 50 initial), ${totalWords} words, ${totalActivities} activities, rank: ${rank}`);
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

  async updateNews(id: number, updates: Partial<News>): Promise<News> {
    const [updatedNews] = await db
      .update(news)
      .set(updates)
      .where(eq(news.id, id))
      .returning();
    return updatedNews;
  }

  async deleteNews(id: number): Promise<void> {
    await db.delete(news).where(eq(news.id, id));
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

  async updateAnnouncement(id: number, updates: Partial<Announcement>): Promise<Announcement> {
    const [updatedAnnouncement] = await db
      .update(announcements)
      .set(updates)
      .where(eq(announcements.id, id))
      .returning();
    return updatedAnnouncement;
  }

  async deleteAnnouncement(id: number): Promise<void> {
    await db.delete(announcements).where(eq(announcements.id, id));
  }

  async getNewsViewers(newsId: number): Promise<Array<{ user: User; viewedAt: string }>> {
    return await db
      .select({
        user: users,
        viewedAt: sql<string>`to_char(${notifications.createdAt}, 'YYYY-MM-DD HH24:MI:SS')`,
      })
      .from(notifications)
      .innerJoin(users, eq(notifications.userId, users.id))
      .where(
        and(
          eq(notifications.type, "news_view"),
          sql`${notifications.content} LIKE '%newsId:${newsId}%'`
        )
      )
      .orderBy(desc(notifications.createdAt));
  }

  async getAnnouncementViewers(announcementId: number): Promise<Array<{ user: User; viewedAt: string }>> {
    return await db
      .select({
        user: users,
        viewedAt: sql<string>`to_char(${notifications.createdAt}, 'YYYY-MM-DD HH24:MI:SS')`,
      })
      .from(notifications)
      .innerJoin(users, eq(notifications.userId, users.id))
      .where(
        and(
          eq(notifications.type, "announcement_view"),
          sql`${notifications.content} LIKE '%announcementId:${announcementId}%'`
        )
      )
      .orderBy(desc(notifications.createdAt));
  }

  async createPlannedActivity(activityData: InsertPlannedActivity & { authorId: number }): Promise<PlannedActivity> {
    // Convert deadline string to Date if provided
    const processedData = {
      ...activityData,
      deadline: activityData.deadline ? new Date(activityData.deadline) : null
    };

    const [activity] = await db.insert(plannedActivities).values(processedData).returning();

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
        deadline: plannedActivities.deadline,
        facebookLink: plannedActivities.facebookLink,
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
    return result.rows.map(row => ({
      id: row.id,
      content: row.content,
      createdAt: row.created_at,
      user: {
        fullName: row.full_name,
        signature: row.signature
      }
    }));
  }

  async getCommentsCount(activityId: number): Promise<number> {
    const result = await db.execute(sql`
      SELECT COUNT(*) as count FROM comments WHERE activity_id = ${activityId}
    `);
    return Number(result.rows[0]?.count || 0);
  }

  async updateActivity(activityId: number, updates: Partial<Activity>): Promise<Activity> {
    try {
      console.log(`Updating activity ${activityId} with:`, updates);

      // Get the original activity to know the user
      const originalActivity = await this.getActivity(activityId);
      if (!originalActivity) {
        throw new Error("Actividad no encontrada");
      }

      const [activity] = await db
        .update(activities)
        .set({ ...updates, updatedAt: new Date() })
        .where(eq(activities.id, activityId))
        .returning();

      if (!activity) {
        throw new Error("Error al actualizar la actividad");
      }

      console.log(`Activity ${activityId} updated successfully`);
      return activity;
    } catch (error) {
      console.error(`Error updating activity ${activityId}:`, error);
      throw error;
    }
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

  // Removed duplicate method - already exists above

  async getAdminUsers(): Promise<User[]> {
    return await db
      .select()
      .from(users)
      .where(eq(users.role, 'admin'));
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

  async createTraceAssignment(assignmentData: {
    title: string;
    date: Date;
    reason: string;
    tracesAmount: number;
    adminId: number;
    userIds: number[];
  }): Promise<any> {
    try {
      // Create the assignment record
      const [assignment] = await db.execute(sql`
        INSERT INTO trace_assignments (title, date, reason, traces_amount, admin_id, created_at)
        VALUES (${assignmentData.title}, ${assignmentData.date}, ${assignmentData.reason}, ${assignmentData.tracesAmount}, ${assignmentData.adminId}, NOW())
        RETURNING *
      `);

      const assignmentId = assignment.id;

      // Create user-assignment relationships
      for (const userId of assignmentData.userIds) {
        await db.execute(sql`
          INSERT INTO trace_assignment_users (assignment_id, user_id, created_at)
          VALUES (${assignmentId}, ${userId}, NOW())
        `);
      }

      return assignment;
    } catch (error) {
      console.error("Error creating trace assignment:", error);
      throw error;
    }
  }

  async adminDeleteActivity(activityId: number): Promise<boolean> {
    try {
      // Get the activity before deleting for stats update
      const activity = await this.getActivity(activityId);
      if (!activity) {
        throw new Error("Actividad no encontrada");
      }

      // Delete the activity (admin can delete any activity)
      await db.delete(activities).where(eq(activities.id, activityId));

      return true;
    } catch (error) {
      console.error("Error deleting activity (admin):", error);
      throw error;
    }
  }

  async updatePlannedActivity(id: number, updates: Partial<PlannedActivity>): Promise<PlannedActivity> {
    // Convert deadline string to Date if provided
    const processedUpdates = {
      ...updates,
      deadline: updates.deadline ? new Date(updates.deadline) : updates.deadline
    };

    const [updatedActivity] = await db
      .update(plannedActivities)
      .set(processedUpdates)
      .where(eq(plannedActivities.id, id))
      .returning();
    return updatedActivity;
  }

  async getExpiredExpressActivities(): Promise<PlannedActivity[]> {
    const now = new Date();
    return await db
      .select()
      .from(plannedActivities)
      .where(
        and(
          eq(plannedActivities.arista, "express"),
          eq(plannedActivities.album, "actividad-express"),
          sql`${plannedActivities.deadline} < ${now}`
        )
      );
  }

  async moveExpiredActivitiesToTardia(): Promise<void> {
    const now = new Date();
    await db
      .update(plannedActivities)
      .set({ album: "actividad-tardia" })
      .where(
        and(
          eq(plannedActivities.arista, "express"),
          eq(plannedActivities.album, "actividad-express"),
          sql`${plannedActivities.deadline} < ${now}`
        )
      );
  }

  async deletePlannedActivity(id: number): Promise<void> {
    await db.delete(plannedActivities).where(eq(plannedActivities.id, id));
  }

  // Bonus History methods
  async createBonusHistory(data: InsertBonusHistory): Promise<BonusHistory> {
    try {
      const [bonusHistoryItem] = await db
        .insert(bonusHistory)
        .values(data)
        .returning();
      return bonusHistoryItem;
    } catch (error) {
      console.error("Error creating bonus history:", error);
      throw error;
    }
  }

  async getUserBonusHistory(userId: number): Promise<BonusHistory[]> {
    try {
      const result = await db
        .select({
          id: bonusHistory.id,
          userId: bonusHistory.userId,
          title: bonusHistory.title,
          traces: bonusHistory.traces,
          type: bonusHistory.type,
          assignedById: bonusHistory.assignedById,
          reason: bonusHistory.reason,
          createdAt: bonusHistory.createdAt,
        })
        .from(bonusHistory)
        .where(eq(bonusHistory.userId, userId))
        .orderBy(desc(bonusHistory.createdAt));

      console.log(`Retrieved ${result.length} bonus history entries for user ${userId}`);
      return result;
    } catch (error) {
      console.error("Error getting user bonus history:", error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();