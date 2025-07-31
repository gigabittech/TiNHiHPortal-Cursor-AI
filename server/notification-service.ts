import { and, desc, eq, count, sql } from "drizzle-orm";
import { db } from "./db";
import { 
  notifications, 
  notificationPreferences, 
  type InsertNotification, 
  type NotificationType, 
  type NotificationPriority,
  type Notification
} from "@shared/notification-schema";
import { users } from "@shared/schema";

export class NotificationService {
  // Create a new notification
  async createNotification(data: InsertNotification): Promise<Notification> {
    const [notification] = await db
      .insert(notifications)
      .values(data)
      .returning();
    
    // Emit real-time notification (WebSocket implementation would go here)
    await this.emitRealtimeNotification(notification);
    
    return notification;
  }

  // Create notifications for multiple users
  async createBulkNotifications(
    userIds: string[], 
    notificationData: Omit<InsertNotification, 'userId'>
  ): Promise<Notification[]> {
    const notificationsToInsert = userIds.map(userId => ({
      ...notificationData,
      userId
    }));

    const createdNotifications = await db
      .insert(notifications)
      .values(notificationsToInsert)
      .returning();

    // Emit real-time notifications for all users
    for (const notification of createdNotifications) {
      await this.emitRealtimeNotification(notification);
    }

    return createdNotifications;
  }

