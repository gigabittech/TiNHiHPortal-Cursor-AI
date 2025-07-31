import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { db } from "./db";
import { integrationService } from "./integration-service";
import { notificationService } from "./notification-service";
import notificationRoutes from "./notification-routes";
import { eq, and, gte, lte, ilike, or, lt, desc, asc, count, sum, sql } from "drizzle-orm";
import { users, patients, practitioners, appointments, clinicalNotes, invoices, messages, telehealthSessions, systemSettings, userPreferences, calendarSettings } from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { insertUserSchema, insertPatientSchema, insertPractitionerSchema, insertAppointmentSchema, insertClinicalNoteSchema, insertInvoiceSchema, insertMessageSchema, insertTelehealthSessionSchema, insertSystemSettingsSchema, insertUserPreferencesSchema, insertCalendarSettingsSchema } from "@shared/schema";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Initialize Stripe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('Missing required Stripe secret: STRIPE_SECRET_KEY');
}
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2024-06-20",
});

// Middleware to verify JWT token
const verifyToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "Access token required" });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }
    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid token" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "User already exists" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      // Create user
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });

      // Create patient or practitioner profile based on role
      if (user.role === "patient") {
        await storage.createPatient({
          userId: user.id,
          dateOfBirth: null, // Required field, set to null for now
        });
      } else if (user.role === "practitioner") {
        await storage.createPractitioner({
          userId: user.id,
        });
      }

      // Generate JWT
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "24h" });

      res.json({
        user: { ...user, password: undefined },
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(400).json({ message: "Registration failed" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = req.body;

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update last login
      await storage.updateUser(user.id, { lastLoginAt: new Date() });

      // Generate JWT
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "24h" });

      res.json({
        user: { ...user, password: undefined },
        token,
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(400).json({ message: "Login failed" });
    }
  });

  app.get("/api/auth/me", verifyToken, async (req: any, res) => {
    try {
      const user = req.user;
      let profile = null;

      if (user.role === "patient") {
        profile = await storage.getPatientByUserId(user.id);
      } else if (user.role === "practitioner") {
        profile = await storage.getPractitionerByUserId(user.id);
      }

      res.json({
        user: { ...user, password: undefined },
        profile,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({ message: "Failed to get user data" });
    }
  });

  // Dashboard routes
  app.get("/api/dashboard/stats", verifyToken, async (req: any, res) => {
    try {
      const user = req.user;
      let practitionerId = null;

      if (user.role === "practitioner") {
        const practitioner = await storage.getPractitionerByUserId(user.id);
        practitionerId = practitioner?.id;
      }

      // Admin users should see all stats across all practitioners
      if (user.role === "admin") {
        const totalPatients = await db.select({ count: count() }).from(patients);
        
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        
        const todayAppointments = await db
          .select({ count: count() })
          .from(appointments)
          .where(
            and(
              gte(appointments.appointmentDate, today),
              lt(appointments.appointmentDate, tomorrow)
            )
          );

        // Get total revenue across all practitioners
        const [totalRevenueResult] = await db
          .select({ 
            total: sql<string>`COALESCE(SUM(CAST(${invoices.total} AS DECIMAL)), 0)::text` 
          })
          .from(invoices);

        const [paidRevenueResult] = await db
          .select({ 
            total: sql<string>`COALESCE(SUM(CAST(${invoices.total} AS DECIMAL)), 0)::text` 
          })
          .from(invoices)
          .where(eq(invoices.status, "paid"));

        const totalRevenue = Number(totalRevenueResult.total || 0);
        const paidRevenue = Number(paidRevenueResult.total || 0);
        const outstandingRevenue = totalRevenue - paidRevenue;

        return res.json({
          totalPatients: totalPatients[0]?.count || 0,
          todayAppointments: todayAppointments[0]?.count || 0,
          totalRevenue: totalRevenue,
          paidRevenue: paidRevenue,
          outstandingRevenue: outstandingRevenue,
        });
      }

      // If no practitioner ID (staff, etc.), return default stats
      if (!practitionerId) {
        return res.json({
          totalPatients: 0,
          todayAppointments: 0,
          totalRevenue: 0,
          paidRevenue: 0,
          outstandingRevenue: 0
        });
      }

      const stats = await storage.getDashboardStats(practitionerId);
      res.json(stats);
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  // Dashboard insights endpoint
  app.get("/api/dashboard/insights", verifyToken, async (req: any, res) => {
    try {
      const user = req.user;
      let practitionerId = null;

      if (user.role === "practitioner") {
        const practitioner = await storage.getPractitionerByUserId(user.id);
        practitionerId = practitioner?.id;
      }

      // Calculate insights with growth percentages
      const currentDate = new Date();
      const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
      const previousMonthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth(), 0);

      let currentPatientsQuery = db.select({ count: count() }).from(patients)
        .where(gte(patients.createdAt, currentMonth));
      
      let previousPatientsQuery = db.select({ count: count() }).from(patients)
        .where(and(
          gte(patients.createdAt, previousMonth),
          lte(patients.createdAt, previousMonthEnd)
        ));

      let currentAppointmentsQuery = db.select({ count: count() }).from(appointments)
        .where(gte(appointments.createdAt, currentMonth));
      
      let previousAppointmentsQuery = db.select({ count: count() }).from(appointments)
        .where(and(
          gte(appointments.createdAt, previousMonth),
          lte(appointments.createdAt, previousMonthEnd)
        ));

      let currentRevenueQuery = db.select({ 
        total: sql<string>`COALESCE(SUM(CAST(${invoices.total} AS DECIMAL)), 0)::text` 
      }).from(invoices)
        .where(and(
          gte(invoices.createdAt, currentMonth),
          eq(invoices.status, "paid")
        ));
      
      let previousRevenueQuery = db.select({ 
        total: sql<string>`COALESCE(SUM(CAST(${invoices.total} AS DECIMAL)), 0)::text` 
      }).from(invoices)
        .where(and(
          gte(invoices.createdAt, previousMonth),
          lte(invoices.createdAt, previousMonthEnd),
          eq(invoices.status, "paid")
        ));

      // Filter by practitioner if not admin
      if (user.role !== "admin" && practitionerId) {
        currentAppointmentsQuery = currentAppointmentsQuery.where(eq(appointments.practitionerId, practitionerId)) as any;
        previousAppointmentsQuery = previousAppointmentsQuery.where(eq(appointments.practitionerId, practitionerId)) as any;
        currentRevenueQuery = currentRevenueQuery.where(eq(invoices.practitionerId, practitionerId)) as any;
        previousRevenueQuery = previousRevenueQuery.where(eq(invoices.practitionerId, practitionerId)) as any;
      }

      const [currentPatients, previousPatients, currentAppointments, previousAppointments, currentRevenue, previousRevenue] = await Promise.all([
        currentPatientsQuery,
        previousPatientsQuery,
        currentAppointmentsQuery,
        previousAppointmentsQuery,
        currentRevenueQuery,
        previousRevenueQuery
      ]);

      const currentPatientsCount = currentPatients[0]?.count || 0;
      const previousPatientsCount = previousPatients[0]?.count || 0;
      const currentAppointmentsCount = currentAppointments[0]?.count || 0;
      const previousAppointmentsCount = previousAppointments[0]?.count || 0;
      const currentRevenueAmount = Number(currentRevenue[0]?.total || 0);
      const previousRevenueAmount = Number(previousRevenue[0]?.total || 0);

      // Calculate growth percentages
      const patientsGrowth = previousPatientsCount > 0 ? 
        ((currentPatientsCount - previousPatientsCount) / previousPatientsCount) * 100 : 0;
      
      const appointmentsGrowth = previousAppointmentsCount > 0 ? 
        ((currentAppointmentsCount - previousAppointmentsCount) / previousAppointmentsCount) * 100 : 0;
      
      const revenueGrowth = previousRevenueAmount > 0 ? 
        ((currentRevenueAmount - previousRevenueAmount) / previousRevenueAmount) * 100 : 0;

      res.json({
        patientsGrowth,
        appointmentsGrowth,
        revenueGrowth,
        currentMonth: {
          totalPatients: currentPatientsCount,
          totalAppointments: currentAppointmentsCount,
          totalRevenue: currentRevenueAmount,
        },
        previousMonth: {
          totalPatients: previousPatientsCount,
          totalAppointments: previousAppointmentsCount,
          totalRevenue: previousRevenueAmount,
        }
      });
    } catch (error) {
      console.error("Get dashboard stats error:", error);
      res.status(500).json({ message: "Failed to get dashboard stats" });
    }
  });

  app.get("/api/dashboard/today-appointments", verifyToken, async (req: any, res) => {
    try {
      const user = req.user;
      let practitionerId = null;

      if (user.role === "practitioner") {
        const practitioner = await storage.getPractitionerByUserId(user.id);
        practitionerId = practitioner?.id;
      }

      // If no practitioner ID (admin, staff, etc.), return empty array
      if (!practitionerId) {
        return res.json([]);
      }

      const appointments = await storage.getTodayAppointments(practitionerId);
      res.json(appointments);
    } catch (error) {
      console.error("Get today appointments error:", error);
      res.status(500).json({ message: "Failed to get today's appointments" });
    }
  });

  // Patient routes
  app.get("/api/patients", verifyToken, async (req: any, res) => {
    try {
      const { limit = 50, offset = 0, search } = req.query;
      const patients = await storage.getPatients(search, parseInt(limit), parseInt(offset));
      res.json(patients);
    } catch (error) {
      console.error("Get patients error:", error);
      res.status(500).json({ message: "Failed to get patients" });
    }
  });

  app.get("/api/patients/:id", verifyToken, async (req, res) => {
    try {
      const patient = await storage.getPatient(req.params.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient not found" });
      }
      res.json(patient);
    } catch (error) {
      console.error("Get patient error:", error);
      res.status(500).json({ message: "Failed to get patient" });
    }
  });

  app.post("/api/patients", verifyToken, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body.user);
      
      // Prepare patient data without userId first, and handle date conversion
      const patientDataRaw = {
        ...req.body.patient,
        medications: Array.isArray(req.body.patient?.medications) ? req.body.patient.medications as string[] : [],
        allergies: Array.isArray(req.body.patient?.allergies) ? req.body.patient.allergies as string[] : [],
        medicalHistory: Array.isArray(req.body.patient?.medicalHistory) ? req.body.patient.medicalHistory as string[] : [],
        // Convert dateOfBirth string to Date object if provided
        dateOfBirth: req.body.patient?.dateOfBirth ? new Date(req.body.patient.dateOfBirth) : null,
      };

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 10);

      // Create user first
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
        role: "patient",
      });

      // Now parse patient data with userId included
      const patientData = insertPatientSchema.parse({
        ...patientDataRaw,
        userId: user.id,
      });

      // Create patient profile
      const patient = await storage.createPatient(patientData);

      res.status(201).json({ user: { ...user, password: undefined }, patient });
    } catch (error) {
      console.error("Create patient error:", error);
      res.status(400).json({ message: "Failed to create patient" });
    }
  });

  app.put("/api/patients/:id", verifyToken, async (req, res) => {
    try {
      // Get current patient to access userId
      const currentPatient = await storage.getPatient(req.params.id);
      if (!currentPatient) {
        return res.status(404).json({ message: "Patient not found" });
      }

      // Update user information if provided
      if (req.body.user) {
        const userUpdateData = insertUserSchema.partial().parse(req.body.user);
        
        // Remove password if empty (optional update)
        if (userUpdateData.password === "") {
          delete userUpdateData.password;
        } else if (userUpdateData.password) {
          // Hash password if provided
          userUpdateData.password = await bcrypt.hash(userUpdateData.password, 10);
        }

        await storage.updateUser(currentPatient.userId, userUpdateData);
      }

      // Update patient information if provided
      if (req.body.patient) {
        const patientDataRaw = {
          ...req.body.patient,
          medications: Array.isArray(req.body.patient?.medications) ? req.body.patient.medications as string[] : [],
          allergies: Array.isArray(req.body.patient?.allergies) ? req.body.patient.allergies as string[] : [],
          medicalHistory: Array.isArray(req.body.patient?.medicalHistory) ? req.body.patient.medicalHistory as string[] : [],
          // Convert dateOfBirth string to Date object if provided
          dateOfBirth: req.body.patient?.dateOfBirth ? new Date(req.body.patient.dateOfBirth) : null,
        };

        const patientData = insertPatientSchema.partial().parse(patientDataRaw);
        await storage.updatePatient(req.params.id, patientData);
      }

      // Return updated patient with user info
      const updatedPatient = await storage.getPatient(req.params.id);
      res.json(updatedPatient);
    } catch (error) {
      console.error("Update patient error:", error);
      res.status(400).json({ message: "Failed to update patient" });
    }
  });

  // Appointment routes
  app.get("/api/appointments", verifyToken, async (req: any, res) => {
    try {
      const { patientId, practitionerId, date, limit = 50, offset = 0 } = req.query;
      
      // If user is a patient, only show their appointments
      let filterPatientId = patientId;
      if (req.user.role === "patient") {
        const patient = await storage.getPatientByUserId(req.user.id);
        filterPatientId = patient?.id;
      }

      // If user is a practitioner, only show their appointments
      let filterPractitionerId = practitionerId;
      if (req.user.role === "practitioner") {
        const practitioner = await storage.getPractitionerByUserId(req.user.id);
        filterPractitionerId = practitioner?.id;
      }

      const appointments = await storage.getAppointments(filterPractitionerId, filterPatientId);
      
      res.json(appointments);
    } catch (error) {
      console.error("Get appointments error:", error);
      res.status(500).json({ message: "Failed to get appointments" });
    }
  });

  app.get("/api/appointments/:id", verifyToken, async (req, res) => {
    try {
      const appointment = await storage.getAppointment(req.params.id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      console.error("Get appointment error:", error);
      res.status(500).json({ message: "Failed to get appointment" });
    }
  });

  app.post("/api/appointments", verifyToken, async (req, res) => {
    try {
      // Convert appointmentDate string to Date if needed
      if (req.body.appointmentDate && typeof req.body.appointmentDate === 'string') {
        req.body.appointmentDate = new Date(req.body.appointmentDate);
      }
      
      const appointmentData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(appointmentData);
      res.status(201).json(appointment);
    } catch (error) {
      console.error("Create appointment error:", error);
      res.status(400).json({ message: "Failed to create appointment" });
    }
  });

  app.put("/api/appointments/:id", verifyToken, async (req, res) => {
    try {
      // Convert appointmentDate string to Date if needed
      if (req.body.appointmentDate && typeof req.body.appointmentDate === 'string') {
        req.body.appointmentDate = new Date(req.body.appointmentDate);
      }
      
      const appointmentData = insertAppointmentSchema.partial().parse(req.body);
      const updatedAppointment = await storage.updateAppointment(req.params.id, appointmentData);
      
      if (!updatedAppointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      res.json(updatedAppointment);
    } catch (error) {
      console.error("Update appointment error:", error);
      res.status(400).json({ message: "Failed to update appointment" });
    }
  });

  app.put("/api/appointments/:id", verifyToken, async (req, res) => {
    try {
      const appointmentData = insertAppointmentSchema.partial().parse(req.body);
      const appointment = await storage.updateAppointment(req.params.id, appointmentData);
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      res.json(appointment);
    } catch (error) {
      console.error("Update appointment error:", error);
      res.status(400).json({ message: "Failed to update appointment" });
    }
  });

  app.delete("/api/appointments/:id", verifyToken, async (req, res) => {
    try {
      const deleted = await storage.deleteAppointment(req.params.id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Delete appointment error:", error);
      res.status(500).json({ message: "Failed to delete appointment" });
    }
  });

  // Clinical notes routes
  app.get("/api/clinical-notes", verifyToken, async (req: any, res) => {
    try {
      const { patientId, practitionerId, limit = 50, offset = 0 } = req.query;
      
      // If user is a practitioner, only show their notes
      let filterPractitionerId = practitionerId;
      if (req.user.role === "practitioner") {
        const practitioner = await storage.getPractitionerByUserId(req.user.id);
        filterPractitionerId = practitioner?.id;
      }

      const notes = await storage.getClinicalNotes(patientId, filterPractitionerId);
      
      res.json(notes);
    } catch (error) {
      console.error("Get clinical notes error:", error);
      res.status(500).json({ message: "Failed to get clinical notes" });
    }
  });

  app.get("/api/clinical-notes/:id", verifyToken, async (req, res) => {
    try {
      const note = await storage.getClinicalNote(req.params.id);
      if (!note) {
        return res.status(404).json({ message: "Clinical note not found" });
      }
      res.json(note);
    } catch (error) {
      console.error("Get clinical note error:", error);
      res.status(500).json({ message: "Failed to get clinical note" });
    }
  });

  app.post("/api/clinical-notes", verifyToken, async (req, res) => {
    try {
      const noteData = insertClinicalNoteSchema.parse(req.body);
      const note = await storage.createClinicalNote(noteData);
      res.status(201).json(note);
    } catch (error) {
      console.error("Create clinical note error:", error);
      res.status(400).json({ message: "Failed to create clinical note" });
    }
  });

  app.put("/api/clinical-notes/:id", verifyToken, async (req, res) => {
    try {
      const noteData = insertClinicalNoteSchema.partial().parse(req.body);
      const note = await storage.updateClinicalNote(req.params.id, noteData);
      
      if (!note) {
        return res.status(404).json({ message: "Clinical note not found" });
      }
      
      res.json(note);
    } catch (error) {
      console.error("Update clinical note error:", error);
      res.status(400).json({ message: "Failed to update clinical note" });
    }
  });

  // Invoice routes
  app.get("/api/invoices", verifyToken, async (req: any, res) => {
    try {
      const { search, status, limit = 50, offset = 0 } = req.query;
      const user = req.user;
      
      console.log("Invoice API params:", { search, status, limit, userRole: user.role });
      
      // If user is a patient, only show their invoices
      if (user.role === "patient") {
        const patient = await storage.getPatientByUserId(user.id);
        if (!patient) {
          return res.json([]);
        }
        const invoices = await storage.getInvoicesByPatientId(patient.id, search, status, parseInt(limit), parseInt(offset));
        return res.json(invoices || []);
      }

      // If user is a practitioner, only show their invoices
      if (user.role === "practitioner") {
        const practitioner = await storage.getPractitionerByUserId(user.id);
        if (!practitioner) {
          return res.json([]);
        }
        const invoices = await storage.getInvoicesByPractitionerId(practitioner.id, search, status, parseInt(limit), parseInt(offset));
        return res.json(invoices || []);
      }

      // For admin/staff, show all invoices with search and filtering
      const invoices = await storage.getInvoicesWithSearch(search, status, parseInt(limit), parseInt(offset));
      console.log("Retrieved invoices for admin:", invoices?.length || 0);
      res.json(invoices || []);
    } catch (error) {
      console.error("Get invoices error:", error);
      res.status(500).json({ message: "Failed to get invoices" });
    }
  });

  app.get("/api/invoices/:id", verifyToken, async (req, res) => {
    try {
      const invoice = await storage.getInvoice(req.params.id);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      res.json(invoice);
    } catch (error) {
      console.error("Get invoice error:", error);
      res.status(500).json({ message: "Failed to get invoice" });
    }
  });

  app.post("/api/invoices", verifyToken, async (req, res) => {
    try {
      // Generate invoice number before validation
      const invoiceNumber = `INV-${Date.now()}`;
      
      // Handle date conversion
      const processedData = {
        ...req.body,
        invoiceNumber,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : null,
        appointmentId: req.body.appointmentId || null,
      };
      
      const invoiceData = insertInvoiceSchema.parse(processedData);
      const invoice = await storage.createInvoice(invoiceData);
      
      res.status(201).json(invoice);
    } catch (error) {
      console.error("Create invoice error:", error);
      res.status(400).json({ message: "Failed to create invoice" });
    }
  });

  app.put("/api/invoices/:id", verifyToken, async (req, res) => {
    try {
      const invoiceData = insertInvoiceSchema.partial().parse(req.body);
      const invoice = await storage.updateInvoice(req.params.id, invoiceData);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      res.json(invoice);
    } catch (error) {
      console.error("Update invoice error:", error);
      res.status(400).json({ message: "Failed to update invoice" });
    }
  });

  // Message routes
  app.get("/api/messages", verifyToken, async (req: any, res) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const messages = await storage.getMessages(req.user.id);
      res.json(messages);
    } catch (error) {
      console.error("Get messages error:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  app.get("/api/messages/unread-count", verifyToken, async (req: any, res) => {
    try {
      const count = await storage.getUnreadMessagesCount(req.user.id);
      res.json({ count });
    } catch (error) {
      console.error("Get unread messages count error:", error);
      res.status(500).json({ message: "Failed to get unread messages count" });
    }
  });

  app.post("/api/messages", verifyToken, async (req: any, res) => {
    try {
      const messageData = insertMessageSchema.parse({
        ...req.body,
        senderId: req.user.id,
      });
      
      const message = await storage.createMessage(messageData);
      res.status(201).json(message);
    } catch (error) {
      console.error("Create message error:", error);
      res.status(400).json({ message: "Failed to create message" });
    }
  });

  app.put("/api/messages/:id/read", verifyToken, async (req, res) => {
    try {
      const success = await storage.markMessageAsRead(req.params.id);
      
      if (!success) {
        return res.status(404).json({ message: "Message not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      console.error("Mark message as read error:", error);
      res.status(500).json({ message: "Failed to mark message as read" });
    }
  });

  // Telehealth session routes
  app.get("/api/telehealth-sessions", verifyToken, async (req: any, res) => {
    try {
      const { practitionerId, patientId } = req.query;
      const user = req.user;
      
      let filterPractitionerId = practitionerId;
      let filterPatientId = patientId;
      
      // Role-based filtering
      if (user.role === "practitioner") {
        const practitioner = await storage.getPractitionerByUserId(user.id);
        filterPractitionerId = practitioner?.id;
      } else if (user.role === "patient") {
        const patient = await storage.getPatientByUserId(user.id);
        filterPatientId = patient?.id;
      }
      
      const sessions = await storage.getTelehealthSessions(filterPractitionerId, filterPatientId);
      res.json(sessions);
    } catch (error) {
      console.error("Get telehealth sessions error:", error);
      res.status(500).json({ message: "Failed to get telehealth sessions" });
    }
  });

  app.get("/api/telehealth-sessions/:id", verifyToken, async (req, res) => {
    try {
      const session = await storage.getTelehealthSession(req.params.id);
      if (!session) {
        return res.status(404).json({ message: "Telehealth session not found" });
      }
      res.json(session);
    } catch (error) {
      console.error("Get telehealth session error:", error);
      res.status(500).json({ message: "Failed to get telehealth session" });
    }
  });

  app.post("/api/telehealth-sessions", verifyToken, async (req, res) => {
    try {
      const sessionData = insertTelehealthSessionSchema.parse(req.body);
      
      // Generate meeting URL based on platform
      const meetingUrl = generateMeetingUrl(sessionData.platform, sessionData.appointmentId);
      const meetingId = generateMeetingId();
      const passcode = generatePasscode();
      
      const sessionWithMeeting = {
        ...sessionData,
        meetingUrl,
        meetingId,
        passcode,
        hostKey: generateHostKey()
      };
      
      const session = await storage.createTelehealthSession(sessionWithMeeting);
      res.status(201).json(session);
    } catch (error) {
      console.error("Create telehealth session error:", error);
      res.status(400).json({ message: "Failed to create telehealth session" });
    }
  });

  app.put("/api/telehealth-sessions/:id", verifyToken, async (req, res) => {
    try {
      const sessionData = insertTelehealthSessionSchema.partial().parse(req.body);
      const session = await storage.updateTelehealthSession(req.params.id, sessionData);
      
      if (!session) {
        return res.status(404).json({ message: "Telehealth session not found" });
      }
      
      res.json(session);
    } catch (error) {
      console.error("Update telehealth session error:", error);
      res.status(400).json({ message: "Failed to update telehealth session" });
    }
  });

  app.post("/api/telehealth-sessions/:id/start", verifyToken, async (req, res) => {
    try {
      const success = await storage.startTelehealthSession(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Telehealth session not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Start telehealth session error:", error);
      res.status(500).json({ message: "Failed to start telehealth session" });
    }
  });

  app.post("/api/telehealth-sessions/:id/join", verifyToken, async (req: any, res) => {
    try {
      const { isPatient } = req.body;
      const success = await storage.joinTelehealthSession(req.params.id, isPatient || false);
      if (!success) {
        return res.status(404).json({ message: "Telehealth session not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Join telehealth session error:", error);
      res.status(500).json({ message: "Failed to join telehealth session" });
    }
  });

  app.post("/api/telehealth-sessions/:id/end", verifyToken, async (req, res) => {
    try {
      const success = await storage.endTelehealthSession(req.params.id);
      if (!success) {
        return res.status(404).json({ message: "Telehealth session not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("End telehealth session error:", error);
      res.status(500).json({ message: "Failed to end telehealth session" });
    }
  });

  // System Settings routes
  app.get("/api/system-settings", verifyToken, async (req: any, res) => {
    try {
      // Only admin users can access system settings
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      let settings = await storage.getSystemSettings();
      
      // Create default settings if none exist
      if (!settings) {
        settings = await storage.createSystemSettings({});
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Get system settings error:", error);
      res.status(500).json({ message: "Failed to get system settings" });
    }
  });

  app.put("/api/system-settings", verifyToken, async (req: any, res) => {
    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admin role required." });
      }
      
      const settingsData = insertSystemSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateSystemSettings(settingsData);
      
      if (!settings) {
        return res.status(404).json({ message: "System settings not found" });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Update system settings error:", error);
      res.status(400).json({ message: "Failed to update system settings" });
    }
  });

  // User Preferences routes
  app.get("/api/user-preferences", verifyToken, async (req: any, res) => {
    try {
      let preferences = await storage.getUserPreferences(req.user.id);
      
      // Create default preferences if none exist
      if (!preferences) {
        preferences = await storage.createUserPreferences({
          userId: req.user.id,
        });
      }
      
      res.json(preferences);
    } catch (error) {
      console.error("Get user preferences error:", error);
      res.status(500).json({ message: "Failed to get user preferences" });
    }
  });

  app.put("/api/user-preferences", verifyToken, async (req: any, res) => {
    try {
      const preferencesData = insertUserPreferencesSchema.partial().parse(req.body);
      let preferences = await storage.updateUserPreferences(req.user.id, preferencesData);
      
      // Create preferences if they don't exist
      if (!preferences) {
        preferences = await storage.createUserPreferences({
          userId: req.user.id,
          ...preferencesData,
        });
      }
      
      res.json(preferences);
    } catch (error) {
      console.error("Update user preferences error:", error);
      res.status(400).json({ message: "Failed to update user preferences" });
    }
  });

  // Integration API endpoints for cross-module workflows
  
  // Integrated appointment creation with cross-module workflows
  app.post("/api/integration/appointments", verifyToken, async (req: any, res) => {
    try {
      const appointmentData = insertAppointmentSchema.parse(req.body);
      const appointment = await integrationService.createIntegratedAppointment(appointmentData, req.user.id);
      res.json(appointment);
    } catch (error) {
      console.error("Create integrated appointment error:", error);
      res.status(400).json({ message: "Failed to create integrated appointment" });
    }
  });

  // Complete appointment workflow
  app.post("/api/integration/appointments/:id/complete", verifyToken, async (req: any, res) => {
    try {
      const { clinicalNoteId, invoiceId } = req.body;
      const appointment = await integrationService.completeAppointmentWorkflow(req.params.id, clinicalNoteId, invoiceId);
      res.json(appointment);
    } catch (error) {
      console.error("Complete appointment workflow error:", error);
      res.status(400).json({ message: "Failed to complete appointment workflow" });
    }
  });

  // Patient timeline - comprehensive view of all patient interactions
  app.get("/api/integration/patient-timeline/:patientId", verifyToken, async (req: any, res) => {
    try {
      const timeline = await integrationService.getPatientTimeline(req.params.patientId);
      res.json(timeline);
    } catch (error) {
      console.error("Get patient timeline error:", error);
      res.status(500).json({ message: "Failed to get patient timeline" });
    }
  });

  // Practitioner dashboard with cross-module insights
  app.get("/api/integration/practitioner-dashboard/:practitionerId", verifyToken, async (req: any, res) => {
    try {
      const dashboard = await integrationService.getPractitionerDashboard(req.params.practitionerId);
      res.json(dashboard);
    } catch (error) {
      console.error("Get practitioner dashboard error:", error);
      res.status(500).json({ message: "Failed to get practitioner dashboard" });
    }
  });

  // Cross-module search
  app.get("/api/integration/search", verifyToken, async (req: any, res) => {
    try {
      const query = req.query.q as string;
      if (!query || query.length < 2) {
        return res.json({ patients: [], appointments: [], notes: [], invoices: [] });
      }

      const [patients, appointments, notes, invoices] = await Promise.all([
        storage.getPatients(query, 10, 0),
        storage.getAppointments(undefined, undefined, query),
        storage.getClinicalNotes(),
        storage.getInvoices()
      ]);

      res.json({
        patients: patients.slice(0, 5),
        appointments: appointments.filter(a => 
          a.title.toLowerCase().includes(query.toLowerCase()) ||
          a.description?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5),
        notes: notes.filter(n => 
          n.subjective?.toLowerCase().includes(query.toLowerCase()) ||
          n.assessment?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5),
        invoices: invoices.filter(i => 
          i.description?.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5)
      });
    } catch (error) {
      console.error("Cross-module search error:", error);
      res.status(500).json({ message: "Failed to perform search" });
    }
  });

  // Contextual data for entity relationships
  app.get("/api/integration/contextual/:entityType/:entityId", verifyToken, async (req: any, res) => {
    try {
      const { entityType, entityId } = req.params;
      
      if (entityType === 'patient') {
        const [patient, recentAppointments, activeInvoices, clinicalNotes] = await Promise.all([
          storage.getPatient(entityId),
          storage.getAppointments(entityId),
          storage.getInvoices(entityId),
          storage.getClinicalNotes(entityId)
        ]);

        res.json({
          patient,
          recentAppointments: recentAppointments.slice(0, 5),
          activeInvoices: activeInvoices.filter(i => i.status !== 'paid').slice(0, 3),
          clinicalSummary: {
            totalNotes: clinicalNotes.length,
            lastNote: clinicalNotes[0]?.createdAt,
          }
        });
      } else {
        res.json({});
      }
    } catch (error) {
      console.error("Get contextual data error:", error);
      res.status(500).json({ message: "Failed to get contextual data" });
    }
  });

  // Get practitioners for appointment scheduling
  app.get("/api/practitioners", verifyToken, async (req, res) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      const practitioners = await storage.getPractitioners();
      res.json(practitioners);
    } catch (error) {
      console.error("Get practitioners error:", error);
      res.status(500).json({ message: "Failed to get practitioners" });
    }
  });

  // Mount notification routes
  app.use("/api/notifications", verifyToken, notificationRoutes);

  // Patient Portal API endpoints
  app.get("/api/patient/dashboard", verifyToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'patient') {
        return res.status(403).json({ message: "Access denied" });
      }

      const patient = await storage.getPatientByUserId(req.user.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient profile not found" });
      }

      res.json({ patient });
    } catch (error) {
      console.error("Get patient dashboard error:", error);
      res.status(500).json({ message: "Failed to get patient dashboard" });
    }
  });

  app.get("/api/patient/appointments", verifyToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'patient') {
        return res.status(403).json({ message: "Access denied" });
      }

      const patient = await storage.getPatientByUserId(req.user.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient profile not found" });
      }

      const appointments = await storage.getAppointments(patient.id);
      res.json(appointments);
    } catch (error) {
      console.error("Get patient appointments error:", error);
      res.status(500).json({ message: "Failed to get appointments" });
    }
  });

  app.get("/api/patient/appointments/upcoming", verifyToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'patient') {
        return res.status(403).json({ message: "Access denied" });
      }

      const patient = await storage.getPatientByUserId(req.user.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient profile not found" });
      }

      const appointments = await storage.getAppointments(patient.id);
      const upcoming = appointments.filter(apt => 
        new Date(apt.appointmentDate) >= new Date() && apt.status !== 'cancelled'
      );
      res.json(upcoming);
    } catch (error) {
      console.error("Get upcoming appointments error:", error);
      res.status(500).json({ message: "Failed to get upcoming appointments" });
    }
  });

  app.post("/api/patient/appointments", verifyToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'patient') {
        return res.status(403).json({ message: "Access denied" });
      }

      const patient = await storage.getPatientByUserId(req.user.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient profile not found" });
      }

      const appointmentData = {
        ...req.body,
        patientId: patient.id,
        status: 'scheduled' as const
      };

      const appointment = await storage.createAppointment(appointmentData);
      res.json(appointment);
    } catch (error) {
      console.error("Create patient appointment error:", error);
      res.status(400).json({ message: "Failed to create appointment" });
    }
  });

  app.get("/api/patient/medical-records", verifyToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'patient') {
        return res.status(403).json({ message: "Access denied" });
      }

      const patient = await storage.getPatientByUserId(req.user.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient profile not found" });
      }

      // For now, return empty array - this would connect to a document management system
      res.json([]);
    } catch (error) {
      console.error("Get medical records error:", error);
      res.status(500).json({ message: "Failed to get medical records" });
    }
  });

  app.get("/api/patient/test-results", verifyToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'patient') {
        return res.status(403).json({ message: "Access denied" });
      }

      const patient = await storage.getPatientByUserId(req.user.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient profile not found" });
      }

      // For now, return empty array - this would connect to lab systems
      res.json([]);
    } catch (error) {
      console.error("Get test results error:", error);
      res.status(500).json({ message: "Failed to get test results" });
    }
  });

  app.get("/api/patient/test-results/recent", verifyToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'patient') {
        return res.status(403).json({ message: "Access denied" });
      }

      const patient = await storage.getPatientByUserId(req.user.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient profile not found" });
      }

      // For now, return empty array - this would connect to lab systems
      res.json([]);
    } catch (error) {
      console.error("Get recent test results error:", error);
      res.status(500).json({ message: "Failed to get recent test results" });
    }
  });

  app.get("/api/patient/clinical-notes", verifyToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'patient') {
        return res.status(403).json({ message: "Access denied" });
      }

      const patient = await storage.getPatientByUserId(req.user.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient profile not found" });
      }

      const notes = await storage.getClinicalNotes(patient.id);
      res.json(notes);
    } catch (error) {
      console.error("Get patient clinical notes error:", error);
      res.status(500).json({ message: "Failed to get clinical notes" });
    }
  });

  app.get("/api/patient/messages", verifyToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'patient') {
        return res.status(403).json({ message: "Access denied" });
      }

      const messages = await storage.getMessages(req.user.id);
      res.json(messages);
    } catch (error) {
      console.error("Get patient messages error:", error);
      res.status(500).json({ message: "Failed to get messages" });
    }
  });

  app.get("/api/patient/messages/unread", verifyToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'patient') {
        return res.status(403).json({ message: "Access denied" });
      }

      const messages = await storage.getMessages(req.user.id);
      const unread = messages.filter(msg => msg.status === 'unread');
      res.json(unread);
    } catch (error) {
      console.error("Get unread messages error:", error);
      res.status(500).json({ message: "Failed to get unread messages" });
    }
  });

  app.get("/api/patient/invoices", verifyToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'patient') {
        return res.status(403).json({ message: "Access denied" });
      }

      const patient = await storage.getPatientByUserId(req.user.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient profile not found" });
      }

      const invoices = await storage.getInvoices(patient.id);
      res.json(invoices);
    } catch (error) {
      console.error("Get patient invoices error:", error);
      res.status(500).json({ message: "Failed to get invoices" });
    }
  });

  app.get("/api/patient/invoices/unpaid", verifyToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'patient') {
        return res.status(403).json({ message: "Access denied" });
      }

      const patient = await storage.getPatientByUserId(req.user.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient profile not found" });
      }

      const invoices = await storage.getInvoices(patient.id);
      const unpaid = invoices.filter(inv => inv.status !== 'paid');
      res.json(unpaid);
    } catch (error) {
      console.error("Get unpaid invoices error:", error);
      res.status(500).json({ message: "Failed to get unpaid invoices" });
    }
  });

  app.get("/api/patient/payment-history", verifyToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'patient') {
        return res.status(403).json({ message: "Access denied" });
      }

      const patient = await storage.getPatientByUserId(req.user.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient profile not found" });
      }

      // For now, return empty array - this would connect to payment history
      res.json([]);
    } catch (error) {
      console.error("Get payment history error:", error);
      res.status(500).json({ message: "Failed to get payment history" });
    }
  });

  app.patch("/api/patient/profile", verifyToken, async (req: any, res) => {
    try {
      if (req.user.role !== 'patient') {
        return res.status(403).json({ message: "Access denied" });
      }

      const patient = await storage.getPatientByUserId(req.user.id);
      if (!patient) {
        return res.status(404).json({ message: "Patient profile not found" });
      }

      // Update user info
      await storage.updateUser(req.user.id, {
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        email: req.body.email,
        phone: req.body.phone,
      });

      // Update patient info
      await storage.updatePatient(patient.id, {
        dateOfBirth: req.body.dateOfBirth,
        gender: req.body.gender,
        address: req.body.address,
        emergencyContact: req.body.emergencyContact,
        emergencyPhone: req.body.emergencyPhone,
        insuranceProvider: req.body.insuranceProvider,
        insuranceNumber: req.body.insuranceNumber,
      });

      res.json({ message: "Profile updated successfully" });
    } catch (error) {
      console.error("Update patient profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  });



  // Calendar Settings routes
  app.get("/api/calendar-settings", verifyToken, async (req: any, res) => {
    try {
      let practitionerId;
      if (req.user.role === "practitioner") {
        const practitioner = await storage.getPractitionerByUserId(req.user.id);
        practitionerId = practitioner?.id;
      }
      
      const settings = await storage.getCalendarSettings(practitionerId);
      
      // If no settings found, return default settings
      if (!settings) {
        const defaultSettings = {
          timeInterval: 60,
          bufferTime: 0,
          defaultStartTime: "09:00",
          defaultEndTime: "17:00",
          workingDays: [1, 2, 3, 4, 5],
          customWorkingHours: {},
          isGlobal: false
        };
        return res.json(defaultSettings);
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Get calendar settings error:", error);
      res.status(500).json({ message: "Failed to get calendar settings" });
    }
  });

  app.post("/api/calendar-settings", verifyToken, async (req: any, res) => {
    try {
      let practitionerId;
      if (req.user.role === "practitioner") {
        const practitioner = await storage.getPractitionerByUserId(req.user.id);
        practitionerId = practitioner?.id;
      }
      
      const settingsData = insertCalendarSettingsSchema.parse({
        ...req.body,
        practitionerId,
        isGlobal: req.user.role === "admin" && req.body.isGlobal
      });
      
      const settings = await storage.createCalendarSettings(settingsData);
      res.status(201).json(settings);
    } catch (error) {
      console.error("Create calendar settings error:", error);
      res.status(400).json({ message: "Failed to create calendar settings" });
    }
  });

  app.put("/api/calendar-settings/:id", verifyToken, async (req: any, res) => {
    try {
      const settingsData = insertCalendarSettingsSchema.partial().parse(req.body);
      const settings = await storage.updateCalendarSettings(req.params.id, settingsData);
      
      if (!settings) {
        return res.status(404).json({ message: "Calendar settings not found" });
      }
      
      res.json(settings);
    } catch (error) {
      console.error("Update calendar settings error:", error);
      res.status(400).json({ message: "Failed to update calendar settings" });
    }
  });

  // Payment Processing Routes
  app.post("/api/payments/create-intent", verifyToken, async (req, res) => {
    try {
      const { invoiceId, amount, currency = 'usd' } = req.body;

      // Verify invoice exists and user has permission
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }

      // Check if user is the patient or has admin/practitioner access
      const user = req.user;
      if (user.role === 'patient') {
        const patient = await storage.getPatientByUserId(user.id);
        if (!patient || invoice.patientId !== patient.id) {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount), // Amount in cents
        currency,
        metadata: {
          invoiceId,
          patientId: invoice.patientId,
          practitionerId: invoice.practitionerId,
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      res.json({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error: any) {
      console.error('Payment intent creation error:', error);
      res.status(500).json({ 
        message: "Error creating payment intent",
        error: error.message 
      });
    }
  });

  // Handle payment success webhook
  app.post("/api/payments/webhook", async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig!, process.env.STRIPE_WEBHOOK_SECRET || '');
    } catch (err: any) {
      console.log(`Webhook signature verification failed.`, err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        
        // Update invoice status to paid
        const invoiceId = paymentIntent.metadata.invoiceId;
        if (invoiceId) {
          await storage.updateInvoice(invoiceId, {
            status: "paid",
            paidAt: new Date().toISOString(),
          });

          // Create notification
          await notificationService.createNotification({
            userId: paymentIntent.metadata.patientId || '',
            title: "Payment Successful",
            message: `Your payment of $${(paymentIntent.amount / 100).toFixed(2)} has been processed successfully.`,
            type: "payment",
            relatedId: invoiceId,
          });
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        const failedInvoiceId = failedPayment.metadata.invoiceId;
        
        if (failedInvoiceId) {
          // Create notification about failed payment
          await notificationService.createNotification({
            userId: failedPayment.metadata.patientId || '',
            title: "Payment Failed",
            message: `Your payment attempt for $${(failedPayment.amount / 100).toFixed(2)} was unsuccessful. Please try again.`,
            type: "payment",
            relatedId: failedInvoiceId,
          });
        }
        break;

      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    res.json({ received: true });
  });

  // Get payment history
  app.get("/api/payments", verifyToken, async (req, res) => {
    try {
      const { patientId, invoiceId, status, search } = req.query;
      const user = req.user;

      // Build query parameters for Stripe
      const params: any = {
        limit: 100,
      };

      if (status && status !== 'all') {
        params.status = status;
      }

      // Get payments from Stripe
      const payments = await stripe.paymentIntents.list(params);
      
      // Filter by metadata if needed
      let filteredPayments = payments.data;
      
      if (patientId) {
        filteredPayments = filteredPayments.filter(p => p.metadata.patientId === patientId);
      }
      
      if (invoiceId) {
        filteredPayments = filteredPayments.filter(p => p.metadata.invoiceId === invoiceId);
      }

      // Remove duplicates by keeping only the latest payment per invoice
      if (invoiceId) {
        // For single invoice, only show unique payments (remove duplicate intents)
        const seenStatuses = new Set();
        filteredPayments = filteredPayments.filter(payment => {
          const key = `${payment.metadata.invoiceId}-${payment.status}`;
          if (seenStatuses.has(key) && payment.status !== 'succeeded') {
            return false; // Skip duplicate non-successful payments
          }
          seenStatuses.add(key);
          return true;
        });
      }

      // If user is a patient, only show their payments
      if (user.role === 'patient') {
        const patient = await storage.getPatientByUserId(user.id);
        if (patient) {
          filteredPayments = filteredPayments.filter(p => p.metadata.patientId === patient.id);
        }
      }

      // Enhance with invoice data
      const enhancedPayments = await Promise.all(
        filteredPayments.map(async (payment) => {
          let invoice = null;
          if (payment.metadata.invoiceId) {
            try {
              invoice = await storage.getInvoice(payment.metadata.invoiceId);
            } catch (error) {
              console.error('Error fetching invoice:', error);
            }
          }
          
          return {
            id: payment.id,
            amount: payment.amount,
            currency: payment.currency,
            status: payment.status,
            created_at: new Date(payment.created * 1000).toISOString(),
            payment_method: payment.payment_method_types?.[0] ? {
              type: payment.payment_method_types[0]
            } : null,
            failure_message: payment.last_payment_error?.message,
            invoice,
            metadata: payment.metadata,
          };
        })
      );

      res.json(enhancedPayments);
    } catch (error: any) {
      console.error('Payment history error:', error);
      res.status(500).json({ 
        message: "Error fetching payment history",
        error: error.message 
      });
    }
  });

  // Refund payment
  app.post("/api/payments/:paymentIntentId/refund", verifyToken, async (req, res) => {
    try {
      const { paymentIntentId } = req.params;
      const { amount, reason } = req.body;
      const user = req.user;

      // Only admin and practitioners can issue refunds
      if (user.role === 'patient') {
        return res.status(403).json({ message: "Access denied" });
      }

      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined, // Partial refund if amount specified
        reason: reason || 'requested_by_customer',
      });

      // Get payment intent to update invoice if needed
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      const invoiceId = paymentIntent.metadata.invoiceId;
      
      if (invoiceId && !amount) {
        // Full refund - update invoice status
        await storage.updateInvoice(invoiceId, {
          status: "refunded",
        });
      }

      res.json({
        refund,
        message: "Refund processed successfully"
      });
    } catch (error: any) {
      console.error('Refund error:', error);
      res.status(500).json({ 
        message: "Error processing refund",
        error: error.message 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions for telehealth meeting generation
function generateMeetingUrl(platform: string, appointmentId: string): string {
  const baseUrls = {
    zoom: "https://zoom.us/j/",
    teams: "https://teams.microsoft.com/l/meetup-join/",
    google_meet: "https://meet.google.com/"
  };
  
  const meetingId = generateMeetingId();
  
  switch (platform) {
    case "zoom":
      return `${baseUrls.zoom}${meetingId}`;
    case "teams":
      return `${baseUrls.teams}${meetingId}`;
    case "google_meet":
      return `${baseUrls.google_meet}${meetingId}`;
    default:
      return `${baseUrls.zoom}${meetingId}`;
  }
}

function generateMeetingId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

function generatePasscode(): string {
  return Math.random().toString(10).substring(2, 8);
}

function generateHostKey(): string {
  return Math.random().toString(36).substring(2, 15);
}
