import { sql, relations } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, boolean, decimal, uuid, jsonb, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const userRoleEnum = pgEnum("user_role", ["admin", "practitioner", "staff", "patient"]);
export const appointmentStatusEnum = pgEnum("appointment_status", ["scheduled", "confirmed", "in_progress", "completed", "cancelled", "no_show"]);
export const appointmentTypeEnum = pgEnum("appointment_type", ["consultation", "follow_up", "therapy", "procedure", "emergency", "telehealth"]);
export const invoiceStatusEnum = pgEnum("invoice_status", ["draft", "sent", "paid", "overdue", "cancelled"]);
export const messageStatusEnum = pgEnum("message_status", ["unread", "read", "archived"]);
export const documentTypeEnum = pgEnum("document_type", ["medical_record", "lab_result", "imaging", "prescription", "insurance", "consent_form", "other"]);
export const telehealthPlatformEnum = pgEnum("telehealth_platform", ["zoom", "teams", "google_meet"]);
export const telehealthStatusEnum = pgEnum("telehealth_status", ["scheduled", "waiting_room", "in_session", "completed", "cancelled", "technical_issues"]);

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  phone: text("phone"),
  role: userRoleEnum("role").notNull().default("patient"),
  isActive: boolean("is_active").notNull().default(true),
  lastLoginAt: timestamp("last_login_at"),
  resetToken: text("reset_token"),
  resetTokenExpiry: timestamp("reset_token_expiry"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Patients table (extends user info for patients)
export const patients = pgTable("patients", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  dateOfBirth: timestamp("date_of_birth"),
  gender: text("gender"),
  address: text("address"),
  emergencyContact: text("emergency_contact"),
  emergencyPhone: text("emergency_phone"),
  insuranceProvider: text("insurance_provider"),
  insuranceNumber: text("insurance_number"),
  medicalHistory: jsonb("medical_history").$type<string[]>().default([]),
  allergies: jsonb("allergies").$type<string[]>().default([]),
  medications: jsonb("medications").$type<string[]>().default([]),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Practitioners table (extends user info for healthcare providers)
export const practitioners = pgTable("practitioners", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  licenseNumber: text("license_number"),
  specialty: text("specialty"),
  qualifications: jsonb("qualifications").$type<string[]>().default([]),
  bio: text("bio"),
  consultationFee: decimal("consultation_fee", { precision: 10, scale: 2 }),
  bookingLink: text("booking_link").unique().default(null), // Unique public booking link
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  readableId: text("readable_id").notNull().unique().default(sql`substring(md5(random()::text), 1, 8)`),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  practitionerId: uuid("practitioner_id").notNull().references(() => practitioners.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  appointmentDate: timestamp("appointment_date").notNull(),
  duration: integer("duration").notNull().default(30), // minutes
  type: appointmentTypeEnum("type").notNull().default("consultation"),
  status: appointmentStatusEnum("status").notNull().default("scheduled"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Clinical Notes table (SOAP notes, treatment plans, etc.)
export const clinicalNotes = pgTable("clinical_notes", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  practitionerId: uuid("practitioner_id").notNull().references(() => practitioners.id, { onDelete: "cascade" }),
  appointmentId: uuid("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
  title: text("title").notNull(),
  subjective: text("subjective"), // SOAP - Subjective
  objective: text("objective"), // SOAP - Objective
  assessment: text("assessment"), // SOAP - Assessment
  plan: text("plan"), // SOAP - Plan
  additionalNotes: text("additional_notes"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Invoices table
export const invoices = pgTable("invoices", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  practitionerId: uuid("practitioner_id").notNull().references(() => practitioners.id, { onDelete: "cascade" }),
  appointmentId: uuid("appointment_id").references(() => appointments.id, { onDelete: "set null" }),
  invoiceNumber: text("invoice_number").notNull().unique(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  tax: decimal("tax", { precision: 10, scale: 2 }).default("0.00"),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  description: text("description"),
  status: invoiceStatusEnum("status").notNull().default("draft"),
  dueDate: timestamp("due_date"),
  paidAt: timestamp("paid_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Messages table
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  senderId: uuid("sender_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  recipientId: uuid("recipient_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  subject: text("subject").notNull(),
  content: text("content").notNull(),
  status: messageStatusEnum("status").notNull().default("unread"),
  readAt: timestamp("read_at"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Documents table
export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  uploadedById: uuid("uploaded_by_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  type: documentTypeEnum("type").notNull().default("other"),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Telehealth Sessions table
export const telehealthSessions = pgTable("telehealth_sessions", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  appointmentId: uuid("appointment_id").notNull().references(() => appointments.id, { onDelete: "cascade" }),
  patientId: uuid("patient_id").notNull().references(() => patients.id, { onDelete: "cascade" }),
  practitionerId: uuid("practitioner_id").notNull().references(() => practitioners.id, { onDelete: "cascade" }),
  platform: telehealthPlatformEnum("platform").notNull(),
  status: telehealthStatusEnum("status").notNull().default("scheduled"),
  meetingUrl: text("meeting_url"),
  meetingId: text("meeting_id"),
  passcode: text("passcode"),
  hostKey: text("host_key"),
  patientJoinedAt: timestamp("patient_joined_at"),
  practitionerJoinedAt: timestamp("practitioner_joined_at"),
  sessionStartedAt: timestamp("session_started_at"),
  sessionEndedAt: timestamp("session_ended_at"),
  recordingUrl: text("recording_url"),
  sessionNotes: text("session_notes"),
  technicalIssues: text("technical_issues"),
  metadata: jsonb("metadata").$type<{
    zoom?: { 
      meetingUuid?: string;
      participantCount?: number;
      duration?: number;
    };
    teams?: {
      threadId?: string;
      organizerMeetingId?: string;
    };
    googleMeet?: {
      conferenceId?: string;
      hangoutLink?: string;
    };
  }>().default({}),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// System Settings - Global platform configuration
export const systemSettings = pgTable("system_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  organizationName: text("organization_name").notNull().default("TiNHiH Foundation"),
  organizationLogo: text("organization_logo"),
  primaryColor: text("primary_color").notNull().default("#ffdd00"),
  secondaryColor: text("secondary_color").notNull().default("#1f2937"),
  timezone: text("timezone").notNull().default("America/New_York"),
  dateFormat: text("date_format").notNull().default("MM/dd/yyyy"),
  timeFormat: text("time_format").notNull().default("12h"),
  currency: text("currency").notNull().default("USD"),
  language: text("language").notNull().default("en"),
  businessHoursStart: text("business_hours_start").notNull().default("09:00"),
  businessHoursEnd: text("business_hours_end").notNull().default("17:00"),
  workingDays: text("working_days").array().notNull().default(sql`ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday']`),
  allowWeekendBookings: boolean("allow_weekend_bookings").default(false),
  defaultAppointmentDuration: integer("default_appointment_duration").notNull().default(60),
  maxAdvanceBookingDays: integer("max_advance_booking_days").notNull().default(90),
  minAdvanceBookingHours: integer("min_advance_booking_hours").notNull().default(24),
  emailNotificationsEnabled: boolean("email_notifications_enabled").default(true),
  smsNotificationsEnabled: boolean("sms_notifications_enabled").default(false),
  appointmentReminderHours: integer("appointment_reminder_hours").notNull().default(24),
  sessionTimeoutMinutes: integer("session_timeout_minutes").notNull().default(480),
  passwordMinLength: integer("password_min_length").notNull().default(8),
  requireTwoFactor: boolean("require_two_factor").default(false),
  defaultTelehealthPlatform: text("default_telehealth_platform").notNull().default("zoom"),
  telehealthBufferMinutes: integer("telehealth_buffer_minutes").notNull().default(5),
  allowRecording: boolean("allow_recording").default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// User Preferences - Individual user customization
export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  theme: text("theme").notNull().default("light"),
  language: text("language").notNull().default("en"),
  timezone: text("timezone").notNull().default("America/New_York"),
  dateFormat: text("date_format").notNull().default("MM/dd/yyyy"),
  timeFormat: text("time_format").notNull().default("12h"),
  defaultDashboardView: text("default_dashboard_view").notNull().default("overview"),
  showPatientPhotos: boolean("show_patient_photos").default(true),
  compactMode: boolean("compact_mode").default(false),
  emailNotifications: boolean("email_notifications").default(true),
  browserNotifications: boolean("browser_notifications").default(true),
  smsNotifications: boolean("sms_notifications").default(false),
  appointmentReminders: boolean("appointment_reminders").default(true),
  messageNotifications: boolean("message_notifications").default(true),
  calendarView: text("calendar_view").notNull().default("week"),
  startDayOfWeek: integer("start_day_of_week").notNull().default(0),
  showWeekends: boolean("show_weekends").default(false),
  timeSlotDuration: integer("time_slot_duration").notNull().default(60),
  fontSizeScale: text("font_size_scale").notNull().default("medium"),
  highContrast: boolean("high_contrast").default(false),
  reduceMotion: boolean("reduce_motion").default(false),
  screenReaderOptimized: boolean("screen_reader_optimized").default(false),
  shareDataForAnalytics: boolean("share_data_for_analytics").default(true),
  allowTelemetry: boolean("allow_telemetry").default(true),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Calendar Settings (per practitioner)
export const calendarSettings = pgTable("calendar_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  practitionerId: uuid("practitioner_id").references(() => practitioners.id),
  isGlobal: boolean("is_global").default(false),
  timeInterval: integer("time_interval").notNull().default(60),
  bufferTime: integer("buffer_time").notNull().default(0),
  defaultStartTime: text("default_start_time").notNull().default("09:00"),
  defaultEndTime: text("default_end_time").notNull().default("17:00"),
  workingDays: text("working_days").array().notNull().default(sql`ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday']`),
  allowWeekendBookings: boolean("allow_weekend_bookings").default(false),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Booking Settings table
export const bookingSettings = pgTable("booking_settings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  practitionerId: uuid("practitioner_id").notNull().references(() => practitioners.id, { onDelete: "cascade" }),
  isPublicBookingEnabled: boolean("is_public_booking_enabled").notNull().default(true),
  requireApproval: boolean("require_approval").notNull().default(true),
  allowDirectBooking: boolean("allow_direct_booking").notNull().default(false),
  showProfile: boolean("show_profile").notNull().default(true),
  showSpecialty: boolean("show_specialty").notNull().default(true),
  showConsultationFee: boolean("show_consultation_fee").notNull().default(true),
  advanceBookingDays: integer("advance_booking_days").notNull().default(30),
  maxBookingsPerDay: integer("max_bookings_per_day").notNull().default(10),
  bufferTime: integer("buffer_time").notNull().default(15),
  emailNotifications: boolean("email_notifications").notNull().default(true),
  smsNotifications: boolean("sms_notifications").notNull().default(false),
  reminderHours: integer("reminder_hours").notNull().default(24),
  requirePhoneVerification: boolean("require_phone_verification").notNull().default(false),
  requireEmailVerification: boolean("require_email_verification").notNull().default(true),
  customMessage: text("custom_message").default('Welcome to my booking page. I\'m looking forward to helping you with your healthcare needs.'),
  cancellationPolicy: text("cancellation_policy").default('24 hours notice required for cancellation'),
  createdAt: timestamp("created_at").notNull().default(sql`now()`),
  updatedAt: timestamp("updated_at").notNull().default(sql`now()`),
});

// Relations
export const usersRelations = relations(users, ({ one, many }) => ({
  patient: one(patients, {
    fields: [users.id],
    references: [patients.userId],
  }),
  practitioner: one(practitioners, {
    fields: [users.id],
    references: [practitioners.userId],
  }),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "recipient" }),
  uploadedDocuments: many(documents),
}));

export const patientsRelations = relations(patients, ({ one, many }) => ({
  user: one(users, {
    fields: [patients.userId],
    references: [users.id],
  }),
  appointments: many(appointments),
  clinicalNotes: many(clinicalNotes),
  invoices: many(invoices),
  documents: many(documents),
}));

export const practitionersRelations = relations(practitioners, ({ one, many }) => ({
  user: one(users, {
    fields: [practitioners.userId],
    references: [users.id],
  }),
  appointments: many(appointments),
  clinicalNotes: many(clinicalNotes),
  invoices: many(invoices),
}));

export const appointmentsRelations = relations(appointments, ({ one, many }) => ({
  patient: one(patients, {
    fields: [appointments.patientId],
    references: [patients.id],
  }),
  practitioner: one(practitioners, {
    fields: [appointments.practitionerId],
    references: [practitioners.id],
  }),
  clinicalNotes: many(clinicalNotes),
  invoices: many(invoices),
  telehealthSession: one(telehealthSessions),
}));

export const clinicalNotesRelations = relations(clinicalNotes, ({ one }) => ({
  patient: one(patients, {
    fields: [clinicalNotes.patientId],
    references: [patients.id],
  }),
  practitioner: one(practitioners, {
    fields: [clinicalNotes.practitionerId],
    references: [practitioners.id],
  }),
  appointment: one(appointments, {
    fields: [clinicalNotes.appointmentId],
    references: [appointments.id],
  }),
}));

export const invoicesRelations = relations(invoices, ({ one }) => ({
  patient: one(patients, {
    fields: [invoices.patientId],
    references: [patients.id],
  }),
  practitioner: one(practitioners, {
    fields: [invoices.practitionerId],
    references: [practitioners.id],
  }),
  appointment: one(appointments, {
    fields: [invoices.appointmentId],
    references: [appointments.id],
  }),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  recipient: one(users, {
    fields: [messages.recipientId],
    references: [users.id],
    relationName: "recipient",
  }),
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  patient: one(patients, {
    fields: [documents.patientId],
    references: [patients.id],
  }),
  uploadedBy: one(users, {
    fields: [documents.uploadedById],
    references: [users.id],
  }),
}));

export const telehealthSessionsRelations = relations(telehealthSessions, ({ one }) => ({
  appointment: one(appointments, {
    fields: [telehealthSessions.appointmentId],
    references: [appointments.id],
  }),
  patient: one(patients, {
    fields: [telehealthSessions.patientId],
    references: [patients.id],
  }),
  practitioner: one(practitioners, {
    fields: [telehealthSessions.practitionerId],
    references: [practitioners.id],
  }),
}));

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastLoginAt: true,
});

export const insertPatientSchema = createInsertSchema(patients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  dateOfBirth: z.union([z.date(), z.string(), z.null()]).optional().transform((val) => {
    if (!val) return null;
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
});

export const insertPractitionerSchema = createInsertSchema(practitioners).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertClinicalNoteSchema = createInsertSchema(clinicalNotes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  appointmentId: z.string().uuid().optional().nullable(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  paidAt: true,
}).extend({
  appointmentId: z.string().uuid().optional().nullable(),
  dueDate: z.union([z.date(), z.string(), z.null()]).optional().transform((val) => {
    if (!val) return null;
    if (typeof val === 'string') return new Date(val);
    return val;
  }),
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  readAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTelehealthSessionSchema = createInsertSchema(telehealthSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  sessionStartedAt: true,
  sessionEndedAt: true,
  practitionerJoinedAt: true,
  patientJoinedAt: true,
}).extend({
  appointmentId: z.string().uuid().optional().nullable(),
});

export const insertSystemSettingsSchema = createInsertSchema(systemSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCalendarSettingsSchema = createInsertSchema(calendarSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertBookingSettingsSchema = createInsertSchema(bookingSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Patient = typeof patients.$inferSelect;
export type InsertPatient = z.infer<typeof insertPatientSchema>;
export type Practitioner = typeof practitioners.$inferSelect;
export type InsertPractitioner = z.infer<typeof insertPractitionerSchema>;
export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;
export type ClinicalNote = typeof clinicalNotes.$inferSelect;
export type InsertClinicalNote = z.infer<typeof insertClinicalNoteSchema>;
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Document = typeof documents.$inferSelect;
export type InsertDocument = z.infer<typeof insertDocumentSchema>;

export type TelehealthSession = typeof telehealthSessions.$inferSelect;
export type InsertTelehealthSession = z.infer<typeof insertTelehealthSessionSchema>;
export type SystemSettings = typeof systemSettings.$inferSelect;
export type InsertSystemSettings = z.infer<typeof insertSystemSettingsSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;
export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type CalendarSettings = typeof calendarSettings.$inferSelect;
export type InsertCalendarSettings = z.infer<typeof insertCalendarSettingsSchema>;
export type BookingSettings = typeof bookingSettings.$inferSelect;
export type InsertBookingSettings = z.infer<typeof insertBookingSettingsSchema>;

// Additional types for API responses
export type PatientWithUser = Patient & { user: User };
export type PractitionerWithUser = Practitioner & { user: User };
export type AppointmentWithDetails = Appointment & {
  patient: PatientWithUser;
  practitioner: PractitionerWithUser;
  telehealthSession?: TelehealthSession;
};
export type MessageWithSender = Message & { sender: User; recipient: User };
export type DocumentWithUploader = Document & { uploadedBy: User };
export type TelehealthSessionWithDetails = TelehealthSession & {
  patient: PatientWithUser;
  practitioner: PractitionerWithUser;
  appointment: Appointment | null;
};

// Re-export notification schemas
export * from "./notification-schema";
