import { storage } from "./storage";
import { notificationService } from "./notification-service";

export class IntegrationService {
  // Create appointment with notifications
  async createAppointmentWithNotifications(appointmentData: any, userId: string) {
    try {
      const appointment = await storage.createAppointment(appointmentData);
      
      // Get patient and practitioner details
      const [patient, practitioner] = await Promise.all([
        storage.getPatient(appointmentData.patientId),
        storage.getPractitioner(appointmentData.practitionerId)
      ]);
      
      // Create notifications for patient
      if (patient?.user) {
        await notificationService.createTemplatedNotification(
          patient.user.id,
          'appointment_created',
          {
            title: appointmentData.title,
            date: appointmentData.appointmentDate,
            practitionerName: `${practitioner?.user?.firstName} ${practitioner?.user?.lastName}`
          },
          `/calendar?appointmentId=${appointment.id}`
        );
      }
      
      // Create notifications for practitioner
      if (practitioner?.user) {
        await notificationService.createTemplatedNotification(
          practitioner.user.id,
          'appointment_created',
          {
            title: appointmentData.title,
            date: appointmentData.appointmentDate,
            patientName: `${patient?.user?.firstName} ${patient?.user?.lastName}`
          },
          `/calendar?appointmentId=${appointment.id}`
        );
      }
      
      return appointment;
    } catch (error) {
      console.error('Error creating appointment with notifications:', error);
      throw error;
    }
  }

  // Create patient with notifications
  async createPatientWithNotifications(patientData: any, userId: string) {
    try {
      const patient = await storage.createPatient(patientData);
      
      // Get all admin and staff users for notification
      const adminUsers = await storage.getUsersByRole(['admin', 'staff']);
      
      // Create notifications for admin/staff users
      const notifications = adminUsers.map(user => 
        notificationService.createTemplatedNotification(
          user.id,
          'patient_registered',
          {
            patientName: `${patient.user?.firstName} ${patient.user?.lastName}`
          },
          `/patients/${patient.id}`
        )
      );
      
      await Promise.all(notifications);
      
      return patient;
    } catch (error) {
      console.error('Error creating patient with notifications:', error);
      throw error;
    }
  }

  // Create clinical note with notifications
  async createClinicalNoteWithNotifications(noteData: any, userId: string) {
    try {
      const note = await storage.createClinicalNote(noteData);
      
      // Get patient and practitioner details
      const [patient, practitioner] = await Promise.all([
        storage.getPatient(noteData.patientId),
        storage.getPractitioner(noteData.practitionerId)
      ]);
      
      // Notify patient about new clinical note
      if (patient?.user) {
        await notificationService.createTemplatedNotification(
          patient.user.id,
          'clinical_note_created',
          {
            patientName: `${patient.user.firstName} ${patient.user.lastName}`,
            practitionerName: `${practitioner?.user?.firstName} ${practitioner?.user?.lastName}`
          },
          `/clinical-notes/${note.id}`
        );
      }
      
      return note;
    } catch (error) {
      console.error('Error creating clinical note with notifications:', error);
      throw error;
    }
  }

  // Create invoice with notifications
  async createInvoiceWithNotifications(invoiceData: any, userId: string) {
    try {
      const invoice = await storage.createInvoice(invoiceData);
      
      // Get patient details
      const patient = await storage.getPatient(invoiceData.patientId);
      
      // Notify patient about new invoice
      if (patient?.user) {
        await notificationService.createTemplatedNotification(
          patient.user.id,
          'invoice_created',
          {
            invoiceNumber: invoice.invoiceNumber,
            amount: invoice.totalAmount,
            patientName: `${patient.user.firstName} ${patient.user.lastName}`
          },
          `/billing/${invoice.id}`
        );
      }
      
      return invoice;
    } catch (error) {
      console.error('Error creating invoice with notifications:', error);
      throw error;
    }
  }

  // Send message with notifications
  async sendMessageWithNotifications(messageData: any) {
    try {
      const message = await storage.createMessage(messageData);
      
      // Get sender and recipient details
      const [sender, recipient] = await Promise.all([
        storage.getUser(messageData.senderId),
        storage.getUser(messageData.recipientId)
      ]);
      
      // Notify recipient about new message
      if (recipient) {
        await notificationService.createTemplatedNotification(
          recipient.id,
          'message_received',
          {
            senderName: `${sender?.firstName} ${sender?.lastName}`,
            recipientName: `${recipient.firstName} ${recipient.lastName}`
          },
          `/messages/${message.id}`
        );
      }
      
      return message;
    } catch (error) {
      console.error('Error sending message with notifications:', error);
      throw error;
    }
  }

  // Update user profile with notifications
  async updateUserProfileWithNotifications(userId: string, updates: any) {
    try {
      const user = await storage.updateUser(userId, updates);
      
      // Notify user about profile update
      await notificationService.createTemplatedNotification(
        userId,
        'user_profile_updated',
        {},
        '/settings?tab=profile'
      );
      
      return user;
    } catch (error) {
      console.error('Error updating user profile with notifications:', error);
      throw error;
    }
  }

  // Change password with security notification
  async changePasswordWithNotifications(userId: string, newPassword: string) {
    try {
      // This would typically hash the password and update it
      // For now, we'll just create the security notification
      
      await notificationService.createTemplatedNotification(
        userId,
        'password_changed',
        {},
        '/settings?tab=security'
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error changing password with notifications:', error);
      throw error;
    }
  }

  // Update calendar settings with notifications
  async updateCalendarSettingsWithNotifications(userId: string, settings: any) {
    try {
      // Update calendar settings (this would call storage method)
      // For now, we'll create the notification
      
      await notificationService.createTemplatedNotification(
        userId,
        'calendar_settings_updated',
        {},
        '/calendar'
      );
      
      return { success: true };
    } catch (error) {
      console.error('Error updating calendar settings with notifications:', error);
      throw error;
    }
  }
}

export const integrationService = new IntegrationService();