import { 
  users, patients, practitioners, appointments, clinicalNotes, invoices, messages, telehealthSessions,
  systemSettings, userPreferences, calendarSettings, documents,
  type User, type InsertUser, type Patient, type InsertPatient, 
  type Practitioner, type InsertPractitioner, type Appointment, type InsertAppointment,
  type ClinicalNote, type InsertClinicalNote, type Invoice, type InsertInvoice,
  type Message, type InsertMessage, type TelehealthSession, type InsertTelehealthSession,
  type SystemSettings, type InsertSystemSettings, type UserPreferences, type InsertUserPreferences,
  type CalendarSettings, type InsertCalendarSettings, type Document, type InsertDocument,
  type PatientWithUser, type PractitionerWithUser, type AppointmentWithDetails, type MessageWithSender,
  type TelehealthSessionWithDetails
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, count, sum, and, gte, lte, sql, or, like, ilike, asc } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

// Storage interface
export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(insertUser: InsertUser): Promise<User>;
  updateUser(id: string, updates: Partial<User>): Promise<User | undefined>;

  // Patient methods
  getPatients(search?: string, limit?: number, offset?: number): Promise<PatientWithUser[]>;
  getPatient(id: string): Promise<PatientWithUser | undefined>;
  getPatientByUserId(userId: string): Promise<Patient | undefined>;
  createPatient(insertPatient: InsertPatient): Promise<Patient>;
  updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | undefined>;

  // Practitioner methods
  getPractitioners(): Promise<PractitionerWithUser[]>;
  getPractitionerByUserId(userId: string): Promise<Practitioner | undefined>;
  createPractitioner(insertPractitioner: InsertPractitioner): Promise<Practitioner>;
  updatePractitioner(id: string, updates: Partial<Practitioner>): Promise<Practitioner | undefined>;

  // Appointment methods
  getAppointments(practitionerId?: string, patientId?: string): Promise<AppointmentWithDetails[]>;
  getAppointment(id: string): Promise<AppointmentWithDetails | undefined>;
  getTodayAppointments(practitionerId: string): Promise<AppointmentWithDetails[]>;
  createAppointment(insertAppointment: InsertAppointment): Promise<Appointment>;
  updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: string): Promise<boolean>;

  // Clinical Notes methods
  getClinicalNotes(patientId?: string, practitionerId?: string): Promise<ClinicalNote[]>;
  getClinicalNote(id: string): Promise<ClinicalNote | undefined>;
  createClinicalNote(insertNote: InsertClinicalNote): Promise<ClinicalNote>;
  updateClinicalNote(id: string, updates: Partial<ClinicalNote>): Promise<ClinicalNote | undefined>;

  // Invoice methods
  getInvoices(patientId?: string, practitionerId?: string): Promise<Invoice[]>;
  getInvoicesWithSearch(search?: string, status?: string, limit?: number, offset?: number): Promise<Invoice[]>;
  getInvoicesByPatientId(patientId: string, search?: string, status?: string, limit?: number, offset?: number): Promise<Invoice[]>;
  getInvoicesByPractitionerId(practitionerId: string, search?: string, status?: string, limit?: number, offset?: number): Promise<Invoice[]>;
  getInvoice(id: string): Promise<Invoice | undefined>;
  createInvoice(insertInvoice: InsertInvoice): Promise<Invoice>;
  updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | undefined>;

  // Message methods
  getMessages(userId: string): Promise<MessageWithSender[]>;
  getUnreadMessagesCount(userId: string): Promise<number>;
  createMessage(insertMessage: InsertMessage): Promise<Message>;
  markMessageAsRead(id: string): Promise<boolean>;

  // Telehealth Session methods
  getTelehealthSessions(practitionerId?: string, patientId?: string): Promise<TelehealthSessionWithDetails[]>;
  getTelehealthSession(id: string): Promise<TelehealthSessionWithDetails | undefined>;
  getTelehealthSessionByAppointmentId(appointmentId: string): Promise<TelehealthSession | undefined>;
  createTelehealthSession(insertSession: InsertTelehealthSession): Promise<TelehealthSession>;
  updateTelehealthSession(id: string, updates: Partial<TelehealthSession>): Promise<TelehealthSession | undefined>;
  startTelehealthSession(id: string): Promise<boolean>;
  joinTelehealthSession(id: string, isPatient: boolean): Promise<boolean>;
  endTelehealthSession(id: string): Promise<boolean>;

  // System Settings methods
  getSystemSettings(): Promise<SystemSettings | undefined>;
  updateSystemSettings(updates: Partial<SystemSettings>): Promise<SystemSettings | undefined>;
  createSystemSettings(settings: InsertSystemSettings): Promise<SystemSettings>;

  // User Preferences methods
  getUserPreferences(userId: string): Promise<UserPreferences | undefined>;
  updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences | undefined>;
  createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences>;

  // Dashboard methods
  getDashboardStats(practitionerId: string): Promise<{
    totalPatients: number;
    todayAppointments: number;
    totalRevenue: number;
    paidRevenue: number;
    outstandingRevenue: number;
  }>;
}