  // Get notifications for a user
  async getUserNotifications(
    userId: string, 
    options: {
      limit?: number;
      offset?: number;
      unreadOnly?: boolean;
      excludeArchived?: boolean;
    } = {}
  ) {
    const { limit = 50, offset = 0, unreadOnly = false, excludeArchived = true } = options;

    let query = db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId));

    if (unreadOnly) {
      query = query.where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
    }

    if (excludeArchived) {
      query = query.where(and(
        eq(notifications.userId, userId),
        eq(notifications.isArchived, false)
      ));
    }

    const results = await query
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    return results;
  }

  // Get unread notification count
  async getUnreadCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false),
        eq(notifications.isArchived, false)
      ));

    return result.count;
  }

  // Mark notification as read
  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ 
        isRead: true, 
        readAt: new Date() 
      })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ));
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ 
        isRead: true, 
        readAt: new Date()
      })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.isRead, false)
      ));
  }

  // Archive notification
  async archiveNotification(notificationId: string, userId: string): Promise<void> {
    await db
      .update(notifications)
      .set({ isArchived: true })
      .where(and(
        eq(notifications.id, notificationId),
        eq(notifications.userId, userId)
      ));
  }

  // Delete old notifications (cleanup)
  async cleanupOldNotifications(daysToKeep: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    await db
      .delete(notifications)
      .where(
        sql`${notifications.createdAt} < ${cutoffDate} AND ${notifications.isArchived} = true`
      );
  }

  // Get user notification preferences
  async getUserPreferences(userId: string) {
    const [preferences] = await db
      .select()
      .from(notificationPreferences)
      .where(eq(notificationPreferences.userId, userId));

    // Create default preferences if none exist
    if (!preferences) {
      return await this.createDefaultPreferences(userId);
    }

    return preferences;
  }

  // Create default notification preferences for a user
  async createDefaultPreferences(userId: string) {
    const [preferences] = await db
      .insert(notificationPreferences)
      .values({ userId })
      .returning();

    return preferences;
  }

  // Update user notification preferences
  async updateUserPreferences(userId: string, updates: Partial<typeof notificationPreferences.$inferInsert>) {
    const [preferences] = await db
      .update(notificationPreferences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(notificationPreferences.userId, userId))
      .returning();

    return preferences;
  }

  // Check if user should receive notification based on preferences
  async shouldNotifyUser(userId: string, notificationType: NotificationType, channel: 'email' | 'browser' | 'sms'): Promise<boolean> {
    const preferences = await this.getUserPreferences(userId);
    
    // Map notification types to preference fields
    const typeMap: Record<NotificationType, string> = {
      'appointment_created': 'Appointments',
      'appointment_updated': 'Appointments', 
      'appointment_cancelled': 'Appointments',
      'appointment_reminder': 'Appointments',
      'patient_registered': 'PatientUpdates',
      'patient_updated': 'PatientUpdates',
      'clinical_note_created': 'ClinicalNotes',
      'clinical_note_updated': 'ClinicalNotes',
      'invoice_created': 'Billing',
      'invoice_paid': 'Billing',
      'invoice_overdue': 'Billing',
      'message_received': 'Messages',
      'telehealth_session_started': 'Telehealth',
      'telehealth_session_ended': 'Telehealth',
      'system_update': 'System',
      'security_alert': 'Security',
      'calendar_settings_updated': 'System',
      'user_profile_updated': 'System',
      'password_changed': 'Security'
    };

    const typeKey = typeMap[notificationType];
    if (!typeKey) return false;

    const prefKey = `${channel}${typeKey}` as keyof typeof preferences;
    return preferences[prefKey] as boolean;
  }

  // Emit real-time notification (WebSocket implementation)
  private async emitRealtimeNotification(notification: Notification): Promise<void> {
    // This would integrate with WebSocket server to push real-time notifications
    // For now, we'll just log it
    console.log(`Real-time notification emitted:`, {
      userId: notification.userId,
      type: notification.type,
      title: notification.title
    });
  }

  // Predefined notification templates
  static getNotificationTemplate(type: NotificationType, data: any) {
    const templates: Record<NotificationType, (data: any) => { title: string; message: string; priority: NotificationPriority }> = {
      'appointment_created': (data) => ({
        title: 'New Appointment Scheduled',
        message: `Your appointment "${data.title}" has been scheduled for ${data.date}`,
        priority: 'medium' as NotificationPriority
      }),
      'appointment_updated': (data) => ({
        title: 'Appointment Updated',
        message: `Your appointment "${data.title}" has been updated`,
        priority: 'medium' as NotificationPriority
      }),
      'appointment_cancelled': (data) => ({
        title: 'Appointment Cancelled',
        message: `Your appointment "${data.title}" has been cancelled`,
        priority: 'high' as NotificationPriority
      }),
      'appointment_reminder': (data) => ({
        title: 'Appointment Reminder',
        message: `Your appointment "${data.title}" is scheduled for ${data.time}`,
        priority: 'high' as NotificationPriority
      }),
      'patient_registered': (data) => ({
        title: 'New Patient Registered',
        message: `${data.patientName} has been registered in the system`,
        priority: 'low' as NotificationPriority
      }),
      'patient_updated': (data) => ({
        title: 'Patient Information Updated',
        message: `Patient ${data.patientName}'s information has been updated`,
        priority: 'low' as NotificationPriority
      }),
      'clinical_note_created': (data) => ({
        title: 'New Clinical Note',
        message: `A new clinical note has been added for ${data.patientName}`,
        priority: 'medium' as NotificationPriority
      }),
      'clinical_note_updated': (data) => ({
        title: 'Clinical Note Updated',
        message: `Clinical note for ${data.patientName} has been updated`,
        priority: 'low' as NotificationPriority
      }),
      'invoice_created': (data) => ({
        title: 'New Invoice Generated',
        message: `Invoice #${data.invoiceNumber} for $${data.amount} has been created`,
        priority: 'medium' as NotificationPriority
      }),
      'invoice_paid': (data) => ({
        title: 'Payment Received',
        message: `Invoice #${data.invoiceNumber} has been paid`,
        priority: 'low' as NotificationPriority
      }),
      'invoice_overdue': (data) => ({
        title: 'Invoice Overdue',
        message: `Invoice #${data.invoiceNumber} is overdue`,
        priority: 'high' as NotificationPriority
      }),
      'message_received': (data) => ({
        title: 'New Message',
        message: `You have a new message from ${data.senderName}`,
        priority: 'medium' as NotificationPriority
      }),
      'telehealth_session_started': (data) => ({
        title: 'Telehealth Session Started',
        message: `Your telehealth session with ${data.participantName} has started`,
        priority: 'high' as NotificationPriority
      }),
      'telehealth_session_ended': (data) => ({
        title: 'Telehealth Session Ended',
        message: `Your telehealth session has ended`,
        priority: 'medium' as NotificationPriority
      }),
      'system_update': (data) => ({
        title: 'System Update',
        message: data.message || 'System has been updated',
        priority: 'low' as NotificationPriority
      }),
      'security_alert': (data) => ({
        title: 'Security Alert',
        message: data.message || 'Security alert detected',
        priority: 'urgent' as NotificationPriority
      }),
      'calendar_settings_updated': (data) => ({
        title: 'Calendar Settings Updated',
        message: 'Your calendar settings have been updated successfully',
        priority: 'low' as NotificationPriority
      }),
      'user_profile_updated': (data) => ({
        title: 'Profile Updated',
        message: 'Your profile information has been updated',
        priority: 'low' as NotificationPriority
      }),
      'password_changed': (data) => ({
        title: 'Password Changed',
        message: 'Your password has been changed successfully',
        priority: 'medium' as NotificationPriority
      })
    };

    return templates[type]?.(data) || {
      title: 'Notification',
      message: 'You have a new notification',
      priority: 'medium' as NotificationPriority
    };
  }

  // Quick notification creation using templates
  async createTemplatedNotification(
    userId: string, 
    type: NotificationType, 
    data: any, 
    actionUrl?: string
  ): Promise<Notification> {
    const template = NotificationService.getNotificationTemplate(type, data);
    
    return await this.createNotification({
      userId,
      type,
      title: template.title,
      message: template.message,
      priority: template.priority,
      actionUrl,
      metadata: data
    });
  }
}

export const notificationService = new NotificationService();