
export class PWAUtils {
  private static sw: ServiceWorker | null = null;

  // Initialize PWA features
  static async initialize() {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        console.log('Service Worker registered:', registration);
        
        // Get the active service worker
        this.sw = registration.active || registration.waiting || registration.installing;
        
        // Listen for service worker messages
        navigator.serviceWorker.addEventListener('message', this.handleSWMessage);
        
        // Request notification permission
        await this.requestNotificationPermission();
        
        // Setup periodic sync
        await this.setupPeriodicSync(registration);
        
        return registration;
      } catch (error) {
        console.error('Service Worker registration failed:', error);
        throw error;
      }
    }
    throw new Error('Service Workers not supported');
  }

  // Handle messages from service worker
  private static handleSWMessage = (event: MessageEvent) => {
    console.log('Message from SW:', event.data);
    
    const { type, data } = event.data;
    
    switch (type) {
      case 'BACKGROUND_SYNC_SUCCESS':
        this.showToast('Datos sincronizados correctamente', 'success');
        break;
      case 'BACKGROUND_SYNC_FAILED':
        this.showToast('Error al sincronizar datos', 'error');
        break;
      case 'CACHE_UPDATED':
        this.showToast('Contenido actualizado', 'info');
        break;
    }
  };

  // Request notification permission
  static async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('Notifications not supported');
    }

    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission;
    }

    return Notification.permission;
  }

  // Show local notification
  static async showNotification(title: string, options: NotificationOptions = {}) {
    const permission = await this.requestNotificationPermission();
    
    if (permission === 'granted') {
      const registration = await navigator.serviceWorker.ready;
      
      await registration.showNotification(title, {
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [200, 100, 200],
        requireInteraction: true,
        ...options
      });
    }
  }

  // Register background sync
  static async registerBackgroundSync(tag: string, data?: any): Promise<void> {
    if (!('serviceWorker' in navigator) || !('sync' in window.ServiceWorkerRegistration.prototype)) {
      throw new Error('Background Sync not supported');
    }

    try {
      const registration = await navigator.serviceWorker.ready;
      
      // Store data for sync if provided
      if (data) {
        await this.storeDataForSync(tag, data);
      }
      
      await registration.sync.register(tag);
      console.log('Background sync registered:', tag);
    } catch (error) {
      console.error('Background sync registration failed:', error);
      throw error;
    }
  }

  // Setup periodic sync
  private static async setupPeriodicSync(registration: ServiceWorkerRegistration) {
    if ('periodicSync' in registration) {
      try {
        // Content updates every 4 hours
        await (registration as any).periodicSync.register('update-content', {
          minInterval: 4 * 60 * 60 * 1000
        });
        
        // Rankings sync every 2 hours
        await (registration as any).periodicSync.register('sync-rankings', {
          minInterval: 2 * 60 * 60 * 1000
        });
        
        // Cache cleanup daily
        await (registration as any).periodicSync.register('cleanup-cache', {
          minInterval: 24 * 60 * 60 * 1000
        });
        
        console.log('Periodic sync registered');
      } catch (error) {
        console.error('Periodic sync registration failed:', error);
      }
    }
  }

  // Store data for background sync
  private static async storeDataForSync(tag: string, data: any): Promise<void> {
    if (!this.sw) return;
    
    this.sw.postMessage({
      type: 'STORE_DATA',
      data: {
        key: `pending_${tag}`,
        value: {
          id: Date.now(),
          tag,
          data,
          timestamp: Date.now()
        }
      }
    });
  }

  // Upload activity with background sync
  static async uploadActivityWithSync(activityData: any): Promise<void> {
    try {
      // Try immediate upload
      const response = await fetch('/api/activities', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activityData)
      });

      if (response.ok) {
        this.showToast('Actividad subida correctamente', 'success');
        return;
      }
      
      throw new Error('Upload failed');
    } catch (error) {
      console.log('Immediate upload failed, registering background sync');
      
      // Store for background sync
      await this.storeOfflineData('pendingUploads', {
        id: Date.now(),
        data: activityData,
        timestamp: Date.now()
      });
      
      // Register background sync
      await this.registerBackgroundSync('upload-activity');
      
      this.showToast('Actividad guardada, se subirá cuando tengas conexión', 'info');
    }
  }

  // Submit comment with background sync
  static async submitCommentWithSync(commentData: any): Promise<void> {
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(commentData)
      });

      if (response.ok) {
        this.showToast('Comentario enviado', 'success');
        return;
      }
      
      throw new Error('Comment submission failed');
    } catch (error) {
      await this.storeOfflineData('pendingComments', {
        id: Date.now(),
        data: commentData,
        timestamp: Date.now()
      });
      
      await this.registerBackgroundSync('submit-comment');
      this.showToast('Comentario guardado, se enviará cuando tengas conexión', 'info');
    }
  }

  // Store data in IndexedDB
  static async storeOfflineData(store: string, data: any): Promise<void> {
    if (!this.sw) return;
    
    this.sw.postMessage({
      type: 'STORE_DATA',
      data: { key: store, value: data }
    });
  }

  // Check if app can be installed
  static canInstall(): boolean {
    return 'beforeinstallprompt' in window;
  }

  // Install PWA
  static async installPWA(): Promise<boolean> {
    const deferredPrompt = (window as any).deferredPrompt;
    
    if (!deferredPrompt) {
      this.showToast('La aplicación ya está instalada o no se puede instalar', 'info');
      return false;
    }

    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        this.showToast('¡Aplicación instalada correctamente!', 'success');
        (window as any).deferredPrompt = null;
        return true;
      } else {
        this.showToast('Instalación cancelada', 'info');
        return false;
      }
    } catch (error) {
      console.error('Installation failed:', error);
      this.showToast('Error durante la instalación', 'error');
      return false;
    }
  }

  // Check network status
  static isOnline(): boolean {
    return navigator.onLine;
  }

  // Listen for online/offline events
  static onNetworkChange(callback: (isOnline: boolean) => void): () => void {
    const handleOnline = () => callback(true);
    const handleOffline = () => callback(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Return cleanup function
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }

  // Show toast notification
  private static showToast(message: string, type: 'success' | 'error' | 'info') {
    // This should integrate with your toast system
    console.log(`${type.toUpperCase()}: ${message}`);
    
    // You can replace this with your actual toast implementation
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('IntrospensArte', {
        body: message,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        silent: true,
        tag: 'toast'
      });
    }
  }

  // Subscribe to push notifications
  static async subscribeToPush(): Promise<PushSubscription | null> {
    try {
      const registration = await navigator.serviceWorker.ready;
      
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlB64ToUint8Array(
          // Replace with your VAPID public key
          'BMqQzLr-e9_1odXF8nzVjAcVY-Hv6RpVz-e3QFGlKGD6VwCuA2yJ_3GG7vOkC3Mk4Ll0XN_-PzGnpX-L-Y8Y2Yw'
        )
      });

      // Send subscription to server
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription)
      });

      console.log('Push subscription created:', subscription);
      return subscription;
    } catch (error) {
      console.error('Push subscription failed:', error);
      return null;
    }
  }

  // Convert VAPID key
  private static urlB64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Install prompt handling
let deferredPrompt: any;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  (window as any).deferredPrompt = e;
  
  // Show install button or banner
  console.log('PWA install prompt available');
});

window.addEventListener('appinstalled', () => {
  console.log('PWA was installed');
  deferredPrompt = null;
  (window as any).deferredPrompt = null;
});