// Database Storage implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getPatients(search?: string, limit: number = 50, offset: number = 0): Promise<PatientWithUser[]> {
    let query = db
      .select()
      .from(patients)
      .leftJoin(users, eq(patients.userId, users.id))
      .limit(limit)
      .offset(offset);

    // Add search filter if provided
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      
      query = query.where(
        or(
          ilike(users.firstName, searchTerm),
          ilike(users.lastName, searchTerm),
          ilike(users.email, searchTerm),
          ilike(users.phone, searchTerm),
          ilike(patients.insuranceProvider, searchTerm),
          ilike(patients.insuranceNumber, searchTerm)
        )
      );
    }

    const result = await query;
    
    return result.map(row => ({
      ...row.patients,
      user: row.users!
    }));
  }

  async getPatient(id: string): Promise<PatientWithUser | undefined> {
    const [result] = await db
      .select()
      .from(patients)
      .leftJoin(users, eq(patients.userId, users.id))
      .where(eq(patients.id, id));
    
    if (!result) return undefined;
    return {
      ...result.patients,
      user: result.users!
    };
  }

  async getPatientByUserId(userId: string): Promise<Patient | undefined> {
    const [patient] = await db.select().from(patients).where(eq(patients.userId, userId));
    return patient || undefined;
  }

  async createPatient(insertPatient: InsertPatient): Promise<Patient> {
    const [patient] = await db
      .insert(patients)
      .values([insertPatient])
      .returning();
    return patient;
  }

  async updatePatient(id: string, updates: Partial<Patient>): Promise<Patient | undefined> {
    const [patient] = await db
      .update(patients)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(patients.id, id))
      .returning();
    return patient || undefined;
  }

  async getPractitioners(): Promise<PractitionerWithUser[]> {
    return await db
      .select()
      .from(practitioners)
      .leftJoin(users, eq(practitioners.userId, users.id))
      .then(rows => rows.map(row => ({
        ...row.practitioners,
        user: row.users!
      })));
  }

  async getPractitionerByUserId(userId: string): Promise<Practitioner | undefined> {
    const [practitioner] = await db.select().from(practitioners).where(eq(practitioners.userId, userId));
    return practitioner || undefined;
  }

  async createPractitioner(insertPractitioner: InsertPractitioner): Promise<Practitioner> {
    const [practitioner] = await db
      .insert(practitioners)
      .values([insertPractitioner])
      .returning();
    return practitioner;
  }

  async updatePractitioner(id: string, updates: Partial<Practitioner>): Promise<Practitioner | undefined> {
    const [practitioner] = await db
      .update(practitioners)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(practitioners.id, id))
      .returning();
    return practitioner || undefined;
  }

  async getAppointments(practitionerId?: string, patientId?: string): Promise<AppointmentWithDetails[]> {
    const patientUsers = alias(users, 'patientUsers');
    const practitionerUsers = alias(users, 'practitionerUsers');
    
    let query = db
      .select()
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .leftJoin(patientUsers, eq(patients.userId, patientUsers.id))
      .leftJoin(practitioners, eq(appointments.practitionerId, practitioners.id))
      .leftJoin(practitionerUsers, eq(practitioners.userId, practitionerUsers.id))
      .orderBy(desc(appointments.appointmentDate));

    if (practitionerId) {
      query = query.where(eq(appointments.practitionerId, practitionerId)) as any;
    }
    if (patientId) {
      query = query.where(eq(appointments.patientId, patientId)) as any;
    }

    const result = await query;
    
    return result.map(row => ({
      ...row.appointments,
      patient: row.patients ? {
        ...row.patients,
        user: row.patientUsers ? {
          ...row.patientUsers,
          firstName: row.patientUsers.firstName,
          lastName: row.patientUsers.lastName
        } : null
      } : null,
      practitioner: row.practitioners ? {
        ...row.practitioners,
        user: row.practitionerUsers ? {
          ...row.practitionerUsers,
          firstName: row.practitionerUsers.firstName,
          lastName: row.practitionerUsers.lastName
        } : null
      } : null
    }));
  }

  async getAppointment(id: string): Promise<AppointmentWithDetails | undefined> {
    const patientUsers = alias(users, 'patientUsers');
    const practitionerUsers = alias(users, 'practitionerUsers');
    
    const [result] = await db
      .select()
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .leftJoin(patientUsers, eq(patients.userId, patientUsers.id))
      .leftJoin(practitioners, eq(appointments.practitionerId, practitioners.id))
      .leftJoin(practitionerUsers, eq(practitioners.userId, practitionerUsers.id))
      .where(eq(appointments.id, id));

    if (!result) return undefined;
    return {
      ...result.appointments,
      patient: result.patients ? {
        ...result.patients,
        user: result.patientUsers ? {
          ...result.patientUsers,
          firstName: result.patientUsers.firstName,
          lastName: result.patientUsers.lastName
        } : null
      } : null,
      practitioner: result.practitioners ? {
        ...result.practitioners,
        user: result.practitionerUsers ? {
          ...result.practitionerUsers,
          firstName: result.practitionerUsers.firstName,
          lastName: result.practitionerUsers.lastName
        } : null
      } : null
    };
  }

  async getTodayAppointments(practitionerId: string): Promise<AppointmentWithDetails[]> {
    const patientUsers = alias(users, 'patientUsers');
    const practitionerUsers = alias(users, 'practitionerUsers');
    
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const result = await db
      .select()
      .from(appointments)
      .leftJoin(patients, eq(appointments.patientId, patients.id))
      .leftJoin(patientUsers, eq(patients.userId, patientUsers.id))
      .leftJoin(practitioners, eq(appointments.practitionerId, practitioners.id))
      .leftJoin(practitionerUsers, eq(practitioners.userId, practitionerUsers.id))
      .where(
        and(
          eq(appointments.practitionerId, practitionerId),
          gte(appointments.appointmentDate, startOfDay),
          lte(appointments.appointmentDate, endOfDay)
        )
      )
      .orderBy(appointments.appointmentDate);

    return result.map(row => ({
      ...row.appointments,
      patient: row.patients ? {
        ...row.patients,
        user: row.patientUsers ? {
          ...row.patientUsers,
          firstName: row.patientUsers.firstName,
          lastName: row.patientUsers.lastName
        } : null
      } : null,
      practitioner: row.practitioners ? {
        ...row.practitioners,
        user: row.practitionerUsers ? {
          ...row.practitionerUsers,
          firstName: row.practitionerUsers.firstName,
          lastName: row.practitionerUsers.lastName
        } : null
      } : null
    }));
  }

  async createAppointment(insertAppointment: InsertAppointment): Promise<Appointment> {
    console.log('Storage: Creating appointment with data:', insertAppointment);
    try {
      const [appointment] = await db
        .insert(appointments)
        .values(insertAppointment)
        .returning();
      console.log('Storage: Appointment created successfully:', appointment);
      return appointment;
    } catch (error) {
      console.error('Storage: Error creating appointment:', error);
      throw error;
    }
  }

  async updateAppointment(id: string, updates: Partial<Appointment>): Promise<Appointment | undefined> {
    const [appointment] = await db
      .update(appointments)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(appointments.id, id))
      .returning();
    return appointment || undefined;
  }

  async deleteAppointment(id: string): Promise<boolean> {
    const result = await db
      .delete(appointments)
      .where(eq(appointments.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getClinicalNotes(patientId?: string, practitionerId?: string): Promise<ClinicalNote[]> {
    let query = db
      .select()
      .from(clinicalNotes)
      .orderBy(desc(clinicalNotes.createdAt));

    if (patientId) {
      query = query.where(eq(clinicalNotes.patientId, patientId)) as any;
    }
    if (practitionerId) {
      query = query.where(eq(clinicalNotes.practitionerId, practitionerId)) as any;
    }

    return await query;
  }

  async getClinicalNote(id: string): Promise<ClinicalNote | undefined> {
    const [note] = await db.select().from(clinicalNotes).where(eq(clinicalNotes.id, id));
    return note || undefined;
  }

  async createClinicalNote(insertNote: InsertClinicalNote): Promise<ClinicalNote> {
    const [note] = await db
      .insert(clinicalNotes)
      .values(insertNote)
      .returning();
    return note;
  }

  async updateClinicalNote(id: string, updates: Partial<ClinicalNote>): Promise<ClinicalNote | undefined> {
    const [note] = await db
      .update(clinicalNotes)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(clinicalNotes.id, id))
      .returning();
    return note || undefined;
  }

  async getInvoices(patientId?: string, practitionerId?: string): Promise<Invoice[]> {
    const patientUsers = alias(users, 'patientUsers');
    const practitionerUsers = alias(users, 'practitionerUsers');
    
    let query = db
      .select({
        invoice: invoices,
        patient: patients,
        patientUser: patientUsers,
        practitioner: practitioners,
        practitionerUser: practitionerUsers
      })
      .from(invoices)
      .leftJoin(patients, eq(invoices.patientId, patients.id))
      .leftJoin(patientUsers, eq(patients.userId, patientUsers.id))
      .leftJoin(practitioners, eq(invoices.practitionerId, practitioners.id))
      .leftJoin(practitionerUsers, eq(practitioners.userId, practitionerUsers.id))
      .orderBy(desc(invoices.createdAt));

    if (patientId) {
      query = query.where(eq(invoices.patientId, patientId)) as any;
    }
    if (practitionerId) {
      query = query.where(eq(invoices.practitionerId, practitionerId)) as any;
    }

    const result = await query;
    
    return result.map(row => ({
      ...row.invoice,
      patient: row.patient ? {
        ...row.patient,
        user: row.patientUser ? {
          ...row.patientUser,
          firstName: row.patientUser.firstName,
          lastName: row.patientUser.lastName
        } : null
      } : null,
      practitioner: row.practitioner ? {
        ...row.practitioner,
        user: row.practitionerUser ? {
          ...row.practitionerUser,
          firstName: row.practitionerUser.firstName,
          lastName: row.practitionerUser.lastName
        } : null
      } : null
    }));
  }

  async getInvoice(id: string): Promise<Invoice | undefined> {
    const patientUsers = alias(users, 'patientUsers');
    const practitionerUsers = alias(users, 'practitionerUsers');
    
    const result = await db
      .select({
        invoice: invoices,
        patient: patients,
        patientUser: patientUsers,
        practitioner: practitioners,
        practitionerUser: practitionerUsers
      })
      .from(invoices)
      .leftJoin(patients, eq(invoices.patientId, patients.id))
      .leftJoin(patientUsers, eq(patients.userId, patientUsers.id))
      .leftJoin(practitioners, eq(invoices.practitionerId, practitioners.id))
      .leftJoin(practitionerUsers, eq(practitioners.userId, practitionerUsers.id))
      .where(eq(invoices.id, id));

    if (!result[0]) return undefined;

    const row = result[0];
    return {
      ...row.invoice,
      patient: row.patient ? {
        ...row.patient,
        user: row.patientUser ? {
          ...row.patientUser,
          firstName: row.patientUser.firstName,
          lastName: row.patientUser.lastName
        } : null
      } : null,
      practitioner: row.practitioner ? {
        ...row.practitioner,
        user: row.practitionerUser ? {
          ...row.practitionerUser,
          firstName: row.practitionerUser.firstName,
          lastName: row.practitionerUser.lastName
        } : null
      } : null
    } as any;
  }

  async createInvoice(insertInvoice: InsertInvoice): Promise<Invoice> {
    const [invoice] = await db
      .insert(invoices)
      .values(insertInvoice)
      .returning();
    return invoice;
  }

  async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice | undefined> {
    const [invoice] = await db
      .update(invoices)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(invoices.id, id))
      .returning();
    return invoice || undefined;
  }

  async getInvoicesWithSearch(search?: string, status?: string, limit: number = 50, offset: number = 0): Promise<Invoice[]> {
    const patientUsers = alias(users, 'patientUsers');
    const practitionerUsers = alias(users, 'practitionerUsers');
    
    let query = db
      .select({
        invoice: invoices,
        patient: patients,
        patientUser: patientUsers,
        practitioner: practitioners,
        practitionerUser: practitionerUsers
      })
      .from(invoices)
      .leftJoin(patients, eq(invoices.patientId, patients.id))
      .leftJoin(patientUsers, eq(patients.userId, patientUsers.id))
      .leftJoin(practitioners, eq(invoices.practitionerId, practitioners.id))
      .leftJoin(practitionerUsers, eq(practitioners.userId, practitionerUsers.id))
      .orderBy(desc(invoices.createdAt))
      .limit(limit)
      .offset(offset);

    const conditions = [];

    // Add search filter if provided
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(invoices.invoiceNumber, searchTerm),
          ilike(invoices.description, searchTerm)
        )!
      );
    }

    // Add status filter if provided
    if (status && status !== "all") {
      conditions.push(eq(invoices.status, status as any));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const result = await query;
    
    return result.map(row => ({
      ...row.invoice,
      patient: row.patient ? {
        ...row.patient,
        user: row.patientUser ? {
          ...row.patientUser,
          firstName: row.patientUser.firstName,
          lastName: row.patientUser.lastName
        } : null
      } : null,
      practitioner: row.practitioner ? {
        ...row.practitioner,
        user: row.practitionerUser ? {
          ...row.practitionerUser,
          firstName: row.practitionerUser.firstName,
          lastName: row.practitionerUser.lastName
        } : null
      } : null
    }));
  }

  async getInvoicesByPatientId(patientId: string, search?: string, status?: string, limit: number = 50, offset: number = 0): Promise<Invoice[]> {
    const patientUsers = alias(users, 'patientUsers');
    const practitionerUsers = alias(users, 'practitionerUsers');
    
    let query = db
      .select({
        invoice: invoices,
        patient: patients,
        patientUser: patientUsers,
        practitioner: practitioners,
        practitionerUser: practitionerUsers
      })
      .from(invoices)
      .leftJoin(patients, eq(invoices.patientId, patients.id))
      .leftJoin(patientUsers, eq(patients.userId, patientUsers.id))
      .leftJoin(practitioners, eq(invoices.practitionerId, practitioners.id))
      .leftJoin(practitionerUsers, eq(practitioners.userId, practitionerUsers.id))
      .where(eq(invoices.patientId, patientId))
      .orderBy(desc(invoices.createdAt))
      .limit(limit)
      .offset(offset);

    const conditions = [eq(invoices.patientId, patientId)];

    // Add search filter if provided
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(invoices.invoiceNumber, searchTerm),
          ilike(invoices.description, searchTerm)
        )!
      );
    }

    // Add status filter if provided
    if (status && status !== "all") {
      conditions.push(eq(invoices.status, status as any));
    }

    if (conditions.length > 1) {
      query = query.where(and(...conditions.slice(1))) as any;
    }

    const result = await query;
    
    return result.map(row => ({
      ...row.invoice,
      patient: row.patient ? {
        ...row.patient,
        user: row.patientUser ? {
          ...row.patientUser,
          firstName: row.patientUser.firstName,
          lastName: row.patientUser.lastName
        } : null
      } : null,
      practitioner: row.practitioner ? {
        ...row.practitioner,
        user: row.practitionerUser ? {
          ...row.practitionerUser,
          firstName: row.practitionerUser.firstName,
          lastName: row.practitionerUser.lastName
        } : null
      } : null
    }));
  }

  async getInvoicesByPractitionerId(practitionerId: string, search?: string, status?: string, limit: number = 50, offset: number = 0): Promise<Invoice[]> {
    const patientUsers = alias(users, 'patientUsers');
    const practitionerUsers = alias(users, 'practitionerUsers');
    
    let query = db
      .select({
        invoice: invoices,
        patient: patients,
        patientUser: patientUsers,
        practitioner: practitioners,
        practitionerUser: practitionerUsers
      })
      .from(invoices)
      .leftJoin(patients, eq(invoices.patientId, patients.id))
      .leftJoin(patientUsers, eq(patients.userId, patientUsers.id))
      .leftJoin(practitioners, eq(invoices.practitionerId, practitioners.id))
      .leftJoin(practitionerUsers, eq(practitioners.userId, practitionerUsers.id))
      .where(eq(invoices.practitionerId, practitionerId))
      .orderBy(desc(invoices.createdAt))
      .limit(limit)
      .offset(offset);

    const conditions = [eq(invoices.practitionerId, practitionerId)];

    // Add search filter if provided
    if (search && search.trim()) {
      const searchTerm = `%${search.trim()}%`;
      conditions.push(
        or(
          ilike(invoices.invoiceNumber, searchTerm),
          ilike(invoices.description, searchTerm)
        )!
      );
    }

    // Add status filter if provided
    if (status && status !== "all") {
      conditions.push(eq(invoices.status, status as any));
    }

    if (conditions.length > 1) {
      query = query.where(and(...conditions.slice(1))) as any;
    }

    const result = await query;
    
    return result.map(row => ({
      ...row.invoice,
      patient: row.patient ? {
        ...row.patient,
        user: row.patientUser ? {
          ...row.patientUser,
          firstName: row.patientUser.firstName,
          lastName: row.patientUser.lastName
        } : null
      } : null,
      practitioner: row.practitioner ? {
        ...row.practitioner,
        user: row.practitionerUser ? {
          ...row.practitionerUser,
          firstName: row.practitionerUser.firstName,
          lastName: row.practitionerUser.lastName
        } : null
      } : null
    }));
  }

  async getMessages(userId: string): Promise<MessageWithSender[]> {
    return await db
      .select({
        message: messages,
        sender: users,
        recipient: users
      })
      .from(messages)
      .leftJoin(users, eq(messages.senderId, users.id))
      .where(eq(messages.recipientId, userId))
      .orderBy(desc(messages.createdAt))
      .then(rows => rows.map(row => ({
        ...row.message,
        sender: row.sender!,
        recipient: row.recipient!
      })));
  }

  async getUnreadMessagesCount(userId: string): Promise<number> {
    const [result] = await db
      .select({ count: count() })
      .from(messages)
      .where(
        and(
          eq(messages.recipientId, userId),
          eq(messages.status, "unread")
        )
      );
    return result.count;
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db
      .insert(messages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async markMessageAsRead(id: string): Promise<boolean> {
    const result = await db
      .update(messages)
      .set({ status: "read", readAt: new Date() })
      .where(eq(messages.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  async getDashboardStats(practitionerId: string): Promise<{
    totalPatients: number;
    todayAppointments: number;
    totalRevenue: number;
    paidRevenue: number;
    outstandingRevenue: number;
  }> {
    // Get total patients count
    const [patientsCount] = await db
      .select({ count: count() })
      .from(patients);

    // Get today's appointments
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    const [todayCount] = await db
      .select({ count: count() })
      .from(appointments)
      .where(
        and(
          eq(appointments.practitionerId, practitionerId),
          gte(appointments.appointmentDate, startOfDay),
          lte(appointments.appointmentDate, endOfDay)
        )
      );

    // Get total revenue
    const [totalRevenueResult] = await db
      .select({ 
        total: sql<string>`COALESCE(SUM(CAST(${invoices.total} AS DECIMAL)), 0)::text` 
      })
      .from(invoices)
      .where(eq(invoices.practitionerId, practitionerId));

    // Get paid revenue
    const [paidRevenueResult] = await db
      .select({ 
        total: sql<string>`COALESCE(SUM(CAST(${invoices.total} AS DECIMAL)), 0)::text` 
      })
      .from(invoices)
      .where(
        and(
          eq(invoices.practitionerId, practitionerId),
          eq(invoices.status, "paid")
        )
      );

    const totalRevenue = Number(totalRevenueResult.total || 0);
    const paidRevenue = Number(paidRevenueResult.total || 0);
    const outstandingRevenue = totalRevenue - paidRevenue;

    return {
      totalPatients: patientsCount.count,
      todayAppointments: todayCount.count,
      totalRevenue: totalRevenue,
      paidRevenue: paidRevenue,
      outstandingRevenue: outstandingRevenue,
    };
  }

  // Calendar Settings methods
  async getCalendarSettings(practitionerId?: string): Promise<CalendarSettings | undefined> {
    if (!practitionerId) {
      return this.getGlobalCalendarSettings();
    }
    
    const [settings] = await db
      .select()
      .from(calendarSettings)
      .where(eq(calendarSettings.practitionerId, practitionerId));
    
    return settings || undefined;
  }

  async getGlobalCalendarSettings(): Promise<CalendarSettings | undefined> {
    const [settings] = await db
      .select()
      .from(calendarSettings)
      .where(eq(calendarSettings.isGlobal, true));
    
    return settings || undefined;
  }

  async createCalendarSettings(insertSettings: InsertCalendarSettings): Promise<CalendarSettings> {
    const [settings] = await db
      .insert(calendarSettings)
      .values([insertSettings])
      .returning();
    
    return settings;
  }

  async updateCalendarSettings(id: string, updates: Partial<CalendarSettings>): Promise<CalendarSettings | undefined> {
    const [settings] = await db
      .update(calendarSettings)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(calendarSettings.id, id))
      .returning();
    
    return settings || undefined;
  }

  // Telehealth Session methods
  async getTelehealthSessions(practitionerId?: string, patientId?: string): Promise<TelehealthSessionWithDetails[]> {
    const patientUsers = alias(users, 'patientUsers');
    const practitionerUsers = alias(users, 'practitionerUsers');
    
    let query = db
      .select({
        session: telehealthSessions,
        appointment: appointments,
        patient: patients,
        patientUser: patientUsers,
        practitioner: practitioners,
        practitionerUser: practitionerUsers
      })
      .from(telehealthSessions)
      .leftJoin(appointments, eq(telehealthSessions.appointmentId, appointments.id))
      .leftJoin(patients, eq(telehealthSessions.patientId, patients.id))
      .leftJoin(patientUsers, eq(patients.userId, patientUsers.id))
      .leftJoin(practitioners, eq(telehealthSessions.practitionerId, practitioners.id))
      .leftJoin(practitionerUsers, eq(practitioners.userId, practitionerUsers.id))
      .orderBy(desc(telehealthSessions.createdAt));

    const conditions = [];
    if (practitionerId) conditions.push(eq(telehealthSessions.practitionerId, practitionerId));
    if (patientId) conditions.push(eq(telehealthSessions.patientId, patientId));
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }

    const result = await query;
    
    return result.map(row => ({
      ...row.session,
      patient: {
        ...row.patient!,
        user: row.patientUser!
      },
      practitioner: {
        ...row.practitioner!,
        user: row.practitionerUser!
      },
      appointment: row.appointment || null
    }));
  }

  async getTelehealthSession(id: string): Promise<TelehealthSessionWithDetails | undefined> {
    const patientUsers = alias(users, 'patientUsers');
    const practitionerUsers = alias(users, 'practitionerUsers');
    
    const [result] = await db
      .select({
        session: telehealthSessions,
        appointment: appointments,
        patient: patients,
        patientUser: patientUsers,
        practitioner: practitioners,
        practitionerUser: practitionerUsers
      })
      .from(telehealthSessions)
      .leftJoin(appointments, eq(telehealthSessions.appointmentId, appointments.id))
      .leftJoin(patients, eq(telehealthSessions.patientId, patients.id))
      .leftJoin(patientUsers, eq(patients.userId, patientUsers.id))
      .leftJoin(practitioners, eq(telehealthSessions.practitionerId, practitioners.id))
      .leftJoin(practitionerUsers, eq(practitioners.userId, practitionerUsers.id))
      .where(eq(telehealthSessions.id, id));

    if (!result) return undefined;
    
    return {
      ...result.session,
      patient: {
        ...result.patient!,
        user: result.patientUser!
      },
      practitioner: {
        ...result.practitioner!,
        user: result.practitionerUser!
      },
      appointment: result.appointment || null
    };
  }

  async getTelehealthSessionByAppointmentId(appointmentId: string): Promise<TelehealthSession | undefined> {
    const [session] = await db
      .select()
      .from(telehealthSessions)
      .where(eq(telehealthSessions.appointmentId, appointmentId));
    return session || undefined;
  }

  async createTelehealthSession(insertSession: InsertTelehealthSession): Promise<TelehealthSession> {
    const [session] = await db
      .insert(telehealthSessions)
      .values([insertSession])
      .returning();
    return session;
  }

  async updateTelehealthSession(id: string, updates: Partial<TelehealthSession>): Promise<TelehealthSession | undefined> {
    const [session] = await db
      .update(telehealthSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(telehealthSessions.id, id))
      .returning();
    return session || undefined;
  }

  async startTelehealthSession(id: string): Promise<boolean> {
    const [updated] = await db
      .update(telehealthSessions)
      .set({ 
        status: "in_session", 
        sessionStartedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(telehealthSessions.id, id))
      .returning();
    return !!updated;
  }

  async joinTelehealthSession(id: string, isPatient: boolean): Promise<boolean> {
    const updateField = isPatient ? "patientJoinedAt" : "practitionerJoinedAt";
    const [updated] = await db
      .update(telehealthSessions)
      .set({ 
        [updateField]: new Date(),
        status: "waiting_room",
        updatedAt: new Date() 
      })
      .where(eq(telehealthSessions.id, id))
      .returning();
    return !!updated;
  }

  async endTelehealthSession(id: string): Promise<boolean> {
    const [updated] = await db
      .update(telehealthSessions)
      .set({ 
        status: "completed", 
        sessionEndedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(telehealthSessions.id, id))
      .returning();
    return !!updated;
  }

  // System Settings methods
  async getSystemSettings(): Promise<SystemSettings | undefined> {
    const [settings] = await db
      .select()
      .from(systemSettings)
      .limit(1);
    return settings || undefined;
  }

  async updateSystemSettings(updates: Partial<SystemSettings>): Promise<SystemSettings | undefined> {
    const [settings] = await db
      .update(systemSettings)
      .set({ ...updates, updatedAt: new Date() })
      .returning();
    return settings || undefined;
  }

  async createSystemSettings(settings: InsertSystemSettings): Promise<SystemSettings> {
    const [newSettings] = await db
      .insert(systemSettings)
      .values(settings)
      .returning();
    return newSettings;
  }

  // User Preferences methods
  async getUserPreferences(userId: string): Promise<UserPreferences | undefined> {
    const [preferences] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId));
    return preferences || undefined;
  }

  async updateUserPreferences(userId: string, updates: Partial<UserPreferences>): Promise<UserPreferences | undefined> {
    const [preferences] = await db
      .update(userPreferences)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(userPreferences.userId, userId))
      .returning();
    return preferences || undefined;
  }

  async createUserPreferences(preferences: InsertUserPreferences): Promise<UserPreferences> {
    const [newPreferences] = await db
      .insert(userPreferences)
      .values(preferences)
      .returning();
    return newPreferences;
  }
}

export const storage = new DatabaseStorage();