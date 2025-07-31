// Helper functions for creating notifications from various module actions

export const createAppointmentNotification = async (
  appointmentData: any, 
  patient: any, 
  practitioner: any,
  action: 'created' | 'updated' | 'cancelled'
) => {
  // This would typically be called from server-side code
  // Client-side notification creation happens through API calls
  const notificationData = {
    type: `appointment_${action}`,
    title: action === 'created' ? 'New Appointment Scheduled' : 
           action === 'updated' ? 'Appointment Updated' : 
           'Appointment Cancelled',
    message: `Appointment "${appointmentData.title}" has been ${action}`,
    actionUrl: `/calendar?appointmentId=${appointmentData.id}`,
    metadata: {
      appointmentId: appointmentData.id,
      patientName: patient?.user?.firstName + ' ' + patient?.user?.lastName,
      practitionerName: practitioner?.user?.firstName + ' ' + practitioner?.user?.lastName,
      appointmentDate: appointmentData.appointmentDate
    }
  };
  
  return notificationData;
};

export const createPatientNotification = async (
  patientData: any,
  action: 'registered' | 'updated'
) => {
  return {
    type: `patient_${action}`,
    title: action === 'registered' ? 'New Patient Registered' : 'Patient Information Updated',
    message: `Patient ${patientData.user?.firstName} ${patientData.user?.lastName} has been ${action}`,
    actionUrl: `/patients/${patientData.id}`,
    metadata: {
      patientId: patientData.id,
      patientName: patientData.user?.firstName + ' ' + patientData.user?.lastName
    }
  };
};

export const createClinicalNoteNotification = async (
  noteData: any,
  patient: any,
  practitioner: any,
  action: 'created' | 'updated'
) => {
  return {
    type: `clinical_note_${action}`,
    title: action === 'created' ? 'New Clinical Note' : 'Clinical Note Updated',
    message: `A clinical note has been ${action} for ${patient?.user?.firstName} ${patient?.user?.lastName}`,
    actionUrl: `/clinical-notes/${noteData.id}`,
    metadata: {
      noteId: noteData.id,
      patientName: patient?.user?.firstName + ' ' + patient?.user?.lastName,
      practitionerName: practitioner?.user?.firstName + ' ' + practitioner?.user?.lastName
    }
  };
};

export const createInvoiceNotification = async (
  invoiceData: any,
  patient: any,
  action: 'created' | 'paid' | 'overdue'
) => {
  return {
    type: `invoice_${action}`,
    title: action === 'created' ? 'New Invoice Generated' : 
           action === 'paid' ? 'Payment Received' : 
           'Invoice Overdue',
    message: `Invoice #${invoiceData.invoiceNumber} ${action === 'created' ? 'has been created' : action === 'paid' ? 'has been paid' : 'is overdue'}`,
    actionUrl: `/billing/${invoiceData.id}`,
    metadata: {
      invoiceId: invoiceData.id,
      invoiceNumber: invoiceData.invoiceNumber,
      amount: invoiceData.totalAmount,
      patientName: patient?.user?.firstName + ' ' + patient?.user?.lastName
    }
  };
};

export const createMessageNotification = async (
  messageData: any,
  sender: any,
  recipient: any
) => {
  return {
    type: 'message_received',
    title: 'New Message',
    message: `You have a new message from ${sender.firstName} ${sender.lastName}`,
    actionUrl: `/messages/${messageData.id}`,
    metadata: {
      messageId: messageData.id,
      senderName: sender.firstName + ' ' + sender.lastName,
      recipientName: recipient.firstName + ' ' + recipient.lastName
    }
  };
};

export const createTelehealthNotification = async (
  sessionData: any,
  patient: any,
  practitioner: any,
  action: 'started' | 'ended'
) => {
  return {
    type: `telehealth_session_${action}`,
    title: `Telehealth Session ${action === 'started' ? 'Started' : 'Ended'}`,
    message: `Your telehealth session ${action === 'started' ? 'has started' : 'has ended'}`,
    actionUrl: action === 'started' ? `/telehealth/${sessionData.id}` : `/appointments/${sessionData.appointmentId}`,
    metadata: {
      sessionId: sessionData.id,
      appointmentId: sessionData.appointmentId,
      patientName: patient?.user?.firstName + ' ' + patient?.user?.lastName,
      practitionerName: practitioner?.user?.firstName + ' ' + practitioner?.user?.lastName
    }
  };
};

export const createSystemNotification = async (
  message: string,
  actionUrl?: string
) => {
  return {
    type: 'system_update',
    title: 'System Update',
    message,
    actionUrl,
    metadata: {
      timestamp: new Date().toISOString()
    }
  };
};

export const createSecurityNotification = async (
  message: string,
  actionUrl?: string
) => {
  return {
    type: 'security_alert',
    title: 'Security Alert',
    message,
    actionUrl,
    metadata: {
      timestamp: new Date().toISOString(),
      severity: 'high'
    }
  };
};