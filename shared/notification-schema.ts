import { pgTable, text, timestamp, boolean, uuid, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { users } from "./schema";

// Notification types enum
export const notificationTypeEnum = pgEnum('notification_type', [
  'appointment_created',
  'appointment_updated', 
  'appointment_cancelled',
  'appointment_reminder',
  'patient_registered',
  'patient_updated',
  'clinical_note_created',
  'clinical_note_updated',
  'invoice_created',
  'invoice_paid',
  'invoice_overdue',
  'message_received',
  'telehealth_session_started',
  'telehealth_session_ended',
  'system_update',
  'security_alert',
  'calendar_settings_updated',
  'user_profile_updated',
  'password_changed'
]);

// Notification priority enum
export const notificationPriorityEnum = pgEnum('notification_priority', [
  'low',
  'medium', 
  'high',
  'urgent'
]);

// Notifications table
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  type: notificationTypeEnum("type").notNull(),
  priority: notificationPriorityEnum("priority").default('medium').notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  actionUrl: text("action_url"),
  metadata: jsonb("metadata"),
  isRead: boolean("is_read").default(false).notNull(),
  isArchived: boolean("is_archived").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  readAt: timestamp("read_at"),
});

// Notification preferences table
export const notificationPreferences = pgTable("notification_preferences", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  
  // Email notifications
  emailAppointments: boolean("email_appointments").default(true).notNull(),
  emailPatientUpdates: boolean("email_patient_updates").default(true).notNull(),
  emailClinicalNotes: boolean("email_clinical_notes").default(false).notNull(),
  emailBilling: boolean("email_billing").default(true).notNull(),
  emailMessages: boolean("email_messages").default(true).notNull(),
  emailTelehealth: boolean("email_telehealth").default(true).notNull(),
  emailSystem: boolean("email_system").default(true).notNull(),
  emailSecurity: boolean("email_security").default(true).notNull(),
  
  // Browser/Push notifications
  browserAppointments: boolean("browser_appointments").default(true).notNull(),
  browserPatientUpdates: boolean("browser_patient_updates").default(false).notNull(),
  browserClinicalNotes: boolean("browser_clinical_notes").default(false).notNull(),
  browserBilling: boolean("browser_billing").default(true).notNull(),
  browserMessages: boolean("browser_messages").default(true).notNull(),
  browserTelehealth: boolean("browser_telehealth").default(true).notNull(),
  browserSystem: boolean("browser_system").default(false).notNull(),
  browserSecurity: boolean("browser_security").default(true).notNull(),
  
  // SMS notifications
  smsAppointments: boolean("sms_appointments").default(false).notNull(),
  smsUrgentOnly: boolean("sms_urgent_only").default(true).notNull(),
  
  // General preferences
  quietHoursEnabled: boolean("quiet_hours_enabled").default(false).notNull(),
  quietHoursStart: text("quiet_hours_start").default("22:00"),
  quietHoursEnd: text("quiet_hours_end").default("08:00"),
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Schemas for validation
export const insertNotificationSchema = createInsertSchema(notifications).omit({
  id: true,
  createdAt: true,
  readAt: true,
});

export const insertNotificationPreferencesSchema = createInsertSchema(notificationPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateNotificationSchema = z.object({
  isRead: z.boolean().optional(),
  isArchived: z.boolean().optional(),
});

// Types
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type NotificationPreferences = typeof notificationPreferences.$inferSelect;
export type InsertNotificationPreferences = z.infer<typeof insertNotificationPreferencesSchema>;
export type UpdateNotification = z.infer<typeof updateNotificationSchema>;

// Notification type definitions for better type safety
export type NotificationType = typeof notificationTypeEnum.enumValues[number];
export type NotificationPriority = typeof notificationPriorityEnum.enumValues[number];