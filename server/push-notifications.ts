
import { storage } from "./storage";

interface NotificationPayload {
  title: string;
  body: string;
  type: string;
  url?: string;
  actionUrl?: string;
  image?: string;
  icon?: string;
  badge?: string;
  requireInteraction?: boolean;
  silent?: boolean;
  vibrate?: number[];
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
}

interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class PushNotificationService {
  private static vapidKeys = {
    publicKey: process.env.VAPID_PUBLIC_KEY || 'BMqQzLr-e9_1odXF8nzVjAcVY-Hv6RpVz-e3QFGlKGD6VwCuA2yJ_3GG7vOkC3Mk4Ll0XN_-PzGnpX-L-Y8Y2Yw',
    privateKey: process.env.VAPID_PRIVATE_KEY || 'your-private-key-here'
  };

  static async sendNotificationToUser(userId: number, payload: NotificationPayload) {
    try {
      // Create notification in database
      await storage.createNotification({
        userId,
        title: payload.title,
        message: payload.body,
        type: payload.type || 'general'
      });

      // Get user's push subscriptions
      const subscriptions = await this.getUserPushSubscriptions(userId);

      if (subscriptions.length > 0) {
        // Send push notification to all user's devices
        const pushPromises = subscriptions.map(subscription => 
          this.sendPushNotification(subscription, payload)
        );

        await Promise.allSettled(pushPromises);
        console.log(`Push notifications sent to user ${userId}`);
      }

      return true;
    } catch (error) {
      console.error('Error sending push notification:', error);
      return false;
    }
  }

  static async sendNotificationToAdmins(payload: NotificationPayload) {
    try {
      const admins = await storage.getAdminUsers();
      
      const promises = admins.map(admin => 
        this.sendNotificationToUser(admin.id, payload)
      );
      
      await Promise.allSettled(promises);
      return true;
    } catch (error) {
      console.error('Error sending notification to admins:', error);
      return false;
    }
  }

  static async broadcastNotification(payload: NotificationPayload) {
    try {
      const users = await storage.getAllUsers();
      
      // Send in batches to avoid overwhelming the system
      const batchSize = 100;
      for (let i = 0; i < users.length; i += batchSize) {
        const batch = users.slice(i, i + batchSize);
        const promises = batch.map(user => 
          this.sendNotificationToUser(user.id, payload)
        );
        
        await Promise.allSettled(promises);
        
        // Small delay between batches
        if (i + batchSize < users.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
      
      console.log(`Broadcast notification sent to ${users.length} users`);
      return true;
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      return false;
    }
  }

  static async sendPushNotification(subscription: PushSubscription, payload: NotificationPayload) {
    try {
      // In a real implementation, you would use a library like web-push
      // For now, we'll simulate the push notification
      
      const pushPayload = JSON.stringify({
        title: payload.title,
        body: payload.body,
        icon: payload.icon || '/icon-192.png',
        badge: payload.badge || '/icon-192.png',
        image: payload.image,
        url: payload.url,
        actionUrl: payload.actionUrl,
        type: payload.type,
        requireInteraction: payload.requireInteraction ?? true,
        silent: payload.silent ?? false,
        vibrate: payload.vibrate || [200, 100, 200],
        actions: payload.actions || [
          {
            action: 'view',
            title: 'Ver',
            icon: '/icon-192.png'
          },
          {
            action: 'close',
            title: 'Cerrar',
            icon: '/icon-192.png'
          }
        ],
        data: {
          dateOfArrival: Date.now(),
          type: payload.type,
          url: payload.url || '/notifications'
        }
      });

      // TODO: Replace with actual web-push implementation
      console.log('Sending push notification:', {
        endpoint: subscription.endpoint,
        payload: pushPayload
      });

      return true;
    } catch (error) {
      console.error('Failed to send push notification:', error);
      return false;
    }
  }

  static async subscribeToPush(userId: number, subscription: PushSubscription) {
    try {
      // Store subscription in database
      await storage.storePushSubscription(userId, subscription);
      console.log(`Push subscription stored for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Failed to store push subscription:', error);
      return false;
    }
  }

  static async unsubscribeFromPush(userId: number, endpoint: string) {
    try {
      await storage.removePushSubscription(userId, endpoint);
      console.log(`Push subscription removed for user ${userId}`);
      return true;
    } catch (error) {
      console.error('Failed to remove push subscription:', error);
      return false;
    }
  }

  static async getUserPushSubscriptions(userId: number): Promise<PushSubscription[]> {
    try {
      return await storage.getUserPushSubscriptions(userId);
    } catch (error) {
      console.error('Failed to get user push subscriptions:', error);
      return [];
    }
  }

  static getVapidPublicKey(): string {
    return this.vapidKeys.publicKey;
  }

  // Send notification for new activity
  static async notifyNewActivity(activity: any, authorName: string) {
    const payload: NotificationPayload = {
      title: '🎨 Nueva Actividad Publicada',
      body: `${authorName} ha compartido "${activity.name}" en ${activity.arista}`,
      type: 'new_activity',
      icon: '/icon-192.png',
      image: activity.image,
      url: `/activities`,
      actionUrl: `/activities/${activity.id}`,
      requireInteraction: true,
      actions: [
        {
          action: 'view',
          title: 'Ver Actividad',
          icon: '/icon-192.png'
        },
        {
          action: 'close',
          title: 'Cerrar',
          icon: '/icon-192.png'
        }
      ]
    };

    await this.broadcastNotification(payload);
  }

  // Send notification for new comment/response
  static async notifyNewResponse(activityId: number, activityName: string, authorName: string, respondentName: string) {
    try {
      const activity = await storage.getActivityById(activityId);
      if (!activity) return;

      const payload: NotificationPayload = {
        title: '💬 Nueva Respuesta',
        body: `${respondentName} ha respondido a "${activityName}" de ${authorName}`,
        type: 'new_response',
        icon: '/icon-192.png',
        url: `/activities/${activityId}`,
        requireInteraction: true
      };

      // Notify activity author
      await this.sendNotificationToUser(activity.userId, payload);
    } catch (error) {
      console.error('Failed to send response notification:', error);
    }
  }

  // Send notification for ranking changes
  static async notifyRankingChange(userId: number, newRank: number, category: 'traces' | 'words') {
    const payload: NotificationPayload = {
      title: '🏆 ¡Nuevo Ranking!',
      body: `Has alcanzado el puesto #${newRank} en el ranking de ${category === 'traces' ? 'trazos' : 'palabras'}`,
      type: 'ranking_change',
      icon: '/icon-192.png',
      url: '/rankings',
      requireInteraction: true
    };

    await this.sendNotificationToUser(userId, payload);
  }

  // Send notification for news/announcements
  static async notifyNewsUpdate(title: string, preview: string) {
    const payload: NotificationPayload = {
      title: '📰 ' + title,
      body: preview.substring(0, 100) + (preview.length > 100 ? '...' : ''),
      type: 'news',
      icon: '/icon-192.png',
      url: '/news',
      requireInteraction: false
    };

    await this.broadcastNotification(payload);
  }

  static async notifyAnnouncementUpdate(title: string, preview: string) {
    const payload: NotificationPayload = {
      title: '📢 ' + title,
      body: preview.substring(0, 100) + (preview.length > 100 ? '...' : ''),
      type: 'announcement',
      icon: '/icon-192.png',
      url: '/announcements',
      requireInteraction: true
    };

    await this.broadcastNotification(payload);
  }

  // Send welcome notification for new users
  static async sendWelcomeNotification(userId: number, userName: string) {
    const payload: NotificationPayload = {
      title: '🎉 ¡Bienvenido a IntrospensArte!',
      body: `Hola ${userName}, explora las actividades y comparte tu arte con la comunidad`,
      type: 'welcome',
      icon: '/icon-192.png',
      url: '/portal',
      requireInteraction: true,
      actions: [
        {
          action: 'explore',
          title: 'Explorar',
          icon: '/icon-192.png'
        },
        {
          action: 'upload',
          title: 'Subir Actividad',
          icon: '/icon-192.png'
        }
      ]
    };

    // Delay welcome notification by 5 seconds
    setTimeout(async () => {
      await this.sendNotificationToUser(userId, payload);
    }, 5000);
  }

  // Send reminders for inactive users
  static async sendActivityReminder(userId: number) {
    const payload: NotificationPayload = {
      title: '✨ Te echamos de menos',
      body: 'Han pasado algunos días desde tu última actividad. ¡Comparte algo nuevo con la comunidad!',
      type: 'reminder',
      icon: '/icon-192.png',
      url: '/upload',
      requireInteraction: false
    };

    await this.sendNotificationToUser(userId, payload);
  }
}
