export class BrowserNotificationService {
  private static instance: BrowserNotificationService;
  private permission: NotificationPermission = 'default';

  private constructor() {
    this.checkPermission();
  }

  static getInstance(): BrowserNotificationService {
    if (!BrowserNotificationService.instance) {
      BrowserNotificationService.instance = new BrowserNotificationService();
    }
    return BrowserNotificationService.instance;
  }

  private checkPermission() {
    if ('Notification' in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications');
      return 'denied';
    }

    if (this.permission === 'granted') {
      return 'granted';
    }

    const permission = await Notification.requestPermission();
    this.permission = permission;
    return permission;
  }

  async showNotification(title: string, options: {
    body?: string;
    icon?: string;
    badge?: string;
    tag?: string;
    data?: any;
    silent?: boolean;
    requireInteraction?: boolean;
  } = {}) {
    if (this.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    try {
      const notification = new Notification(title, {
        body: options.body,
        icon: options.icon || '/favicon.ico',
        badge: options.badge,
        tag: options.tag,
        data: options.data,
        silent: options.silent || false,
        requireInteraction: options.requireInteraction || false,
      });

      notification.onclick = () => {
        window.focus();
        if (options.data?.url) {
          window.location.href = options.data.url;
        }
        notification.close();
      };

      // Auto-close after 5 seconds unless requireInteraction is true
      if (!options.requireInteraction) {
        setTimeout(() => {
          notification.close();
        }, 5000);
      }

      return notification;
    } catch (error) {
      console.error('Failed to show notification:', error);
      return null;
    }
  }

  // Convenience methods for different notification types
  async showAppointmentReminder(appointment: any) {
    return this.showNotification(
      'Upcoming Appointment',
      {
        body: `${appointment.patientName} - ${new Date(appointment.startTime).toLocaleTimeString()}`,
        icon: '/favicon.ico',
        tag: `appointment-${appointment.id}`,
        data: { url: '/calendar', type: 'appointment', id: appointment.id },
        requireInteraction: true,
      }
    );
  }

  async showMessageNotification(message: any) {
    return this.showNotification(
      'New Message',
      {
        body: `From ${message.senderName}: ${message.preview}`,
        icon: '/favicon.ico',
        tag: `message-${message.id}`,
        data: { url: '/messages', type: 'message', id: message.id },
      }
    );
  }

  async showSystemNotification(title: string, message: string, priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium') {
    return this.showNotification(title, {
      body: message,
      icon: '/favicon.ico',
      requireInteraction: priority === 'urgent' || priority === 'high',
      silent: priority === 'low',
    });
  }

  getPermissionStatus(): NotificationPermission {
    return this.permission;
  }

  isSupported(): boolean {
    return 'Notification' in window;
  }
}

export const notificationService = BrowserNotificationService.getInstance();