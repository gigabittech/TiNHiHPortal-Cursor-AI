import type { Express } from "express";
import { createServer, type Server } from "http";
import Stripe from "stripe";
import { storage } from "./storage";
import { db } from "./db";
import { integrationService } from "./integration-service";
import { notificationService } from "./notification-service";
import notificationRoutes from "./notification-routes";
import { eq, and, gte, lte, ilike, or, lt, desc, asc, count, sum, sql } from "drizzle-orm";
import { users, patients, practitioners, appointments, clinicalNotes, invoices, messages, telehealthSessions, systemSettings, userPreferences, calendarSettings, bookingSettings } from "@shared/schema";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { insertUserSchema, insertPatientSchema, insertPractitionerSchema, insertAppointmentSchema, insertClinicalNoteSchema, insertInvoiceSchema, insertMessageSchema, insertTelehealthSessionSchema, insertSystemSettingsSchema, insertUserPreferencesSchema, insertCalendarSettingsSchema } from "@shared/schema";
import { format } from "date-fns";
import { isSameDay } from "date-fns";
import nodemailer from "nodemailer";
import crypto from "crypto";

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
        try {
          await storage.createPatient({
            userId: user.id,
            dateOfBirth: null, // Required field, set to null for now
          });
        } catch (patientError) {
          console.error("Patient creation error:", patientError);
          // Delete the user if patient creation fails
          await storage.updateUser(user.id, { isActive: false });
          return res.status(400).json({ message: "Failed to create patient profile" });
        }
      } else if (user.role === "practitioner") {
        try {
          await storage.createPractitioner({
            userId: user.id,
          });
        } catch (practitionerError) {
          console.error("Practitioner creation error:", practitionerError);
          // Delete the user if practitioner creation fails
          await storage.updateUser(user.id, { isActive: false });
          return res.status(400).json({ message: "Failed to create practitioner profile" });
        }
      }

      // Generate JWT
      const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "24h" });

      res.json({
        user: { ...user, password: undefined },
        token,
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(400).json({ message: "Registration failed" });
      }
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

  // Forgot password functionality
  app.post("/api/auth/forgot-password", async (req, res) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if user exists or not for security
        return res.json({ message: "If an account with that email exists, a password reset link has been sent." });
      }

      // Generate reset token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour from now

      // Store reset token in user record (you might want to add these fields to your schema)
      await storage.updateUser(user.id, {
        resetToken,
        resetTokenExpiry,
      });

      // Create email transporter (only if email is configured)
      let transporter = null;
      if (process.env.SMTP_USER && process.env.SMTP_PASS) {
        transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST || 'smtp.gmail.com',
          port: parseInt(process.env.SMTP_PORT || '587'),
          secure: false, // true for 465, false for other ports
          auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
          },
        });
      }

      // Create reset URL
      const resetUrl = `${process.env.CLIENT_BASE_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

      // Email content
      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@tinhih.org',
        to: email,
        subject: 'Password Reset Request - TiNHiH Foundation',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #f8f9fa; padding: 20px; text-align: center;">
              <h2 style="color: #2c3e50; margin: 0;">TiNHiH Foundation</h2>
              <p style="color: #7f8c8d; margin: 10px 0;">Password Reset Request</p>
            </div>
            <div style="padding: 30px; background-color: white;">
              <h3 style="color: #2c3e50; margin-bottom: 20px;">Hello ${user.firstName},</h3>
              <p style="color: #34495e; line-height: 1.6; margin-bottom: 20px;">
                We received a request to reset your password for your TiNHiH Foundation account. 
                If you didn't make this request, you can safely ignore this email.
              </p>
              <p style="color: #34495e; line-height: 1.6; margin-bottom: 30px;">
                To reset your password, click the button below:
              </p>
              <div style="text-align: center; margin-bottom: 30px;">
                <a href="${resetUrl}" 
                   style="background-color: #3498db; color: white; padding: 12px 30px; 
                          text-decoration: none; border-radius: 5px; display: inline-block; 
                          font-weight: bold;">
                  Reset Password
                </a>
              </div>
              <p style="color: #7f8c8d; font-size: 14px; margin-bottom: 20px;">
                This link will expire in 1 hour for security reasons.
              </p>
              <p style="color: #7f8c8d; font-size: 14px;">
                If the button doesn't work, copy and paste this link into your browser:<br>
                <a href="${resetUrl}" style="color: #3498db;">${resetUrl}</a>
              </p>
            </div>
            <div style="background-color: #ecf0f1; padding: 20px; text-align: center;">
              <p style="color: #7f8c8d; font-size: 12px; margin: 0;">
                © 2024 TiNHiH Foundation. All rights reserved.
              </p>
            </div>
          </div>
        `,
      };

      // Send email (only if email is configured)
      if (transporter && process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          await transporter!.sendMail(mailOptions);
          console.log(`Password reset email sent to ${email}`);
        } catch (emailError) {
          console.error("Email sending failed:", emailError);
          // In development, we can still proceed without email
          if (process.env.NODE_ENV === 'development') {
            console.log(`Development mode: Password reset link would be: ${resetUrl}`);
          }
        }
      } else {
        console.log(`Email not configured. Password reset link would be: ${resetUrl}`);
        if (process.env.NODE_ENV === 'development') {
          console.log(`\n🔗 DEVELOPMENT MODE - Password Reset Link:`);
          console.log(`   ${resetUrl}`);
          console.log(`   Token: ${resetToken}`);
          console.log(`   Expires: ${resetTokenExpiry.toISOString()}\n`);
        }
      }

      res.json({ message: "If an account with that email exists, a password reset link has been sent." });
    } catch (error) {
      console.error("Forgot password error:", error);
      res.status(500).json({ message: "Failed to process password reset request" });
    }
  });

  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { token, newPassword } = req.body;

      if (!token || !newPassword) {
        return res.status(400).json({ message: "Token and new password are required" });
      }

      // Find user by reset token
      const [user] = await db.select().from(users).where(eq(users.resetToken, token));
      
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Check if token is expired
      if (user.resetTokenExpiry && new Date() > new Date(user.resetTokenExpiry)) {
        return res.status(400).json({ message: "Reset token has expired" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

      // Update user with new password and clear reset token
      await storage.updateUser(user.id, {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      });

      res.json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      res.status(500).json({ message: "Failed to reset password" });
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
      const { practitionerId, patientId } = req.query;
      const user = req.user;
      
      console.log("Fetching appointments with filters:", { practitionerId, patientId, userRole: user.role });
      
      let appointments;
      
      // If user is a practitioner, get their appointments by default
      if (user.role === "practitioner") {
        const practitioner = await storage.getPractitionerByUserId(user.id);
        if (practitioner) {
          appointments = await storage.getAppointments(practitioner.id, patientId);
        } else {
          appointments = [];
        }
      } else {
        // For other roles, use the provided filters
        appointments = await storage.getAppointments(practitionerId, patientId);
      }
      
      console.log("Retrieved appointments:", appointments.length, "appointments");
      
      res.json(appointments);
    } catch (error) {
      console.error("Get appointments error:", error);
      res.status(500).json({ message: "Failed to get appointments" });
    }
  });

  app.get("/api/appointments/available-slots", verifyToken, async (req: any, res) => {
    try {
      const { date, practitionerId } = req.query;
      
      if (!date || !practitionerId) {
        return res.status(400).json({ 
          message: "Date and practitionerId are required" 
        });
      }
      
      const selectedDate = new Date(date);
      const existingAppointments = await storage.getAppointments(practitionerId);
      
      // Get calendar settings for this practitioner
      const calendarSettings = await storage.getCalendarSettings(practitionerId);
      const settings = calendarSettings || {
        timeInterval: 60,
        defaultStartTime: "09:00",
        defaultEndTime: "17:00",
        bufferTime: 0
      };
      
      // Generate time slots
      const [startHour, startMin] = settings.defaultStartTime.split(':').map(Number);
      const [endHour, endMin] = settings.defaultEndTime.split(':').map(Number);
      
      let currentMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const availableSlots = [];
      
      while (currentMinutes < endMinutes) {
        const hour = Math.floor(currentMinutes / 60);
        const min = currentMinutes % 60;
        const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        
        // Check if this time slot is available
        const slotDateTime = new Date(selectedDate);
        slotDateTime.setHours(hour, min, 0, 0);
        
        // Skip if slot is in the past
        if (slotDateTime < new Date()) {
          currentMinutes += settings.timeInterval;
          continue;
        }
        
        const slotEndTime = new Date(slotDateTime.getTime() + 60 * 60000); // Default 1 hour
        const bufferStartTime = new Date(slotDateTime.getTime() - settings.bufferTime * 60000);
        const bufferEndTime = new Date(slotEndTime.getTime() + settings.bufferTime * 60000);
        
        const hasConflict = existingAppointments.some((apt: any) => {
          if (!isSameDay(new Date(apt.appointmentDate), selectedDate)) return false;
          
          const existingDateTime = new Date(apt.appointmentDate);
          const existingEndTime = new Date(existingDateTime.getTime() + (apt.duration || 60) * 60000);
          
          return (
            (slotDateTime < existingEndTime && slotEndTime > existingDateTime) ||
            (existingDateTime < bufferEndTime && existingEndTime > bufferStartTime)
          );
        });
        
        if (!hasConflict) {
          availableSlots.push({
            time: timeString,
            label: format(slotDateTime, 'h:mm a'),
            isAvailable: true
          });
        }
        
        currentMinutes += settings.timeInterval;
      }
      
      res.json(availableSlots);
    } catch (error) {
      console.error("Get available slots error:", error);
      res.status(500).json({ message: "Failed to get available slots" });
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
      console.log("Creating appointment with data:", req.body);
      
      // Convert appointmentDate string to Date if needed
      if (req.body.appointmentDate && typeof req.body.appointmentDate === 'string') {
        req.body.appointmentDate = new Date(req.body.appointmentDate);
      }
      
      const appointmentData = insertAppointmentSchema.parse(req.body);
      console.log("Parsed appointment data:", appointmentData);
      
      // Validate appointment is not in the past
      const appointmentDateTime = new Date(appointmentData.appointmentDate);
      const now = new Date();
      
      if (appointmentDateTime < now) {
        return res.status(400).json({ 
          message: "Cannot create appointments in the past" 
        });
      }
      
      // Check for scheduling conflicts
      const existingAppointments = await storage.getAppointments(appointmentData.practitionerId);
      const appointmentEndTime = new Date(appointmentDateTime.getTime() + (appointmentData.duration || 60) * 60000);
      
      // Get calendar settings for buffer time
      const practitioner = await storage.getPractitionerByUserId(req.user.id);
      const calendarSettings = await storage.getCalendarSettings(practitioner?.id);
      const bufferTime = calendarSettings?.bufferTime || 0;
      
      const hasConflict = existingAppointments.some((apt: any) => {
        const existingDateTime = new Date(apt.appointmentDate);
        const existingEndTime = new Date(existingDateTime.getTime() + (apt.duration || 60) * 60000);
        
        // Check if appointments overlap (including buffer time)
        const bufferStartTime = new Date(appointmentDateTime.getTime() - bufferTime * 60000);
        const bufferEndTime = new Date(appointmentEndTime.getTime() + bufferTime * 60000);
        
        return (
          (appointmentDateTime < existingEndTime && appointmentEndTime > existingDateTime) ||
          (existingDateTime < bufferEndTime && existingEndTime > bufferStartTime)
        );
      });
      
      if (hasConflict) {
        return res.status(409).json({ 
          message: "There is already an appointment scheduled at this time for this practitioner" 
        });
      }
      
      const appointment = await storage.createAppointment(appointmentData);
      console.log("Created appointment:", appointment);
      
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

  // =============================================================================
  // PUBLIC BOOKING ROUTES
  // =============================================================================

  // Get practitioner by booking link
  app.get("/api/public/practitioner/:bookingLink", async (req, res) => {
    try {
      const { bookingLink } = req.params;
      
      const practitioner = await db.query.practitioners.findFirst({
        where: eq(practitioners.bookingLink, bookingLink),
        with: {
          user: true,
        },
      });

      if (!practitioner) {
        return res.status(404).json({ message: "Practitioner not found" });
      }

      res.json(practitioner);
    } catch (error: any) {
      console.error('Get practitioner by booking link error:', error);
      res.status(500).json({ 
        message: "Error fetching practitioner",
        error: error.message 
      });
    }
  });

  // Get available time slots for a practitioner
  app.get("/api/public/available-slots/:bookingLink", async (req, res) => {
    try {
      const { bookingLink } = req.params;
      const { date } = req.query;
      
      if (!date) {
        return res.status(400).json({ message: "Date parameter is required" });
      }

      const practitioner = await db.query.practitioners.findFirst({
        where: eq(practitioners.bookingLink, bookingLink),
      });

      if (!practitioner) {
        return res.status(404).json({ message: "Practitioner not found" });
      }

      // Get practitioner's calendar settings
      const calendarSettingsData = await db.query.calendarSettings.findFirst({
        where: eq(calendarSettings.practitionerId, practitioner.id),
      });

      const settings = calendarSettingsData || {
        timeInterval: 60,
        defaultStartTime: "09:00",
        defaultEndTime: "17:00",
        bufferTime: 0,
        workingDays: [1, 2, 3, 4, 5] // Monday to Friday
      };

      // Ensure timeInterval is set
      if (!settings.timeInterval) {
        settings.timeInterval = 60;
      }

      // Get existing appointments for the date
      const targetDate = new Date(date as string);
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const existingAppointments = await db.query.appointments.findMany({
        where: and(
          eq(appointments.practitionerId, practitioner.id),
          gte(appointments.appointmentDate, startOfDay),
          lte(appointments.appointmentDate, endOfDay)
        ),
      });

      // Generate available time slots
      const [startHour, startMin] = settings.defaultStartTime.split(':').map(Number);
      const [endHour, endMin] = settings.defaultEndTime.split(':').map(Number);
      
      let currentMinutes = startHour * 60 + startMin;
      const endMinutes = endHour * 60 + endMin;
      const timeSlots = [];

      while (currentMinutes < endMinutes) {
        const hour = Math.floor(currentMinutes / 60);
        const min = currentMinutes % 60;
        const timeString = `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
        
        // Check if this time slot conflicts with existing appointments
        const slotDateTime = new Date(targetDate);
        slotDateTime.setHours(hour, min, 0, 0);
        
        // Check if slot is in the past
        if (slotDateTime <= new Date()) {
          continue; // Skip past slots
        }
        
        const conflictingAppointments = existingAppointments.filter(apt => {
          const aptStart = new Date(apt.appointmentDate);
          const aptEnd = new Date(aptStart.getTime() + (apt.duration || 30) * 60000);
          const slotEnd = new Date(slotDateTime.getTime() + settings.timeInterval * 60000);
          
          // Check for overlap: if appointment overlaps with slot
          return (
            (aptStart < slotEnd && aptEnd > slotDateTime) ||
            (slotDateTime < aptEnd && slotEnd > aptStart)
          );
        });

        if (conflictingAppointments.length === 0) {
          timeSlots.push({
            time: timeString,
            available: true
          });
        } else {
          console.log(`Slot ${timeString} conflicts with ${conflictingAppointments.length} existing appointment(s)`);
        }
        
        currentMinutes += settings.timeInterval;
      }

      res.json(timeSlots);
    } catch (error: any) {
      console.error('Get available slots error:', error);
      res.status(500).json({ 
        message: "Error fetching available slots",
        error: error.message 
      });
    }
  });

  // Book appointment via public link
  app.post("/api/public/book-appointment", async (req, res) => {
    try {
      console.log('Received booking request:', req.body);
      
      const { 
        practitionerId, 
        firstName, 
        lastName, 
        email, 
        phone, 
        appointmentDate, 
        appointmentTime,
        type,
        duration,
        reason,
        additionalNotes,
        bookingLink 
      } = req.body;

      // Verify the booking link matches the practitioner
      console.log('Looking for practitioner with ID:', practitionerId, 'and booking link:', bookingLink);
      
      const practitioner = await db.query.practitioners.findFirst({
        where: and(
          eq(practitioners.id, practitionerId),
          eq(practitioners.bookingLink, bookingLink)
        ),
      });

      console.log('Found practitioner:', practitioner);

      if (!practitioner) {
        console.error('Practitioner not found for ID:', practitionerId, 'and booking link:', bookingLink);
        return res.status(404).json({ message: "Invalid booking link" });
      }

      // Check if user exists, create if not
      console.log('Checking for existing user with email:', email);
      let user = await storage.getUserByEmail(email);
      console.log('Found user:', user ? { id: user.id, email: user.email } : 'Not found');
      
      if (!user) {
        console.log('Creating new user account');
        // Create new user account
        const hashedPassword = await bcrypt.hash(Math.random().toString(36), 10);
        user = await storage.createUser({
          email,
          password: hashedPassword,
          firstName,
          lastName,
          role: "patient",
          isActive: true,
        });
        console.log('Created new user:', { id: user.id, email: user.email });
      }

      // Check if patient profile exists, create if not
      console.log('Checking for existing patient with user ID:', user.id);
      let patient = await db.query.patients.findFirst({
        where: eq(patients.userId, user.id),
      });
      console.log('Found patient:', patient ? { id: patient.id, userId: patient.userId } : 'Not found');

      if (!patient) {
        console.log('Creating new patient profile');
        patient = await storage.createPatient({
          userId: user.id,
          dateOfBirth: null,
          phoneNumber: phone,
        });
        console.log('Created new patient:', { id: patient.id, userId: patient.userId });
      }

      // Create appointment
      let appointmentDateTime;
      if (appointmentDate) {
        // Parse the date and time components
        const [year, month, day] = appointmentDate.split('-').map(Number);
        const [hours, minutes] = appointmentTime.split(':').map(Number);
        
        // Create the date in the local timezone
        appointmentDateTime = new Date(year, month - 1, day, hours, minutes, 0, 0);
        
        // Convert to UTC for database storage
        const utcTime = appointmentDateTime.getTime() - (appointmentDateTime.getTimezoneOffset() * 60000);
        appointmentDateTime = new Date(utcTime);
      } else {
        // Fallback if appointmentDate is not provided
        appointmentDateTime = new Date();
        const [hours, minutes] = appointmentTime.split(':').map(Number);
        appointmentDateTime.setHours(hours, minutes, 0, 0);
      }

      console.log('Creating appointment with data:', {
        patientId: patient.id,
        practitionerId,
        appointmentDate,
        appointmentTime,
        reason,
        duration,
        appointmentDateTime: appointmentDateTime.toISOString(),
        timezoneOffset: appointmentDateTime.getTimezoneOffset(),
        localTime: new Date().toLocaleString(),
        utcTime: new Date().toISOString()
      });

      console.log('Appointment date time:', appointmentDateTime);

      // Check for conflicting appointments before creating
      const appointmentStart = new Date(appointmentDateTime);
      const appointmentEnd = new Date(appointmentStart.getTime() + (duration || 30) * 60000);
      
      const conflictingAppointments = await db.query.appointments.findMany({
        where: and(
          eq(appointments.practitionerId, practitionerId),
          or(
            // Check if new appointment overlaps with existing ones
            and(
              gte(appointments.appointmentDate, appointmentStart),
              lt(appointments.appointmentDate, appointmentEnd)
            ),
            and(
              lt(appointments.appointmentDate, appointmentEnd),
              gt(
                sql`${appointments.appointmentDate} + INTERVAL '1 minute' * ${appointments.duration}`,
                appointmentStart
              )
            )
          )
        ),
      });

      if (conflictingAppointments.length > 0) {
        console.log('Conflicting appointments found:', conflictingAppointments.length);
        return res.status(409).json({ 
          message: "This time slot is no longer available. Please select a different time.",
          conflicts: conflictingAppointments.length
        });
      }

      console.log('No conflicts found, creating appointment');

      const appointment = await storage.createAppointment({
        patientId: patient.id,
        practitionerId,
        title: reason,
        description: additionalNotes,
        appointmentDate: appointmentDateTime,
        duration: duration || 30,
        type: type || "consultation",
        status: "scheduled",
      });

      console.log('Created appointment:', { id: appointment.id, title: appointment.title });

      // Send notification to practitioner
      console.log('Sending notification to practitioner:', practitioner.userId);
      try {
        await notificationService.createNotification({
          userId: practitioner.userId,
          type: "appointment_created",
          title: "New Appointment Request",
          message: `${firstName} ${lastName} has requested an appointment for ${appointmentDateTime.toLocaleDateString()} at ${appointmentTime}`,
          metadata: {
            appointmentId: appointment.id,
            patientId: patient.id,
            practitionerId: practitioner.id,
          },
          priority: "medium",
          isRead: false,
          isArchived: false,
        });
        console.log('Notification sent successfully');
      } catch (notificationError) {
        console.error('Failed to send notification:', notificationError);
        // Don't fail the entire booking if notification fails
      }

      console.log('Booking completed successfully');
      res.json({
        appointment,
        message: "Appointment request submitted successfully"
      });
    } catch (error: any) {
      console.error('Public booking error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ 
        message: "Error booking appointment",
        error: error.message 
      });
    }
  });

  // =============================================================================
  // PRACTITIONER BOOKING LINK ROUTES
  // =============================================================================

  // Get current practitioner's profile
  app.get("/api/practitioner/me", verifyToken, async (req, res) => {
    try {
      const user = req.user;
      
      if (user.role !== "practitioner") {
        return res.status(403).json({ message: "Access denied" });
      }

      console.log('Getting practitioner profile for user:', user.id);

      const practitioner = await db.query.practitioners.findFirst({
        where: eq(practitioners.userId, user.id),
        with: {
          user: true,
        },
      });

      if (!practitioner) {
        return res.status(404).json({ message: "Practitioner profile not found" });
      }

      console.log('Found practitioner profile:', {
        id: practitioner.id,
        bookingLink: practitioner.bookingLink,
        userId: practitioner.userId
      });

      res.json(practitioner);
    } catch (error: any) {
      console.error('Get practitioner profile error:', error);
      res.status(500).json({ 
        message: "Error fetching practitioner profile",
        error: error.message 
      });
    }
  });

  // Generate booking link for practitioner
  app.post("/api/practitioner/generate-booking-link", verifyToken, async (req, res) => {
    try {
      const user = req.user;
      
      if (user.role !== "practitioner") {
        return res.status(403).json({ message: "Access denied" });
      }

      console.log('Generating booking link for user:', user.id);

      const practitioner = await db.query.practitioners.findFirst({
        where: eq(practitioners.userId, user.id),
      });

      if (!practitioner) {
        return res.status(404).json({ message: "Practitioner profile not found" });
      }

      console.log('Found practitioner:', practitioner.id);

      // Generate unique booking link
      const bookingLink = `dr-${user.firstName.toLowerCase()}-${user.lastName.toLowerCase()}-${Math.random().toString(36).substring(2, 8)}`;

      console.log('Generated booking link:', bookingLink);

      // Update practitioner with booking link
      const updatedPractitioner = await storage.updatePractitioner(practitioner.id, {
        bookingLink,
      });

      console.log('Updated practitioner:', updatedPractitioner);

      res.json({
        bookingLink,
        message: "Booking link generated successfully"
      });
    } catch (error: any) {
      console.error('Generate booking link error:', error);
      res.status(500).json({ 
        message: "Error generating booking link",
        error: error.message 
      });
    }
  });

  // Get booking settings for practitioner
  app.get("/api/practitioner/booking-settings", verifyToken, async (req, res) => {
    try {
      const user = req.user;
      console.log('User requesting booking settings:', user);
      
      if (user.role !== "practitioner") {
        console.log('User role is not practitioner:', user.role);
        return res.status(403).json({ message: "Access denied" });
      }

      const practitioner = await db.query.practitioners.findFirst({
        where: eq(practitioners.userId, user.id),
      });

      console.log('Found practitioner profile:', practitioner);

      if (!practitioner) {
        console.log('No practitioner profile found for user:', user.id);
        return res.status(404).json({ message: "Practitioner profile not found" });
      }

      // Get booking settings from database
      let settings = await db.query.bookingSettings.findFirst({
        where: eq(bookingSettings.practitionerId, practitioner.id),
      });

      console.log('Existing settings found:', !!settings);

      // If no settings exist, create default settings
      if (!settings) {
        console.log('Creating default settings for practitioner:', practitioner.id);
        const defaultSettings = {
          practitionerId: practitioner.id,
          isPublicBookingEnabled: true,
          requireApproval: true,
          allowDirectBooking: false,
          showProfile: true,
          showSpecialty: true,
          showConsultationFee: true,
          advanceBookingDays: 30,
          maxBookingsPerDay: 10,
          bufferTime: 15,
          emailNotifications: true,
          smsNotifications: false,
          reminderHours: 24,
          requirePhoneVerification: false,
          requireEmailVerification: true,
          cancellationPolicy: '24 hours notice required for cancellation',
          customMessage: 'Welcome to my booking page. I\'m looking forward to helping you with your healthcare needs.',
        };

        try {
          const inserted = await db.insert(bookingSettings).values(defaultSettings).returning();
          console.log('inserted', inserted);
          settings = inserted[0];
          console.log('Default settings created:', settings);
        } catch (insertError) {
          console.error('Failed to create default settings:', insertError);
          // Return default settings object without saving to database
          settings = defaultSettings;
        }
      }

      console.log('Returning settings:', settings);
      res.json(settings);
    } catch (error: any) {
      console.error('Get booking settings error:', error);
      res.status(500).json({ 
        message: "Error fetching booking settings",
        error: error.message 
      });
    }
  });

  // Save booking settings for practitioner
  app.post("/api/practitioner/booking-settings", verifyToken, async (req, res) => {
    try {
      const user = req.user;
      console.log('User attempting to save settings:', user);
      
      if (user.role !== "practitioner") {
        console.log('User role is not practitioner:', user.role);
        return res.status(403).json({ message: "Access denied" });
      }

      const practitioner = await db.query.practitioners.findFirst({
        where: eq(practitioners.userId, user.id),
      });

      console.log('Found practitioner profile:', practitioner);

      if (!practitioner) {
        console.log('No practitioner profile found for user:', user.id);
        return res.status(404).json({ message: "Practitioner profile not found" });
      }

      const settings = req.body;
      console.log('Received settings data:', settings);
      console.log('Practitioner ID:', practitioner.id);

      // Check if booking settings already exist
      const existingSettings = await db.query.bookingSettings.findFirst({
        where: eq(bookingSettings.practitionerId, practitioner.id),
      });

      console.log('Existing settings found:', !!existingSettings);

      let savedSettings;

      if (existingSettings) {
        console.log('Updating existing settings...');
        // Update existing settings
        const updated = await db.update(bookingSettings).set({
          ...settings,
          updatedAt: new Date(),
        })
        .where(eq(bookingSettings.practitionerId, practitioner.id))
        .returning()
        savedSettings = updated[0];
      } else {
        console.log('Creating new settings...');
        // Create new settings
        const inserted = await db.insert(bookingSettings).values({
          practitionerId: practitioner.id,
          ...settings,
        }).returning();
        savedSettings = inserted[0];
      }

      console.log('Booking settings saved for practitioner:', practitioner.id);
      console.log('Saved settings:', savedSettings);

      res.json({
        message: "Booking settings saved successfully",
        settings: savedSettings
      });
    } catch (error: any) {
      console.error('Save booking settings error:', error);
      res.status(500).json({ 
        message: "Error saving booking settings",
        error: error.message 
      });
    }
  });

  // Get public booking settings for a practitioner
  app.get("/api/public/booking-settings/:bookingLink", async (req, res) => {
    try {
      const { bookingLink } = req.params;

      console.log('bookingLink', bookingLink);

      // Find practitioner by booking link
      const practitioner = await db.query.practitioners.findFirst({
        where: eq(practitioners.bookingLink, bookingLink),
      });

      if (!practitioner) {
        return res.status(404).json({ message: "Practitioner not found" });
      }

      // Get booking settings from database
      const settings = await db.query.bookingSettings.findFirst({
        where: eq(bookingSettings.practitionerId, practitioner.id),
      });

      // If no settings exist, return default settings
      if (!settings) {
        const defaultSettings = {
          id: null,
          practitionerId: practitioner.id,
          isPublicBookingEnabled: true,
          requireApproval: true,
          allowDirectBooking: false,
          showProfile: true,
          showSpecialty: true,
          showConsultationFee: true,
          advanceBookingDays: 30,
          maxBookingsPerDay: 10,
          bufferTime: 15,
          emailNotifications: true,
          smsNotifications: false,
          reminderHours: 24,
          requirePhoneVerification: false,
          requireEmailVerification: true,
          customMessage: 'Welcome to my booking page. I\'m looking forward to helping you with your healthcare needs.',
          cancellationPolicy: '24 hours notice required for cancellation',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        return res.json(defaultSettings);
      }

      // Return public booking settings (filtered for public use)
      res.json(settings);
    } catch (error: any) {
      console.error('Get public booking settings error:', error);
      res.status(500).json({ 
        message: "Error fetching booking settings",
        error: error.message 
      });
    }
  });

  // Get public calendar settings for a practitioner
  app.get("/api/public/calendar-settings/:bookingLink", async (req, res) => {
    try {
      const { bookingLink } = req.params;

      console.log('Getting calendar settings for bookingLink:', bookingLink);

      // Find practitioner by booking link
      const practitioner = await db.query.practitioners.findFirst({
        where: eq(practitioners.bookingLink, bookingLink),
      });

      if (!practitioner) {
        return res.status(404).json({ message: "Practitioner not found" });
      }

      // Get calendar settings from database
      const settings = await db.query.calendarSettings.findFirst({
        where: eq(calendarSettings.practitionerId, practitioner.id),
      });

      // If no settings exist, return default settings
      if (!settings) {
        const defaultSettings = {
          id: null,
          practitionerId: practitioner.id,
          timeInterval: 60,
          bufferTime: 0,
          defaultStartTime: "09:00",
          defaultEndTime: "17:00",
          workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
          allowWeekendBookings: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        console.log('No calendar settings found, returning defaults');
        return res.json(defaultSettings);
      }

      console.log('Calendar settings found:', settings);
      res.json(settings);
    } catch (error: any) {
      console.error('Get public calendar settings error:', error);
      res.status(500).json({ 
        message: "Error fetching calendar settings",
        error: error.message 
      });
    }
  });

  // Test route to check database schema
  app.get("/api/test/db-schema", async (req, res) => {
    try {
      // Check if booking_link column exists
      const result = await db.execute(sql`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'practitioners' 
        AND column_name = 'booking_link'
      `);
      
      res.json({
        bookingLinkColumnExists: result.length > 0,
        columns: result
      });
    } catch (error: any) {
      console.error('Database schema test error:', error);
      res.status(500).json({ 
        message: "Error testing database schema",
        error: error.message 
      });
    }
  });

  // Test endpoint to check authentication status
  app.get("/api/test/auth-status", verifyToken, async (req, res) => {
    try {
      res.json({
        authenticated: true,
        user: req.user,
        message: "User is authenticated"
      });
    } catch (error) {
      res.status(401).json({
        authenticated: false,
        message: "User is not authenticated"
      });
    }
  });

  // Test endpoint to create a sample appointment
  app.post("/api/test/create-sample-appointment", async (req, res) => {
    try {
      // Get Dr. Sarah Smith practitioner
      const practitioner = await db.query.practitioners.findFirst({
        where: eq(practitioners.bookingLink, "dr-sarah-smith"),
      });
      if (!practitioner) {
        return res.status(404).json({ message: "Dr. Sarah Smith practitioner not found" });
      }

      // Get the first patient
      const patient = await db.query.patients.findFirst();
      if (!patient) {
        return res.status(404).json({ message: "No patient found" });
      }

      // Create a sample appointment for Dr. Sarah Smith
      const sampleAppointment = await storage.createAppointment({
        patientId: patient.id,
        practitionerId: practitioner.id,
        title: "Test Appointment for Dr. Sarah Smith",
        description: "This is a test appointment for Dr. Sarah Smith",
        appointmentDate: new Date(),
        duration: 30,
        type: "consultation",
        status: "scheduled",
      });

      res.json({
        message: "Sample appointment created for Dr. Sarah Smith",
        appointment: sampleAppointment,
        practitionerId: practitioner.id
      });
    } catch (error: any) {
      console.error('Create sample appointment error:', error);
      res.status(500).json({ 
        message: "Error creating sample appointment",
        error: error.message 
      });
    }
  });

  // Test endpoint to check appointments table
  app.get("/api/test/appointments-table", async (req, res) => {
    try {
      // Get all appointments
      const allAppointments = await db.query.appointments.findMany({
        with: {
          patient: {
            with: {
              user: true
            }
          },
          practitioner: {
            with: {
              user: true
            }
          }
        }
      });
      
      res.json({
        totalAppointments: allAppointments.length,
        appointments: allAppointments
      });
    } catch (error: any) {
      console.error('Test appointments table error:', error);
      res.status(500).json({ 
        message: "Error testing appointments table",
        error: error.message 
      });
    }
  });

  // Test endpoint to check booking_settings table
  app.get("/api/test/booking-settings-table", async (req, res) => {
    try {
      // Check if booking_settings table exists
      const tableExists = await db.execute(sql`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_name = 'booking_settings'
        );
      `);
      
      // Get all booking_settings records
      const allSettings = await db.query.bookingSettings.findMany();
      
      // Get table structure
      const tableStructure = await db.execute(sql`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns 
        WHERE table_name = 'booking_settings'
        ORDER BY ordinal_position;
      `);
      
      res.json({
        tableExists: tableExists[0]?.exists,
        totalRecords: allSettings.length,
        records: allSettings,
        structure: tableStructure
      });
    } catch (error: any) {
      console.error('Booking settings table test error:', error);
      res.status(500).json({ 
        message: "Error testing booking settings table",
        error: error.message 
      });
    }
  });

  // Get practitioner details for public booking
  app.get("/api/public/practitioner/:bookingLink", async (req, res) => {
    try {
      const { bookingLink } = req.params;

      console.log('Fetching practitioner for booking link:', bookingLink);

      // Find practitioner by booking link
      const practitioner = await db.query.practitioners.findFirst({
        where: eq(practitioners.bookingLink, bookingLink),
      });

      if (!practitioner) {
        console.log('Practitioner not found for booking link:', bookingLink);
        return res.status(404).json({ message: "Practitioner not found" });
      }

      // Get user details for the practitioner
      const user = await db.query.users.findFirst({
        where: eq(users.id, practitioner.userId),
      });

      if (!user) {
        console.log('User not found for practitioner:', practitioner.id);
        return res.status(404).json({ message: "Practitioner user not found" });
      }

      const practitionerData = {
        id: practitioner.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        specialty: practitioner.specialty,
        bio: practitioner.bio,
        consultationFee: practitioner.consultationFee,
        qualifications: practitioner.qualifications,
        bookingLink: practitioner.bookingLink,
      };

      console.log('Returning practitioner data:', practitionerData);
      res.json(practitionerData);
    } catch (error: any) {
      console.error('Get public practitioner error:', error);
      res.status(500).json({ 
        message: "Error fetching practitioner details",
        error: error.message 
      });
    }
  });





  // Test endpoint to manually insert booking settings
  app.post("/api/test/insert-booking-settings", async (req, res) => {
    try {
      const { practitionerId } = req.body;
      
      if (!practitionerId) {
        return res.status(400).json({ message: "practitionerId is required" });
      }

      const testSettings = {
        practitionerId: practitionerId,
        isPublicBookingEnabled: true,
        requireApproval: true,
        allowDirectBooking: false,
        showProfile: true,
        showSpecialty: true,
        showConsultationFee: true,
        advanceBookingDays: 30,
        maxBookingsPerDay: 10,
        bufferTime: 15,
        emailNotifications: true,
        smsNotifications: false,
        reminderHours: 24,
        requirePhoneVerification: false,
        requireEmailVerification: true,
        customMessage: 'Test welcome message',
        cancellationPolicy: 'Test cancellation policy',
      };

      console.log('Inserting test settings for practitioner:', practitionerId);
      
      const savedSettings = await db.insert(bookingSettings)
        .values(testSettings)
        .returning()[0];

      console.log('Test settings saved:', savedSettings);

      res.json({
        message: "Test booking settings inserted successfully",
        settings: savedSettings
      });
    } catch (error: any) {
      console.error('Test insert booking settings error:', error);
      res.status(500).json({ 
        message: "Error inserting test booking settings",
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
